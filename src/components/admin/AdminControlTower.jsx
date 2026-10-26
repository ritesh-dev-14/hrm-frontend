import React from "react";
import {
  AlertTriangle,
  Clock,
  Camera,
  DollarSign,
  Users,
  ShieldAlert,
  Activity,
  Loader2,
  Building2,
  IndianRupee,
  X,
  User,
  FolderOpen,
  ChevronRight,
  Calendar,
  Eye,
  Target,
  Link2,
} from "lucide-react";

const getSafeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

export default function AdminControlTower({
  data,
  loading,
  healthMap,
  managers = [],
  projects = [],
  marketingMetrics = {},
  marketingMetricsLoading = false,
  marketingMetricsError = "",
  managerDirectoryError = "",
  onSelectProject,
  onSelectMarketingProject,
  uploadCalendarSheets = [],
  uploadCalendarError = "",
}) {
  const [selectedManagerId, setSelectedManagerId] = React.useState("");
  const [selectedManagerDepartment, setSelectedManagerDepartment] = React.useState("");
  const [selectedSocialProjectId, setSelectedSocialProjectId] = React.useState("");
  const [showBudgetModal, setShowBudgetModal] = React.useState(false);
  const [showSpendModal, setShowSpendModal] = React.useState(false);
  const [showTeamModal, setShowTeamModal] = React.useState(false);
  
  const [showUrgentDeliverablesModal, setShowUrgentDeliverablesModal] = React.useState(false);
  const [showUrgentApprovalsModal, setShowUrgentApprovalsModal] = React.useState(false);
  const [showClientsAtRiskModal, setShowClientsAtRiskModal] = React.useState(false);
  const [showClientsIgnoredModal, setShowClientsIgnoredModal] = React.useState(false);
  const [showCalendarModal, setShowCalendarModal] = React.useState(false);
  const [marketingFilter, setMarketingFilter] = React.useState("ALL");
  const currentMarketingMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [selectedMarketingMonth, setSelectedMarketingMonth] = React.useState(currentMarketingMonth);

  let clientsAtRisk = 0;
  let notContacted7Days = 0;
  const clientsAtRiskList = [];
  const clientsIgnoredList = [];

  if (healthMap) {
    Object.values(healthMap).forEach(h => {
      if (h.status === "AT_RISK") {
        clientsAtRisk++;
        clientsAtRiskList.push(h);
      }
      if (h.breakdown?.daysSinceLastComm >= 7) {
        notContacted7Days++;
        clientsIgnoredList.push(h);
      }
    });
  }

  const managerProjects = projects.filter((project) =>
    project.assignments?.some(
      (assignment) => assignment.manager?.id === selectedManagerId,
    ),
  );
  const managerProjectGroups = [...managerProjects.reduce((groups, project) => {
    const departmentName = project.department?.name || "Other";
    const group = groups.get(departmentName) || [];
    group.push(project);
    groups.set(departmentName, group);
    return groups;
  }, new Map()).entries()];

  const handleManagerSelect = (managerId) => {
    setSelectedManagerId(managerId);
    const firstGroup = projects.find((project) =>
      project.assignments?.some(
        (assignment) => assignment.manager?.id === managerId,
      ),
    )?.department?.name;
    setSelectedManagerDepartment(firstGroup || "");
  };

  const socialProjects = projects.filter((project) => {
    const departmentName = project.department?.name?.toLowerCase() || "";
    return departmentName.includes("social") || departmentName.includes("smm");
  });
  const selectedSocialProject = socialProjects.find(
    (project) => project.id === selectedSocialProjectId,
  );
  const getMonthLabel = (month, year) => {
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };
  const socialProjectIds = React.useMemo(
    () => new Set(socialProjects.map((project) => project.id)),
    [socialProjects],
  );
  const monthOptions = React.useMemo(() => {
    const options = new Map();
    uploadCalendarSheets.forEach((sheet) => {
      if (!socialProjectIds.has(sheet.projectId)) return;
      const value = `${sheet.year}-${String(sheet.month).padStart(2, "0")}`;
      options.set(value, { value, month: sheet.month, year: sheet.year });
    });
    return [...options.values()].sort(
      (a, b) => Number(b.year) - Number(a.year) || Number(b.month) - Number(a.month),
    );
  }, [uploadCalendarSheets, socialProjectIds]);
  const currentMonthValue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [selectedSocialMonth, setSelectedSocialMonth] = React.useState(currentMonthValue);
  const activeMonthOption = monthOptions.find((option) => option.value === selectedSocialMonth)
    || monthOptions[0];
  const activeMonthValue = activeMonthOption?.value || selectedSocialMonth;
  const activeMonthLabel = activeMonthOption
    ? getMonthLabel(activeMonthOption.month, activeMonthOption.year)
    : "";
  const socialProjectRows = React.useMemo(() => socialProjects.map((project) => {
    const sheet = uploadCalendarSheets.find(
      (item) => item.projectId === project.id
        && `${item.year}-${String(item.month).padStart(2, "0")}` === activeMonthValue,
    );
    const approvedUploads = (sheet?.days || []).reduce(
      (counts, day) => {
        if (day.uploadStatus !== "APPROVED") return counts;
        counts.reels += (day.videoUploadLinks || []).filter((link) => String(link || "").trim()).length;
        counts.posts += (day.contentUploadLinks || []).filter((link) => String(link || "").trim()).length;
        return counts;
      },
      { reels: 0, posts: 0 },
    );

    return {
      project,
      sheet,
      plannedReels: Number(sheet?.totalReels) || 0,
      approvedReels: approvedUploads.reels,
      plannedPosts: Number(sheet?.totalPosts) || 0,
      approvedPosts: approvedUploads.posts,
    };
  }), [socialProjects, uploadCalendarSheets, activeMonthValue]);
  const selectedSocialSheet = uploadCalendarSheets.find(
    (sheet) => sheet.projectId === selectedSocialProjectId
      && `${sheet.year}-${String(sheet.month).padStart(2, "0")}` === activeMonthValue,
  );

  const marketingProjects = React.useMemo(() => projects.filter((project) => {
    const departmentName = project.department?.name?.toLowerCase() || "";
    return departmentName.includes("performance") || departmentName.includes("marketing") || departmentName.includes("ads") || departmentName.includes("meta");
  }), [projects]);

  const filteredMarketingProjects = React.useMemo(() => {
    if (marketingFilter === "RUNNING") return marketingProjects.filter(p => p.isRunning === true);
    if (marketingFilter === "NOT_RUNNING") return marketingProjects.filter(p => p.isRunning !== true);
    return marketingProjects;
  }, [marketingProjects, marketingFilter]);

  const marketingMonthOptions = React.useMemo(() => {
    const options = new Map();
    (data?.thisWeek?.monthlySpendBreakdown || []).forEach((item) => {
      const value = `${item.year}-${String(item.month).padStart(2, "0")}`;
      options.set(value, { value, month: item.month, year: item.year });
    });
    const [currentYear, currentMonth] = currentMarketingMonth.split("-").map(Number);
    options.set(currentMarketingMonth, {
      value: currentMarketingMonth,
      month: currentMonth,
      year: currentYear,
    });
    return [...options.values()].sort(
      (a, b) => Number(b.year) - Number(a.year) || Number(b.month) - Number(a.month),
    );
  }, [data, currentMarketingMonth]);
  const activeMarketingMonth = marketingMonthOptions.find(
    (option) => option.value === selectedMarketingMonth,
  ) || marketingMonthOptions[0];
  const activeMarketingMonthValue = activeMarketingMonth?.value || currentMarketingMonth;
  const marketingProjectRows = React.useMemo(() => {
    const budgets = new Map(
      (data?.thisWeek?.budgetBreakdown || []).map((item) => [item.projectId, item.amount]),
    );
    const selectedMonthSpend = new Map();
    (data?.thisWeek?.monthlySpendBreakdown || []).forEach((item) => {
      const value = `${item.year}-${String(item.month).padStart(2, "0")}`;
      if (value === activeMarketingMonthValue) {
        selectedMonthSpend.set(
          item.projectId,
          (selectedMonthSpend.get(item.projectId) || 0) + (Number(item.amount) || 0),
        );
      }
    });
    return filteredMarketingProjects.map((project) => ({
      project,
      budget: Number(budgets.get(project.id)) || 0,
      spent: Number(selectedMonthSpend.get(project.id)) || 0,
    }));
  }, [data, filteredMarketingProjects, activeMarketingMonthValue]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-center min-h-[150px]">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-semibold">Loading Control Tower...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-5">
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <div className="bg-slate-900 p-2.5 rounded-xl text-white">
          <Activity size={20} />
        </div>
        <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">CEO Control Tower</h2>
        <p className="text-xs font-medium text-slate-500">Morning briefing</p>
        </div>
      </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Critical Section */}
      <div className="rounded-xl border border-slate-200 border-t-2 border-t-rose-500 bg-white p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <AlertTriangle size={16} /> Urgent Attention
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setShowUrgentDeliverablesModal(true)}
            role="button" tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowUrgentDeliverablesModal(true);
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center cursor-pointer hover:border-rose-200 hover:bg-rose-50/40 transition group"
          >
            <p className="text-2xl font-bold text-rose-600">{data.critical.overdueDeliverables}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Overdue deliverables</p>
          </div>
          <div 
            onClick={() => setShowUrgentApprovalsModal(true)}
            role="button" tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowUrgentApprovalsModal(true);
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center cursor-pointer hover:border-rose-200 hover:bg-rose-50/40 transition group"
          >
            <p className="text-2xl font-bold text-rose-600">{data.critical.oldApprovals}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Approvals waiting 3+ days</p>
          </div>
        </div>
      </div>

      {/* This Week Section */}
      <div className="rounded-xl border border-slate-200 border-t-2 border-t-indigo-500 bg-white p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <Clock size={16} /> This Month's Output
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center">
            <p className="text-xl font-bold text-indigo-600">{data.thisWeek.shootsScheduled}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Shoots</p>
            </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center">
            <p className="text-xl font-bold text-indigo-600">{data.thisWeek.contentPiecesDue}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Assets</p>
          </div>
          <div 
            onClick={() => setShowBudgetModal(true)}
            role="button" tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowBudgetModal(true);
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/40 transition"
          >
            <p className="text-sm font-bold text-indigo-600 flex justify-center items-center">
              <IndianRupee size={12} />{data.thisWeek.totalMonthlyBudget > 1000 ? (data.thisWeek.totalMonthlyBudget/1000).toFixed(1) + 'k' : data.thisWeek.totalMonthlyBudget}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Budget</p>
          </div>
          <div 
            onClick={() => setShowSpendModal(true)}
            role="button" tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowSpendModal(true);
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/40 transition"
          >
            <p className="text-sm font-bold text-indigo-600 flex justify-center items-center">
              <IndianRupee size={12} />{data.thisWeek.totalMonthlySpent > 1000 ? (data.thisWeek.totalMonthlySpent/1000).toFixed(1) + 'k' : data.thisWeek.totalMonthlySpent}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Spent this month</p>
          </div>
        </div>
      </div>

      {/* People Section */}
      <div className="rounded-xl border border-slate-200 border-t-2 border-t-amber-500 bg-white p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <Users size={16} /> Team Bottlenecks
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div 
            onClick={() => setShowTeamModal(true)}
            role="button" tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowTeamModal(true);
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between cursor-pointer hover:border-amber-200 hover:bg-amber-50/40 transition"
          >
            <div>
              <p className="text-2xl font-bold text-amber-600">{data.people.editorsWithOverdueCount}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Staff with overdue tasks</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <ShieldAlert size={20} />
            </div>
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div className="rounded-xl border border-slate-200 border-t-2 border-t-emerald-500 bg-white p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Building2 size={16} /> Client Health
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setShowClientsAtRiskModal(true)}
              role="button" tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setShowClientsAtRiskModal(true);
                }
              }}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center cursor-pointer hover:border-rose-200 hover:bg-rose-50/40 transition"
            >
              <p className="text-2xl font-bold text-rose-600">{clientsAtRisk}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Clients at risk</p>
            </div>
            <div 
              onClick={() => setShowClientsIgnoredModal(true)}
              role="button" tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setShowClientsIgnoredModal(true);
                }
              }}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center cursor-pointer hover:border-amber-200 hover:bg-amber-50/40 transition"
            >
              <p className="text-2xl font-bold text-amber-600">{notContacted7Days}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">No contact 7+ days</p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Manager projects</h3>
              <p className="text-sm text-slate-500">Choose a manager and project to view details.</p>
            </div>
          </div>
          <label className="w-full md:max-w-sm">
            <span className="sr-only">Select a manager</span>
            <select
              value={selectedManagerId}
              onChange={(event) => handleManagerSelect(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}{manager.employeeId ? ` (${manager.employeeId})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {managerDirectoryError && (
          <p role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {managerDirectoryError}
          </p>
        )}

        {!selectedManagerId ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Select a manager to view their departments and projects.
          </p>
        ) : managerProjectGroups.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No projects are assigned to this manager.
          </p>
        ) : (
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {managerProjectGroups.map(([departmentName, groupProjects]) => (
                <button
                  key={departmentName}
                  type="button"
                  onClick={() => setSelectedManagerDepartment(departmentName)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selectedManagerDepartment === departmentName
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {departmentName}
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                    selectedManagerDepartment === departmentName ? "bg-white/20" : "bg-slate-100"
                  }`}>
                    {groupProjects.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(managerProjectGroups.find(
                ([departmentName]) => departmentName === selectedManagerDepartment,
              )?.[1] || []).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectProject?.(project)}
                  className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                    {project.logo ? (
                      <img src={project.logo} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <FolderOpen size={18} />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{project.projectName}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{project.clientName || project.department?.name || "Project"}</span>
                  </span>
                  <ChevronRight size={15} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Social media project output</h3>
            <p className="text-sm text-slate-500">
              Monthly planned content vs manager-approved uploads from the Uploads page.
            </p>
          </div>
        </div>

        {uploadCalendarError ? (
          <p role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {uploadCalendarError}
          </p>
        ) : null}

        {socialProjects.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No Social Media projects are available.
          </p>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                {activeMonthLabel ? `Showing all projects for ${activeMonthLabel}` : "No monthly content calendars are available yet."}
              </p>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                Month
                <select
                  value={activeMonthValue}
                  onChange={(event) => setSelectedSocialMonth(event.target.value)}
                  disabled={monthOptions.length === 0}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {getMonthLabel(option.month, option.year)}
                    </option>
                  ))}
                  {monthOptions.length === 0 && <option value={currentMonthValue}>No months available</option>}
                </select>
              </label>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3 text-center">Planned reels</th>
                    <th className="px-4 py-3 text-center">Approved reels</th>
                    <th className="px-4 py-3 text-center">Planned posts</th>
                    <th className="px-4 py-3 text-center">Approved posts</th>
                    <th className="px-4 py-3 text-right">Calendar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {socialProjectRows.map((row) => (
                    <tr key={row.project.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                            {row.project.logo ? (
                              <img src={row.project.logo} alt="" className="h-full w-full object-contain p-1" />
                            ) : (
                              <FolderOpen size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{row.project.projectName}</p>
                            <p className="truncate text-xs text-slate-500">{row.project.clientName || row.project.department?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">{row.plannedReels}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-emerald-700">{row.approvedReels}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">{row.plannedPosts}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-emerald-700">{row.approvedPosts}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSocialProjectId(row.project.id);
                            setShowCalendarModal(true);
                          }}
                          disabled={!row.sheet}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-4 sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Performance marketing &amp; Meta Ads</h3>
            <p className="text-sm text-slate-500">
              Monthly budget and total spend for marketing projects.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-sm font-medium text-slate-600">Filter projects</p>
          <select
            value={marketingFilter}
            onChange={(e) => setMarketingFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="ALL">All Projects</option>
            <option value="RUNNING">Ads Running</option>
            <option value="NOT_RUNNING">Ads Not Running</option>
          </select>
        </div>

        {marketingMetricsError && (
          <p role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {marketingMetricsError}
          </p>
        )}

        {marketingProjectRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No Marketing projects found for this filter.
          </p>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {activeMarketingMonth
                  ? `Showing all projects for ${new Date(activeMarketingMonth.year, activeMarketingMonth.month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
                  : "No monthly spend data is available yet."}
              </p>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                Month
                <select
                  value={activeMarketingMonthValue}
                  onChange={(event) => setSelectedMarketingMonth(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {marketingMonthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {new Date(option.year, option.month - 1, 1).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold text-slate-500">
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3 text-right">Monthly Budget</th>
                    <th className="px-4 py-3 text-right">Total Spent</th>
                    <th className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-1"><Eye size={12} /> Total Reach</span>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-1"><Target size={12} /> Leads Obtained</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marketingProjectRows.map(({ project, budget, spent }) => (
                    <tr
                      key={project.id}
                      onClick={() => onSelectMarketingProject?.(project.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectMarketingProject?.(project.id);
                        }
                      }}
                      role={onSelectMarketingProject ? "button" : undefined}
                      tabIndex={onSelectMarketingProject ? 0 : undefined}
                      aria-label={onSelectMarketingProject ? `Open reports for ${project.projectName}` : undefined}
                      className={`hover:bg-blue-50/70 ${onSelectMarketingProject ? "cursor-pointer focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-blue-600">
                            {project.logo ? (
                              <img src={project.logo} alt="" className="h-full w-full object-contain p-1" />
                            ) : (
                              <FolderOpen size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-900">{project.projectName}</p>
                            <p className="truncate text-[10px] text-slate-500">{project.clientName || project.department?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-blue-700">
                        <span className="inline-flex items-center justify-end"><IndianRupee size={13} />{budget.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-indigo-700">
                        <span className="inline-flex items-center justify-end"><IndianRupee size={13} />{spent.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-sky-700">
                        {marketingMetricsLoading
                          ? "Loading..."
                          : marketingMetricsError ? "Unavailable"
                          : (Number(marketingMetrics[project.id]?.totalReach) || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-extrabold text-emerald-700">
                        {marketingMetricsLoading
                          ? "Loading..."
                          : marketingMetricsError ? "Unavailable"
                          : (Number(marketingMetrics[project.id]?.totalLeads) || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Budget Breakdown Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <IndianRupee size={18} className="text-indigo-600" /> Monthly Budget Allocation
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Total budget set for all active projects</p>
              </div>
              <button 
                onClick={() => setShowBudgetModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.thisWeek.budgetBreakdown && data.thisWeek.budgetBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.thisWeek.budgetBreakdown.map((proj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{proj.projectName}</p>
                        <p className="text-xs text-slate-500">{proj.clientName}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm">
                        <IndianRupee size={14} />
                        {proj.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No active projects with a budget found.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Monthly Budget</span>
              <span className="text-lg font-black text-slate-900 flex items-center">
                <IndianRupee size={18} />
                {data.thisWeek.totalMonthlyBudget.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Spend Breakdown Modal */}
      {showSpendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <IndianRupee size={18} className="text-indigo-600" /> Month-To-Date Spend
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Actual spend from daily Marketing Reports</p>
              </div>
              <button 
                onClick={() => setShowSpendModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.thisWeek.spentBreakdown && data.thisWeek.spentBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.thisWeek.spentBreakdown.map((proj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{proj.projectName}</p>
                        <p className="text-xs text-slate-500">{proj.clientName}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm">
                        <IndianRupee size={14} />
                        {proj.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No daily marketing reports found this month.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Spent (MTD)</span>
              <span className="text-lg font-black text-slate-900 flex items-center">
                <IndianRupee size={18} />
                {data.thisWeek.totalMonthlySpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Team Bottlenecks Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-600" /> Overdue Tasks by Employee
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Staff members with missed deadlines</p>
              </div>
              <button 
                onClick={() => setShowTeamModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.people.editorsWithOverdue && data.people.editorsWithOverdue.length > 0 ? (
                <div className="space-y-3">
                  {data.people.editorsWithOverdue.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-500">ID: {emp.employeeId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm border border-rose-100">
                        <AlertTriangle size={14} />
                        {emp.overdueCount} Tasks
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  Hooray! No staff members have overdue tasks.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Urgent Deliverables Modal */}
      {showUrgentDeliverablesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-600" /> Overdue Deliverables
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Tasks that have passed their deadline</p>
              </div>
              <button 
                onClick={() => setShowUrgentDeliverablesModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.critical.overdueDeliverablesList && data.critical.overdueDeliverablesList.length > 0 ? (
                <div className="space-y-3">
                  {data.critical.overdueDeliverablesList.map((task, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-100 transition">
                      <p className="text-sm font-bold text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.task?.project?.projectName} ({task.task?.project?.clientName})</p>
                      <div className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded w-max">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No overdue deliverables found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Urgent Approvals Modal */}
      {showUrgentApprovalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-600" /> Stuck Approvals
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Tasks verified but not approved by client (&gt;3 days)</p>
              </div>
              <button 
                onClick={() => setShowUrgentApprovalsModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.critical.oldApprovalsList && data.critical.oldApprovalsList.length > 0 ? (
                <div className="space-y-3">
                  {data.critical.oldApprovalsList.map((task, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-100 transition">
                      <p className="text-sm font-bold text-slate-800">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.task?.project?.projectName} ({task.task?.project?.clientName})</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No stuck approvals found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clients At Risk Modal */}
      {showClientsAtRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-rose-600" /> Clients At Risk
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Clients with critical health scores</p>
              </div>
              <button 
                onClick={() => setShowClientsAtRiskModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {clientsAtRiskList.length > 0 ? (
                <div className="space-y-3">
                  {clientsAtRiskList.map((client, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-100 transition">
                      <p className="text-sm font-bold text-slate-800">{client.projectName}</p>
                      <p className="text-xs text-slate-500 mb-2">Score: {client.score}/100</p>
                      <div className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">
                        {client.breakdown?.statusReason || "Poor communication or missed tasks"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No clients currently at risk.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clients Ignored Modal */}
      {showClientsIgnoredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-amber-600" /> Ignored Clients (&gt; 7 Days)
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">No WhatsApp messages in last 7 days</p>
              </div>
              <button 
                onClick={() => setShowClientsIgnoredModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {clientsIgnoredList.length > 0 ? (
                <div className="space-y-3">
                  {clientsIgnoredList.map((client, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-100 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{client.projectName}</p>
                        <p className="text-xs text-slate-500">Last Comm: {client.breakdown?.lastComm ? new Date(client.breakdown.lastComm).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {client.breakdown?.daysSinceLastComm} Days
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  All clients have been contacted recently.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && selectedSocialSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Calendar size={18} className="text-violet-600" /> Monthly Content Calendar
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {selectedSocialProject?.projectName} ({activeMonthLabel})
                </p>
              </div>
              <button 
                onClick={() => setShowCalendarModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="px-4 py-3 font-bold text-xs uppercase">Date</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase">Title</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase">Content Type</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase">Upload Status</th>
                        <th className="px-4 py-3 font-bold text-xs uppercase">Submitted Links</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedSocialSheet.days || []).map((day, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-slate-800">
                            {day.title || <span className="text-slate-400 italic">No Title</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {day.reelType && day.reelType !== 'NONE' && (
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded">REEL</span>
                              )}
                              {day.postType && day.postType !== 'NONE' && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">POST</span>
                              )}
                              {(!day.reelType || day.reelType === 'NONE') && (!day.postType || day.postType === 'NONE') && (
                                <span className="text-slate-400 text-xs italic">Unspecified</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                              day.uploadStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                              day.uploadStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {day.uploadStatus || 'NOT UPLOADED'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {day.uploadStatus === "APPROVED" ? (
                              <div className="flex min-w-40 flex-col items-start gap-1.5">
                                {[
                                  ...(day.videoUploadLinks || []).map((link) => ({ link, type: "Reel" })),
                                  ...(day.contentUploadLinks || []).map((link) => ({ link, type: "Post" })),
                                ].map(({ link, type }, linkIndex) => {
                                  const safeUrl = getSafeExternalUrl(link);
                                  return safeUrl ? (
                                    <a
                                      key={`${day.id}-${type}-${linkIndex}`}
                                      href={safeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex max-w-64 items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                    >
                                      <Link2 size={13} className="shrink-0" />
                                      <span className="truncate">{type} link {linkIndex + 1}</span>
                                    </a>
                                  ) : null;
                                })}
                                {!(day.videoUploadLinks || []).some((link) => getSafeExternalUrl(link))
                                  && !(day.contentUploadLinks || []).some((link) => getSafeExternalUrl(link))
                                  && <span className="text-xs text-slate-400">No links submitted</span>}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Available after approval</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!selectedSocialSheet.days || selectedSocialSheet.days.length === 0) && (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                            No planned days in this calendar yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
