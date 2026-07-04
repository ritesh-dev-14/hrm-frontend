import React, { useEffect, useMemo, useState, useRef } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
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
  Check,
  XCircle,
  ChevronRight,
  MessageSquare,
  Send,
  Plus,
  X,
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

export default function AssignedActionsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  // Dual View Tracking Mechanism
  const [viewMode, setViewMode] = useState("PERSONAL"); // PERSONAL or DELEGATED

  // Requirement Deployment Pipeline States
  const [coordinators, setCoordinators] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [submittingRequirement, setSubmittingRequirement] = useState(false);
  const [requirementForm, setRequirementForm] = useState({
    taskName: "",
    description: "",
    endDate: "",
    assignedToCoordinatorId: "",
  });

  // State machine handlers for inline action adjustments
  const [updatingId, setUpdatingId] = useState(null);
  const [exceptionTargetId, setExceptionTargetId] = useState(null);
  const [exceptionReason, setExceptionReason] = useState("");

  // Follow-Up Interaction System States
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});

  // History progressive viewport sizing
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(10);
  const chatEndRef = useRef(null);

  const fetchAssignedActions = async () => {
    try {
      setLoading(true);
      // Route routing splits depending on selected viewport perspective
      const endpoint = viewMode === "PERSONAL"
        ? `/api/coordinator-assignments/assigned-to/${user?.id}`
        : `/api/coordinator-assignments/my-created`;
      
      const res = await API.get(endpoint);
      setActions(res?.data?.data?.data || res?.data?.data || []);
    } catch (error) {
      console.error("Data pipeline execution failure:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const res = await API.get("/api/coordinator-assignments/coordinators");
      setCoordinators(res?.data?.data || []);
    } catch (error) {
      console.error("Failed to parse system coordinator nodes:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAssignedActions();
    }
  }, [user, viewMode]);

  useEffect(() => {
    if (user?.id) {
      fetchCoordinators();
    }
  }, [user]);

  // Thread Stream Auto-Scrolling Context Execution
  useEffect(() => {
    if (chatEndRef.current && !messagesLoading) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessagesCount, messages]);

  const updateStatus = async (assignmentId, payload) => {
    try {
      setUpdatingId(assignmentId);
      await API.patch(
        `/api/coordinator-assignments/${assignmentId}/status`,
        payload,
      );

      // Clear exception tracking frames on successful update
      setExceptionTargetId(null);
      setExceptionReason("");

      await fetchAssignedActions();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message || "Failed to finalize status shift",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    try {
      setSubmittingRequirement(true);
      
      const payload = {
        taskName: requirementForm.taskName.trim(),
        description: requirementForm.description.trim(),
        startDate: new Date().toISOString(),
        endDate: requirementForm.endDate ? new Date(requirementForm.endDate).toISOString() : null,
        assignedToCoordinatorId: requirementForm.assignedToCoordinatorId,
      };

      const res = await API.post("/api/coordinator-assignments/create-requirement", payload);
      if (res.data?.success || res.data) {
        setIsAssignModalOpen(false);
        setRequirementForm({ taskName: "", description: "", endDate: "", assignedToCoordinatorId: "" });
        await fetchAssignedActions();
      }
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to create deployment requirement matrix structure.");
    } finally {
      setSubmittingRequirement(false);
    }
  };

  const handleOpenChatPanel = async (assignmentItem) => {
    const isAlreadyOpen = expandedTaskId === assignmentItem.id;

    if (isAlreadyOpen) {
      setExpandedTaskId(null);
      setMessages([]);
      return;
    }

    setExpandedTaskId(assignmentItem.id);
    setMessages([]);
    setVisibleMessagesCount(10);

    try {
      setMessagesLoading(true);

      const res = await API.get(
        `/api/coordinator-assignments/${assignmentItem.id}/follow-up-messages`,
      );

      const sorted = (res?.data?.data || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setMessages(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendReply = async (assignmentId, messageId, replyMessage) => {
    if (!replyMessage?.trim()) return;

    try {
      setSendingReply(true);

      await API.patch(`/api/coordinator-assignments/${assignmentId}/reply`, {
        message: replyMessage.trim(),
      });

      setReplyInputs((prev) => ({
        ...prev,
        [messageId]: "",
      }));

      const res = await API.get(
        `/api/coordinator-assignments/${assignmentId}/follow-up-messages`,
      );

      const sorted = (res?.data?.data || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setMessages(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setSendingReply(false);
    }
  };

  // Safe subset slice view calculation for high volume threads
  const slicedMessages = useMemo(() => {
    if (messages.length <= visibleMessagesCount) return messages;
    return messages.slice(messages.length - visibleMessagesCount);
  }, [messages, visibleMessagesCount]);

  const hasMoreMessages = messages.length > visibleMessagesCount;

  // Processed Pipeline Matrix: Custom Filters and Tiered Sorting Configurations
  const filteredActions = useMemo(() => {
    const underlyingSelection = actions.filter((item) => {
      const title = (item?.task?.projectName || item?.task?.name || "").toLowerCase();
      const matchesSearch = title.includes(search.toLowerCase());
      const matchesTab = activeTab === "ALL" || item?.status === activeTab;
      return matchesSearch && matchesTab;
    });

    return [...underlyingSelection].sort((a, b) => {
      const dueA = a?.completionDate
        ? new Date(a.completionDate).getTime()
        : Infinity;
      const dueB = b?.completionDate
        ? new Date(b.completionDate).getTime()
        : Infinity;

      if (dueA !== dueB) return dueA - dueB;

      const assignedA = a?.assignedTime
        ? new Date(a.assignedTime).getTime()
        : 0;
      const assignedB = b?.assignedTime
        ? new Date(b.assignedTime).getTime()
        : 0;

      return assignedA - assignedB;
    });
  }, [actions, search, activeTab]);

  const stats = useMemo(() => {
    return {
      all: actions.length,
      assigned: actions.filter((i) => i.status === "ASSIGNED").length,
      progress: actions.filter((i) => i.status === "IN_PROGRESS").length,
      completed: actions.filter((i) => i.status === "COMPLETED").length,
      submitted: actions.filter((i) => i.status === "SUBMITTED").length,
    };
  }, [actions]);

  const tabItems = [
    { id: "ALL", label: "All Tasks", count: stats.all },
    { id: "ASSIGNED", label: "Assigned", count: stats.assigned },
    { id: "IN_PROGRESS", label: "In Progress", count: stats.progress },
    { id: "SUBMITTED", label: "Submitted", count: stats.submitted },
    { id: "COMPLETED", label: "Completed", count: stats.completed },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-6 lg:p-8 antialiased relative">
      {/* HEADER PIPELINE WITH MULTI-MODE DEPLOYMENT HOOKS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Assigned Actions
            </h1>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
              <button 
                onClick={() => {
                  setActiveTab("ALL");
                  setViewMode("PERSONAL");
                }}
                className={`px-3 py-1 rounded-md transition ${viewMode === "PERSONAL" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
              >
                My Actions
              </button>
              <button 
                onClick={() => {
                  setActiveTab("ALL");
                  setViewMode("DELEGATED");
                }}
                className={`px-3 py-1 rounded-md transition ${viewMode === "DELEGATED" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-800"}`}
              >
                Delegated Tasks
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {viewMode === "PERSONAL" 
              ? "Track, execute, and status update coordinator requests instantly."
              : "Track and review requirements you have assigned directly to coordinators."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by action name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition"
            />
          </div>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Plus size={15} />
            <span>Assign Coordinator</span>
          </button>
        </div>
      </div>

      {/* METRIC CARD DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: "Awaiting Action",
            count: stats.assigned,
            icon: BellRing,
            color: "text-amber-500",
            bg: "bg-amber-50/50",
          },
          {
            title: "Active Track",
            count: stats.progress,
            icon: Clock3,
            color: "text-blue-500",
            bg: "bg-blue-50/50",
          },
          {
            title: "Verified Finished",
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
            <div
              className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}
            >
              <card.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* SEGMENT CONTROL SYSTEM */}
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
                  isSelected
                    ? "text-slate-900 font-semibold"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
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

      {/* CORE PIPELINE ACTION MATRIX */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <BriefcaseBusiness size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              No entries localized
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no operational files matching this specific processing
              bucket.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActions.map((item) => {
              const currentStatus = STATUS_CONFIG[item?.status] || {
                color: "bg-slate-100 text-slate-700",
                label: item?.status,
              };
              const isProcessing = updatingId === item.id;
              const isReportingException = exceptionTargetId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-5 lg:p-6 hover:bg-slate-50/40 transition duration-150"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* PRIMARY OBJECT DESCRIPTION */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex flex-shrink-0 items-center justify-center text-slate-600">
                        <BriefcaseBusiness size={18} />
                      </div>
                      <div className="space-y-1 w-full">
                        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                          {item?.task?.projectName || item?.task?.name || "Unnamed Operational Assignment"}
                        </h3>

                        {/* SUBMETRICS INFOBAR */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-xs text-slate-400 font-medium">
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <User2 size={13} />
                            <span className="text-slate-400">
                              {viewMode === "PERSONAL" ? "Assigned By - " : "Assigned To - "}
                            </span>
                            {viewMode === "PERSONAL" 
                              ? (item?.assignedBy || "System Coordinator")
                              : (item?.assignedTo?.name || "Coordinator Target")}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={13} />
                            <span className="text-slate-600">
                              Due Date and Time:{" "}
                            </span>
                            {item?.completionDate
                              ? new Date(item.completionDate).toLocaleString(
                                  undefined,
                                  { dateStyle: "short", timeStyle: "short" },
                                )
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STATUS BADGE TRACK FRAME */}
                    <div className="flex items-center lg:justify-center min-w-[140px]">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${currentStatus.color}`}
                        >
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

                    {/* CONTEXTUAL OPERATOR CONTROL DECK */}
                    <div className="flex items-center justify-end gap-2 lg:min-w-[320px]">
                      {!isReportingException && (
                        <>
                          {/* Follow-Up Interface Hooks restricted strictly to Personal Task Perspectives */}
                          {viewMode === "PERSONAL" && (
                            <button
                              onClick={() => handleOpenChatPanel(item)}
                              className={`h-9 px-3 rounded-lg border text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm ${
                                expandedTaskId === item.id
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              <MessageSquare size={14} />
                              <span>
                                {expandedTaskId === item.id
                                  ? "Hide Follow Ups"
                                  : "Follow Ups"}
                              </span>
                            </button>
                          )}

                          {/* Action Management Hooks configuration rules matching chosen perspective context */}
                          {viewMode === "PERSONAL" ? (
                            <>
                              {item?.status === "ASSIGNED" && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() =>
                                    updateStatus(item.id, { status: "IN_PROGRESS" })
                                  }
                                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                >
                                  {isProcessing ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Play size={13} className="fill-current" />
                                  )}
                                  <span>Start Work</span>
                                </button>
                              )}

                              {item?.status === "IN_PROGRESS" && (
                                <>
                                  <button
                                    disabled={isProcessing}
                                    onClick={() =>
                                      updateStatus(item.id, { status: "SUBMITTED" })
                                    }
                                    className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                  >
                                    {isProcessing ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <ChevronRight size={14} />
                                    )}
                                    <span>Submit</span>
                                  </button>

                                  <button
                                    disabled={isProcessing}
                                    onClick={() => setExceptionTargetId(item.id)}
                                    className="h-9 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
                                  >
                                    Unable to Submit
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                            
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* INLINE EXPANSION EXCEPTION INTERFACE */}
                  {isReportingException && (
                    <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 max-w-xl ml-0 lg:ml-14 animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Specify the reason behind uncompletion:
                      </label>
                      <textarea
                        rows={2}
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        placeholder="Enter the critical reason or dependency block preventing successful closeout..."
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
                          <span>Confirm Unable to Completion</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FOLLOW UP MESSAGING CONTAINER SYSTEM */}
                  {expandedTaskId === item.id && viewMode === "PERSONAL" && (
                    <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="px-4 py-3 border-b bg-slate-50">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Follow Up Messages & Your Responses
                        </h4>
                        <p className="text-xs text-slate-500">
                          Reply to specific coordinator follow-ups to keep them updated on your progress.
                        </p>
                      </div>

                      {messagesLoading ? (
                        <div className="py-12 flex justify-center">
                          <Loader2 size={22} className="animate-spin text-slate-400" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                          No follow up messages available.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 border-b">
                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">
                                  Coordinator Follow Up
                                </th>
                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3 w-[180px]">
                                  Date Sent
                                </th>
                                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">
                                  Your Replies
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {messages
                                .filter((msg) => msg.senderRole === "COORDINATOR")
                                .map((coordMsg) => {
                                  const replies = messages.filter(
                                    (m) =>
                                      m.senderRole === "EMPLOYEE" &&
                                      new Date(m.createdAt) > new Date(coordMsg.createdAt),
                                  );

                                  return (
                                    <tr key={coordMsg.id} className="border-b last:border-b-0">
                                      <td className="px-4 py-4 align-top">
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-slate-700">
                                          {coordMsg.message}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">
                                          From:{" "}
                                          <span className="font-semibold text-slate-600">
                                            {coordMsg.sender?.name || "System"}
                                          </span>
                                        </p>
                                      </td>
                                      <td className="px-4 py-4 align-top">
                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                          {new Date(coordMsg.createdAt).toLocaleString(undefined, {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                          })}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 align-top">
                                        <div className="space-y-3">
                                          {replies.length > 0 && (
                                            <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
                                              {replies.map((reply) => (
                                                <div
                                                  key={reply.id}
                                                  className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-xs text-slate-700"
                                                >
                                                  <div className="flex items-start justify-between mb-1">
                                                    <span className="font-semibold text-emerald-700">
                                                      Your Response
                                                    </span>
                                                    <span className="text-[11px] text-emerald-600 font-medium">
                                                      {new Date(reply.createdAt).toLocaleTimeString(
                                                        undefined,
                                                        { timeStyle: "short" },
                                                      )}
                                                    </span>
                                                  </div>
                                                  <p className="text-slate-700">{reply.message}</p>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          <form
                                            onSubmit={(e) => {
                                              e.preventDefault();
                                              handleSendReply(
                                                item.id,
                                                coordMsg.id,
                                                replyInputs[coordMsg.id],
                                              );
                                            }}
                                            className="space-y-2"
                                          >
                                            <textarea
                                              rows={2}
                                              value={replyInputs[coordMsg.id] || ""}
                                              onChange={(e) =>
                                                setReplyInputs((prev) => ({
                                                  ...prev,
                                                  [coordMsg.id]: e.target.value,
                                                }))
                                              }
                                              placeholder="Write your update..."
                                              className="w-full border border-slate-200 rounded-lg p-2 text-xs resize-none focus:outline-none focus:border-indigo-500 bg-white"
                                            />
                                            <button
                                              type="submit"
                                              disabled={
                                                sendingReply ||
                                                !replyInputs[coordMsg.id]?.trim()
                                              }
                                              className="h-8 px-3 bg-slate-900 text-white rounded-md text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50 shadow-sm"
                                            >
                                              {sendingReply ? (
                                                <Loader2 size={12} className="animate-spin" />
                                              ) : (
                                                <Send size={12} />
                                              )}
                                              Send Reply
                                            </button>
                                          </form>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DESIGN COMPONENT MODAL: ASSIGN COORDINATOR REQUIREMENT */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deploy Coordinator Requirement Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Initialize and assign a targeted operational project milestone directly.</p>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Coordinator Operator
                </label>
                <select
                  required
                  value={requirementForm.assignedToCoordinatorId}
                  onChange={(e) => setRequirementForm({ ...requirementForm, assignedToCoordinatorId: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition"
                >
                  <option value="">Select an active operational coordinator...</option>
                  {coordinators.map((coord) => (
                    <option key={coord.id} value={coord.id}>
                      {coord.name} ({coord.employeeId || "COORD"}) — {coord.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Action Module Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Complete Q1 Performance Audit Report"
                  value={requirementForm.taskName}
                  onChange={(e) => setRequirementForm({ ...requirementForm, taskName: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Task Scope / Operational Parameters
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the descriptive roadmap expectations, requirements, or dependencies for the targeted execution..."
                  value={requirementForm.description}
                  onChange={(e) => setRequirementForm({ ...requirementForm, description: e.target.value })}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Target Expiry Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  value={requirementForm.endDate}
                  onChange={(e) => setRequirementForm({ ...requirementForm, endDate: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="h-9 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequirement}
                  className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                >
                  {submittingRequirement ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  <span>Deploy Segment Requirement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}