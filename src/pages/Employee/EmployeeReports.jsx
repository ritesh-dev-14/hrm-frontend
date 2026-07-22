import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { LayoutGrid, CheckCircle, Clock, Camera, Film, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const COLORS = ["#4ade80", "#f87171"]; // Green for completed, Red for pending
const SHOOT_COLORS = ["#a855f7", "#fb923c"]; // Purple for approved, Orange for pending

export default function EmployeeReports() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/reports/employee/me");
      if (res.data?.success) {
        const data = res.data.data;
        data.pendingTasks = data.totalTasks - data.completedTasks;
        data.pendingShoots = (data.totalShoots || 0) - (data.completedShoots || 0);
        setStats(data);
      } else {
        toast.error("Failed to load reports");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) return <div className="p-8">No data available</div>;

  const taskChartData = [
    { name: "Completed", value: stats.completedTasks },
    { name: "Pending", value: stats.pendingTasks },
  ];

  const shootChartData = [
    { name: "Approved", value: stats.completedShoots || 0 },
    { name: "Pending", value: stats.pendingShoots || 0 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <Layers className="w-8 h-8 text-indigo-600" />
          My Performance & Shoot Reports
        </h1>
        <p className="text-slate-500 mt-2">
          Real-time overview of your general project tasks and shoot employee workspace deliverables.
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <LayoutGrid size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">General Tasks</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalTasks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tasks Done</p>
              <p className="text-2xl font-black text-slate-900">{stats.completedTasks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Camera size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Shoot Deliverables</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalShoots || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Film size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Shoots Approved</p>
              <p className="text-2xl font-black text-slate-900">{stats.completedShoots || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Project Tasks Progress */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center text-center justify-between">
          <div className="w-full text-left">
            <h2 className="text-lg font-bold text-slate-900">Project Tasks Completion</h2>
            <p className="text-xs text-slate-500">General assigned workflow tasks.</p>
          </div>
          <div className="relative w-44 h-44 my-6">
            <svg viewBox="0 0 36 36" className="w-full h-full stroke-current text-indigo-100">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
                strokeDasharray={`${stats.completionPercentage || 0}, 100`}
                className="stroke-current text-indigo-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-black text-slate-900">{stats.completionPercentage || 0}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">General Tasks</span>
            </div>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 flex justify-around text-xs font-semibold">
            <span className="text-emerald-600 font-bold">{stats.completedTasks} Done</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{stats.pendingTasks} Pending</span>
          </div>
        </div>

        {/* Shoot Tasks Progress */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col items-center text-center justify-between">
          <div className="w-full text-left">
            <h2 className="text-lg font-bold text-slate-900">Shoot Tasks Completion</h2>
            <p className="text-xs text-slate-500">Shoot workspace deliverables & subtasks.</p>
          </div>
          <div className="relative w-44 h-44 my-6">
            <svg viewBox="0 0 36 36" className="w-full h-full stroke-current text-purple-100">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
                strokeDasharray={`${stats.shootCompletionPercentage || 0}, 100`}
                className="stroke-current text-purple-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-black text-purple-900">{stats.shootCompletionPercentage || 0}%</span>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-1">Shoot Tasks</span>
            </div>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 flex justify-around text-xs font-semibold">
            <span className="text-purple-600 font-bold">{stats.completedShoots || 0} Approved</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{stats.pendingShoots || 0} Pending</span>
          </div>
        </div>
      </div>

      {/* Recent Shoot Subtasks List */}
      {stats.shootSubtasks && stats.shootSubtasks.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            Assigned Shoot Subtasks Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Workspace</th>
                  <th className="pb-3">Task / Shoot Title</th>
                  <th className="pb-3">Subtask</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.shootSubtasks.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold text-slate-900 text-xs">{st.workspaceName}</td>
                    <td className="py-3 text-xs text-slate-600">{st.taskTitle}</td>
                    <td className="py-3 text-xs font-semibold text-slate-800">{st.title}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {st.type}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          st.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : st.status === "REJECTED"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : st.status === "SUBMITTED"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

