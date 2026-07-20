import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { LayoutGrid, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const COLORS = ["#4ade80", "#f87171"]; // Green for completed, Red for pending

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
        // Compute pendingTasks on the frontend
        const data = res.data.data;
        data.pendingTasks = data.totalTasks - data.completedTasks;
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

  const chartData = [
    { name: "Completed", value: stats.completedTasks },
    { name: "Pending", value: stats.pendingTasks },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          My Performance Report
        </h1>
        <p className="text-slate-500 mt-2">
          Overview of your task progress and completion status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-sm font-semibold text-slate-500">Total Tasks</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalTasks}</p>
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
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Completed</p>
              <p className="text-2xl font-black text-slate-900">{stats.completedTasks}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending</p>
              <p className="text-2xl font-black text-slate-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Task Completion Distribution</h2>
          <div className="h-[300px]">
            {stats.totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No tasks available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Overall Progress</h2>
          <div className="relative w-48 h-48">
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
                strokeDasharray={`${stats.completionPercentage}, 100`}
                className="stroke-current text-indigo-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-black text-slate-900">{stats.completionPercentage}%</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
