import React from "react";
import {
  AlertTriangle,
  Clock,
  Camera,
  FileText,
  DollarSign,
  Users,
  ShieldAlert,
  PhoneOff,
  Activity,
  Loader2,
  Building2,
  IndianRupee,
  X,
  User,
  FolderOpen,
  ChevronRight,
} from "lucide-react";

export default function AdminControlTower({
  data,
  loading,
  healthMap,
  managers = [],
  projects = [],
  managerDirectoryError = "",
  onSelectProject,
}) {
  const [selectedManagerId, setSelectedManagerId] = React.useState("");
  const [selectedManagerDepartment, setSelectedManagerDepartment] = React.useState("");
  const [showBudgetModal, setShowBudgetModal] = React.useState(false);
  const [showSpendModal, setShowSpendModal] = React.useState(false);
  const [showTeamModal, setShowTeamModal] = React.useState(false);
  
  const [showUrgentDeliverablesModal, setShowUrgentDeliverablesModal] = React.useState(false);
  const [showUrgentApprovalsModal, setShowUrgentApprovalsModal] = React.useState(false);
  const [showClientsAtRiskModal, setShowClientsAtRiskModal] = React.useState(false);
  const [showClientsIgnoredModal, setShowClientsIgnoredModal] = React.useState(false);

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
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-slate-900 p-2 rounded-xl text-white">
          <Activity size={20} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">CEO Control Tower</h2>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Morning Briefing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Section */}
        <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 space-y-4">
          <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={16} /> Urgent Attention
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setShowUrgentDeliverablesModal(true)}
              className="bg-white/70 rounded-2xl p-4 border border-rose-100/50 text-center shadow-sm cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-3xl font-black text-rose-600 group-hover:scale-105 transition">{data.critical.overdueDeliverables}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Deliverables<br/>Overdue</p>
            </div>
            <div 
              onClick={() => setShowUrgentApprovalsModal(true)}
              className="bg-white/70 rounded-2xl p-4 border border-rose-100/50 text-center shadow-sm cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-3xl font-black text-rose-600 group-hover:scale-105 transition">{data.critical.oldApprovals}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Approvals<br/>Stuck &gt;3d</p>
            </div>
          </div>
        </div>

        {/* This Week Section */}
        <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 space-y-4">
          <h3 className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} /> This Month's Output
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-xl font-black text-indigo-600">{data.thisWeek.shootsScheduled}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Shoots</p>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-xl font-black text-indigo-600">{data.thisWeek.contentPiecesDue}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Assets</p>
            </div>
            <div 
              onClick={() => setShowBudgetModal(true)}
              className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-sm font-black text-indigo-600 flex justify-center items-center group-hover:scale-105 transition">
                <IndianRupee size={12} />{data.thisWeek.totalMonthlyBudget > 1000 ? (data.thisWeek.totalMonthlyBudget/1000).toFixed(1) + 'k' : data.thisWeek.totalMonthlyBudget}
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Budget</p>
            </div>
            <div 
              onClick={() => setShowSpendModal(true)}
              className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-sm font-black text-indigo-600 flex justify-center items-center group-hover:scale-105 transition">
                <IndianRupee size={12} />{data.thisWeek.totalMonthlySpent > 1000 ? (data.thisWeek.totalMonthlySpent/1000).toFixed(1) + 'k' : data.thisWeek.totalMonthlySpent}
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Spent(MTD)</p>
            </div>
          </div>
        </div>

        {/* People Section */}
        <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 space-y-4">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            <Users size={16} /> Team Bottlenecks
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div 
              onClick={() => setShowTeamModal(true)}
              className="bg-white/70 rounded-2xl p-4 border border-amber-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <div>
                <p className="text-2xl font-black text-amber-600 group-hover:scale-105 transition origin-left">{data.people.editorsWithOverdueCount}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Staff with overdue tasks</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 space-y-4">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 size={16} /> Client Health
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => setShowClientsAtRiskModal(true)}
              className="bg-white/70 rounded-2xl p-4 border border-emerald-100/50 text-center shadow-sm cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-3xl font-black text-rose-500 group-hover:scale-105 transition">{clientsAtRisk}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Clients<br/>At Risk</p>
            </div>
            <div 
              onClick={() => setShowClientsIgnoredModal(true)}
              className="bg-white/70 rounded-2xl p-4 border border-emerald-100/50 text-center shadow-sm cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-3xl font-black text-amber-500 group-hover:scale-105 transition">{notContacted7Days}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Ignored<br/>&gt; 7 Days</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50">
        <div className="flex flex-col gap-4 border-b border-indigo-100 bg-white/70 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Manager Projects</h3>
              <p className="text-xs font-medium text-slate-500">Choose a manager, department, and project to inspect full details.</p>
            </div>
          </div>
          <label className="w-full md:max-w-sm">
            <span className="sr-only">Select a manager</span>
            <select
              value={selectedManagerId}
              onChange={(event) => handleManagerSelect(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
          <p role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">
            {managerDirectoryError}
          </p>
        )}

        {!selectedManagerId ? (
          <p className="p-5 text-center text-sm font-medium text-slate-500">
            Select a manager to view their departments and projects.
          </p>
        ) : managerProjectGroups.length === 0 ? (
          <p className="p-5 text-center text-sm font-medium text-slate-500">
            No projects are assigned to this manager.
          </p>
        ) : (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              {managerProjectGroups.map(([departmentName, groupProjects]) => (
                <button
                  key={departmentName}
                  type="button"
                  onClick={() => setSelectedManagerDepartment(departmentName)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    selectedManagerDepartment === departmentName
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  {departmentName}
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
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
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-indigo-500">
                    {project.logo ? (
                      <img src={project.logo} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <FolderOpen size={18} />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">{project.projectName}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{project.clientName || project.department?.name || "Project"}</span>
                  </span>
                  <ChevronRight size={15} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                </button>
              ))}
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
    </div>
  );
}
