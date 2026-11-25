import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, Check, RefreshCw, Search, X } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const getDateKeyInIST = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${values.year}-${values.month}-${values.day}`;
};

const formatDate = (value) => {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

export default function EAOverdueTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const { user, role } = useAuth();

  const fetchTasks = useCallback(async () => {
    try {
      const response = await API.get("/api/ea-overdue-tasks");
      setTasks(response.data?.data?.tasks || []);
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(message ? `Failed to load Coordinator tasks: ${message}` : "Failed to load Coordinator tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => fetchTasks(), 0);
    return () => window.clearTimeout(request);
  }, [fetchTasks]);

  const todayInIST = getDateKeyInIST(new Date());
  const canReview = String(role || "").toUpperCase() === "COORDINATOR";
  const reviewTask = async (assignment, status) => {
    let reason;
    if (status === "REJECTED") {
      const enteredReason = window.prompt("Enter a reason for rejecting this submission:");
      if (enteredReason === null) return;
      reason = enteredReason.trim();
      if (!reason) {
        toast.error("A reason is required to reject a submission.");
        return;
      }
    }

    try {
      setReviewingId(assignment.id);
      const response = await API.patch(
        `/api/coordinator-assignments/${assignment.id}/review`,
        { status, reason },
      );
      if (status === "COMPLETED") {
        setTasks((current) => current.filter((task) => task.id !== assignment.id));
        toast.success("Task approved.");
      } else {
        const updatedStatus = response.data?.data?.status || status;
        setTasks((current) => current.map((task) => (
          task.id === assignment.id
            ? { ...task, status: updatedStatus, rejectionReason: reason }
            : task
        )));
        toast.success("Submission rejected and returned for updates.");
      }
    } catch (requestError) {
      console.error("Failed to review Coordinator task:", requestError);
      toast.error(requestError.response?.data?.message || "Failed to review task.");
    } finally {
      setReviewingId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((assignment) => {
      const isOverdue = getDateKeyInIST(assignment.completionDate) <= todayInIST;
      const matchesRole = roleFilter === "ALL" || assignment.assignedTo?.role === roleFilter;
      const matchesUrgency = urgencyFilter === "ALL"
        || (urgencyFilter === "OVERDUE" ? isOverdue : !isOverdue);
      const searchText = [
        assignment.task?.projectName,
        assignment.task?.description,
        assignment.assignedTo?.name,
        assignment.assignedTo?.employeeId,
        assignment.assignedTo?.email,
        assignment.createdBy?.name,
      ].join(" ").toLowerCase();
      return matchesRole && matchesUrgency && (!query || searchText.includes(query));
    });
  }, [tasks, search, roleFilter, urgencyFilter, todayInIST]);

  return (
    <div className="min-h-full bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Coordinator Pending &amp; Overdue Tasks</h1>
            <p className="mt-1 text-sm text-slate-500">
              Incomplete tasks created by Coordinators. Overdue tasks are highlighted in red.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchTasks();
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, assignee, employee ID, or Coordinator..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="ALL">All assignee roles</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="MANAGER">Managers</option>
            <option value="HR">HR</option>
          </select>
          <select
            value={urgencyFilter}
            onChange={(event) => setUrgencyFilter(event.target.value)}
            aria-label="Filter by task due status"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="ALL">Pending &amp; overdue</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-800">Outstanding assignments</h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
              {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading Coordinator tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarClock className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
              <p className="font-semibold text-slate-700">No matching pending or overdue Coordinator tasks found.</p>
              <p className="mt-1 text-sm text-slate-500">Incomplete Coordinator tasks appear here until approved or completed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-bold">Task</th>
                    <th className="px-5 py-3 font-bold">Assigned To</th>
                    <th className="px-5 py-3 font-bold">Created By</th>
                    <th className="px-5 py-3 font-bold">Due Date</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Due state</th>
                    <th className="px-5 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((assignment) => {
                    const isOverdue = getDateKeyInIST(assignment.completionDate) <= todayInIST;
                    const canReviewAssignment = canReview
                      && assignment.createdBy?.id === user?.id
                      && assignment.status === "SUBMITTED";
                    return (
                      <tr
                        key={assignment.id}
                        className={`align-top ${isOverdue ? "bg-rose-50/70 hover:bg-rose-100/80" : "hover:bg-slate-50/70"}`}
                      >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{assignment.task?.projectName || "Untitled task"}</p>
                        {assignment.task?.description && (
                          <p className="mt-1 max-w-md text-xs text-slate-500">{assignment.task.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">{assignment.assignedTo?.name || "Unknown"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {assignment.assignedTo?.role || "—"}
                          {assignment.assignedTo?.employeeId ? ` · ${assignment.assignedTo.employeeId}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <p>{assignment.createdBy?.name || assignment.assignedBy || "Unknown"}</p>
                        <p className="mt-1 text-xs text-slate-500">{assignment.createdBy?.role || "—"}</p>
                      </td>
                      <td className={`whitespace-nowrap px-5 py-4 font-semibold ${isOverdue ? "text-rose-700" : "text-slate-600"}`}>
                        {formatDate(assignment.completionDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          {assignment.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isOverdue ? "bg-rose-100 text-rose-700" : "bg-sky-50 text-sky-700"}`}>
                          {isOverdue ? "OVERDUE" : "PENDING"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canReviewAssignment ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => reviewTask(assignment, "COMPLETED")}
                              disabled={reviewingId !== null}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => reviewTask(assignment, "REJECTED")}
                              disabled={reviewingId !== null}
                              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : assignment.status === "SUBMITTED" ? (
                          <span className="text-xs text-slate-400">Creator review required</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
