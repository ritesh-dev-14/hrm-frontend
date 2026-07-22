import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, CheckCircle, Clock, Camera, Film, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function HrReports() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, PROJECTS, SHOOTS
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/reports/hr/employees");
      if (res.data?.success) {
        setEmployees(res.data.data);
      } else {
        toast.error("Failed to load HR reports");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading HR reports");
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

  const totalEmployees = employees.length;
  
  // General Tasks Metrics
  const overallTasksCompleted = employees.reduce((sum, emp) => sum + (emp.completedTasks || 0), 0);
  const overallTasksTotal = employees.reduce((sum, emp) => sum + (emp.totalTasks || 0), 0);
  const overallTasksPending = overallTasksTotal - overallTasksCompleted;

  // Shoot Employee Tasks Metrics
  const overallShootsCompleted = employees.reduce((sum, emp) => sum + (emp.completedShoots || 0), 0);
  const overallShootsTotal = employees.reduce((sum, emp) => sum + (emp.totalShoots || 0), 0);
  const overallShootsPending = overallShootsTotal - overallShootsCompleted;

  // Prepare chart data for General vs Shoot Tasks
  const chartData = employees.map((emp) => ({
    name: emp.name,
    "Project Tasks Done": emp.completedTasks || 0,
    "Project Tasks Pending": (emp.totalTasks || 0) - (emp.completedTasks || 0),
    "Shoot Tasks Done": emp.completedShoots || 0,
    "Shoot Tasks Pending": (emp.totalShoots || 0) - (emp.completedShoots || 0),
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-600" />
            Organization & Shoot Reports
          </h1>
          <p className="text-slate-500 mt-1">
            Complete operational analytics for General Project Tasks and Shoot Employee Tasks.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Reports
          </button>
          <button
            onClick={() => setActiveTab("PROJECTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "PROJECTS"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Project Tasks
          </button>
          <button
            onClick={() => setActiveTab("SHOOTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "SHOOTS"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-purple-500" />
            Shoot Tasks
          </button>
        </div>
      </div>

      {/* Stats Cards Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Active Workforce</p>
              <p className="text-2xl font-black text-slate-900">{totalEmployees}</p>
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
              <p className="text-sm font-semibold text-slate-500">Project Tasks Done</p>
              <p className="text-2xl font-black text-slate-900">{overallTasksCompleted} <span className="text-xs font-normal text-slate-400">/ {overallTasksTotal}</span></p>
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
              <p className="text-sm font-semibold text-purple-600">Shoot Tasks Approved</p>
              <p className="text-2xl font-black text-slate-900">{overallShootsCompleted} <span className="text-xs font-normal text-slate-400">/ {overallShootsTotal}</span></p>
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
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Pending Shoots</p>
              <p className="text-2xl font-black text-amber-700">{overallShootsPending}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {activeTab === "SHOOTS" ? "Shoot Tasks Performance Chart" : activeTab === "PROJECTS" ? "Project Tasks Performance Chart" : "Workforce Tasks & Shoot Performance"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Comparative review of tasks completed vs pending by employee.</p>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              {(activeTab === "ALL" || activeTab === "PROJECTS") && (
                <>
                  <Bar dataKey="Project Tasks Done" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Project Tasks Pending" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                </>
              )}
              {(activeTab === "ALL" || activeTab === "SHOOTS") && (
                <>
                  <Bar dataKey="Shoot Tasks Done" stackId="b" fill="#a855f7" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Shoot Tasks Pending" stackId="b" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Details Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Employee Task & Shoot Breakdown</h2>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{employees.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Department</th>
                <th className="pb-3 text-center">Project Tasks</th>
                <th className="pb-3 text-center">Project %</th>
                <th className="pb-3 text-center">Shoot Tasks</th>
                <th className="pb-3 text-center">Shoot %</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.userId} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 font-bold text-slate-900 text-sm">
                    {emp.name}
                    {emp.employeeId && <span className="block text-[11px] font-medium text-slate-400">ID: {emp.employeeId}</span>}
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-600">{emp.department || "N/A"}</td>

                  {/* Project Tasks */}
                  <td className="py-4 text-center text-xs font-bold text-slate-700">
                    <span className="text-indigo-600">{emp.completedTasks || 0}</span> / {emp.totalTasks || 0}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${emp.completionPercentage || 0}%` }} />
                      </div>
                      <span className="text-xs font-extrabold text-slate-700">{emp.completionPercentage || 0}%</span>
                    </div>
                  </td>

                  {/* Shoot Employee Tasks */}
                  <td className="py-4 text-center text-xs font-bold text-slate-700">
                    <span className="text-purple-600">{emp.completedShoots || 0}</span> / {emp.totalShoots || 0}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${emp.shootCompletionPercentage || 0}%` }} />
                      </div>
                      <span className="text-xs font-extrabold text-purple-700">{emp.shootCompletionPercentage || 0}%</span>
                    </div>
                  </td>

                  <td className="py-4 text-right">
                    <button
                      onClick={() => navigate(`/reports/hr/employee/${emp.userId}`)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                    >
                      View Full Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

