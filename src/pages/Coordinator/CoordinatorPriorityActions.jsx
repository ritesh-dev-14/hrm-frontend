import React, { useEffect, useMemo, useState, useRef } from "react";
import API from "../../services/api";
import {
  Plus,
  Search,
  CalendarDays,
  User2,
  Loader2,
  CheckCircle2,
  Clock3,
  AlertCircle,
  SlidersHorizontal,
  X,
  MessageSquarePlus,
  Send,
  History,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "COMPLETED", label: "Completed" },
  { value: "UNABLE_TO_SUBMIT", label: "Unable to Submit" },
  { value: "REJECTED", label: "Rejected" },
];

const CoordinatorPriorityActions = () => {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");

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

  // Derived state: Extract information seamlessly without mirroring state variables
  const selectedEmployeeDetails = useMemo(() => {
    if (!formData.assignedToId) return null;
    return employees.find((emp) => emp.id === formData.assignedToId) || null;
  }, [formData.assignedToId, employees]);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/api/coordinator-assignments/users/list");
      setEmployees(res?.data?.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      setTableLoading(true);
      const res = await API.get("/api/coordinator-assignments/my-assignments");
      setAssignments(res?.data?.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAssignments();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (assignmentId) => {
    const res = await API.get(
      `/api/coordinator-assignments/${assignmentId}/follow-up-messages`,
    );

    const sorted = (res?.data?.data || []).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

  // Efficient Pipeline Matrix for Filters
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const taskName = item?.task?.projectName?.toLowerCase() || "";
      const matchesSearch = taskName.includes(search.toLowerCase());
      const matchesStatus = statusFilter ? item?.status === statusFilter : true;
      const matchesEmployee = employeeFilter
        ? item?.assignedTo?.id === employeeFilter
        : true;

      return matchesSearch && matchesStatus && matchesEmployee;
    });
  }, [assignments, search, statusFilter, employeeFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setEmployeeFilter("");
  };

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
          Create, track, and dispatch follow-ups across active team workflows.
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
            <input
              type="text"
              required
              value={formData.task}
              onChange={(e) => handleInputChange("task", e.target.value)}
              placeholder="Enter task title"
              className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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

      {/* Interactive table controller container */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Dynamic Filters Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                Filter Management Pipeline
              </h3>
              {(search || statusFilter || employeeFilter) && (
                <button
                  onClick={clearFilters}
                  className="ml-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium bg-slate-200/60 px-2.5 py-1 rounded-md">
              Found {filteredAssignments.length} matches
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by project name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="">All Operational Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-slate-400 sm:col-span-2 md:col-span-1"
            >
              <option value="">All Assigned Personnel</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
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
              ) : filteredAssignments.length > 0 ? (
                filteredAssignments.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-50/50 transition duration-150">
                      <td className="p-4 text-sm font-medium text-slate-900">
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

                      {/* Integrated Follow Up Action Controller */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenFollowUpPanel(item)}
                          className={`h-8 px-3 rounded-lg border text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm ${
                            activeTaskForFollowUp?.id === item.id
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
                      </td>
                    </tr>

                    {activeTaskForFollowUp?.id === item.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={11} className="p-4">
                          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="p-4 space-y-4">
                              <div className="grid gap-4 md:grid-cols-[1.4fr_180px_1.7fr] text-slate-500 text-xs uppercase tracking-wide">
                                <div className="font-semibold text-slate-900">
                                  Coordinator Follow Up
                                </div>
                                <div className="font-semibold text-slate-900">
                                  Date Sent
                                </div>
                                <div className="font-semibold text-slate-900">
                                  Employee Replies
                                </div>
                              </div>

                              {messagesLoading ? (
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                                  Loading follow-up history...
                                </div>
                              ) : messages.length === 0 ? (
                                <div className="rounded-3xl border border-slate-200 bg-amber-50 p-6 text-center text-amber-700">
                                  No follow-up activity yet. Send a quick
                                  request below.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {hasMoreMessages && (
                                    <div className="flex justify-center">
                                      <button
                                        onClick={() =>
                                          setVisibleMessagesCount(
                                            (prev) => prev + 15,
                                          )
                                        }
                                        className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100/70 transition"
                                      >
                                        <History
                                          size={11}
                                          className="inline-block"
                                        />
                                        <span className="ml-1">
                                          Load previous history (
                                          {messages.length -
                                            visibleMessagesCount}{" "}
                                          left)
                                        </span>
                                      </button>
                                    </div>
                                  )}

                                  <div className="space-y-4">
                                    {messagePairs.map((pair, idx) => (
                                      <div
                                        key={idx}
                                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                                      >
                                        <div className="grid gap-4 md:grid-cols-[1.4fr_180px_1.7fr] items-start">
                                          <div>
                                            <div className="text-sm text-slate-800">
                                              {pair.coordinator.message}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">
                                              From:{" "}
                                              <span className="font-semibold text-slate-600">
                                                {pair.coordinator.sender
                                                  ?.name || "System"}
                                              </span>
                                            </p>
                                          </div>
                                          <div className="text-sm text-slate-700">
                                            {new Date(
                                              pair.coordinator.createdAt,
                                            ).toLocaleString(undefined, {
                                              dateStyle: "short",
                                              timeStyle: "short",
                                            })}
                                          </div>
                                          <div className="space-y-3">
                                            {pair.employeeReplies.length > 0 ? (
                                              pair.employeeReplies.map(
                                                (reply) => (
                                                  <div
                                                    key={reply.id}
                                                    className="rounded-3xl border border-emerald-100 bg-white p-3"
                                                  >
                                                    <p className="text-sm text-slate-700">
                                                      {reply.message}
                                                    </p>
                                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                                      <span>
                                                        From:{" "}
                                                        <span className="font-semibold text-slate-600">
                                                          {reply.sender?.name ||
                                                            "System"}
                                                        </span>
                                                      </span>
                                                      <span className="text-emerald-600 font-medium">
                                                        {new Date(
                                                          reply.createdAt,
                                                        ).toLocaleTimeString(
                                                          undefined,
                                                          {
                                                            timeStyle: "short",
                                                          },
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                ),
                                              )
                                            ) : (
                                              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700 text-center">
                                                Awaiting response...
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <form
                                onSubmit={handleSendFollowUp}
                                className="grid gap-2 md:grid-cols-[1fr_auto]"
                              >
                                <input
                                  type="text"
                                  required
                                  disabled={sendingFollowUp || messagesLoading}
                                  value={followUpText}
                                  onChange={(e) =>
                                    setFollowUpText(e.target.value)
                                  }
                                  placeholder="Ask for operational status updates..."
                                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                                />
                                <button
                                  type="submit"
                                  disabled={
                                    sendingFollowUp ||
                                    !followUpText.trim() ||
                                    messagesLoading
                                  }
                                  className="h-10 rounded-lg bg-slate-900 text-white px-4 text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition"
                                >
                                  {sendingFollowUp ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Send size={16} />
                                  )}
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
                        <Search size={20} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        No priority actions match criteria
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Adjust search metrics or drop active status filters to
                        locate historical entries.
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
