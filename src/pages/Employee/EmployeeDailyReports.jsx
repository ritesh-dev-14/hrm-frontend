import { useEffect, useState, useMemo } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { Send, FileText, RefreshCw, Layers, CheckSquare, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDailyReports() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  const [selectedTaskAssignmentId, setSelectedTaskAssignmentId] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportDetails, setReportDetails] = useState({
    lastWorking: "",
    lastDiscussion: "",
    nextStep: "",
    blockers: "",
    taskProgress: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // For displaying previous reports of selected project
  const [pastReports, setPastReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchMyTasks = async () => {
    try {
      setLoadingTasks(true);
      const [tasksRes, projectsRes] = await Promise.all([
        API.get("/api/task-item-submission/my-items"),
        API.get("/api/projects"),
      ]);
      const projects = projectsRes.data?.data || [];
      const projectsById = new Map(projects.map((project) => [project.id, project]));
      const isWebDevelopment = (project) => {
        const departmentName = project?.department?.name?.toLowerCase().trim() || "";
        return departmentName.includes("web development") || departmentName === "it";
      };

      if (tasksRes.data?.data) {
        const validTasks = tasksRes.data.data.filter((task) => {
          const taskProject = task.taskItem?.task?.project || {};
          const projectId = task.taskItem?.task?.projectId || taskProject.id;
          const project = projectsById.get(projectId) || taskProject;
          const departmentName = [
            project?.department?.name,
            taskProject?.departmentName,
            task.taskItem?.task?.departmentName,
          ].find(Boolean);

          // This page is dedicated to Web Development. Some task responses omit
          // department relations, so let the backend validate those projects.
          return projectId && (isWebDevelopment(project) || !departmentName);
        });
        setTasks(validTasks);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading tasks.");
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const selectedTask = useMemo(() => {
    return tasks.find(t => String(t.assignmentId) === String(selectedTaskAssignmentId));
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
    
    const task = tasks.find(t => String(t.assignmentId) === String(tId));
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
        date: reportDate,
        content: finalContent,
        lastWorking: reportDetails.lastWorking.trim() || null,
        lastDiscussion: reportDetails.lastDiscussion.trim() || null,
        nextStep: reportDetails.nextStep.trim() || null,
        blockers: reportDetails.blockers.trim() || null,
        taskProgress: reportDetails.taskProgress === "" ? null : Number(reportDetails.taskProgress),
      });

      if (res.status >= 200 && res.status < 300) {
        toast.success("Daily report submitted successfully!");
        setReportContent("");
        setReportDate(new Date().toISOString().split("T")[0]);
        setReportDetails({ lastWorking: "", lastDiscussion: "", nextStep: "", blockers: "", taskProgress: "" });
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

              <div className="mb-6 space-y-4">
                {[
                  ["lastWorking", "Last Working", "What was the last successfully completed part?", "e.g., User authentication module completed"],
                  ["lastDiscussion", "Last Discussion", "Summary of recent meetings or discussions", "e.g., Client approved design on Aug 21. Waiting for animation approvals."],
                  ["nextStep", "Next Step", "What's the next action item?", "e.g., Integrate payment gateway. Will start after API credentials received."],
                ].map(([name, label, placeholder, helpText]) => (
                  <div key={name}>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</label>
                    <textarea
                      maxLength={1000}
                      rows="3"
                      placeholder={placeholder}
                      value={reportDetails[name]}
                      onChange={(e) => setReportDetails((prev) => ({ ...prev, [name]: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-400">{helpText}</p>
                  </div>
                ))}

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    {reportDetails.blockers && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    Blockers
                  </label>
                  <textarea
                    maxLength={1000}
                    rows="3"
                    placeholder="Any obstacles or blocking issues?"
                    value={reportDetails.blockers}
                    onChange={(e) => setReportDetails((prev) => ({ ...prev, blockers: e.target.value }))}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${reportDetails.blockers ? "border-amber-300 focus:border-amber-400 focus:ring-amber-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`}
                  />
                  <p className="mt-1 text-xs text-slate-400">e.g., Staging environment not setup. Missing database access.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Task Progress</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={reportDetails.taskProgress === "" ? 0 : reportDetails.taskProgress}
                      onChange={(e) => setReportDetails((prev) => ({ ...prev, taskProgress: e.target.value }))}
                      className="h-2 flex-1 accent-indigo-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="%"
                      value={reportDetails.taskProgress}
                      onChange={(e) => setReportDetails((prev) => ({ ...prev, taskProgress: e.target.value }))}
                      className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                    <span className="w-12 text-right text-sm font-bold text-indigo-600">{reportDetails.taskProgress === "" ? "—" : `${reportDetails.taskProgress}%`}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${reportDetails.taskProgress || 0}%` }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Report Date <span className="text-rose-500">*</span></label>
                  <input type="date" required value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
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
