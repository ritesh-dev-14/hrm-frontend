import React, { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import { notifyError, notifyInfo, notifySuccess } from "../../utils/toast";
import { motion, AnimatePresence } from "framer-motion";

import {
  CheckCircle2,
  Clock3,
  FileText,
  User2,
  Briefcase,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search,
  Layers,
  Link2,
} from "lucide-react";

// Status configuration map for beautiful UI rendering
const statusConfig = {
  VERIFIED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, label: "Verified" },
  REJECTED: { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", icon: AlertTriangle, label: "Rejected" },
  SUBMITTED: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: CheckCircle2, label: "Awaiting Review" },
  ASSIGNED: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: FileText, label: "Assigned" },
  PENDING: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock3, label: "In Progress" },
  UNABLE_TO_SUBMIT: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle, label: "Blocked" },
};

const EmployeeTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Form Fields
  const [progressValue, setProgressValue] = useState(0);
  const [driveLink, setDriveLink] = useState("");
  const [remarks, setRemarks] = useState("");
  const [unableReason, setUnableReason] = useState("");

  // Action States
  const [savingProgress, setSavingProgress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [reportingIssue, setReportingIssue] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/task-item-submission/my-items");
      setTasks(response?.data?.data || []);
    } catch (error) {
      notifyError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setProgressValue(task.progress || 0);
    setRemarks("");
    setDriveLink("");
    setUnableReason("");
  };

  const handleSaveProgress = async () => {
    try {
      setSavingProgress(true);
      await API.patch(
        `/api/task-item-submission/${selectedTask.assignmentId}/progress`,
        { progress: progressValue },
      );
      notifySuccess("Progress updated");
      loadTasks();
    } catch (error) {
      notifyError("Failed to update progress");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSubmitTask = async () => {
    try {
      setSubmitting(true);
      await API.post(
        `/api/task-item-submission/${selectedTask.assignmentId}/submit`,
        { remarks, driveLink },
      );
      notifySuccess("Task submitted successfully");
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmitTask = async () => {
    try {
      setResubmitting(true);
      await API.post(
        `/api/task-item-submission/${selectedTask.assignmentId}/resubmit`,
        { remarks, driveLink },
      );
      notifySuccess("Task resubmitted! Manager has been notified.");
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Resubmission failed");
    } finally {
      setResubmitting(false);
    }
  };

  const handleUnableToSubmit = async () => {
    try {
      if (!unableReason.trim()) {
        notifyInfo("Please provide a reason for the roadblock");
        return;
      }
      setReportingIssue(true);
      await API.post(
        `/api/task-item-submission/${selectedTask.assignmentId}/unable-to-submit`,
        { reason: unableReason },
      );
      notifySuccess("Roadblock logged successfully");
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      notifyError("Failed to log roadblock");
    } finally {
      setReportingIssue(false);
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const verified = tasks.filter((t) => t.status === "VERIFIED").length;
    const rejected = tasks.filter((t) => t.status === "REJECTED").length;
    const pending = tasks.filter(
      (t) =>
        t.status === "PENDING" ||
        t.status === "SUBMITTED" ||
        t.status === "ASSIGNED",
    ).length;

    const avg =
      total > 0
        ? Math.round(
            tasks.reduce((sum, item) => sum + (item.progress || 0), 0) / total,
          )
        : 0;

    return { total, verified, rejected, pending, avg };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.toLowerCase();
    return tasks.filter((task) => 
      task.taskItem?.title?.toLowerCase().includes(term) ||
      task.taskItem?.description?.toLowerCase().includes(term) ||
      task.taskItem?.task?.projectName?.toLowerCase().includes(term)
    );
  }, [tasks, searchTerm]);

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 bg-slate-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 p-6 md:p-10 font-sans selection:bg-indigo-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              My Project Tasks
              {stats.rejected > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-2 text-xs font-bold text-white bg-rose-500 rounded-full shadow-sm" title="Tasks rejected — action needed">
                  {stats.rejected}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Manage deliverables, track your progress, and view milestones.</p>
          </div>

          {/* Average Progress Widget */}
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm min-w-[220px]">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-indigo-600 w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Average Progress</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">{stats.avg}%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid & Search */}
        <div className="mt-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <StatsRow title="Total Assigned" value={stats.total} icon={FileText} color="indigo" />
            <StatsRow title="In Progress" value={stats.pending} icon={Clock3} color="amber" />
            <StatsRow title="Verified" value={stats.verified} icon={CheckCircle2} color="emerald" />
            <StatsRow title="Rejected" value={stats.rejected} icon={AlertTriangle} color="rose" />
          </div>

          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-sm"
              placeholder="Search by title, project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* Main Task List Rendering */}
      {filteredTasks.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 max-w-6xl mx-auto bg-white/60 backdrop-blur-xl border border-slate-100/60 rounded-[2rem] shadow-sm relative z-10">
          <Layers className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">
            {searchTerm ? "No tasks matching your search" : "No active tasks right now"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {searchTerm ? "Try a different keyword." : "You're all caught up with your project assignments!"}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-4 relative z-10">
          {filteredTasks.map((item) => {
            const sc = statusConfig[item.status] || statusConfig.PENDING;
            const StatusIcon = sc.icon;
            const isRejected = item.status === "REJECTED";

            return (
              <motion.div 
                variants={itemVariants}
                key={item.assignmentId}
                className={`flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/70 backdrop-blur-md border ${isRejected ? 'border-rose-200 bg-rose-50/30 shadow-sm' : 'border-slate-200/60'} rounded-[1.5rem] hover:shadow-md transition-all gap-5 group`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-slate-100 text-slate-600">
                      {item.taskItem?.task?.projectName || "General Project"}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${sc.bg} ${sc.color} ${sc.border}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {sc.label}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{item.taskItem?.title}</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-2xl mt-1 line-clamp-2">
                      {item.taskItem?.description || "No description provided."}
                    </p>
                  </div>

                  {isRejected && item.rejectionReason && (
                    <div className="mt-2 text-xs inline-flex items-center gap-2 bg-rose-100/50 text-rose-700 px-3 py-1.5 rounded-xl font-medium border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-md">{item.rejectionReason}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col lg:flex-row items-center gap-6 md:gap-4 lg:gap-8 justify-between md:justify-end shrink-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0 mt-2 md:mt-0">
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 w-32 shrink-0">
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                      <div style={{ width: `${item.progress || 0}%` }} className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0 w-8">{item.progress || 0}%</span>
                  </div>

                  {/* Manager Assignee */}
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 min-w-[120px]">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <User2 className="w-3 h-3 text-slate-400" />
                    </div>
                    <span className="truncate">{item.taskItem?.task?.createdBy?.name || "Unassigned"}</span>
                  </div>

                  <button
                    onClick={() => handleOpenTask(item)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0 ${
                      isRejected
                        ? "text-white bg-rose-600 hover:bg-rose-700 hover:shadow-md"
                        : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                    }`}
                  >
                    {isRejected ? (
                      <><RefreshCw size={14} /> Fix & Resubmit</>
                    ) : (
                      <>View Workspace <ChevronRight size={14} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Task Dialog overlay utilizing framer-motion */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-t-3xl lg:rounded-[2rem] w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`px-6 md:px-8 py-5 border-b flex items-start justify-between gap-4 shrink-0 transition-colors ${selectedTask.status === "REJECTED" ? "bg-rose-50/50 border-rose-200" : "bg-white/50 border-slate-200/60"}`}>
                <div className="space-y-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border mb-2 ${statusConfig[selectedTask.status]?.bg || 'bg-slate-100'} ${statusConfig[selectedTask.status]?.color || 'text-slate-600'} ${statusConfig[selectedTask.status]?.border || 'border-slate-200'}`}>
                    {selectedTask.status === "REJECTED" ? "❌ Rejected — Resubmission Required" : statusConfig[selectedTask.status]?.label || selectedTask.status}
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{selectedTask.taskItem?.title}</h2>
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Project: {selectedTask.taskItem?.task?.projectName || "General"}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Details */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Description Block */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" /> Task Description
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {selectedTask.taskItem?.description || "No specific instructions provided for this task."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-slate-200/60 bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                          <User2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Assigned by</span>
                          <span className="text-sm font-bold text-slate-800 block mt-0.5">{selectedTask.taskItem?.task?.createdBy?.name || "-"}</span>
                        </div>
                      </div>
                      <div className="border border-slate-200/60 bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 shrink-0">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">Manager Role</span>
                          <span className="text-sm font-bold text-slate-800 block mt-0.5">{selectedTask.taskItem?.task?.createdBy?.role || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Resources */}
                    {(selectedTask.taskItem?.referenceLink || selectedTask.taskItem?.rawDataLink) && (
                      <div className="border border-slate-200/60 rounded-2xl p-6 bg-white shadow-sm space-y-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4" /> Provided Resources
                        </span>
                        
                        {selectedTask.taskItem?.referenceLink && (
                          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Reference Material</span>
                            <a href={selectedTask.taskItem.referenceLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 break-all transition">
                              <ExternalLink className="w-4 h-4 shrink-0" /> {selectedTask.taskItem.referenceLink}
                            </a>
                          </div>
                        )}

                        {selectedTask.taskItem?.rawDataLink && (
                          <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100">
                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">Raw Assets</span>
                            <a href={selectedTask.taskItem.rawDataLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-violet-600 hover:text-violet-800 flex items-center gap-2 break-all transition">
                              <ExternalLink className="w-4 h-4 shrink-0" /> {selectedTask.taskItem.rawDataLink}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Previous Submission Log */}
                    {selectedTask.submission && (
                      <div className="border border-slate-200/60 rounded-2xl p-6 bg-white shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-4 h-4" /> Previous Submission
                        </span>
                        <div className="space-y-4">
                          {selectedTask.submission.driveLink && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Submitted Link</span>
                              <a href={selectedTask.submission.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition break-all">
                                <ExternalLink className="w-4 h-4" /> {selectedTask.submission.driveLink}
                              </a>
                            </div>
                          )}
                          {selectedTask.submission.remarks && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Remarks Provided</span>
                              <div className="p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 border border-slate-100">
                                {selectedTask.submission.remarks}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Manager Rejection Banner */}
                    {selectedTask.status === "REJECTED" && (
                      <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                        <div>
                          <span className="font-bold text-rose-900 text-sm block mb-1 tracking-tight">Manager Feedback / Rejection Reason</span>
                          <p className="text-rose-700 text-sm font-medium leading-relaxed bg-white/60 p-3 rounded-xl border border-rose-100 mt-2">
                            {selectedTask.rejectionReason || "Please resubmit with revised work."}
                          </p>
                          <p className="text-rose-500 text-xs font-bold mt-3">Action required: Fix the issues and use the form to resubmit.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Interactive Actions */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Progress Widget */}
                    <div className="border border-slate-200/60 rounded-2xl p-6 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Completion Status</span>
                        <span className="text-2xl font-black text-slate-900">{progressValue}%</span>
                      </div>
                      
                      <div className="relative pt-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressValue}
                          onChange={(e) => setProgressValue(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          disabled={selectedTask.status === "VERIFIED"}
                        />
                      </div>

                      <button
                        onClick={handleSaveProgress}
                        disabled={savingProgress || selectedTask.status === "VERIFIED"}
                        className="w-full mt-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {savingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                        {savingProgress ? "Updating Progress..." : "Save Progress Value"}
                      </button>
                    </div>

                    {/* Resubmit Workflow Container */}
                    {selectedTask.status === "REJECTED" && (
                      <div className="border-2 border-rose-200 bg-rose-50/30 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <RefreshCw className="w-5 h-5 text-rose-600" />
                          <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Resubmit Work</h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Drive / Resource Link</label>
                            <input
                              type="url"
                              value={driveLink}
                              onChange={(e) => setDriveLink(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">What Changed? (Optional)</label>
                            <textarea
                              rows={3}
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              placeholder="Explain how you addressed the feedback..."
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white resize-none"
                            />
                          </div>

                          {selectedTask.progress < 100 && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              Set progress to 100% to resubmit.
                            </div>
                          )}

                          <button
                            onClick={handleResubmitTask}
                            disabled={resubmitting || selectedTask.progress < 100}
                            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                          >
                            {resubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {resubmitting ? "Sending..." : "Submit to Manager"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Standard Submission Workflow */}
                    {!selectedTask.submission && selectedTask.status !== "REJECTED" && (
                      <div className="space-y-6">
                        {/* Standard Submission Form */}
                        <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-6 shadow-sm">
                          <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Complete Task
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Delivery Link</label>
                              <input
                                type="url"
                                value={driveLink}
                                onChange={(e) => setDriveLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Remarks</label>
                              <textarea
                                rows={3}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Additional context..."
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white resize-none"
                              />
                            </div>
                            <button
                              onClick={handleSubmitTask}
                              disabled={submitting}
                              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                            >
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              {submitting ? "Submitting..." : "Submit Deliverables"}
                            </button>
                          </div>
                        </div>

                        {/* Unable to Submit Log */}
                        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Log Blockers
                          </h3>
                          <div className="space-y-3">
                            <textarea
                              rows={2}
                              value={unableReason}
                              onChange={(e) => setUnableReason(e.target.value)}
                              placeholder="Provide explicit context on limitations..."
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-slate-50 resize-none"
                            />
                            <button
                              onClick={handleUnableToSubmit}
                              disabled={reportingIssue}
                              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {reportingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : "Report Issue & Block Task"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* INNER METRIC ROW TILES */
const StatsRow = ({ title, value, icon: Icon, color = "slate" }) => {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100"
  };

  const currentConfig = colorMap[color];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px]">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${currentConfig}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{title}</span>
        <span className="text-xl font-black text-slate-900 block mt-0.5">{value}</span>
      </div>
    </div>
  );
};

export default EmployeeTaskPage;