import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function HrReports() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const overallCompleted = employees.reduce((sum, emp) => sum + emp.completedTasks, 0);
  const overallPending = employees.reduce((sum, emp) => sum + (emp.totalTasks - emp.completedTasks), 0);

  // Prepare chart data
  const chartData = employees.map(emp => ({
    name: emp.name,
    Completed: emp.completedTasks,
    Pending: emp.totalTasks - emp.completedTasks
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Organization Reports
        </h1>
        <p className="text-slate-500 mt-2">
          Overview of all employees' task progress and completion status.
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
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Employees</p>
              <p className="text-2xl font-black text-slate-900">{totalEmployees}</p>
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
              <p className="text-sm font-semibold text-slate-500">Total Completed Tasks</p>
              <p className="text-2xl font-black text-slate-900">{overallCompleted}</p>
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
              <p className="text-sm font-semibold text-slate-500">Total Pending Tasks</p>
              <p className="text-2xl font-black text-slate-900">{overallPending}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Employee Performance Overview</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Completed" stackId="a" fill="#4ade80" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Pending" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Employee Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold text-center">Total Tasks</th>
                <th className="pb-3 font-semibold text-center">Completed</th>
                <th className="pb-3 font-semibold text-center">Progress</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-semibold text-slate-900">{emp.name}</td>
                  <td className="py-4 text-slate-600">{emp.department || "N/A"}</td>
                  <td className="py-4 text-center font-medium text-slate-700">{emp.totalTasks}</td>
                  <td className="py-4 text-center font-medium text-slate-700">{emp.completedTasks}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${emp.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-8">{emp.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => navigate(`/reports/hr/employee/${emp.userId}`)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      View Projects
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
