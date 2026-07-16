import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import { notifyError, notifyInfo, notifySuccess } from "../../utils/toast";

import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  User2,
  Briefcase,
  AlertTriangle,
  CalendarDays,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const statusStyles = {
  VERIFIED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  SUBMITTED: "bg-blue-50 text-blue-700 border border-blue-200",
  ASSIGNED: "bg-slate-100 text-slate-700 border border-slate-200",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  UNABLE_TO_SUBMIT: "bg-rose-50 text-rose-700 border border-rose-200",
};

const EmployeeTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

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

  // 🔥 Resubmit after manager rejection
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

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 mt-1">My Tasks</h1>
            <p className="text-sm text-slate-500 mt-1">Track your active tasks, manage task delivery, and update your project progress.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 min-w-[260px]">
            <div className="flex-1">
              <span className="text-xs text-slate-500 block">Average Progress</span>
              <span className="text-2xl font-bold text-slate-950 mt-0.5 block">{stats.avg}%</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} className="text-slate-600" />
            </div>
          </div>
        </div>

        {/* METRICS COUNT GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsRow title="Total Assigned" value={stats.total} icon={FileText} />
          <StatsRow title="In Progress" value={stats.pending} icon={Clock3} />
          <StatsRow title="Verified Work" value={stats.verified} icon={CheckCircle2} />
          <StatsRow title="Rejected" value={stats.rejected} icon={AlertTriangle} />
        </div>

        {/* CORE RENDER AREA */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin text-slate-600 mb-3" size={24} />
            <span className="text-sm font-medium text-slate-500">Fetching task listings...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No current tasks found</h3>
            <p className="text-sm text-slate-500 mt-1">All newly assigned milestones from your manager will appear here.</p>
          </div>
        ) : (
          /* MINIMAL ROW LAYOUT */
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Task Info</th>
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Task Progress</th>
                    <th className="px-6 py-4">Manager</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {tasks.map((item) => (
                    <tr key={item.assignmentId} className={`hover:bg-slate-50/60 transition-colors ${item.status === "REJECTED" ? "bg-red-50/30" : ""}`}>
                      <td className="px-6 py-4 max-w-sm">
                        <span className="font-semibold text-slate-900 block truncate">{item.taskItem?.title}</span>
                        {item.taskItem?.description && (
                          <span className="text-xs text-slate-500 block truncate mt-0.5">{item.taskItem.description}</span>
                        )}
                        {item.status === "REJECTED" && item.rejectionReason && (
                          <span className="text-[11px] text-red-600 block mt-1 truncate">
                            ⚠ {item.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {item.taskItem?.task?.projectName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[item.status]}`}>
                          {item.status === "REJECTED" ? "Rejected — Action Required" : item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3 w-32">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div style={{ width: `${item.progress || 0}%` }} className="h-full bg-slate-900 rounded-full" />
                          </div>
                          <span className="text-xs font-medium text-slate-600 shrink-0">{item.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {item.taskItem?.task?.createdBy?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenTask(item)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-xl transition-colors ${
                            item.status === "REJECTED"
                              ? "text-white bg-red-600 border-red-600 hover:bg-red-700"
                              : "text-slate-900 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {item.status === "REJECTED" ? (
                            <><RefreshCw size={13} /> Resubmit</>
                          ) : (
                            <>View Work <ChevronRight size={14} /></>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL WORKSPACE INTERACTION OVERLAY */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full lg:max-w-6xl h-[100vh] lg:h-[90vh] rounded-t-3xl lg:rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* MODAL HEADER */}
            <div className={`border-b px-6 py-5 flex items-start justify-between gap-4 shrink-0 ${selectedTask.status === "REJECTED" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[selectedTask.status]} mb-2`}>
                  {selectedTask.status === "REJECTED" ? "❌ Rejected — Resubmission Required" : selectedTask.status}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedTask.taskItem?.title}</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">Project Group: {selectedTask.taskItem?.task?.projectName}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-9 h-9 rounded-xl hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* MAIN CORE DIALOG INTERACTION COLUMNS */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* DETAILS COMPONENT COLUMN */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Description</span>
                    <p className="text-sm text-slate-700 leading-relaxed mt-1.5">{selectedTask.taskItem?.description || "No layout description included."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <RowMetaItem label="Assigned by" value={selectedTask.taskItem?.task?.createdBy?.name} icon={User2} />
                    <RowMetaItem label="Assigner Role" value={selectedTask.taskItem?.task?.createdBy?.role} icon={Briefcase} />
                  </div>

                  {/* REFERENCE AND RAW DATA LINKS */}
                  {(selectedTask.taskItem?.referenceLink || selectedTask.taskItem?.rawDataLink) && (
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Task Resources</h3>
                      <div className="space-y-4">
                        {selectedTask.taskItem?.referenceLink && (
                          <div>
                            <span className="text-xs text-slate-500 block mb-1 font-semibold">Reference Link</span>
                            <a
                              href={selectedTask.taskItem.referenceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 inline-flex items-start gap-1.5 hover:underline break-all"
                            >
                              <ExternalLink size={14} className="shrink-0 mt-0.5" />
                              {selectedTask.taskItem.referenceLink}
                            </a>
                          </div>
                        )}
                        {selectedTask.taskItem?.rawDataLink && (
                          <div>
                            <span className="text-xs text-slate-500 block mb-1 font-semibold">Raw Data Link</span>
                            <a
                              href={selectedTask.taskItem.rawDataLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 inline-flex items-start gap-1.5 hover:underline break-all"
                            >
                              <ExternalLink size={14} className="shrink-0 mt-0.5" />
                              {selectedTask.taskItem.rawDataLink}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUBMISSION SUMMARY CONTAINER */}
                  {selectedTask.submission && (
                    <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Previous Submission</h3>
                      <div className="space-y-3">
                        {selectedTask.submission.driveLink && (
                          <div>
                            <span className="text-xs text-slate-400 block">Resource Link</span>
                            <a
                              href={selectedTask.submission.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-slate-900 inline-flex items-center gap-1 hover:underline mt-0.5"
                            >
                              {selectedTask.submission.driveLink} <ExternalLink size={12} className="text-slate-400" />
                            </a>
                          </div>
                        )}
                        {selectedTask.submission.remarks && (
                          <div>
                            <span className="text-xs text-slate-400 block">Remarks</span>
                            <p className="text-sm text-slate-700 mt-0.5">{selectedTask.submission.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 🔥 REJECTION REASON — Prominent Banner */}
                  {selectedTask.status === "REJECTED" && selectedTask.rejectionReason && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-start gap-3">
                      <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-900 text-sm block mb-1">Manager's Feedback</span>
                        <p className="text-red-700 text-sm leading-relaxed">{selectedTask.rejectionReason}</p>
                        <p className="text-red-500 text-xs mt-2">Please revise your work based on this feedback and resubmit using the form →</p>
                      </div>
                    </div>
                  )}

                  {selectedTask.status === "REJECTED" && !selectedTask.rejectionReason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>Your submission was rejected. Please resubmit with revised work.</p>
                    </div>
                  )}
                </div>

                {/* CONTROLS UPDATE COLUMN */}
                <div className="space-y-5">
                  {/* PROGRESS ACTION BOX */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white">
                    <span className="text-xs font-semibold text-slate-400 uppercase block">Update Completion Level</span>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-3xl font-bold text-slate-900">{progressValue}%</span>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressValue}
                      onChange={(e) => setProgressValue(parseInt(e.target.value))}
                      className="w-full accent-slate-900 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer mt-4"
                      disabled={selectedTask.status === "VERIFIED"}
                    />

                    <button
                      onClick={handleSaveProgress}
                      disabled={savingProgress || selectedTask.status === "VERIFIED"}
                      className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold mt-4 transition-colors disabled:opacity-50"
                    >
                      {savingProgress ? "Updating..." : "Save Progress Value"}
                    </button>
                  </div>

                  {/* 🔥 RESUBMIT FORM — shown only when status is REJECTED */}
                  {selectedTask.status === "REJECTED" && (
                    <div className="border-2 border-red-300 rounded-2xl p-5 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <RefreshCw size={15} className="text-red-600 shrink-0" />
                        <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">Resubmit Revised Work</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-4">Address the manager's feedback and submit your revised work.</p>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-600 block mb-1 font-semibold">Drive / Resource Link <span className="font-normal text-slate-400">(optional)</span></label>
                          <input
                            type="url"
                            value={driveLink}
                            onChange={(e) => setDriveLink(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-slate-50"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-600 block mb-1 font-semibold">What Changed? <span className="font-normal text-slate-400">(optional)</span></label>
                          <textarea
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Briefly explain what you revised based on manager's feedback..."
                            className="w-full rounded-xl border border-slate-200 p-3 text-xs resize-none outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-slate-50"
                          />
                        </div>

                        {selectedTask.progress < 100 && (
                          <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700">
                            <AlertTriangle size={13} className="shrink-0" />
                            Progress must be 100% to resubmit. Update progress above first.
                          </div>
                        )}

                        <button
                          onClick={handleResubmitTask}
                          disabled={resubmitting || selectedTask.progress < 100}
                          className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {resubmitting ? (
                            <><Loader2 size={13} className="animate-spin" /> Resubmitting...</>
                          ) : (
                            <><RefreshCw size={13} /> Resubmit to Manager</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DISPATCH DELIVERY HANDLER FORMS — shown only when no submission yet and NOT rejected */}
                  {!selectedTask.submission && selectedTask.status !== "REJECTED" && (
                    <div className="space-y-4">
                      
                      {/* COMMIT FORM */}
                      <div className="border border-slate-200 rounded-2xl p-5 bg-white">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Submit Your task here</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Drive / Resource Link <span className="text-slate-400">(optional)</span></label>
                            <input
                              type="url"
                              value={driveLink}
                              onChange={(e) => setDriveLink(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-900 bg-slate-50/50"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Submission Remarks</label>
                            <textarea
                              rows={3}
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                              placeholder="Provide status summary context..."
                              className="w-full rounded-xl border border-slate-200 p-3 text-xs resize-none outline-none focus:border-slate-900 bg-slate-50/50"
                            />
                          </div>

                          <button
                            onClick={handleSubmitTask}
                            disabled={submitting}
                            className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {submitting ? "Submitting..." : "Submit Task"}
                          </button>
                        </div>
                      </div>

                      {/* ROADBLOCK CONTEXT LOGGER */}
                      <div className="border border-red-100 rounded-2xl p-5 bg-red-50/20">
                        <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-red-600" /> Failed to complete task
                        </h3>
                        
                        <div className="space-y-3">
                          <textarea
                            rows={3}
                            value={unableReason}
                            onChange={(e) => setUnableReason(e.target.value)}
                            placeholder="Provide explicit context on limitations..."
                            className="w-full rounded-xl border border-slate-200 p-3 text-xs resize-none bg-white outline-none focus:border-red-500"
                          />
                          <button
                            onClick={handleUnableToSubmit}
                            disabled={reportingIssue}
                            className="w-full h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {reportingIssue ? "Submiting..." : "Unable to Complete Task"}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

/* INNER METRIC ROW TILES */
const StatsRow = ({ title, value, icon: Icon }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
      <div>
        <span className="text-xs font-medium text-slate-400 block">{title}</span>
        <span className="text-xl font-bold text-slate-900 block mt-1">{value}</span>
      </div>
      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-slate-500" />
      </div>
    </div>
  );
};

/* METADATA DISPLAY LINE ITEMS */
const RowMetaItem = ({ label, value, icon: Icon, isMono = false }) => {
  return (
    <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">{label}</span>
        <span className={`text-xs font-semibold text-slate-800 block truncate mt-0.5 ${isMono ? "font-mono text-slate-500" : ""}`}>
          {value || "-"}
        </span>
      </div>
      {Icon && (
        <div className="w-7 h-7 bg-white rounded-lg border border-slate-200/60 flex items-center justify-center shrink-0">
          <Icon size={12} className="text-slate-400" />
        </div>
      )}
    </div>
  );
};

/* LOG LEVEL ROW DISPLAY LINE */
const RowTimelineLog = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-100">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-semibold text-slate-700">{value}</span>
    </div>
  );
};

export default EmployeeTaskPage;