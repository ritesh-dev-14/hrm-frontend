import React, { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { Send, FileText, Briefcase, RefreshCw, Layers, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDailyReports() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  const [selectedTaskAssignmentId, setSelectedTaskAssignmentId] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // For displaying previous reports of selected project
  const [pastReports, setPastReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await API.get("/api/task-item-submission/my-items");
      if (res.data?.data) {
        // We only want tasks that belong to a project, ideally Web Dev.
        // The backend /api/project-reports validates if it's Web Dev.
        const validTasks = res.data.data.filter(t => t.taskItem?.task?.projectId || t.taskItem?.task?.project?.id);
        setTasks(validTasks);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.assignmentId === selectedTaskAssignmentId);
  }, [tasks, selectedTaskAssignmentId]);

  const fetchPastReports = async (projectId) => {
    if (!projectId) {
      setPastReports([]);
      return;
    }
    try {
      setLoadingReports(true);
      const res = await API.get(`/api/project-reports/${projectId}`);
      if (res.data?.success) {
        setPastReports(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch past reports.");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleTaskSelect = (e) => {
    const tId = e.target.value;
    setSelectedTaskAssignmentId(tId);
    
    const task = tasks.find(t => t.assignmentId === tId);
    const projectId = task?.taskItem?.task?.projectId || task?.taskItem?.task?.project?.id;
    if (projectId) {
      fetchPastReports(projectId);
    } else {
      setPastReports([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) {
      toast.warning("Please select a task first.");
      return;
    }
    if (!reportContent.trim()) {
      toast.warning("Report content cannot be empty.");
      return;
    }

    const projectId = selectedTask.taskItem?.task?.projectId || selectedTask.taskItem?.task?.project?.id;
    if (!projectId) {
      toast.error("Selected task does not belong to a valid project.");
      return;
    }

    const finalContent = `[Task: ${selectedTask.taskItem?.title || "Unknown Task"}]\n\n${reportContent}`;

    try {
      setSubmitting(true);
      const res = await API.post("/api/project-reports", {
        projectId,
        content: finalContent,
      });

      if (res.data?.success) {
        toast.success("Daily report submitted successfully!");
        setReportContent("");
        fetchPastReports(projectId);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          Web Development Daily Reports
        </h1>
        <p className="text-slate-500 mt-2">
          Submit your daily updates and deliverables for your assigned tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COL: Form */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-500" />
              Submit New Report
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Select Task <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckSquare className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={selectedTaskAssignmentId}
                    onChange={handleTaskSelect}
                    disabled={loadingTasks}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    <option value="">-- Choose a Task --</option>
                    {tasks.map((t) => (
                      <option key={t.assignmentId} value={t.assignmentId}>
                        {t.taskItem?.task?.projectName || "General Project"} - {t.taskItem?.title}
                      </option>
                    ))}
                  </select>
                  {loadingTasks && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Report Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="6"
                  placeholder="What did you work on today? Provide details, links, etc."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedTaskAssignmentId || !reportContent.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COL: Past Reports */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 h-full min-h-[500px]">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Project Reports History
              </span>
              {loadingReports && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
            </h2>

            {!selectedTaskAssignmentId ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <CheckSquare className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">Select a task to view project history</p>
              </div>
            ) : pastReports.length === 0 && !loadingReports ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">No reports submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {pastReports.map((report) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm text-slate-800">
                          {report.employee?.name || "Unknown"}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                          {new Date(report.date).toLocaleDateString("en-US", {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {report.content}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
