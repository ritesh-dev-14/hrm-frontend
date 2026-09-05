import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { refreshEmployeeLogoutStatus } from "../../utils/employeeLogoutStatus";

// Matches the response shapes from both endpoints:
// Manager:  { data: { data: [...] } }  OR  { data: [...] }
// EA:       { data: { data: { data: [...] } } }  OR  { data: { data: [...] } }  OR  { data: [...] }
const parseList = (res) => {
  const raw = res?.data;
  if (Array.isArray(raw)) return raw;
  const d1 = raw?.data;
  if (Array.isArray(d1)) return d1;
  const d2 = d1?.data;
  if (Array.isArray(d2)) return d2;
  return [];
};

const getStatus = (task) => String(task?.status || "ASSIGNED").toUpperCase();
const isComplete = (task) =>
  task.source === "MANAGER"
    ? getStatus(task) === "VERIFIED"
    : ["SUBMITTED", "COMPLETED"].includes(getStatus(task));
const formatDate = (value) => value ? new Date(value).toLocaleString() : "-";

export default function EmployeePendingPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [logoutStatus, setLogoutStatus] = useState({ canLogout: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const userId = JSON.parse(localStorage.getItem("user") || "null")?.id;

      const promises = [
        API.get("/api/manager/tasks/my-tasks"),
        refreshEmployeeLogoutStatus(),
      ];
      if (userId) {
        promises.push(
          API.get(`/api/coordinator-assignments/assigned-to/${userId}`)
        );
      }

      const [managerRes, status, eaRes] = await Promise.all(promises);

      const managerTasks = parseList(managerRes).map(t => ({
        assignmentId: t.assignmentId ?? t.id,
        source: "MANAGER",
        status: String(t.status || "ASSIGNED").toUpperCase(),
        title: t.task?.title || t.task?.projectName || t.title || "Untitled task",
        description: t.task?.description || t.description || "",
        dueDate: t.task?.endDate || t.completionDate || t.dueDate,
        assignedByName: t.task?.createdBy?.name || t.assignedBy?.name || "-",
        progress: t.progress ?? 0,
        submitted: t.submitted ?? false,
      }));

      const eaTasks = eaRes ? parseList(eaRes).map(t => ({
        assignmentId: t.id,
        source: "EA",
        status: String(t.status || "ASSIGNED").toUpperCase(),
        title: t.task?.projectName || t.task?.name || t.taskName || t.title || "Untitled task",
        description: t.task?.description || t.description || "",
        dueDate: t.endDate || t.completionDate || t.dueDate,
        assignedByName: t.assignedBy?.name || "-",
        progress: t.progress ?? 0,
        submitted: t.submitted ?? false,
      })) : [];

      // DEBUG: log raw responses to browser console so we can verify shape
      console.log("[PendingPage] managerRes:", managerRes?.data);
      console.log("[PendingPage] eaRes:", eaRes?.data);
      console.log("[PendingPage] managerTasks parsed:", managerTasks);
      console.log("[PendingPage] eaTasks parsed:", eaTasks);

      const combined = [...managerTasks, ...eaTasks]
        .sort((a, b) => (isComplete(a) ? 1 : 0) - (isComplete(b) ? 1 : 0));

      setTasks(combined);
      setLogoutStatus(status);
      if (status.error) setError(status.errorMessage || "Unable to verify logout status.");
    } catch (requestError) {
      setTasks([]);
      setLogoutStatus({ canLogout: false, error: true });
      setError(requestError?.response?.data?.message || "Unable to load assigned tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateTaskStatus = async (task, nextStatus) => {
    if (!task.assignmentId) return;
    setUpdatingId(task.assignmentId);
    setError("");
    try {
      const endpoint = task.source === "EA"
        ? `/api/coordinator-assignments/${task.assignmentId}/status`
        : `/api/manager/tasks/assignment/${task.assignmentId}/status`;
      await API.patch(endpoint, { status: nextStatus });
      await loadData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update task.");
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingTasks = tasks.filter((task) => !isComplete(task));
  // Only allow logout when the backend confirms AND our merged task list has no pending items
  const canLogout = logoutStatus.canLogout === true && pendingTasks.length === 0 && tasks.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Employee Tasks</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Pending Tasks</h1>
          <p className="mt-2 text-sm text-slate-500">Manager and EA assignments for today.</p>
        </div>
        <button type="button" onClick={loadData} disabled={loading} aria-label="Refresh" className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm hover:bg-slate-100 disabled:opacity-50">
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          <p>{error}</p>
          <button type="button" onClick={loadData} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white">Retry</button>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : pendingTasks.length === 0 && canLogout ? (
        <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
          <CheckCircle2 className="mb-3 text-emerald-600" size={34} />
          <h2 className="font-bold text-slate-900">All today&apos;s tasks are complete</h2>
          <p className="mt-1 text-sm text-emerald-700">You can now log out.</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
          <CheckCircle2 className="mb-3 text-slate-400" size={34} />
          <h2 className="font-bold text-slate-700">No tasks assigned yet</h2>
          <p className="mt-1 text-sm text-slate-500">You have no pending manager or EA tasks for today.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const done = isComplete(task);
            const isEa = task.source === "EA";
            return (
              <article
                key={`${task.source}-${task.assignmentId}`}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-opacity ${done ? "border-emerald-100 opacity-70" : "border-amber-200"}`}
              >
                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                        isEa ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {isEa ? "EA Task" : "Manager Task"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">
                        {task.status}
                      </span>
                      {done && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">Done</span>
                      )}
                    </div>
                    <h2 className="font-bold text-slate-900">{task.title}</h2>
                    {task.description && (
                      <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Progress: <strong>{task.progress}%</strong></p>
                    <p className="mt-1">Due: {formatDate(task.dueDate)}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:grid-cols-2">
                  <p>Source: <strong>{isEa ? "EA (Coordinator)" : "Manager"}</strong></p>
                  <p>Assigned by: <strong>{task.assignedByName}</strong></p>
                  <p>Submitted: <strong>{task.submitted ? "Yes" : "No"}</strong></p>
                  <p>Status: <strong>{task.status}</strong></p>
                </div>

                {/* Actions */}
                {!done && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingId === task.assignmentId}
                      onClick={() => updateTaskStatus(task, "IN_PROGRESS")}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Start task
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === task.assignmentId}
                      onClick={() => updateTaskStatus(task, "SUBMITTED")}
                      className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-50"
                    >
                      Submit task
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === task.assignmentId}
                      onClick={() => updateTaskStatus(task, "UNABLE_TO_SUBMIT")}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
                    >
                      Unable to submit
                    </button>
                    {updatingId === task.assignmentId && (
                      <Loader2 size={16} className="animate-spin self-center text-indigo-500" />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/projects")}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
      >
        Open Tasks
      </button>
    </div>
  );
}
