import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Briefcase,
  ClipboardList,
  TrendingUp,
  Mail,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Loader2,
  Search,
  ChevronRight,
  UserCheck,
  Layers,
  CheckSquare
} from "lucide-react";

import API from "../../services/api";
import { notifyError } from "../../utils/toast";
import AttendanceCard from "../../components/attendece/AttendenceCard";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-violet-50 text-violet-700 border-violet-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const HrHomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerSearch, setManagerSearch] = useState("");
  
  // High-level workspace segregation tab state
  // TARGET SECTIONS: "EMPLOYEES" | "PROJECTS" | "TASKS"
  const [activeSegment, setActiveSegment] = useState("EMPLOYEES");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/hr/dashboard/overview");

      if (response?.data?.success) {
        const data = response.data.data;
        setDashboardData(data);
        if (data.managerDetails?.length > 0) {
          setSelectedManager(data.managerDetails[0]);
        }
      }
    } catch (error) {
      console.error(error);
      notifyError("Failed to load dashboard parameters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const filteredManagers = useMemo(() => {
    const list = dashboardData?.managerDetails || [];
    const term = managerSearch.toLowerCase().trim();
    if (!term) return list;
    return list.filter((m) => m.manager?.name?.toLowerCase().includes(term));
  }, [dashboardData, managerSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="animate-spin text-slate-900" size={24} />
          <span className="text-xs font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { globalStats } = dashboardData;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* HEADER */}
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Overview</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-0.5">HR Operations Control</h1>
        </div>

        {/* ATTENDANCE CARD METRIC BLOCK */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
          <AttendanceCard />
        </div>

        {/* TOP LEVEL GLOBAL DIRECTORY METRICS METADATA */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsMiniRow title="Total Managers" value={globalStats.totalManagers} icon={Users} />
          <StatsMiniRow title="Total Employees" value={globalStats.totalEmployees} icon={Users} />
          <StatsMiniRow title="Active Projects" value={globalStats.totalTasks} icon={Briefcase} />
          <StatsMiniRow title="Assigned Tasks" value={globalStats.totalAssignments} icon={ClipboardList} />
        </div>

        {/* AGGREGATED STATS METRIC MATRIX */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCountRow label="Completed" value={globalStats.completedAssignments} icon={CheckCircle2} colorClass="text-emerald-600 bg-emerald-50 border-emerald-100" />
          <StatusCountRow label="Submitted" value={globalStats.submittedAssignments} icon={Clock3} colorClass="text-violet-600 bg-violet-50 border-violet-100" />
          <StatusCountRow label="Rejected" value={globalStats.rejectedAssignments} icon={XCircle} colorClass="text-red-600 bg-red-50 border-red-100" />
          <StatusCountRow label="Avg Progress" value={`${globalStats.globalAverageProgress}%`} icon={TrendingUp} colorClass="text-blue-600 bg-blue-50 border-blue-100" />
        </div>

        {/* COHORT WORKSPACE SPLIT BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANEL: STABLE NAVIGATION MANAGER LISTING SEARCH */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manager Nodes</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Select a lead to update data segregation views.</p>
            </div>
            
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Find manager profile..."
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {filteredManagers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No matching profiles</p>
              ) : (
                filteredManagers.map((node) => {
                  const isSelected = selectedManager?.manager?.id === node.manager.id;
                  return (
                    <button
                      key={node.manager.id}
                      onClick={() => setSelectedManager(node)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center justify-between group transition-colors ${
                        isSelected
                          ? "bg-slate-950 text-white border-slate-950"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block font-semibold truncate">{node.manager.name}</span>
                        <span className={`block text-[10px] mt-0.5 font-mono ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                          {node.manager.employeeId}
                        </span>
                      </div>
                      <ChevronRight size={14} className={isSelected ? "text-white" : "text-slate-300 group-hover:text-slate-600"} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: SEGREGATED WORKSPACE CONTEXT VIEW */}
          <div className="lg:col-span-2 space-y-4">
            {selectedManager ? (
              <>
                {/* ACTIVE BANNER META DATA BAR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedManager.manager.name}</h2>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono">
                        {selectedManager.manager.employeeId}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Mail size={12} /> {selectedManager.manager.email}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} /> Joined {new Date(selectedManager.manager.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* MINI PERFORMANCE COUNTERS */}
                  <div className="flex items-center gap-3 self-start md:self-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 w-full md:w-auto">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Reportees</span>
                      <span className="text-base font-bold text-slate-900 block">{selectedManager.stats.totalEmployees}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 min-w-[90px]">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Team Avg</span>
                      <span className="text-base font-bold text-slate-900 block">{selectedManager.stats.averageProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* SEGREGATION SEGMENTATION NAVIGATION TAB STRIP */}
                <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl w-full max-w-sm">
                  <SegmentTab 
                    label={`Employees (${selectedManager.employees.length})`}
                    active={activeSegment === "EMPLOYEES"}
                    onClick={() => setActiveSegment("EMPLOYEES")}
                    icon={Users}
                  />
                  <SegmentTab 
                    label={`Projects (${selectedManager.tasks.length})`}
                    active={activeSegment === "PROJECTS"}
                    onClick={() => setActiveSegment("PROJECTS")}
                    icon={Layers}
                  />
                  <SegmentTab 
                    label={`Tasks (${selectedManager.recentAssignments.length})`}
                    active={activeSegment === "TASKS"}
                    onClick={() => setActiveSegment("TASKS")}
                    icon={CheckSquare}
                  />
                </div>

                {/* CONDITIONAL SEGREGATED MATRIX BOARD VIEWS */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  
                  {/* SEGMENT BOARD 1: EMPLOYEES ROSTER LIST */}
                  {activeSegment === "EMPLOYEES" && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-5 py-3">Employee Details</th>
                            <th className="px-5 py-3">Department</th>
                            <th className="px-5 py-3 text-center">Assigned</th>
                            <th className="px-5 py-3 text-center">Submitted</th>
                            <th className="px-5 py-3">Progress Vector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {selectedManager.employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-5 py-3">
                                <span className="font-semibold text-slate-900 block">{emp.name}</span>
                                <span className="text-slate-400 font-mono text-[10px] block mt-0.5">{emp.email}</span>
                              </td>
                              <td className="px-5 py-3 text-slate-600 font-medium">
                                {emp.department?.name || "General"}
                              </td>
                              <td className="px-5 py-3 text-center font-bold text-slate-800">{emp.assignedTasks}</td>
                              <td className="px-5 py-3 text-center font-bold text-violet-700">{emp.submittedTasks}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2 w-28">
                                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div style={{ width: `${emp.averageProgress}%` }} className="h-full bg-slate-950 rounded-full" />
                                  </div>
                                  <span className="font-semibold text-slate-700 shrink-0">{emp.averageProgress}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SEGMENT BOARD 2: BLUEPRINT MANAGEMENT STRIP */}
                  {activeSegment === "PROJECTS" && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-5 py-3">Project Blueprint</th>
                            <th className="px-5 py-3">Scoped Context Context</th>
                            <th className="px-5 py-3">Lifecycle State</th>
                            <th className="px-5 py-3">Date Configured</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {selectedManager.tasks.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-slate-400">No projects mapped under management scope.</td></tr>
                          ) : (
                            selectedManager.tasks.map((task) => (
                              <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">{task.projectName}</td>
                                <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{task.description || "No specific brief metadata logs available."}</td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[task.status]}`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-400 font-medium">{new Date(task.createdAt).toLocaleDateString("en-IN")}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SEGMENT BOARD 3: TASK ITEM ASSIGNMENTS METRIC BOARD */}
                  {activeSegment === "TASKS" && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-5 py-3">Assigned Owner</th>
                            <th className="px-5 py-3">Task Parameter Deliverable</th>
                            <th className="px-5 py-3">System Status</th>
                            <th className="px-5 py-3">Completion Matrix</th>
                            <th className="px-5 py-3">Submission Record</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {selectedManager.recentAssignments.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-slate-400">No transactional line task tracking entries recorded.</td></tr>
                          ) : (
                            selectedManager.recentAssignments.map((assignment) => (
                              <tr key={assignment.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-5 py-3.5 font-semibold text-slate-900">{assignment.employee?.name || "Unassigned Operations"}</td>
                                <td className="px-5 py-3.5 text-slate-700 font-medium max-w-xs truncate">{assignment.taskItem?.title}</td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[assignment.status]}`}>
                                    {assignment.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2 w-24">
                                    <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                                      <div style={{ width: `${assignment.progress}%` }} className="h-full bg-slate-900 rounded-full" />
                                    </div>
                                    <span className="font-semibold text-slate-600">{assignment.progress}%</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-400 font-medium">
                                  {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString("en-IN") : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="border border-dashed border-slate-200 bg-white rounded-2xl py-16 text-center text-xs text-slate-400 shadow-xs">
                <UserCheck size={20} className="mx-auto mb-2 text-slate-300" />
                Select an active managing node from the terminal left-hand layout to load segregated reports.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

/* INLINE WORKSPACE SEGREGATION SEGMENT CONTROL BUTTON SUB-COMPONENT */
const SegmentTab = ({ label, active, onClick, icon: Icon }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
        active 
          ? "bg-white text-slate-950 shadow-xs border border-slate-200/40 font-bold" 
          : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
      }`}
    >
      <Icon size={12} className={active ? "text-slate-950" : "text-slate-400"} />
      <span>{label}</span>
    </button>
  );
};

/* HEADER TOP MINI STAT ROWS */
const StatsMiniRow = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
      <div>
        <span className="text-xs font-medium text-slate-400 block">{title}</span>
        <span className="text-lg font-bold text-slate-900 block mt-0.5">{value}</span>
      </div>
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-slate-500" />
      </div>
    </div>
  );
};

/* STRIP CELL METRIC BADGES COUNTS */
const StatusCountRow = ({ label, value, icon: Icon, colorClass }) => {
  return (
    <div className={`border rounded-xl p-4 flex items-center justify-between shadow-xs ${colorClass}`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">{label}</span>
        <span className="text-lg font-black block mt-0.5">{value}</span>
      </div>
      <div className="opacity-60 shrink-0">
        <Icon size={16} />
      </div>
    </div>
  );
};

export default HrHomePage;