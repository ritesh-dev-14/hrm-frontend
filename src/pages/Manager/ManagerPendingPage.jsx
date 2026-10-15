import { useEffect, useState, useMemo, useCallback } from "react";
import { BarChart2, CheckCircle2, ClipboardList, Eye, X, FolderOpen, Filter, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfessionalLoader from "../../components/ProfessionalLoader";
import API from "../../services/api";
import HrUploads from "../HR/HrUploads";
import {
  getManagerAssignment,
  getManagerPendingCategories,
  getLocalDateString,
  refreshManagerLogoutStatus,
  submitMarketingUnableReason,
  submitManagerTask,
} from "../../utils/managerLogoutStatus";

const errorMessage = (error, fallback) => {
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "This task could not be found.";
  return error?.response?.data?.message || fallback;
};

const taskName = (task) => task.projectName || task.task?.projectName || task.task?.name || task.task?.title || "Untitled Task";
const assignedBy = (task) => task.assignedBy?.name || (typeof task.assignedBy === "string" ? task.assignedBy : null) || task.createdBy?.name || task.task?.createdBy?.name || "EA";
const finalStatuses = new Set(["SUBMITTED", "VERIFIED", "COMPLETED"]);
const finalEaTaskStatuses = new Set(["VERIFIED", "COMPLETED"]);
const today = getLocalDateString();

const pendingCategories = [
  { id: "ea", label: "Pending Tasks by EA/Coordinator", icon: ClipboardList, color: "indigo" },
  { id: "metaAds", label: "Pending Meta Ads", icon: BarChart2, color: "orange" },
  { id: "seo", label: "Pending SEO", icon: BarChart2, color: "emerald" },
  { id: "socialMedia", label: "Pending Social Media", icon: BarChart2, color: "pink" },
  { id: "webDevelopment", label: "Pending Web Development", icon: BarChart2, color: "sky" },
  { id: "uploads", label: "Pending Uploads", icon: FolderOpen, color: "purple" },
];

const itemDate = (item) => item.completionDate || item.workDate || item.date || item.reportDate || item.dueDate;

const matchesDateFilter = (item, pendingFilter, dateFilter) => {
  if (!pendingFilter && !dateFilter) return true;

  const rawDate = itemDate(item);
  if (!rawDate) return pendingFilter === "today" || !pendingFilter;

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const startOfLast3Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 0, 0, 0, 0);

  const dayOfWeek = now.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (pendingFilter === "today") {
    return d >= startOfToday && d <= endOfToday;
  }
  if (pendingFilter === "last3days") {
    return d >= startOfLast3Days && d <= endOfToday;
  }
  if (pendingFilter === "this_week") {
    return d >= startOfWeek && d <= endOfWeek;
  }
  if (pendingFilter === "this_month") {
    return d >= startOfMonth && d <= endOfMonth;
  }

  if (dateFilter) {
    const [fYear, fMonth, fDay] = dateFilter.split("-").map(Number);
    return (
      d.getFullYear() === fYear &&
      d.getMonth() === fMonth - 1 &&
      d.getDate() === fDay
    );
  }

  return true;
};

const itemTitle = (item) => item.projectName || item.clientName || item.task?.projectName || item.task?.name || "Pending work";
const itemStatus = (item) => String(item.status || item.submissionStatus || "PENDING").toUpperCase();

