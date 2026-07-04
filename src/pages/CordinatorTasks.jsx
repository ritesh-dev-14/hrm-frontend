import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import {
  Search,
  BellRing,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarClock,
  User2,
  BriefcaseBusiness,
  Play,
  ChevronRight,
  XCircle
} from "lucide-react";

const STATUS_CONFIG = {
  ASSIGNED: {
    color: "bg-amber-50 text-amber-700 border-amber-200/60",
    label: "Assigned",
  },
  IN_PROGRESS: {
    color: "bg-blue-50 text-blue-700 border-blue-200/60",
    label: "In Progress",
  },
  SUBMITTED: {
    color: "bg-purple-50 text-purple-700 border-purple-200/60",
    label: "Submitted",
  },
  COMPLETED: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    label: "Completed",
  },
  REJECTED: {
    color: "bg-rose-50 text-rose-700 border-rose-200/60",
    label: "Rejected",
  },
  UNABLE_TO_SUBMIT: {
    color: "bg-slate-100 text-slate-700 border-slate-300/60",
    label: "Unable to Submit",
  },
};

export default function CordinatorTasks() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  // State handles for processing action adjustments
  const [updatingId, setUpdatingId] = useState(null);
  const [exceptionTargetId, setExceptionTargetId] = useState(null);
  const [exceptionReason, setExceptionReason] = useState("");

  const fetchCoordinatorTasks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/coordinator-assignments/my-tasks");
      // Cleanly extracts the deep array from your response envelope
      setTasks(res?.data?.data?.data || res?.data?.data || []);
    } catch (error) {
      console.error("Failed to compile coordinator workflow data matrix:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinatorTasks();
  }, []);

  const updateStatus = async (assignmentId, payload) => {
    try {
      setUpdatingId(assignmentId);
      await API.patch(
        `/api/coordinator-assignments/${assignmentId}/status`,
        payload,
      );

      // Clean transactional frames on success
      setExceptionTargetId(null);
      setExceptionReason("");

      await fetchCoordinatorTasks();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message || "Failed to transition operational stage.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Processed Pipeline Matrix: Custom Filters and Sorting Configurations
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((item) => {
        const title = (item?.task?.name || "").toLowerCase();
        const description = (item?.task?.description || "").toLowerCase();
        const matchesSearch = title.includes(search.toLowerCase()) || description.includes(search.toLowerCase());
        const matchesTab = activeTab === "ALL" || item?.status === activeTab;

        return matchesSearch && matchesTab;
      })
      .sort((a, b) => {
        const dueA = a?.completionDate ? new Date(a.completionDate).getTime() : Infinity;
        const dueB = b?.completionDate ? new Date(b.completionDate).getTime() : Infinity;
        return dueA - dueB;
      });
  }, [tasks, search, activeTab]);

  const stats = useMemo(() => {
    return {
      all: tasks.length,
      assigned: tasks.filter((i) => i.status === "ASSIGNED").length,
      progress: tasks.filter((i) => i.status === "IN_PROGRESS").length,
      submitted: tasks.filter((i) => i.status === "SUBMITTED").length,
      completed: tasks.filter((i) => i.status === "COMPLETED").length,
    };
  }, [tasks]);

  const tabItems = [
    { id: "ALL", label: "All My Tasks", count: stats.all },
    { id: "ASSIGNED", label: "Assigned", count: stats.assigned },
    { id: "IN_PROGRESS", label: "In Progress", count: stats.progress },
    { id: "SUBMITTED", label: "Submitted", count: stats.submitted },
    { id: "COMPLETED", label: "Completed", count: stats.completed },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-6 lg:p-8 antialiased">
      {/* HEADER PIPELINE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Coordinator Action Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review, execute pipelines, and submit status verification closures for delegated workloads.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search tasks or parameters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition"
          />
        </div>
      </div>

      {/* QUICK STATUS METRIC MATRICES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: "Assigned To Me",
            count: stats.assigned,
            icon: BellRing,
            color: "text-amber-500",
            bg: "bg-amber-50/50",
          },
          {
            title: "Under Execution",
            count: stats.progress,
            icon: Clock3,
            color: "text-blue-500",
            bg: "bg-blue-50/50",
          },
          {
            title: "Completed Actions",
            count: stats.completed,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-50/50",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </p>
              <h2 className="text-3xl font-bold mt-2 tracking-tight text-slate-900">
                {card.count}
              </h2>
            </div>
            <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* SEGMENT STEP TABS */}
      <div className="flex overflow-x-auto pb-px mb-6 border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <div className="flex space-x-6">
          {tabItems.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setExceptionTargetId(null);
                }}
                className={`pb-3 text-sm font-medium relative whitespace-nowrap transition-colors ${
                  isSelected ? "text-slate-900 font-semibold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
                    isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PIPELINE CARDS ELEMENT BOX */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <BriefcaseBusiness size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No matching assignments</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your workflow buffer is currently clear for this filtered tier segment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((item) => {
              const currentStatus = STATUS_CONFIG[item?.status] || {
                color: "bg-slate-100 text-slate-700",
                label: item?.status,
              };
              const isProcessing = updatingId === item.id;
              const isReportingException = exceptionTargetId === item.id;

              return (
                <div key={item.id} className="p-5 lg:p-6 hover:bg-slate-50/40 transition duration-150">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* PRIMARY OBJECT DATA DESCRIPTORS */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600">
                        <BriefcaseBusiness size={18} />
                      </div>
                      <div className="space-y-1 w-full">
                        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                          {item?.task?.name || "Unnamed Operational Milestone"}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">
                          {item?.task?.description || "No specific design structural details provided."}
                        </p>

                        {/* ROW METRICS HOOK LINE */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-400 font-medium">
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <User2 size={13} />
                            <span className="text-slate-400">Assigned By -</span>{" "}
                            {item?.assignedBy || item?.createdBy?.name || "System Controller"}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={13} />
                            <span className="text-slate-600">Expected Submission:</span>
                            {item?.completionDate
                              ? new Date(item.completionDate).toLocaleString(undefined, {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* REASON BADGE COLUMN CONTAINER */}
                    <div className="flex items-center lg:justify-center min-w-[140px]">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${currentStatus.color}`}>
                          {currentStatus.label}
                        </span>
                        {item?.reason && (
                          <div className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100 max-w-[200px]">
                            <AlertCircle size={12} className="flex-shrink-0" />
                            <span className="truncate" title={item.reason}>
                              {item.reason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CONTROL LAYER ENGINE FOR DISPATCH OPERATORS */}
                    <div className="flex items-center justify-end gap-2 lg:min-w-[220px]">
                      {!isReportingException && (
                        <>
                          {item?.status === "ASSIGNED" && (
                            <button
                              disabled={isProcessing}
                              onClick={() => updateStatus(item.id, { status: "IN_PROGRESS" })}
                              className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                            >
                              {isProcessing ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Play size={13} className="fill-current" />
                              )}
                              <span>Accept & Start</span>
                            </button>
                          )}

                          {item?.status === "IN_PROGRESS" && (
                            <>
                              <button
                                disabled={isProcessing}
                                onClick={() => updateStatus(item.id, { status: "SUBMITTED" })}
                                className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                              >
                                {isProcessing ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                                <span>Mark Submitted</span>
                              </button>

                              <button
                                disabled={isProcessing}
                                onClick={() => setExceptionTargetId(item.id)}
                                className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
                              >
                                Blocked
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* SUB-PANEL ROADBLOCK FORM STRIP */}
                  {isReportingException && (
                    <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 max-w-xl ml-0 lg:ml-14 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Specify structural execution issue preventing submission:
                      </label>
                      <textarea
                        rows={2}
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        placeholder="Provide details about system or data dependencies blocking this closure matrix..."
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 placeholder:text-slate-400 resize-none"
                      />
                      <div className="flex items-center gap-2 mt-3 justify-end">
                        <button
                          onClick={() => {
                            setExceptionTargetId(null);
                            setExceptionReason("");
                          }}
                          className="h-8 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 transition"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={isProcessing || !exceptionReason.trim()}
                          onClick={() =>
                            updateStatus(item.id, {
                              status: "UNABLE_TO_SUBMIT",
                              reason: exceptionReason.trim(),
                            })
                          }
                          className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md transition inline-flex items-center gap-1 disabled:opacity-40"
                        >
                          {isProcessing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          <span>Flag Blocked</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}