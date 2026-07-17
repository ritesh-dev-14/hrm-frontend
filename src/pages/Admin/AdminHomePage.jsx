import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Briefcase, FileText, CheckCircle2, Clock3, XCircle, TrendingUp, ChevronRight
} from "lucide-react";
import API from "../../services/api";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [monthlySheets, setMonthlySheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [overviewRes, employeesRes, sheetsRes, projectsRes] = await Promise.all([
          API.get("/api/hr/dashboard/admin-overview"),
          API.get("/api/hr/dashboard/employees"),
          API.get("/api/hr/dashboard/monthly-sheets"),
          API.get("/api/hr/dashboard/projects"),
        ]);

        const overviewData = overviewRes.data || overviewRes;
        const employeesData = employeesRes.data || employeesRes;
        const sheetsData = sheetsRes.data || sheetsRes;
        const projectsData = projectsRes.data || projectsRes;

        if (overviewData.success) setOverview(overviewData.data);
        if (employeesData.success) setEmployees(employeesData.data);
        if (sheetsData.success) setMonthlySheets(sheetsData.data);
        if (projectsData.success) setProjects(projectsData.data);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-red-100 shadow-2xl max-w-md w-full text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const counts = overview?.counts || {};
  const assignmentSummary = overview?.assignmentSummary || {};

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-8 relative z-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Admin Control Center
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Real-time overview of your organization's performance.</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-indigo-100 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Live Metrics
          </div>
        </motion.div>

        {/* SECTION 1: CORE STATS */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/hr/team?role=MANAGER">
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Managers</p>
              <h3 className="text-4xl font-black text-slate-900">{counts.totalManagers || 0}</h3>
            </motion.div>
          </Link>

          <Link to="/hr/team?role=EMPLOYEE">
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <Users size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Employees</p>
              <h3 className="text-4xl font-black text-slate-900">{counts.totalEmployees || 0}</h3>
            </motion.div>
          </Link>

          <Link to="/projects">
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-violet-50 rounded-2xl text-violet-600">
                  <Briefcase size={24} />
                </div>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Projects</p>
              <h3 className="text-4xl font-black text-slate-900">{counts.totalProjects || 0}</h3>
            </motion.div>
          </Link>

          <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <FileText size={24} />
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly Sheets</p>
            <h3 className="text-4xl font-black text-slate-900">{counts.totalMonthlySheets || 0}</h3>
          </motion.div>
        </motion.div>

        {/* Assignment Status Summary */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100/60">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-slate-400" size={20} />
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Global Assignment Status</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <span className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Pending</span>
                <span className="text-3xl font-black text-slate-800">{assignmentSummary.pending || 0}</span>
              </div>
              <Clock3 className="text-amber-100 group-hover:text-amber-200 transition-colors" size={40} />
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Submitted</span>
                <span className="text-3xl font-black text-slate-800">{assignmentSummary.submitted || 0}</span>
              </div>
              <FileText className="text-blue-100 group-hover:text-blue-200 transition-colors" size={40} />
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Completed</span>
                <span className="text-3xl font-black text-slate-800">{assignmentSummary.completed || 0}</span>
              </div>
              <CheckCircle2 className="text-emerald-100 group-hover:text-emerald-200 transition-colors" size={40} />
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Rejected</span>
                <span className="text-3xl font-black text-slate-800">{assignmentSummary.rejected || 0}</span>
              </div>
              <XCircle className="text-red-100 group-hover:text-red-200 transition-colors" size={40} />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Projects Catalog */}
          <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 md:p-8 border-b border-slate-100/50 pb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase size={20} className="text-indigo-500" /> Project Catalog
              </h2>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <div className="space-y-3">
                {projects.map((proj, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={proj.id}
                    onClick={() => navigate(`/project/${proj.id}`)}
                    className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer transition-all group flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{proj.projectName}</h4>
                      <p className="text-xs text-slate-500 mt-1">{proj.department?.name || "General"} • {new Date(proj.startDate).toLocaleDateString()} to {new Date(proj.endDate).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </motion.div>
                ))}
                {projects.length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-medium">No projects listed.</div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Monthly Sheets */}
          <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col h-[500px]">
            <div className="p-6 md:p-8 border-b border-slate-100/50 pb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText size={20} className="text-violet-500" /> Content Calendar
              </h2>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                {monthlySheets.map((sheet, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={sheet.id}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{sheet.project?.projectName}</h4>
                        <p className="text-xs text-slate-400 mt-1">Period: <span className="font-semibold text-slate-600">{sheet.month}/{sheet.year}</span></p>
                      </div>
                      {sheet.moodBoardLink && (
                        <a
                          href={sheet.moodBoardLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-100 transition-colors"
                        >
                          Moodboard
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                        <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Reels TGT</span>
                        <span className="text-sm font-black text-slate-700">{sheet.totalReels}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100/50 text-center">
                        <span className="block text-[9px] uppercase font-bold text-emerald-500 mb-1">Reels Live</span>
                        <span className="text-sm font-black text-emerald-700">{sheet.totalReelsUploaded}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                        <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Posts TGT</span>
                        <span className="text-sm font-black text-slate-700">{sheet.totalPosts}</span>
                      </div>
                      <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100/50 text-center">
                        <span className="block text-[9px] uppercase font-bold text-emerald-500 mb-1">Posts Live</span>
                        <span className="text-sm font-black text-emerald-700">{sheet.totalPostsUploaded}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {monthlySheets.length === 0 && (
                  <div className="text-center py-10 text-slate-400 font-medium">No monthly data metrics logged.</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Employee Roster */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100/60">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-indigo-500" size={20} />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Team Roster & Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((emp, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={emp.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{emp.name}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] px-2 py-1 rounded-md font-bold tracking-wider uppercase">
                      {emp.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Avg Progress</span>
                    <span className="text-sm font-black text-indigo-600">{emp.assignmentStats?.averageProgress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${emp.assignmentStats?.averageProgress || 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            {employees.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-400 font-medium">No employee data found.</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminPage;