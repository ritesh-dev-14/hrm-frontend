import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, RefreshCw, Search } from "lucide-react";
import API from "../services/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/api/ea-overdue-tasks");
      setTasks(response.data?.data?.tasks || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load overdue EA tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((assignment) => {
      const matchesRole = roleFilter === "ALL" || assignment.assignedTo?.role === roleFilter;
      const searchText = [
        assignment.task?.projectName,
        assignment.task?.description,
        assignment.assignedTo?.name,
        assignment.assignedTo?.employeeId,
        assignment.createdBy?.name,
      ].join(" ").toLowerCase();
      return matchesRole && (!query || searchText.includes(query));
    });
  }, [tasks, search, roleFilter]);

  return (
    <div className="min-h-full bg-slate-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Overdue EA Tasks</h1>
            <p className="mt-1 text-sm text-slate-500">
              Incomplete tasks assigned by an EA and due today or earlier.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task, assignee, employee ID, or EA..."
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
            <div className="p-10 text-center text-sm text-slate-500">Loading overdue tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarClock className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
              <p className="font-semibold text-slate-700">No overdue EA tasks found.</p>
              <p className="mt-1 text-sm text-slate-500">Tasks due today or earlier will appear here while incomplete.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-bold">Task</th>
                    <th className="px-5 py-3 font-bold">Assigned To</th>
                    <th className="px-5 py-3 font-bold">Assigned By</th>
                    <th className="px-5 py-3 font-bold">Due Date</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((assignment) => (
                    <tr key={assignment.id} className="align-top hover:bg-slate-50/70">
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
                        {assignment.createdBy?.name || assignment.assignedBy || "EA"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-red-600">
                        {formatDate(assignment.completionDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          {assignment.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
