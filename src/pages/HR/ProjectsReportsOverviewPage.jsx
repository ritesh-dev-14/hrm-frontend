import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Megaphone,
  TrendingUp,
  Download,
  Calendar,
  Search,
  RefreshCw,
  Film,
  ImageIcon,
  DollarSign,
  Users,
  BarChart3,
  FileText,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Activity,
  Layers,
  X,
  Code2,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import ProfessionalLoader from "../../components/ProfessionalLoader";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));
const fmtCurrency = (n) =>
  n == null
    ? "—"
    : "₹" +
      Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

const getPreset = (preset) => {
  const today = new Date();
  const toISO = (d) => d.toISOString().split("T")[0];
  if (preset === "today")
    return { startDate: toISO(today), endDate: toISO(today) };
  if (preset === "3days") {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return { startDate: toISO(d), endDate: toISO(today) };
  }
  if (preset === "weekly") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { startDate: toISO(d), endDate: toISO(today) };
  }
  if (preset === "monthly") {
    const d = new Date(today);
    d.setDate(1);
    return { startDate: toISO(d), endDate: toISO(today) };
  }
  return { startDate: "", endDate: "" };
};

function exportToExcel(tab, data, startDate, endDate) {
  let rows = [];
  const range =
    startDate && endDate ? `${startDate} to ${endDate}` : "All Time";
  const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;

  rows.push(escapeCell(`Reports Overview - ${tab.toUpperCase()}`));
  rows.push(escapeCell(`Date Range: ${range}`));
  rows.push("");

  if (tab === "social-media") {
    rows.push(
      [
        "Project",
        "Total Planned",
        "Reels Planned",
        "Reels Uploaded",
        "Post Planned",
        "Post Uploaded",
        "Total Uploads",
      ].join(","),
    );
    (data.socialMedia || []).forEach((p) => {
      const totalPlanned = (p.reelsPlanned || 0) + (p.postsPlanned || 0);
      const totalUploaded = (p.reelsPosted || 0) + (p.postsPosted || 0);
      rows.push(
        [
          escapeCell(p.projectName),
          totalPlanned,
          p.reelsPlanned ?? 0,
          p.reelsPosted ?? 0,
          p.postsPlanned ?? 0,
          p.postsPosted ?? 0,
          totalUploaded,
        ].join(","),
      );
    });
  } else if (tab === "meta-ads") {
    rows.push(
      [
        "Project",
        "Client",
        "Total Reach",
        "Total Spend",
        "Total Leads",
        "Reports",
      ].join(","),
    );
    (data.metaAds || []).forEach((p) =>
      rows.push(
        [
          escapeCell(p.projectName),
          escapeCell(p.clientName),
          p.totalReach ?? 0,
          p.totalSpend ?? 0,
          p.totalLeads ?? 0,
          p.reportCount ?? 0,
        ].join(","),
      ),
    );
  } else if (tab === "seo") {
    rows.push(
      [
        "Project",
        "Client",
        "Keywords",
        "Ranking",
        "Last Checked",
        "Remarks",
        "Manager",
      ].join(","),
    );
    (data.seo || []).forEach((p) => {
      const lr = p.latestReport;
      rows.push(
        [
          escapeCell(p.projectName),
          escapeCell(p.clientName),
          escapeCell((lr?.keywords || []).join(", ")),
          lr?.rankingNo ?? "—",
          lr ? fmtDate(lr.checkDate) : "—",
          escapeCell(lr?.remarks),
          escapeCell(lr?.managerName),
        ].join(","),
      );
    });
  } else if (tab === "web-development") {
    rows.push(
      ["Project", "Latest Report", "Previous Report", "Task Progress", "Blockers", "Employee"].join(","),
    );
    (data.webDevelopment || []).forEach((p) => {
      const latest = p.reports?.[0];
      const previous = p.reports?.[1];
      rows.push([
        escapeCell(p.projectName),
        escapeCell(latest?.content),
        escapeCell(previous?.content),
        latest?.taskProgress == null ? "—" : `${latest.taskProgress}%`,
        escapeCell(latest?.blockers),
        escapeCell(latest?.employeeName),
      ].join(","));
    });
  }

  const blob = new Blob(["\ufeff" + rows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tab}-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ icon: Icon, label, value, subValue, secondaryLabel, secondaryValue, colorClass, bgClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all duration-200 relative"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </p>
        
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
          <span className="font-medium text-slate-500">{subValue || "—"}</span>
          {secondaryLabel && (
            <span className="font-semibold text-slate-700">
              <span className="text-slate-400 font-normal mr-1">{secondaryLabel}:</span>
              {secondaryValue}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ label }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white/50 rounded-2xl border border-slate-200 border-dashed backdrop-blur-sm"
    >
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 shadow-inner">
        <BarChart3 size={28} className="text-slate-300" />
      </div>
      <p className="font-semibold text-slate-700 text-lg">{label}</p>
      <p className="text-sm mt-1 text-slate-500">
        Adjust the date range or try a different filter.
      </p>
    </motion.div>
  );
}

function SocialMediaTab({ data, search, selectedProject, setSelectedProject }) {
  const [expanded, setExpanded] = useState(null);
  const [projectReasons, setProjectReasons] = useState({});
  const [loadingReasons, setLoadingReasons] = useState(null);

  const projects = (data?.socialMedia || []).filter(
    (p) =>
      !search ||
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = selectedProject
    ? {
        reelsPlanned: selectedProject.reelsPlanned || 0,
        reelsPosted: selectedProject.reelsPosted || 0,
        postsPlanned: selectedProject.postsPlanned || 0,
        postsPosted: selectedProject.postsPosted || 0,
      }
    : projects.reduce(
        (acc, p) => ({
          reelsPlanned: acc.reelsPlanned + (p.reelsPlanned || 0),
          reelsPosted: acc.reelsPosted + (p.reelsPosted || 0),
          postsPlanned: acc.postsPlanned + (p.postsPlanned || 0),
          postsPosted: acc.postsPosted + (p.postsPosted || 0),
        }),
        { reelsPlanned: 0, reelsPosted: 0, postsPlanned: 0, postsPosted: 0 },
      );

  const totalPlannedAll = totals.reelsPlanned + totals.postsPlanned;
  const totalUploadedAll = totals.reelsPosted + totals.postsPosted;
  const overallExecutionRate = totalPlannedAll > 0 ? Math.round((totalUploadedAll / totalPlannedAll) * 100) : 0;

  const getReasons = (project) => {
    const reasons = projectReasons[project.projectId] ?? project.reasons ?? [];
    return [...reasons].sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  };

  const handleRowClick = async (p) => {
    if (selectedProject?.projectId === p.projectId) {
      setSelectedProject(null);
    } else {
      setSelectedProject(p);
    }

    if (expanded === p.projectId) {
      setExpanded(null);
      return;
    }

    setExpanded(p.projectId);
    if (projectReasons[p.projectId]) return;

    setLoadingReasons(p.projectId);
    try {
      const response = await API.get(`/api/projects/${p.projectId}`);
      const projectData = response.data?.data || response.data || {};
      setProjectReasons((current) => ({
        ...current,
        [p.projectId]: projectData.reasons || [],
      }));
    } catch (error) {
      console.error("Failed to load Deviation:", error);
      setProjectReasons((current) => ({
        ...current,
        [p.projectId]: p.reasons || [],
      }));
    } finally {
      setLoadingReasons(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon={Layers}
          label={selectedProject ? `Execution Rate (${selectedProject.projectName})` : "Total Execution Rate"}
          value={`${overallExecutionRate}%`}
          subValue={selectedProject ? `Client: ${selectedProject.clientName || "—"}` : `${projects.length} Active Projects`}
          secondaryLabel="Total Volume"
          secondaryValue={`${fmt(totalUploadedAll)} / ${fmt(totalPlannedAll)}`}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <StatCard
          icon={Film}
          label="Reels Deviation"
          value={fmt(totals.reelsPosted)}
          subValue={`${Math.round((totals.reelsPosted / (totals.reelsPlanned || 1)) * 100)}% Fulfilled`}
          secondaryLabel="Planned"
          secondaryValue={fmt(totals.reelsPlanned)}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          icon={ImageIcon}
          label="Posts Deviation"
          value={fmt(totals.postsPosted)}
          subValue={`${Math.round((totals.postsPosted / (totals.postsPlanned || 1)) * 100)}% Fulfilled`}
          secondaryLabel="Planned"
          secondaryValue={fmt(totals.postsPlanned)}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState label="No Social Media projects found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Project Details
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Planned
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Reels Planned
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Reels Uploaded
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Post Planned
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Post Uploaded
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Uploads
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p, i) => {
                const totalPlanned =
                  (p.reelsPlanned || 0) + (p.postsPlanned || 0);
                const totalUploaded =
                  (p.reelsPosted || 0) + (p.postsPosted || 0);
                const uploadPct =
                  totalPlanned > 0
                    ? Math.round((totalUploaded / totalPlanned) * 100)
                    : 0;
                const reasons = getReasons(p);
                const latestReason = reasons[0];
                const isSelected = selectedProject?.projectId === p.projectId;

                return [
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.projectId}
                    onClick={() => handleRowClick(p)}
                    className={`cursor-pointer transition-colors group ${isSelected ? "bg-indigo-50/40 ring-1 ring-inset ring-indigo-200" : expanded === p.projectId ? "bg-slate-50/90" : "hover:bg-slate-50/80"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg border transition-colors ${expanded === p.projectId ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:text-slate-600"}`}>
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${expanded === p.projectId ? "rotate-180" : ""}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {p.projectName || "—"}
                            </p>
                            {isSelected && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          {latestReason && (
                            <p
                              className="text-xs text-amber-700 mt-1 font-medium max-w-xs truncate"
                              title={latestReason.reason || latestReason.text}
                            >
                              Deviation: {latestReason.reason || latestReason.text || "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 bg-slate-50/40">
                      {fmt(totalPlanned)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-600">
                      {fmt(p.reelsPlanned)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {fmt(p.reelsPosted)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-600">
                      {fmt(p.postsPlanned)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {fmt(p.postsPosted)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="text-sm font-bold text-slate-900">
                          {fmt(totalUploaded)} <span className="text-slate-400 font-normal text-xs">/ {fmt(totalPlanned)}</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full rounded-full ${uploadPct >= 100 ? 'bg-emerald-500' : uploadPct >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`} 
                            style={{ width: `${Math.min(uploadPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">{uploadPct}% Executed</span>
                      </div>
                    </td>
                  </motion.tr>,
                  expanded === p.projectId && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={`${p.projectId}-reasons`}
                      className="bg-amber-50/20"
                    >
                      <td colSpan={7} className="px-6 py-5">
                        <div className="ml-10 rounded-xl border border-amber-200/70 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Deviation Records
                            </h4>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {reasons.length} {reasons.length === 1 ? "reason" : "reasons"}
                            </span>
                          </div>
                          {loadingReasons === p.projectId ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                              <Loader2 size={16} className="animate-spin text-amber-600" /> Loading reasons...
                            </div>
                          ) : reasons.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">
                              No deviation reasons logged for this project.
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {reasons.map((reason, reasonIndex) => (
                                <div
                                  key={reason.id || `${p.projectId}-${reasonIndex}`}
                                  className="flex items-start gap-3 border-t border-slate-100 pt-2.5 first:border-t-0 first:pt-0"
                                >
                                  <Calendar
                                    size={14}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                  />
                                  <div>
                                    <p className="text-xs font-medium text-slate-800">
                                      {reason.reason || reason.text || "—"}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      {fmtDate(reason.date)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function MetaAdsTab({ data, search, selectedProject, setSelectedProject }) {
  const [expanded, setExpanded] = useState(null);
  const projects = (data?.metaAds || []).filter(
    (p) =>
      !search ||
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = selectedProject
    ? {
        reach: selectedProject.totalReach || 0,
        spend: selectedProject.totalSpend || 0,
        leads: selectedProject.totalLeads || 0,
        reports: selectedProject.reportCount || (selectedProject.reports || []).length || 0,
      }
    : projects.reduce(
        (acc, p) => ({
          reach: acc.reach + (p.totalReach || 0),
          spend: acc.spend + (p.totalSpend || 0),
          leads: acc.leads + (p.totalLeads || 0),
          reports: acc.reports + (p.reportCount || (p.reports || []).length || 0),
        }),
        { reach: 0, spend: 0, leads: 0, reports: 0 },
      );

  const costPerLead = totals.leads > 0 ? totals.spend / totals.leads : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon={DollarSign}
          label={selectedProject ? `Ad Spend (${selectedProject.projectName})` : "Ad Spend & Efficiency"}
          value={fmtCurrency(totals.spend)}
          subValue={`CPL: ${fmtCurrency(costPerLead)}`}
          secondaryLabel="Total Reach"
          secondaryValue={fmt(totals.reach)}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          icon={Users}
          label="Total Leads Generated"
          value={fmt(totals.leads)}
          subValue={selectedProject ? `Client: ${selectedProject.clientName || "—"}` : `${projects.length} Campaigns`}
          secondaryLabel="Conversion Volume"
          secondaryValue="Verified"
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          icon={Activity}
          label="Total Campaign Reports"
          value={fmt(totals.reports)}
          subValue="Logged Activity Reports"
          secondaryLabel="Efficiency Score"
          secondaryValue="Optimal"
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState label="No Meta Ads reports found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Project Details
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Reach
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Spend
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Leads
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Cost Per Lead (CPL)
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Reports Count
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p, i) => {
                const pSpend = p.totalSpend || 0;
                const pLeads = p.totalLeads || 0;
                const pCpl = pLeads > 0 ? pSpend / pLeads : 0;
                const reportCount = p.reportCount || (p.reports || []).length || 0;
                const isSelected = selectedProject?.projectId === p.projectId;
                
                const isAnyAdRunning = (p.reports || []).some((r) => r.isAdRunning === true);

                return [
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.projectId}
                    onClick={() => {
                      if (selectedProject?.projectId === p.projectId) {
                        setSelectedProject(null);
                      } else {
                        setSelectedProject(p);
                      }
                      setExpanded(expanded === p.projectId ? null : p.projectId);
                    }}
                    className={`cursor-pointer transition-colors group ${isSelected ? "bg-blue-50/40 ring-1 ring-inset ring-blue-200" : expanded === p.projectId ? "bg-slate-50/90" : "hover:bg-slate-50/80"}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg border transition-colors ${expanded === p.projectId ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400 group-hover:text-slate-600"}`}>
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${expanded === p.projectId ? "rotate-180" : ""}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {isAnyAdRunning && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            )}
                            
                            <p className={`font-bold transition-colors ${
                              isAnyAdRunning 
                                ? "text-emerald-600 group-hover:text-emerald-700" 
                                : "text-slate-900 group-hover:text-blue-600"
                            }`}>
                              {p.projectName || "—"}
                            </p>

                            {isSelected && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            {p.clientName || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 bg-slate-50/40">
                      {fmt(p.totalReach)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-600">
                      {fmtCurrency(p.totalSpend)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">
                      {fmt(p.totalLeads)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-600">
                      {fmtCurrency(pCpl)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {fmt(reportCount)}
                    </td>
                  </motion.tr>,
                  expanded === p.projectId && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={`${p.projectId}-reports`}
                      className="bg-blue-50/20"
                    >
                      <td colSpan={6} className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                        <div className="ml-10 rounded-xl border border-blue-200/70 bg-white p-4 shadow-sm">
                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3">
                            Daily Breakdown Logs
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-slate-200/70">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80">
                                  {[
                                    "Date",
                                    "Reach",
                                    "Spend",
                                    "Leads",
                                    "Status",
                                    "Type",
                                    "Area",
                                  ].map((h) => (
                                  <th
                                    key={h}
                                    className="px-4 py-2.5 font-bold text-slate-600 uppercase tracking-wider text-xs"
                                  >
                                    {h}
                                  </th>
                                ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(p.reports || []).map((r) => (
                                  <tr
                                    key={r.id}
                                    className="text-slate-600 hover:bg-slate-50/80 transition-colors"
                                  >
                                    <td className="px-4 py-3 text-slate-900 font-semibold text-xs">
                                      {fmtDate(r.date)}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-xs">
                                      {fmt(r.reach)}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-xs">
                                      {fmtCurrency(r.spend)}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-blue-600 text-xs">
                                      {fmt(r.leads)}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                      {r.isAdRunning === null ? (
                                        "—"
                                      ) : r.isAdRunning ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                                          <CheckCircle2 size={10} strokeWidth={3} /> Running
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
                                          <AlertCircle size={10} strokeWidth={3} /> Paused
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-xs">
                                      {r.typeOfAds || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                      {r.areaName || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function SeoTab({ data, search, selectedProject, setSelectedProject }) {
  const [expanded, setExpanded] = useState(null);
  
  const projects = (data?.seo || []).filter(
    (p) =>
      !search ||
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()),
  );

  const topRankingsCount = selectedProject
    ? (selectedProject.latestReport?.rankingNo && selectedProject.latestReport.rankingNo <= 10 ? 1 : 0)
    : projects.filter(p => p.latestReport?.rankingNo && p.latestReport.rankingNo <= 10).length;

  const getRankBadge = (rank) => {
    if (!rank) return <span className="text-slate-400 font-medium">—</span>;
    if (rank <= 3) return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold shadow-sm">#{rank}</span>;
    if (rank <= 10) return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold">#{rank}</span>;
    return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded text-xs font-semibold">#{rank}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Top Stats - Kept clean and minimal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard
          icon={TrendingUp}
          label={selectedProject ? `SEO Project: ${selectedProject.projectName}` : "Tracked SEO Projects"}
          value={selectedProject ? (selectedProject.latestReport?.rankingNo ? `#${selectedProject.latestReport.rankingNo}` : "—") : projects.length}
          subValue={selectedProject ? `Client: ${selectedProject.clientName || "—"}` : `${topRankingsCount} projects in Top 10`}
          secondaryLabel="Status"
          secondaryValue="Active Monitoring"
          colorClass="text-slate-700"
          bgClass="bg-slate-100"
        />
        <StatCard
          icon={Search}
          label="Keyword Density"
          value={selectedProject ? (selectedProject.latestReport?.keywords?.length || 0) : projects.reduce((acc, p) => acc + (p.latestReport?.keywords?.length || 0), 0)}
          subValue="Total Tracked Keywords"
          secondaryLabel="Update Cycle"
          secondaryValue="Real-time"
          colorClass="text-slate-700"
          bgClass="bg-slate-100"
        />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-lg border-dashed">
          <Search size={28} className="text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No SEO data available.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          {/* Table Header Equivalent */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Project & Client</div>
            <div className="col-span-3 text-center">Current Rank</div>
            <div className="col-span-3 text-center">Last Audit</div>
            <div className="col-span-2 text-right pr-4">Action</div>
          </div>

          <div className="divide-y divide-slate-200">
            {projects.map((p, i) => {
              const lr = p.latestReport;
              const isSelected = selectedProject?.projectId === p.projectId;
              const isExpanded = expanded === p.projectId;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={p.projectId}
                  className={`group transition-colors ${isSelected ? "bg-indigo-50/30" : "hover:bg-slate-50/50"}`}
                >
                  {/* Row Content */}
                  <div 
                    onClick={() => setSelectedProject(isSelected ? null : p)}
                    className="cursor-pointer p-4 md:px-4 md:py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                  >
                    {/* Project Info */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                      <div className={`p-2 rounded border ${isExpanded ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500"}`}>
                        <TrendingUp size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {p.projectName}
                          </h3>
                          {isSelected && (
                            <span className="text-[9px] uppercase tracking-widest bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-sm">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                          <Users size={12} /> {p.clientName || "Internal"}
                        </p>
                      </div>
                    </div>

                    {/* Rank */}
                    <div className="col-span-6 md:col-span-3 flex md:justify-center items-center">
                      <div className="md:hidden text-xs text-slate-400 font-medium mr-2">Rank:</div>
                      {getRankBadge(lr?.rankingNo)}
                    </div>
                    
                    {/* Date */}
                    <div className="col-span-6 md:col-span-3 flex md:justify-center items-center">
                      <div className="md:hidden text-xs text-slate-400 font-medium mr-2">Audited:</div>
                      <span className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {fmtDate(lr?.checkDate)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 md:col-span-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(isExpanded ? null : p.projectId);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      >
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Data Area */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 md:p-6 bg-slate-50 border-t border-slate-200 space-y-6">
                          
                          {/* Top Section: Keywords & Remarks */}
                          {lr && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Keywords */}
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <Search size={14} className="text-slate-400" /> Targeted Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {(lr.keywords || []).length > 0 ? (
                                    lr.keywords.map((kw, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded shadow-sm"
                                      >
                                        {kw}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-slate-500 italic">No keywords tracked.</span>
                                  )}
                                </div>
                              </div>

                              {/* Remarks */}
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <MessageSquare size={14} className="text-slate-400" /> Auditor Remarks
                                </h4>
                                <div className="bg-white border-l-2 border-indigo-500 p-4 rounded-r shadow-sm">
                                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {lr.remarks || <span className="text-slate-400 italic">No remarks provided for the current cycle.</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Historical Data Table */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Layers size={14} className="text-slate-400" /> Historical Performance
                            </h4>
                            
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                              <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    {["Audit Date", "Rank", "Keywords Shift", "Manager", "Evidence"].map((h) => (
                                      <th key={h} className="px-4 py-3 font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(p.reports || []).length > 0 ? (
                                    p.reports.map((r, rIdx) => (
                                      <tr key={r.id || rIdx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                          {fmtDate(r.checkDate)}
                                        </td>
                                        <td className="px-4 py-3">
                                          {getRankBadge(r.rankingNo)}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate" title={(r.keywords || []).join(", ")}>
                                          {(r.keywords || []).join(", ") || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-medium text-slate-700">
                                          {r.managerName || "Unknown"}
                                        </td>
                                        <td className="px-4 py-3">
                                          {r.screenshotUrl ? (
                                            <a
                                              href={r.screenshotUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition-colors"
                                            >
                                              <ExternalLink size={13} /> View File
                                            </a>
                                          ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-sm">
                                        No historical records available.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}



function WebDevelopmentTab({ data, search }) {
  const [expanded, setExpanded] = useState(null);

  const projects = (data?.webDevelopment || []).filter((project) =>
    !search ||
    `${project.projectName} ${project.clientName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard 
          icon={Code2} 
          label="Web Development Projects" 
          value={projects.length} 
          subValue="Active Tracked Projects" 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          icon={FileText} 
          label="Latest Reports" 
          value={projects.filter((p) => p.reports?.[0]).length} 
          subValue="Projects with recent updates" 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50" 
        />
        <StatCard 
          icon={Activity} 
          label="Average Progress" 
          value={`${projects.length ? Math.round(projects.reduce((sum, p) => sum + (p.reports?.[0]?.taskProgress || 0), 0) / projects.length) : 0}%`} 
          subValue="Across all active projects" 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState label="No Web Development reports found" />
      ) : (
        <div className="space-y-4">
          {projects.map((project, i) => {
            const latest = project.reports?.[0];
            const previous = project.reports?.[1];
            const isExpanded = expanded === project.projectId;
            const progress = latest?.taskProgress || 0;

            return (
              <motion.div 
                key={project.projectId} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? "border-blue-200 shadow-lg shadow-blue-900/5 ring-4 ring-blue-50" 
                    : "border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {/* Header Section */}
                <div 
                  onClick={() => setExpanded(isExpanded ? null : project.projectId)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer group gap-4"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl transition-colors duration-300 ${isExpanded ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
                      <Code2 size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-extrabold text-slate-900 text-[16px] group-hover:text-blue-700 transition-colors">
                        {project.projectName}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                        <Users size={14} className="text-slate-400" />
                        {project.clientName || "Internal Project"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                    <div className="flex-1 sm:w-40">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Progress</span>
                        <span className="text-[11px] font-extrabold text-blue-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <button className={`p-2.5 rounded-xl border transition-all duration-200 shrink-0 ${
                      isExpanded ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-500 group-hover:bg-slate-50"
                    }`}>
                      <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Timeline Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="border-t border-slate-100 bg-slate-50/50 p-5 md:p-8">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                          <Layers size={14} /> Development Activity Logs
                        </h4>
                        
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                          {/* Latest Report */}
                          {latest ? (
                            <div className="relative pl-6">
                              <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-100 border-2 border-blue-600 ring-4 ring-slate-50" />
                              <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                                    <Activity size={12} /> Latest Update
                                  </span>
                                  <span className="text-xs font-semibold text-slate-400">{fmtDate(latest.date)}</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                  {latest.content || "No details provided."}
                                </p>
                                
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                  {latest.lastWorking && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Last Working</p>
                                      <p className="text-xs text-slate-700 font-medium">{latest.lastWorking}</p>
                                    </div>
                                  )}
                                  {latest.nextStep && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Next Step</p>
                                      <p className="text-xs text-slate-700 font-medium">{latest.nextStep}</p>
                                    </div>
                                  )}
                                </div>

                                {latest.blockers && (
                                  <div className="mt-3 bg-red-50/50 border border-red-100 p-3 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">Current Blockers</p>
                                      <p className="text-xs font-semibold text-red-900">{latest.blockers}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {latest.employeeName && (
                                  <p className="mt-4 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> Logged by {latest.employeeName}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="pl-6 text-sm text-slate-400 italic">No reports generated yet.</p>
                          )}

                          {/* Previous Report */}
                          {previous && (
                            <div className="relative pl-6 opacity-75 hover:opacity-100 transition-opacity">
                              <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-slate-200 border-2 border-slate-400 ring-4 ring-slate-50" />
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previous Update</span>
                                  <span className="text-xs font-semibold text-slate-400">{fmtDate(previous.date)}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {previous.content}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}


export default function ProjectsReportsOverviewPage() {
  const [tab, setTab] = useState("social-media");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [preset, setPreset] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const tabs = [
    {
      id: "social-media",
      label: "Social Media",
      icon: Share2,
      activeClass: "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
    {
      id: "meta-ads",
      label: "Meta Ads",
      icon: Megaphone,
      activeClass: "bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
    {
      id: "seo",
      label: "SEO",
      icon: TrendingUp,
      activeClass:
        "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
    {
      id: "web-development",
      label: "Web Development",
      icon: Code2,
      activeClass: "bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await API.get(`/api/reports/projects-overview?${params}`);
      const overview = res.data?.data || {};
      const projectsRes = await API.get("/api/projects");
      const webProjects = (projectsRes.data?.data || []).filter((project) => {
        const name = project.department?.name?.toLowerCase() || "";
        return name.includes("web development") || name === "it";
      });
      const webDevelopment = await Promise.all(webProjects.map(async (project) => {
        try {
          const reportsRes = await API.get(`/api/project-reports/${project.id}`);
          const reports = reportsRes.data?.data || [];
          return {
            projectId: project.id,
            projectName: project.projectName,
            clientName: project.clientName,
            reports: reports.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2).map((report) => ({
              ...report,
              employeeName: report.employee?.name || report.createdBy?.name,
            })),
          };
        } catch {
          return { projectId: project.id, projectName: project.projectName, clientName: project.clientName, reports: [] };
        }
      }));
      setData({ ...overview, webDevelopment });
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (p) => {
    setPreset(p);
    const r = getPreset(p);
    setStart(r.startDate);
    setEnd(r.endDate);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-8 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header - Premium Enterprise Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Reports Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium tracking-wide">
              Monitor key performance metrics across social media, meta ads, SEO, and Web Development projects.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-semibold text-xs transition-all shadow-sm"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin text-blue-600" : ""}
              />
              Refresh Data
            </button>
            <button
              onClick={() => exportToExcel(tab, data, startDate, endDate)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              <Download
                size={14}
                className="text-slate-300 group-hover:text-white transition-colors"
              />
              Export CSV
            </button>
          </div>
        </div>

        {/* Selected Project Banner Notification (if active) */}
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-900 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="bg-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">Filtering Stats</span>
              <span>Showing metrics for: <strong className="underline decoration-indigo-400">{selectedProject.projectName}</strong></span>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="text-indigo-200 hover:text-white text-xs flex items-center gap-1 bg-indigo-800/80 px-2.5 py-1 rounded-lg transition-colors"
            >
              <X size={13} /> Reset View
            </button>
          </motion.div>
        )}

        {/* Consolidated Filters Panel */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.02)] flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0">
            {[
              { id: "today", label: "Today" },
              { id: "3days", label: "3 Days" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "", label: "All Time" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 whitespace-nowrap ${preset === p.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/60 rounded-xl px-3 py-1.5 flex-1 md:flex-none">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPreset("");
                }}
                className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none w-full md:w-28 cursor-pointer"
              />
            </div>
            <span className="text-slate-300 font-medium hidden md:block">—</span>
            <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/60 rounded-xl px-3 py-1.5 flex-1 md:flex-none">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPreset("");
                }}
                className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none w-full md:w-28 cursor-pointer"
              />
            </div>

            <div className="w-px h-6 bg-slate-200 hidden xl:block mx-1"></div>

            <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/60 rounded-xl px-3 py-1.5 flex-1 w-full xl:w-48">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records..."
                className="bg-transparent text-[12px] font-semibold text-slate-700 outline-none placeholder-slate-400 w-full"
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-start">
          <div className="inline-flex bg-slate-200/70 p-1 rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelectedProject(null); // Clear selection when switching tabs
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 ${tab === t.id ? t.activeClass : t.inactiveClass}`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <ProfessionalLoader text="Loading reports..." />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "social-media" && (
                  <SocialMediaTab 
                    data={data} 
                    search={search} 
                    selectedProject={selectedProject} 
                    setSelectedProject={setSelectedProject} 
                  />
                )}
                {tab === "meta-ads" && (
                  <MetaAdsTab 
                    data={data} 
                    search={search} 
                    selectedProject={selectedProject} 
                    setSelectedProject={setSelectedProject} 
                  />
                )}
                {tab === "seo" && (
                  <SeoTab 
                    data={data} 
                    search={search} 
                    selectedProject={selectedProject} 
                    setSelectedProject={setSelectedProject} 
                  />
                )}
                {tab === "web-development" && (
                  <WebDevelopmentTab data={data} search={search} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
