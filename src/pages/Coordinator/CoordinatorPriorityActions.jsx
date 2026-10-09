import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  CalendarDays,
  User2,
  ClipboardList,
  Loader2,
  CheckCircle2,
  Clock3,
  AlertCircle,
  MessageSquarePlus,
  Send,
  History,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

const CoordinatorPriorityActions = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    task: "",
    assignedToId: "",
    assignedBy: "",
    completionDate: "",
  });

  // Follow-Up System States
  const [activeTaskForFollowUp, setActiveTaskForFollowUp] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState("");

  // Clean UI Virtual Pagination State
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(10);
  const chatEndRef = useRef(null);

  // Review (Approve / Reject) State
  const [reviewingId, setReviewingId] = useState(null); // assignment ID being reviewed
  const [reviewAction, setReviewAction] = useState(null); // "COMPLETED" | "REJECTED"
  const [rejectReason, setRejectReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Derived state: Extract information seamlessly without mirroring state variables
  const selectedEmployeeDetails = useMemo(() => {
    if (!formData.assignedToId) return null;
    return employees.find((emp) => emp.id === formData.assignedToId) || null;
  }, [formData.assignedToId, employees]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await API.get("/api/coordinator-assignments/users/list", {
        params: { take: 1000, limit: 1000, pageSize: 1000, all: true },
      });
      const list = res?.data?.data?.data || res?.data?.data || res?.data || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      setTableLoading(true);
      const res = await API.get("/api/coordinator-assignments/team-assignments", {
        params: { all: true },
      });
      const list = res?.data?.data?.data || res?.data?.data || res?.data || [];
      setAssignments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAssignments();
    window.addEventListener("focus", fetchAssignments);
    return () => {
      window.removeEventListener("focus", fetchAssignments);
    };
  }, [fetchAssignments, fetchEmployees]);

  // Message Auto-Scroll Execution
  useEffect(() => {
    if (chatEndRef.current && !messagesLoading) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
    }
  }, [visibleMessagesCount, messages, messagesLoading]);

  useEffect(() => {
    if (!activeTaskForFollowUp?.id) return;

    const interval = setInterval(() => {
      fetchMessages(activeTaskForFollowUp.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTaskForFollowUp]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...formData,
        completionDate: new Date(formData.completionDate).toISOString(),
        employeeNumber: selectedEmployeeDetails?.employeeId || "",
        employeeEmail: selectedEmployeeDetails?.email || "",
      };

      await API.post("/api/coordinator-assignments", payload);

      setFormData({
        task: "",
        assignedToId: "",
        assignedBy: "",
        completionDate: "",
      });
      fetchAssignments();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  // Review handler: coordinator approves or rejects a SUBMITTED task
  const handleReview = async (assignmentId, status) => {
    if (status === "REJECTED" && !rejectReason.trim()) return;
    try {
      setReviewLoading(true);
      await API.patch(`/api/coordinator-assignments/${assignmentId}/review`, {
        status,
        reason: status === "REJECTED" ? rejectReason.trim() : undefined,
      });
      // Reset review state
      setReviewingId(null);
      setReviewAction(null);
      setRejectReason("");
      // Refresh assignments
      fetchAssignments();
    } catch (error) {
      console.error("Failed to review submission:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    const taskName = assignment?.task?.projectName || "this task";
    if (!window.confirm(`Delete "${taskName}"? This will remove the assignment.`)) return;

    try {
      setDeletingId(assignment.id);
      await API.delete(`/api/coordinator-assignments/${assignment.id}`);
      setAssignments((current) => current.filter((item) => item.id !== assignment.id));
      if (activeTaskForFollowUp?.id === assignment.id) {
        setActiveTaskForFollowUp(null);
        setMessages([]);
      }
      toast.success("Task assignment deleted.");
    } catch (error) {
      console.error("Failed to delete coordinator assignment:", error);
      toast.error(error.response?.data?.message || "Failed to delete task assignment.");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchMessages = async (assignmentId) => {
    const res = await API.get(
      `/api/coordinator-assignments/${assignmentId}/follow-up-messages`,
    );

    // Sort oldest first so chat reads top-to-bottom
    const sorted = (res?.data?.data || []).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    setMessages(sorted);
  };

  // Follow-Up Engine Implementations
  const handleOpenFollowUpPanel = async (assignmentItem) => {
    if (activeTaskForFollowUp?.id === assignmentItem.id) {
      setActiveTaskForFollowUp(null);
      setMessages([]);
      setVisibleMessagesCount(10);
      setFollowUpText("");
      return;
    }

    setActiveTaskForFollowUp(assignmentItem);
    setMessages([]);
    setVisibleMessagesCount(10);
    setFollowUpText("");

    try {
      setMessagesLoading(true);
      await fetchMessages(assignmentItem.id);
    } catch (error) {
      console.error("Failed to fetch task audit trail:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendFollowUp = async (e) => {
    e.preventDefault();

    if (!followUpText.trim() || !activeTaskForFollowUp) return;

    try {
      setSendingFollowUp(true);

      const targetId = activeTaskForFollowUp.id;

      await API.post(`/api/coordinator-assignments/${targetId}/follow-up`, {
        message: followUpText.trim(),
      });

      setFollowUpText("");

      await fetchMessages(targetId);
    } catch (error) {
      console.error("Failed to transmit assignment follow-up alert:", error);
    } finally {
      setSendingFollowUp(false);
    }
  };

  // Paginated/Sliced subset view computation - Show newest first
  const slicedMessages = useMemo(() => {
    return messages.slice(0, visibleMessagesCount);
  }, [messages, visibleMessagesCount]);

  const hasMoreMessages = messages.length > visibleMessagesCount;

  // Create paired exchanges: coordinator message with its corresponding employee reply group
  const messagePairs = useMemo(() => {
    const sortedByOldest = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const pairs = [];
    let currentPair = null;

    sortedByOldest.forEach((msg) => {
      if (msg.senderRole === "COORDINATOR") {
        currentPair = { coordinator: msg, employeeReplies: [] };
        pairs.push(currentPair);
      } else if (msg.senderRole === "EMPLOYEE") {
        if (currentPair) {
          currentPair.employeeReplies.push(msg);
        }
      }
    });

    return pairs.reverse();
  }, [messages]);

  const getStatusStyle = (status) => {
    const styles = {
      COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
      ASSIGNED: "bg-amber-50 text-amber-700 border-amber-100",
      IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
      SUBMITTED: "bg-violet-50 text-violet-700 border-violet-100",
      UNABLE_TO_SUBMIT: "bg-rose-50 text-rose-700 border-rose-100",
      REJECTED: "bg-red-50 text-red-700 border-red-100",
    };
    return styles[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 md:p-8 antialiased relative">
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Priority Actions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          All tasks assigned by EAs and coordinators to employees, managers, and HR.
        </p>
      </div>

      {/* Creation form */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Plus size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Create Quick Task</h2>
            <p className="text-xs text-slate-500">
              Dispatch action items instantly
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateTask}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">
              Task Title
            </label>
            <textarea
              required
              rows={1}
              value={formData.task}
              onChange={(e) => handleInputChange("task", e.target.value)}
              placeholder="Enter task title"
              className="w-full min-h-10 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-y"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">
              Assign To
            </label>
            <select
              required
              value={formData.assignedToId}
              onChange={(e) =>
                handleInputChange("assignedToId", e.target.value)
              }
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="">Select Target User</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">
              Assigned By
            </label>
            <input
              type="text"
              required
              value={formData.assignedBy}
              onChange={(e) => handleInputChange("assignedBy", e.target.value)}
              placeholder="Coordinator reference name"
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-700">
              Completion Target
            </label>
            <input
              type="datetime-local"
              required
              value={formData.completionDate}
              onChange={(e) =>
                handleInputChange("completionDate", e.target.value)
              }
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">
              Employee Number
            </label>
            <input
              type="text"
              disabled
              value={selectedEmployeeDetails?.employeeId || "—"}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-100 bg-slate-50 text-slate-400 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5 lg:col-span-2 xl:col-span-1">
            <label className="text-xs font-medium text-slate-400">
              Employee Email
            </label>
            <input
              type="text"
              disabled
              value={selectedEmployeeDetails?.email || "—"}
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-100 bg-slate-50 text-slate-400"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end pt-2">
            <button
              disabled={loading}
              className="h-10 px-5 text-sm font-medium text-white rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 transition flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>{loading ? "Processing..." : "Create Priority Task"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* All assignments in one list */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Tasks Assigned by EAs and Coordinators
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Employees, managers, and HR
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium bg-slate-200/60 px-2.5 py-1 rounded-md">
                {assignments.length} {assignments.length === 1 ? "task" : "tasks"}
              </span>
              <button
                type="button"
                onClick={fetchAssignments}
                disabled={tableLoading}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh priority actions"
              >
                <RefreshCw size={13} className={tableLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Layout Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1550px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Task / Project
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Assigned To
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Role
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Originator
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Issued At
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Target Milestone
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Submitted
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Completed
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Exception Context
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 tracking-wider uppercase text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tableLoading ? (
                <tr>
                  <td colSpan={11} className="py-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2
                        className="animate-spin text-slate-400"
                        size={28}
                      />
                    </div>
                  </td>
                </tr>
              ) : assignments.length > 0 ? (
                assignments.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-50/50 transition duration-150">
                      <td className="p-4 text-sm font-medium text-slate-900 whitespace-pre-wrap break-words min-w-[250px] max-w-[400px]">
                        {item?.task?.projectName || "—"}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs">
                            {item?.assignedTo?.name ? (
                              item.assignedTo.name.charAt(0)
                            ) : (
                              <User2 size={14} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {item?.assignedTo?.name || "—"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item?.assignedTo?.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {item?.assignedTo?.role || "—"}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {item?.assignedBy || "—"}
                      </td>
                      <td className="p-4 text-sm text-slate-500 font-mono whitespace-nowrap">
                        {item?.assignedTime
                          ? new Date(item.assignedTime).toLocaleString(
                            undefined,
                            { dateStyle: "short", timeStyle: "short" },
                          )
                          : "—"}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays size={14} className="text-slate-400" />
                          <span>
                            {item?.completionDate
                              ? new Date(item.completionDate).toLocaleString(
                                undefined,
                                { dateStyle: "short", timeStyle: "short" },
                              )
                              : "—"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                        {item?.submittedAt ? (
                          new Date(item.submittedAt).toLocaleDateString()
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                        {item?.completedAt ? (
                          new Date(item.completedAt).toLocaleDateString()
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        {item?.reason ? (
                          <div className="max-w-[180px]" title={item.reason}>
                            <p className="text-xs text-rose-600 font-medium truncate bg-rose-50 px-2 py-1 rounded border border-rose-100">
                              {item.reason}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusStyle(item?.status)}`}
                        >
                          {item?.status === "COMPLETED" ? (
                            <CheckCircle2 size={12} />
                          ) : item?.status === "ASSIGNED" ? (
                            <Clock3 size={12} />
                          ) : (
                            <AlertCircle size={12} />
                          )}
                          {item?.status
                            ? item.status.replace(/_/g, " ")
                            : "UNKNOWN"}
                        </span>
                      </td>

                      {/* Actions Column: Follow-Up + Approve/Reject for SUBMITTED */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-2">
                          {/* Follow-Up button always available */}
                          <button
                            onClick={() => handleOpenFollowUpPanel(item)}
                            className={`h-8 px-3 rounded-lg border text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm ${activeTaskForFollowUp?.id === item.id
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                          >
                            <MessageSquarePlus size={13} />
                            <span>
                              {activeTaskForFollowUp?.id === item.id
                                ? "Hide Follow Ups"
                                : "Follow Ups"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(item)}
                            disabled={deletingId === item.id}
                            className="h-8 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold transition inline-flex items-center gap-1.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${item?.task?.projectName || "task assignment"}`}
                          >
                            {deletingId === item.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Delete
                          </button>

                          {/* Approve / Reject — only for SUBMITTED tasks */}
                          {item?.status === "SUBMITTED" && (
                            <div className="w-full">
                              {reviewingId === item.id ? (
                                <div className="flex flex-col gap-1.5 min-w-[200px]">
                                  {reviewAction === "REJECTED" && (
                                    <input
                                      type="text"
                                      placeholder="Reason for rejection..."
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      className="w-full px-2 py-1 text-xs rounded-lg border border-rose-300 focus:outline-none focus:border-rose-500 bg-white"
                                      autoFocus
                                    />
                                  )}
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() =>
                                        handleReview(item.id, reviewAction)
                                      }
                                      disabled={
                                        reviewLoading ||
                                        (reviewAction === "REJECTED" && !rejectReason.trim())
                                      }
                                      className="flex-1 h-7 rounded-lg text-xs font-semibold transition inline-flex items-center justify-center gap-1 disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800"
                                    >
                                      {reviewLoading ? (
                                        <Loader2 size={11} className="animate-spin" />
                                      ) : (
                                        "Confirm"
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReviewingId(null);
                                        setReviewAction(null);
                                        setRejectReason("");
                                      }}
                                      className="flex-1 h-7 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      setReviewingId(item.id);
                                      setReviewAction("COMPLETED");
                                      setRejectReason("");
                                    }}
                                    className="flex-1 h-7 px-2 rounded-lg border text-xs font-semibold transition inline-flex items-center justify-center gap-1 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                  >
                                    <ThumbsUp size={11} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviewingId(item.id);
                                      setReviewAction("REJECTED");
                                      setRejectReason("");
                                    }}
                                    className="flex-1 h-7 px-2 rounded-lg border text-xs font-semibold transition inline-flex items-center justify-center gap-1 bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                                  >
                                    <ThumbsDown size={11} />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {activeTaskForFollowUp?.id === item.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={11} className="p-4">
                          <div className="max-w-4xl mx-auto w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                            {/* Chat Header */}
                            <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Follow Up Conversation</p>
                                <p className="text-xs text-slate-500">
                                  All messages between you and{" "}
                                  <span className="font-semibold text-slate-700">
                                    {activeTaskForFollowUp?.assignedTo?.name || "the employee"}
                                  </span>
                                </p>
                              </div>
                              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-1 rounded-full border border-indigo-100">
                                {messages.length} message{messages.length !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {/* Messages */}
                            <div className="max-h-72 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                              {messagesLoading ? (
                                <div className="py-8 flex justify-center">
                                  <Loader2 size={22} className="animate-spin text-slate-400" />
                                </div>
                              ) : messages.length === 0 ? (
                                <div className="py-6 text-center">
                                  <MessageSquarePlus size={28} className="mx-auto text-slate-300 mb-2" />
                                  <p className="text-sm text-slate-400">No messages yet. Send the first follow-up!</p>
                                </div>
                              ) : (
                                messages.map((msg) => {
                                  const isMe = msg.sender?.id === user?.id || msg.senderId === user?.id;
                                  const isCoordinator = ["COORDINATOR", "EA"].includes(msg.senderRole);
                                  return (
                                    <div
                                      key={msg.id}
                                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[72%] rounded-xl px-3 py-2 shadow-sm ${
                                          isMe
                                            ? "bg-indigo-600 text-white rounded-br-sm"
                                            : isCoordinator
                                            ? "bg-amber-50 border border-amber-200 text-slate-800 rounded-bl-sm"
                                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                        }`}
                                      >
                                        <p
                                          className={`text-[11px] font-semibold mb-0.5 ${
                                            isMe ? "text-indigo-200" : "text-slate-500"
                                          }`}
                                        >
                                          {isMe
                                            ? "You"
                                            : `${msg.sender?.name || "User"} (${msg.senderRole})`}
                                        </p>
                                        <p className="text-sm leading-snug whitespace-pre-wrap break-words">{msg.message}</p>
                                        <p
                                          className={`text-[10px] mt-1 text-right ${
                                            isMe ? "text-indigo-300" : "text-slate-400"
                                          }`}
                                        >
                                          {new Date(msg.createdAt).toLocaleString(undefined, {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              <div ref={chatEndRef} />
                            </div>

                            {/* Compose Box */}
                            <div className="border-t border-slate-200 bg-white px-4 py-3">
                              <form
                                onSubmit={handleSendFollowUp}
                                className="flex items-end gap-2"
                              >
                                <textarea
                                  rows={2}
                                  required
                                  disabled={sendingFollowUp || messagesLoading}
                                  value={followUpText}
                                  onChange={(e) => setFollowUpText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendFollowUp(e);
                                    }
                                  }}
                                  placeholder="Send a follow-up to the employee... (Enter to send)"
                                  className="flex-1 min-w-0 border border-slate-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500 bg-white"
                                />
                                <button
                                  type="submit"
                                  disabled={sendingFollowUp || !followUpText.trim() || messagesLoading}
                                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 transition shadow-sm whitespace-nowrap"
                                >
                                  {sendingFollowUp ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Send size={15} />
                                  )}
                                  Send
                                </button>
                              </form>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-4">
                        <ClipboardList size={20} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        No tasks assigned yet
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Tasks you assign to employees, managers, or HR will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default CoordinatorPriorityActions;
