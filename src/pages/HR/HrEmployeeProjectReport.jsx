import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { BriefcaseBusiness, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

export default function HrEmployeeProjectReport() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectStats();
  }, [employeeId]);

  const fetchProjectStats = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/reports/hr/employee/${employeeId}/projects`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        toast.error("Failed to load project reports");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading project reports");
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

  if (!data) return <div className="p-8">No data available</div>;

  const projectStats = data.map(p => ({
    ...p,
    pending: p.totalTasks - p.completedTasks
  }));

  const totalProjects = projectStats.length;
  const totalTasks = projectStats.reduce((sum, p) => sum + p.totalTasks, 0);
  const totalCompleted = projectStats.reduce((sum, p) => sum + p.completedTasks, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-semibold"
      >
        <ArrowLeft size={16} />
        Back to Organization Reports
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Project Report Overview
        </h1>
        <p className="text-slate-500 mt-2">
          Detailed breakdown of tasks by project for this employee.
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
              <BriefcaseBusiness size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Active Projects</p>
              <p className="text-2xl font-black text-slate-900">{totalProjects}</p>
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
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Tasks Assigned</p>
              <p className="text-2xl font-black text-slate-900">{totalTasks}</p>
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
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Tasks Completed</p>
              <p className="text-2xl font-black text-slate-900">{totalCompleted}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Task Completion by Project</h2>
          <div className="h-[350px]">
            {projectStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectStats}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis dataKey="projectName" type="category" width={100} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="completedTasks" name="Completed" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No projects data
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Performance Radar</h2>
          <div className="h-[350px]">
            {projectStats.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={projectStats}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="projectName" tick={{fill: '#64748b', fontSize: 12}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Radar name="Completion %" dataKey="completionPercentage" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-center px-4">
                Radar chart requires at least 3 projects to display effectively.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
