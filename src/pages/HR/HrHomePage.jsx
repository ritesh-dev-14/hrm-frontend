import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Briefcase, ClipboardList, TrendingUp, Mail, CalendarDays,
  CheckCircle2, Clock3, XCircle, Loader2, Search, ChevronRight,
  UserCheck, Layers, CheckSquare, Activity
} from "lucide-react";

import API from "../../services/api";
import { notifyError } from "../../utils/toast";
import AttendanceCard from "../../components/attendece/AttendenceCard";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ASSIGNED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-violet-50 text-violet-700 border-violet-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const HrHomePage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerSearch, setManagerSearch] = useState("");
  
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!dashboardData) return null;

  const { globalStats } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">Overview</span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              HR Operations Control
            </h1>
          </div>
        </motion.div>

        {/* ATTENDANCE CARD METRIC BLOCK */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-4 shadow-sm relative overflow-hidden">
             <AttendanceCard />
          </div>
        </motion.div>

        {/* TOP LEVEL GLOBAL DIRECTORY METRICS METADATA */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsMiniRow title="Total Managers" value={globalStats.totalManagers} icon={Users} color="indigo" />
          <StatsMiniRow title="Total Employees" value={globalStats.totalEmployees} icon={Users} color="emerald" />
          <StatsMiniRow title="Active Projects" value={globalStats.totalTasks} icon={Briefcase} color="violet" />
          <StatsMiniRow title="Assigned Tasks" value={globalStats.totalAssignments} icon={ClipboardList} color="amber" />
        </motion.div>

        {/* AGGREGATED STATS METRIC MATRIX */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCountRow label="Completed" value={globalStats.completedAssignments} icon={CheckCircle2} colorClass="text-emerald-500 bg-emerald-50/50 border-emerald-100" />
          <StatusCountRow label="Submitted" value={globalStats.submittedAssignments} icon={Clock3} colorClass="text-blue-500 bg-blue-50/50 border-blue-100" />
          <StatusCountRow label="Rejected" value={globalStats.rejectedAssignments} icon={XCircle} colorClass="text-red-500 bg-red-50/50 border-red-100" />
          <StatusCountRow label="Avg Progress" value={`${globalStats.globalAverageProgress}%`} icon={TrendingUp} colorClass="text-indigo-500 bg-indigo-50/50 border-indigo-100" />
        </motion.div>

        {/* COHORT WORKSPACE SPLIT BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT PANEL: STABLE NAVIGATION MANAGER LISTING SEARCH */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 space-y-6 shadow-sm sticky top-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-indigo-400" /> Manager Nodes
              </h3>
              <p className="text-xs text-slate-500 mt-1">Select a lead to view their segregated reports.</p>
            </div>
            
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Find manager profile..."
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-white"
              />
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredManagers.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8 font-medium">No matching profiles</div>
              ) : (
                filteredManagers.map((node, i) => {
                  const isSelected = selectedManager?.manager?.id === node.manager.id;
                  return (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={node.manager.id}
                      onClick={() => setSelectedManager(node)}
                      className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium border flex items-center justify-between group transition-all duration-300 relative overflow-hidden ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                          : "bg-white text-slate-700 border-slate-100 hover:border-indigo-200 hover:shadow-sm"
                      }`}
                    >
                      {isSelected && (
                        <motion.div 
                          layoutId="activeManager"
                          className="absolute inset-0 bg-indigo-600 -z-10"
                        />
                      )}
                      <div className="min-w-0 flex-1 relative z-10">
                        <span className={`block font-bold truncate ${isSelected ? "text-white" : "text-slate-800"}`}>{node.manager.name}</span>
                        <span className={`block text-[10px] mt-0.5 font-bold tracking-wider uppercase ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                          {node.manager.employeeId}
                        </span>
                      </div>
                      <ChevronRight size={16} className={`relative z-10 ${isSelected ? "text-white" : "text-slate-300 group-hover:text-indigo-500 transition-colors"}`} />
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* RIGHT PANEL: SEGREGATED WORKSPACE CONTEXT VIEW */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            {selectedManager ? (
              <>
                {/* ACTIVE BANNER META DATA BAR */}
                <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-bl-full -z-10" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-slate-900">{selectedManager.manager.name}</h2>
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wider uppercase">
                        {selectedManager.manager.employeeId}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm font-medium text-slate-500">
                      <span className="inline-flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {selectedManager.manager.email}</span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={14} className="text-slate-400" /> Joined {new Date(selectedManager.manager.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* MINI PERFORMANCE COUNTERS */}
                  <div className="flex items-center gap-4 self-start md:self-auto w-full md:w-auto">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 min-w-[110px] shadow-sm flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-widest">Reportees</span>
                      <span className="text-2xl font-black text-indigo-600 block">{selectedManager.stats.totalEmployees}</span>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 min-w-[110px] shadow-sm flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-widest">Team Avg</span>
                      <span className="text-2xl font-black text-emerald-500 block">{selectedManager.stats.averageProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* SEGREGATION SEGMENTATION NAVIGATION TAB STRIP */}
                <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-2xl w-full max-w-md backdrop-blur-md border border-slate-100/50">
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
                <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                  
                  {/* SEGMENT BOARD 1: EMPLOYEES ROSTER LIST */}
                  {activeSegment === "EMPLOYEES" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto p-2">
                      <table className="w-full min-w-[650px] text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-6 py-4">Employee Details</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4 text-center">Assigned</th>
                            <th className="px-6 py-4 text-center">Submitted</th>
                            <th className="px-6 py-4">Progress Vector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {selectedManager.employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4 rounded-l-2xl">
                                <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{emp.name}</span>
                                <span className="text-slate-400 font-medium text-[11px] block mt-1">{emp.email}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-medium">
                                {emp.department?.name || "General"}
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-800">{emp.assignedTasks}</td>
                              <td className="px-6 py-4 text-center font-bold text-indigo-600">{emp.submittedTasks}</td>
                              <td className="px-6 py-4 rounded-r-2xl">
                                <div className="flex items-center gap-3 w-32">
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${emp.averageProgress}%` }}
                                      transition={{ duration: 1 }}
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                                    />
                                  </div>
                                  <span className="font-bold text-slate-700 shrink-0 text-xs">{emp.averageProgress}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {/* SEGMENT BOARD 2: BLUEPRINT MANAGEMENT STRIP */}
                  {activeSegment === "PROJECTS" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto p-2">
                      <table className="w-full min-w-[650px] text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-6 py-4">Project Blueprint</th>
                            <th className="px-6 py-4">Scoped Context</th>
                            <th className="px-6 py-4">Lifecycle State</th>
                            <th className="px-6 py-4">Date Configured</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {selectedManager.tasks.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-12 text-slate-400 font-medium">No projects mapped under management scope.</td></tr>
                          ) : (
                            selectedManager.tasks.map((task) => (
                              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap rounded-l-2xl group-hover:text-indigo-600 transition-colors">{task.projectName}</td>
                                <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-medium">{task.description || "No specific brief metadata logs available."}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusStyles[task.status]}`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium rounded-r-2xl">{new Date(task.createdAt).toLocaleDateString("en-IN")}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                  {/* SEGMENT BOARD 3: TASK ITEM ASSIGNMENTS METRIC BOARD */}
                  {activeSegment === "TASKS" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto p-2">
                      <table className="w-full min-w-[700px] text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            <th className="px-6 py-4">Assigned Owner</th>
                            <th className="px-6 py-4">Task Deliverable</th>
                            <th className="px-6 py-4">System Status</th>
                            <th className="px-6 py-4">Completion Matrix</th>
                            <th className="px-6 py-4">Submission Record</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {selectedManager.recentAssignments.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium">No transactional line task tracking entries recorded.</td></tr>
                          ) : (
                            selectedManager.recentAssignments.map((assignment) => (
                              <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900 rounded-l-2xl group-hover:text-indigo-600 transition-colors">{assignment.employee?.name || "Unassigned Operations"}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium max-w-xs truncate">{assignment.taskItem?.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusStyles[assignment.status]}`}>
                                    {assignment.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3 w-28">
                                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${assignment.progress}%` }}
                                        transition={{ duration: 1 }}
                                        className="h-full bg-slate-900 rounded-full" 
                                      />
                                    </div>
                                    <span className="font-bold text-slate-700 text-xs shrink-0">{assignment.progress}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium rounded-r-2xl">
                                  {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString("en-IN") : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </motion.div>
                  )}

                </div>
              </>
            ) : (
              <div className="border border-dashed border-slate-200 bg-white/50 backdrop-blur-sm rounded-[2rem] py-24 text-center text-sm text-slate-400 font-medium shadow-sm flex flex-col items-center">
                <UserCheck size={32} className="mb-4 text-slate-300" />
                Select an active managing node from the left panel to load segregated reports.
              </div>
            )}
          </motion.div>

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
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl transition-all relative z-10 ${
        active 
          ? "text-indigo-700 shadow-sm" 
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeSegment"
          className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100"
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        />
      )}
      <Icon size={14} className={`relative z-10 ${active ? "text-indigo-600" : "text-slate-400"}`} />
      <span className="relative z-10">{label}</span>
    </button>
  );
};

/* HEADER TOP MINI STAT ROWS */
const StatsMiniRow = ({ title, value, icon: Icon, color = "indigo" }) => {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer group">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{title}</span>
        <span className="text-3xl font-black text-slate-900 block">{value}</span>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
    </motion.div>
  );
};

/* STRIP CELL METRIC BADGES COUNTS */
const StatusCountRow = ({ label, value, icon: Icon, colorClass }) => {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} className={`border rounded-[2rem] p-5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer group ${colorClass}`}>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75 mb-1">{label}</span>
        <span className="text-3xl font-black block">{value}</span>
      </div>
      <div className="opacity-80 shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6">
        <Icon size={32} strokeWidth={1.5} />
      </div>
    </motion.div>
  );
};

export default HrHomePage;