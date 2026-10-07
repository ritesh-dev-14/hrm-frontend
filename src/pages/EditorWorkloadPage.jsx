import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Search, Calendar
} from "lucide-react";
import API from "../services/api";
import ProfessionalLoader from "../components/ProfessionalLoader";

export default function EditorWorkloadPage() {
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState("allTime");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchWorkloads();
  }, []);

  const fetchWorkloads = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/editor-workload");
      if (res.data?.success) {
        setWorkloads(res.data.data || []);
      } else {
        setError("Failed to load editor workload data.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTarget = async (editor, type) => {
    const isVideo = type === 'video';
    const currentTarget = isVideo ? (editor.dailyVideoTarget || 0) : (editor.dailyPostTarget || 0);
    const newTargetStr = window.prompt(`Set daily ${type} target for ${editor.name}:`, currentTarget);
    
    if (newTargetStr === null) return;
    
    const newTarget = parseInt(newTargetStr, 10);
    if (isNaN(newTarget) || newTarget < 0) {
      alert("Please enter a valid positive number");
      return;
    }

    try {
      const payload = isVideo ? { dailyVideoTarget: newTarget } : { dailyPostTarget: newTarget };
      const res = await API.put(`/api/editor-workload/${editor.id}/targets`, payload);
      if (res.data.success) {
        setWorkloads(prev => prev.map(w => w.id === editor.id ? { ...w, ...payload } : w));
      }
    } catch (err) {
      alert("Failed to update target. Please try again.");
    }
  };

  const filteredWorkloads = workloads.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) return <ProfessionalLoader text="Loading editor workloads..." />;
  if (error) return (
    <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-xl max-w-md mx-auto mt-10">
      <AlertCircle className="w-10 h-10 mx-auto mb-2" />
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Users className="text-indigo-600" /> Editor Workload Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Live view of editor task assignments, turnaround times (TAT), and overdue items.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-slate-700 font-bold cursor-pointer"
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="allTime">All Time</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search editor..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Workload List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredWorkloads.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-slate-200 text-slate-500">
              No editors found with active tasks.
            </div>
          ) : (
            filteredWorkloads.map(editor => (
              <motion.div 
                key={editor.id}
                variants={itemVariants}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Editor Row Header */}
                <div 
                  onClick={() => setExpandedId(expandedId === editor.id ? null : editor.id)}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-lg">
                      {editor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{editor.name}</h3>
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        {editor.employeeId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-start lg:justify-end">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active</p>
                      <p className="text-xl font-black text-slate-800">{editor.activeTasks}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Due/Overdue</p>
                      <p className={`text-xl font-black ${(editor.dueToday > 0 || editor.overdue > 0) ? "text-red-500" : "text-slate-800"}`}>
                        {editor.dueToday} <span className="text-slate-400 font-normal">/</span> {editor.overdue}
                      </p>
                    </div>
                    
                    <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

                    <div className="text-center group relative">
                      <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                        Videos
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditTarget(editor, 'video'); }}
                          className="opacity-50 hover:opacity-100 text-indigo-400 hover:text-indigo-600 transition-opacity"
                          title="Set daily video target"
                        >
                          ✏️
                        </button>
                      </p>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-baseline gap-1 justify-center">
                          <p className="text-xl font-black text-slate-800">
                            {editor.stats?.[timeframe]?.videosEdited || 0}
                            <span className="text-sm font-semibold text-slate-400 ml-1">
                              / {(editor.dailyVideoTarget || 0) * (editor.stats?.[timeframe]?.workingDays || 1)}
                            </span>
                          </p>
                          <p className="text-xs font-medium text-slate-500" title="Average TAT">
                            ({editor.stats?.[timeframe]?.videoAvgTat || 0}h)
                          </p>
                        </div>
                        {timeframe !== 'daily' && editor.dailyVideoTarget > 0 && (
                          <div className="mt-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                            🎯 Hit: {editor.stats?.[timeframe]?.videoHitDays || 0}/{editor.stats?.[timeframe]?.workingDays || 1}d
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center group relative">
                      <p className="text-xs text-pink-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                        Posts
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditTarget(editor, 'post'); }}
                          className="opacity-50 hover:opacity-100 text-pink-400 hover:text-pink-600 transition-opacity"
                          title="Set daily post target"
                        >
                          ✏️
                        </button>
                      </p>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-baseline gap-1 justify-center">
                          <p className="text-xl font-black text-slate-800">
                            {editor.stats?.[timeframe]?.postsEdited || 0}
                            <span className="text-sm font-semibold text-slate-400 ml-1">
                              / {(editor.dailyPostTarget || 0) * (editor.stats?.[timeframe]?.workingDays || 1)}
                            </span>
                          </p>
                          <p className="text-xs font-medium text-slate-500" title="Average TAT">
                            ({editor.stats?.[timeframe]?.postAvgTat || 0}h)
                          </p>
                        </div>
                        {timeframe !== 'daily' && editor.dailyPostTarget > 0 && (
                          <div className="mt-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                            🎯 Hit: {editor.stats?.[timeframe]?.postHitDays || 0}/{editor.stats?.[timeframe]?.workingDays || 1}d
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-slate-400 ml-auto lg:ml-4">
                      {expandedId === editor.id ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === editor.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5">
                        <div className="flex gap-4 mb-4">
                          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-indigo-500"/> Current Assignments
                          </h4>
                        </div>
                        
                        {editor.detailedTasks?.length === 0 ? (
                          <p className="text-sm text-slate-500 mb-6">No active assignments.</p>
                        ) : (
                          <div className="overflow-x-auto mb-6">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                  <th className="pb-2 font-bold">Project</th>
                                  <th className="pb-2 font-bold">Task Title</th>
                                  <th className="pb-2 font-bold">Status</th>
                                  <th className="pb-2 font-bold">Due Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {editor.detailedTasks.map((t, idx) => {
                                  const isOverdue = t.taskItem?.dueDate && new Date(t.taskItem.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
                                  
                                  return (
                                    <tr key={`active-${idx}`} className="hover:bg-white transition-colors">
                                      <td className="py-3 font-medium text-slate-700">
                                        {t.taskItem?.task?.projectName || "Unknown Project"}
                                      </td>
                                      <td className="py-3 text-slate-600">
                                        {t.taskItem?.title || "Untitled Task"}
                                      </td>
                                      <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                          t.status === "ASSIGNED" ? "bg-blue-100 text-blue-700" :
                                          t.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                                          "bg-slate-200 text-slate-700"
                                        }`}>
                                          {t.status}
                                        </span>
                                      </td>
                                      <td className="py-3 flex items-center gap-1.5">
                                        <Calendar size={14} className={isOverdue ? "text-red-500" : "text-slate-400"}/>
                                        <span className={`${isOverdue ? "text-red-600 font-bold" : "text-slate-600"}`}>
                                          {t.taskItem?.dueDate ? new Date(t.taskItem.dueDate).toLocaleDateString() : "No Date"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <div className="flex gap-4 mb-4">
                          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500"/> Recently Completed (Last 20)
                          </h4>
                        </div>
                        
                        {editor.completedTasks?.length === 0 ? (
                          <p className="text-sm text-slate-500">No recently completed assignments.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm opacity-80">
                              <thead>
                                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                  <th className="pb-2 font-bold">Project</th>
                                  <th className="pb-2 font-bold">Task Title</th>
                                  <th className="pb-2 font-bold">Status</th>
                                  <th className="pb-2 font-bold">Completed On</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {editor.completedTasks.map((t, idx) => {
                                  return (
                                    <tr key={`completed-${idx}`} className="hover:bg-white transition-colors">
                                      <td className="py-2 font-medium text-slate-600">
                                        {t.taskItem?.task?.projectName || "Unknown Project"}
                                      </td>
                                      <td className="py-2 text-slate-500">
                                        {t.taskItem?.title || "Untitled Task"}
                                      </td>
                                      <td className="py-2">
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                                          {t.status}
                                        </span>
                                      </td>
                                      <td className="py-2 text-slate-500">
                                        {t.completedAt || t.submittedAt ? new Date(t.completedAt || t.submittedAt).toLocaleDateString() : "N/A"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
