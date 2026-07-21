import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight, ArrowRight, Activity, Clock, ClipboardList, CheckCircle2, Hourglass
} from "lucide-react";
import AttendanceCard from "../../components/attendece/AttendenceCard";
import API from "../../services/api";
import { employeeActions } from "../../components/dashboard/dashboardData.js";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white/60 backdrop-blur-xl border border-slate-100 p-5 rounded-[2rem] shadow-sm flex flex-col justify-center gap-3 transition-all hover:-translate-y-1 hover:shadow-md">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
    </div>
  </div>
);

const EmployeeHomePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || { name: "User" };
  const firstName = user.name.split(" ")[0];

  const handleActionClick = (label) => {
    if (label.includes("Leave")) navigate("/leave");
    else if (label.includes("Attendance")) navigate("/attendance");
  };

  const [stats, setStats] = useState({
    totalHours: 0,
    totalTasks: 0,
    completed: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let totalHours = 0;
        let totalTasks = 0;
        let completed = 0;
        let pending = 0;

        // Fetch Tasks
        try {
          const tasksRes = await API.get("/api/employee-dashboard/items");
          if (tasksRes?.data?.success) {
            const tasks = tasksRes.data.data || [];
            totalTasks = tasks.length;
            completed = tasks.filter(t => t.status === "COMPLETED" || t.status === "VERIFIED").length;
            pending = tasks.filter(t => !["COMPLETED", "VERIFIED"].includes(t.status)).length;
          }
        } catch (err) {
          console.error("Error fetching tasks:", err);
        }

        // Fetch Attendance
        try {
          const attRes = await API.get("/api/attendance/history");
          if (attRes?.data?.success) {
            const records = attRes.data.data || [];
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const thisMonthRecords = records.filter(r => {
              if (!r.date) return false;
              const d = new Date(r.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            
            totalHours = thisMonthRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
            totalHours = parseFloat(totalHours.toFixed(1));
          }
        } catch (err) {
          console.error("Error fetching attendance:", err);
        }

        setStats({ totalHours, totalTasks, completed, pending });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto space-y-6 relative z-10"
      >
        {/* HERO */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{firstName}</span>!
            </h1>
            <p className="text-slate-500 font-medium max-w-md leading-relaxed">
              Here's an overview of your attendance, recent tasks, and current work session performance.
            </p>
          </div>

          <button
            onClick={() => navigate("/attendance")}
            className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Activity size={18} />
            Open Attendance
          </button>
        </motion.div>

        {/* STATS */}
        {!loading && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard icon={Clock} label="TOTAL HOURS (THIS MONTH)" value={`${stats.totalHours}h`} color="text-blue-600" bg="bg-blue-100" />
            <StatCard icon={ClipboardList} label="TOTAL TASKS" value={stats.totalTasks} color="text-indigo-600" bg="bg-indigo-100" />
            <StatCard icon={CheckCircle2} label="TASKS COMPLETED" value={stats.completed} color="text-emerald-600" bg="bg-emerald-100" />
            <StatCard icon={Hourglass} label="TASKS PENDING" value={stats.pending} color="text-amber-600" bg="bg-amber-100" />
          </motion.div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: ATTENDANCE CARD */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <div className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 md:p-8 h-full shadow-sm overflow-hidden relative">
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <AttendanceCard />
            </div>
          </motion.div>

          {/* RIGHT: QUICK ACTIONS */}
          <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col h-full">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Quick Actions</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Frequently used shortcuts</p>
            </div>

            <div className="space-y-3 flex-1">
              {employeeActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleActionClick(action.label)}
                  className="group w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1 text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center shrink-0 border border-white`}>
                      <action.icon size={20} className={action.color} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {action.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {action.sub}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300 relative z-10" />
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100/50">
              <button
                onClick={() => navigate("/assigned-actions")}
                className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                View Assigned Tasks
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
};

export default EmployeeHomePage;
