import { useEffect, useState } from "react";
import { AlertTriangle, BarChart2, CheckCircle2, ClipboardList, Eye, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getManagerAssignedTasks,
  getManagerAssignment,
  refreshManagerLogoutStatus,
  submitManagerTask,
} from "../../utils/managerLogoutStatus";

const pendingStatus = new Set(["ASSIGNED", "IN_PROGRESS", "COMPLETED", "REJECTED", "UNABLE_TO_SUBMIT"]);

const errorMessage = (error, fallback) => {
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "This task could not be found.";
  return error?.response?.data?.message || fallback;
};

const taskName = (task) => task.projectName || task.task?.projectName || task.task?.name || task.task?.title || "Untitled Task";
const assignedBy = (task) => task.assignedBy?.name || task.createdBy?.name || task.task?.createdBy?.name || "EA";

export default function ManagerPendingPage() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState({ pendingMarketingReports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadData = async () => {
  if (role !== "MANAGER" || !user?.id) return;
  setLoading(true);
  setError("");
  try {
    const [assignedTasks, logoutStatus] = await Promise.all([
    getManagerAssignedTasks(user.id),
    refreshManagerLogoutStatus(),
    ]);
    setTasks(assignedTasks.filter((task) => pendingStatus.has(task.status) || !["SUBMITTED", "VERIFIED"].includes(task.status)));
    setStatus(logoutStatus || { pendingMarketingReports: [] });
  } catch (requestError) {
    setError(errorMessage(requestError, "Unable to load pending obligations right now."));
  } finally {
    setLoading(false);
  }
  };

  useEffect(() => { loadData(); }, [role, user?.id]);

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

  if (loading) return <div className="flex h-full flex-1 items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  const reports = status.pendingMarketingReports || [];
  const visibleTasks = tasks.filter((task) => !["SUBMITTED", "VERIFIED"].includes(task.status));

  return (
  <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8">
    <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900">Pending Obligations</h1><p className="mt-1 text-sm text-slate-500">Complete your assigned tasks and reports to unlock logout.</p></div>
    {error && <p className={`mb-6 rounded-xl border p-4 text-sm font-semibold ${error.startsWith("Task submitted") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{error}</p>}

    <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
    <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50"><ClipboardList size={20} className="text-indigo-600" /></div><h2 className="text-lg font-bold text-slate-900">Pending Tasks Assigned by EA</h2></div>
    {visibleTasks.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No pending EA tasks.</p> : <div className="space-y-3">{visibleTasks.map((task, index) => { const id = task.assignmentId || task.id; return <div key={id || index} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><div className="min-w-0"><p className="font-semibold text-slate-900">{taskName(task)}</p><p className="mt-1 text-sm text-slate-600">Assigned by: {assignedBy(task)}</p><p className="mt-1 text-xs text-slate-500">Status: {task.status || "ASSIGNED"} · Work date: {task.workDate ? new Date(task.workDate).toLocaleDateString() : "—"}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => handleView(id)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><Eye size={14} />View Task</button><button type="button" disabled={submittingId === id} onClick={() => handleSubmit(id)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{submittingId === id ? "Submitting..." : "Submit to EA"}</button></div></div>; })}</div>}
    </div>

    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8"><div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50"><BarChart2 size={20} className="text-orange-600" /></div><h2 className="text-lg font-bold text-slate-900">Missing Marketing Reports</h2></div>{reports.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">All marketing reports are submitted.</p> : <div className="space-y-3">{reports.map((report, index) => <div key={report.projectId || index} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4"><div><p className="font-semibold text-slate-900">{report.projectName || "Unnamed Project"}</p><p className="mt-1 text-sm text-slate-600">Client: {report.clientName || "—"}</p></div>{report.projectId && <button type="button" onClick={() => navigate(`/project/${report.projectId}`)} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"><Eye size={14} />View Project</button>}</div>)}</div>}</div>

    {!visibleTasks.length && !reports.length && <div className="mt-6 flex flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mb-3 text-emerald-600" size={32} /><h2 className="font-bold text-slate-900">All obligations completed. You can logout.</h2></div>}
    {selectedTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{taskName(selectedTask)}</h2><button type="button" onClick={() => setSelectedTask(null)}><X /></button></div><div className="mt-5 space-y-3 text-sm text-slate-600"><p><strong>Project:</strong> {selectedTask.task?.projectName || selectedTask.projectName || "—"}</p><p><strong>Description:</strong> {selectedTask.task?.description || "—"}</p><p><strong>Instructions:</strong> {selectedTask.task?.instructions || "—"}</p><p><strong>Assigned by:</strong> {selectedTask.createdBy?.name || selectedTask.assignedBy || "EA"}</p><p><strong>Status:</strong> {selectedTask.status || "—"}</p><p><strong>Completion date:</strong> {selectedTask.completionDate ? new Date(selectedTask.completionDate).toLocaleString() : "—"}</p></div></div></div>}
  </div>
  );
}