export default function ManagerPendingPage() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState({ pendingMarketingReports: [] });
  const [activeCategory, setActiveCategory] = useState("ea");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reasonTarget, setReasonTarget] = useState(null);
  const [unableReason, setUnableReason] = useState("");
  const [submittingReason, setSubmittingReason] = useState(false);

  // Quick Preset and Custom Date Filter states
  const [pendingFilter, setPendingFilter] = useState("today");
  const [dateFilter, setDateFilter] = useState("");

  const loadData = useCallback(async () => {
    if (role !== "MANAGER" || !user?.id) return;
    setLoading(true);
    setError("");
    try {
      const [logoutStatus, assignedRes] = await Promise.all([
        refreshManagerLogoutStatus(),
        API.get(`/api/coordinator-assignments/assigned-to/${user.id}`, {
          params: { take: 1000, limit: 1000, pageSize: 1000, all: true },
        }).catch(() => null),
      ]);

      const rawAssigned = assignedRes?.data?.data?.data || assignedRes?.data?.data || assignedRes?.data || [];
      const assignedList = Array.isArray(rawAssigned) ? rawAssigned : [];
      const logoutEaTasks = logoutStatus?.pendingEaTasks || [];

      // Combine both sources, keying by ID so no duplicates
      const eaTasksMap = new Map();

      assignedList.forEach((a) => {
        const id = a.id || a.assignmentId;
        if (id) {
          eaTasksMap.set(String(id), {
            ...a,
            assignmentId: id,
            taskId: a.taskId || a.task?.id,
            projectName: a.task?.projectName || a.task?.name || a.projectName || "Untitled Task",
            workDate: a.completionDate || a.workDate || a.endDate,
            completionDate: a.completionDate || a.workDate,
            assignedBy: a.assignedBy,
            status: a.status,
          });
        }
      });

      logoutEaTasks.forEach((a) => {
        const id = a.assignmentId || a.id;
        if (id && !eaTasksMap.has(String(id))) {
          eaTasksMap.set(String(id), a);
        }
      });

      const allEaTasks = Array.from(eaTasksMap.values()).filter(
        (task) => !finalEaTaskStatuses.has(String(task.status || "").toUpperCase())
      );

      setTasks(allEaTasks);
      setStatus(logoutStatus || { pendingMarketingReports: [], pendingSeo: [], pendingUploadsCount: 0 });
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load pending obligations right now."));
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleView = async (assignmentId) => {
    try {
      setError("");
      setSelectedTask(await getManagerAssignment(assignmentId));
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load task details."));
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (submittingId) return;
    setSubmittingId(assignmentId);
    setError("");
    try {
      await submitManagerTask(assignmentId);
      setTasks((current) => current.map((task) => (task.assignmentId || task.id) === assignmentId ? { ...task, status: "SUBMITTED" } : task));
      await refreshManagerLogoutStatus();
      window.dispatchEvent(new CustomEvent("manager-task-submitted", { detail: { assignmentId } }));
      setError("Task submitted to EA successfully.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to submit this task right now."));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUnableReasonSubmit = async (event) => {
    event.preventDefault();
    const reason = unableReason.trim();
    if (!reasonTarget?.projectId || !reason) {
      setError("Please enter the reason you cannot submit this report.");
      return;
    }
    setSubmittingReason(true);
    setError("");
    try {
      await submitMarketingUnableReason({
        projectId: reasonTarget.projectId,
        clientName: reasonTarget.clientName,
        reason,
        date: today,
      });
      const refreshedStatus = await refreshManagerLogoutStatus();
      setStatus(refreshedStatus || status);
      setReasonTarget(null);
      setUnableReason("");
      setError("Your reason was sent to HR for approval.");
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to send the reason to HR right now."));
    } finally {
      setSubmittingReason(false);
    }
  };

  const categories = useMemo(() => {
    return getManagerPendingCategories({ ...status, pendingEaTasks: tasks });
  }, [status, tasks]);

  const pendingStats = useMemo(() => {
    const allPendingItems = [];
    pendingCategories.forEach((category) => {
      if (category.id === "uploads") return;
      const completedStatuses = category.id === "ea" ? finalEaTaskStatuses : finalStatuses;
      const items = (categories[category.id] || []).filter(
        (item) => !completedStatuses.has(itemStatus(item))
      );
      allPendingItems.push(...items);
    });

    let todayCount = 0;
    let last3DaysCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    allPendingItems.forEach((item) => {
      if (matchesDateFilter(item, "today", "")) todayCount++;
      if (matchesDateFilter(item, "last3days", "")) last3DaysCount++;
      if (matchesDateFilter(item, "this_week", "")) thisWeekCount++;
      if (matchesDateFilter(item, "this_month", "")) thisMonthCount++;
    });

    return {
      today: todayCount,
      last3days: last3DaysCount,
      this_week: thisWeekCount,
      this_month: thisMonthCount,
    };
  }, [categories]);

  const categoryItems = useMemo(() => {
    return pendingCategories.reduce((result, category) => {
      if (category.id === "uploads") {
        result[category.id] = new Array(status.pendingUploadsCount || 0).fill({});
      } else {
        const completedStatuses = category.id === "ea" ? finalEaTaskStatuses : finalStatuses;
        result[category.id] = (categories[category.id] || []).filter(
          (item) => !completedStatuses.has(itemStatus(item)) && matchesDateFilter(item, pendingFilter, dateFilter)
        );
      }
      return result;
    }, {});
  }, [categories, status.pendingUploadsCount, pendingFilter, dateFilter]);

  const activeItems = categoryItems[activeCategory] || [];
  const activeCategoryConfig = pendingCategories.find((category) => category.id === activeCategory);
  const ActiveIcon = activeCategoryConfig.icon;
  const totalPending = Object.values(categoryItems).reduce((total, items) => total + items.length, 0);

  if (loading) return <ProfessionalLoader text="Loading pending obligations..." />;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Obligations</h1>
          <p className="mt-1 text-sm text-slate-500">Complete your assigned tasks and reports to unlock logout.</p>
        </div>

        {/* TOP FILTER CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Pending Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 h-10 shadow-sm">
            <Clock3 size={14} className="text-slate-400 shrink-0" />
            <select
              value={pendingFilter}
              onChange={(e) => {
                const val = e.target.value;
                setPendingFilter(val);
                if (val) setDateFilter("");
              }}
              aria-label="Pending quick filters"
              className="text-xs font-medium text-slate-700 outline-none bg-transparent cursor-pointer pr-1"
            >
              <option value="">All Dates</option>
              <option value="today">Pending Today ({pendingStats.today})</option>
              <option value="last3days">Pending Last 3 Days ({pendingStats.last3days})</option>
              <option value="this_week">Pending This Week ({pendingStats.this_week})</option>
              <option value="this_month">Pending This Month ({pendingStats.this_month})</option>
            </select>
            {pendingFilter && (
              <button
                type="button"
                onClick={() => setPendingFilter("")}
                className="text-slate-400 hover:text-rose-500 transition ml-0.5"
                title="Clear quick filter"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Single Date Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 h-10 shadow-sm">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) setPendingFilter("");
              }}
              title="Filter by Specific Date"
              className="text-xs text-slate-700 outline-none bg-transparent w-[110px] cursor-pointer"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="ml-1 text-slate-400 hover:text-rose-500 transition"
                title="Clear date filter"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className={`mb-6 rounded-xl border p-4 text-sm font-semibold ${error.startsWith("Task submitted") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </p>
      )}

      {/* CATEGORY CARDS */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {pendingCategories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveCategory(id)}
            className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left transition ${
              activeCategory === id
                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Icon size={16} className="text-indigo-600" />
              {label}
            </span>
            <span className="text-2xl font-bold text-slate-900">{categoryItems[id].length}</span>
          </button>
        ))}
      </div>

      {/* QUICK PRESET FILTERS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPendingFilter("");
              setDateFilter("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              !pendingFilter && !dateFilter
                ? "bg-slate-900 text-white shadow-sm font-semibold"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            All Dates
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingFilter((prev) => (prev === "today" ? "" : "today"));
              setDateFilter("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
              pendingFilter === "today"
                ? "bg-amber-600 text-white shadow-sm font-semibold ring-2 ring-amber-600/20"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                pendingFilter === "today" ? "bg-white" : "bg-amber-500"
              }`}
            />
            <span>Pending Today</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                pendingFilter === "today"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {pendingStats.today}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingFilter((prev) => (prev === "last3days" ? "" : "last3days"));
              setDateFilter("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
              pendingFilter === "last3days"
                ? "bg-indigo-600 text-white shadow-sm font-semibold ring-2 ring-indigo-600/20"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                pendingFilter === "last3days" ? "bg-white" : "bg-indigo-500"
              }`}
            />
            <span>Pending Last 3 Days</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                pendingFilter === "last3days"
                  ? "bg-indigo-700 text-white"
                  : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {pendingStats.last3days}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingFilter((prev) => (prev === "this_week" ? "" : "this_week"));
              setDateFilter("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
              pendingFilter === "this_week"
                ? "bg-blue-600 text-white shadow-sm font-semibold ring-2 ring-blue-600/20"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                pendingFilter === "this_week" ? "bg-white" : "bg-blue-500"
              }`}
            />
            <span>Pending This Week</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                pendingFilter === "this_week"
                  ? "bg-blue-700 text-white"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {pendingStats.this_week}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingFilter((prev) => (prev === "this_month" ? "" : "this_month"));
              setDateFilter("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
              pendingFilter === "this_month"
                ? "bg-purple-600 text-white shadow-sm font-semibold ring-2 ring-purple-600/20"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                pendingFilter === "this_month" ? "bg-white" : "bg-purple-500"
              }`}
            />
            <span>Pending This Month</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                pendingFilter === "this_month"
                  ? "bg-purple-700 text-white"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {pendingStats.this_month}
            </span>
          </button>
        </div>

        {/* ACTIVE FILTER STATUS / RESET */}
        {(pendingFilter || dateFilter) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Filtered by:{" "}
              <strong className="text-slate-800">
                {pendingFilter === "today" && "Pending Today"}
                {pendingFilter === "last3days" && "Pending Last 3 Days"}
                {pendingFilter === "this_week" && "Pending This Week"}
                {pendingFilter === "this_month" && "Pending This Month"}
                {dateFilter && `Date: ${dateFilter}`}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setPendingFilter("");
                setDateFilter("");
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition"
            >
              <X size={12} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE CATEGORY DETAILS CARD */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        {activeCategory === "uploads" ? (
          <HrUploads embedded={true} />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <ActiveIcon size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeCategoryConfig.label}</h2>
                <p className="text-xs text-slate-500">
                  {pendingFilter === "today"
                    ? "Today's actionable work"
                    : pendingFilter === "last3days"
                    ? "Actionable work from the last 3 days"
                    : pendingFilter === "this_week"
                    ? "This week's actionable work"
                    : pendingFilter === "this_month"
                    ? "This month's actionable work"
                    : dateFilter
                    ? `Actionable work for ${dateFilter}`
                    : "All pending actionable work"}
                </p>
              </div>
            </div>

            {activeItems.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-500">No pending work in this category for the selected filter.</p>
                {(pendingFilter || dateFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingFilter("");
                      setDateFilter("");
                    }}
                    className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    View all dates
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activeItems.map((item, index) => {
                  const id = item.assignmentId || item.id || item.projectId || index;
                  const isEaTask = activeCategory === "ea";
                  const isMetaAds = activeCategory === "metaAds";
                  const submitted = itemStatus(item) === "SUBMITTED";
                  return (
                    <div
                      key={id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{isEaTask ? taskName(item) : itemTitle(item)}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {isEaTask ? `Assigned by: ${assignedBy(item)}` : `Client: ${item.clientName || "—"}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Status: {itemStatus(item)} · Work date: {itemDate(item) ? new Date(itemDate(item)).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isEaTask ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleView(id)}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                            >
                              <Eye size={14} />
                              View Task
                            </button>
                            {submitted ? (
                              <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                                Awaiting EA approval
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={submittingId === id}
                                onClick={() => handleSubmit(id)}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                              >
                                {submittingId === id ? "Submitting..." : "Submit to EA"}
                              </button>
                            )}
                          </>
                        ) : (
                          item.projectId && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/project/${item.projectId}`)}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-600"
                              >
                                <Eye size={14} />
                                View Project
                              </button>
                              {isMetaAds && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReasonTarget(item);
                                    setUnableReason("");
                                  }}
                                  className="rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50"
                                >
                                  Unable to submit
                                </button>
                              )}
                            </>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {!totalPending && (
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mb-3 text-emerald-600" size={32} />
          <h2 className="font-bold text-slate-900">All obligations completed. You can logout.</h2>
        </div>
      )}

      {reasonTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={handleUnableReasonSubmit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Unable to submit today&apos;s report?</h2>
                <p className="mt-1 text-sm text-slate-500">Send your reason to HR for approval.</p>
              </div>
              <button
                type="button"
                onClick={() => setReasonTarget(null)}
                className="text-slate-500 hover:text-slate-900"
                aria-label="Close reason form"
              >
                <X />
              </button>
            </div>
            <p className="mt-5 rounded-xl bg-orange-50 p-3 text-sm font-semibold text-orange-800">{itemTitle(reasonTarget)}</p>
            <textarea
              autoFocus
              required
              rows={5}
              value={unableReason}
              onChange={(event) => setUnableReason(event.target.value)}
              placeholder="Why can't you submit today's report?"
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReasonTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReason}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {submittingReason ? "Sending..." : "Send to HR"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{taskName(selectedTask)}</h2>
              <button type="button" onClick={() => setSelectedTask(null)}>
                <X />
              </button>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p><strong>Project:</strong> {selectedTask.task?.projectName || selectedTask.projectName || "—"}</p>
              <p><strong>Description:</strong> {selectedTask.task?.description || "—"}</p>
              <p><strong>Instructions:</strong> {selectedTask.task?.instructions || "—"}</p>
              <p><strong>Assigned by:</strong> {selectedTask.createdBy?.name || selectedTask.assignedBy || "EA"}</p>
              <p><strong>Status:</strong> {selectedTask.status || "—"}</p>
              <p><strong>Completion date:</strong> {selectedTask.completionDate ? new Date(selectedTask.completionDate).toLocaleString() : "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
