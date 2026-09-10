import { useEffect, useState } from "react";
import { BarChart2, CheckCircle2, ClipboardList, Eye, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getManagerAssignedTasks,
  getManagerAssignment,
  getManagerPendingCategories,
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
const assignedBy = (task) => task.assignedBy?.name || task.createdBy?.name || task.task?.createdBy?.name || "EA";
const finalStatuses = new Set(["SUBMITTED", "VERIFIED"]);
const today = new Date().toISOString().slice(0, 10);

const pendingCategories = [
  { id: "ea", label: "Pending Tasks by EA", icon: ClipboardList, color: "indigo" },
  { id: "metaAds", label: "Pending Meta Ads", icon: BarChart2, color: "orange" },
  { id: "seo", label: "Pending SEO", icon: BarChart2, color: "emerald" },
  { id: "socialMedia", label: "Pending Social Media", icon: BarChart2, color: "pink" },
  { id: "webDevelopment", label: "Pending Web Development", icon: BarChart2, color: "sky" },
];

const itemDate = (item) => item.workDate || item.date || item.reportDate || item.dueDate;
const isToday = (item) => {
  const date = itemDate(item);
  return !date || new Date(date).toISOString().slice(0, 10) === today;
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

  const loadData = async () => {
  if (role !== "MANAGER" || !user?.id) return;
  setLoading(true);
  setError("");
  try {
    const [assignedTasks, logoutStatus] = await Promise.all([
    getManagerAssignedTasks(user.id),
    refreshManagerLogoutStatus(),
    ]);
    setTasks(assignedTasks.filter((task) => !finalStatuses.has(String(task.status || "").toUpperCase()) && isToday(task)));
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

  if (loading) return <div className="flex h-full flex-1 items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  const categories = getManagerPendingCategories({ ...status, pendingEaTasks: tasks });
  const categoryItems = pendingCategories.reduce((result, category) => {
    result[category.id] = categories[category.id].filter((item) => !finalStatuses.has(itemStatus(item)) && isToday(item));
    return result;
  }, {});
  const activeItems = categoryItems[activeCategory] || [];
  const activeCategoryConfig = pendingCategories.find((category) => category.id === activeCategory);
  const ActiveIcon = activeCategoryConfig.icon;
  const totalPending = Object.values(categoryItems).reduce((total, items) => total + items.length, 0);

  return (
  <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
    <div className="mb-8"><h1 className="text-2xl font-bold text-slate-900">Pending Obligations</h1><p className="mt-1 text-sm text-slate-500">Complete your assigned tasks and reports to unlock logout.</p></div>
    {error && <p className={`mb-6 rounded-xl border p-4 text-sm font-semibold ${error.startsWith("Task submitted") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{error}</p>}

    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {pendingCategories.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveCategory(id)} className={`flex min-h-24 flex-col items-start justify-between rounded-2xl border p-4 text-left transition ${activeCategory === id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300"}`}><span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Icon size={16} className="text-indigo-600" />{label}</span><span className="text-2xl font-bold text-slate-900">{categoryItems[id].length}</span></button>)}
    </div>

    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="mb-6 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50"><ActiveIcon size={20} className="text-indigo-600" /></div><div><h2 className="text-lg font-bold text-slate-900">{activeCategoryConfig.label}</h2><p className="text-xs text-slate-500">Today&apos;s actionable work</p></div></div>
      {activeItems.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No pending work in this category.</p> : <div className="space-y-3">{activeItems.map((item, index) => { const id = item.assignmentId || item.id || item.projectId || index; const isEaTask = activeCategory === "ea"; const isMetaAds = activeCategory === "metaAds"; return <div key={id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><div className="min-w-0"><p className="font-semibold text-slate-900">{isEaTask ? taskName(item) : itemTitle(item)}</p><p className="mt-1 text-sm text-slate-600">{isEaTask ? `Assigned by: ${assignedBy(item)}` : `Client: ${item.clientName || "—"}`}</p><p className="mt-1 text-xs text-slate-500">Status: {itemStatus(item)} · Work date: {itemDate(item) ? new Date(itemDate(item)).toLocaleDateString() : "—"}</p></div><div className="flex flex-wrap items-center justify-end gap-2">{isEaTask ? <><button type="button" onClick={() => handleView(id)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><Eye size={14} />View Task</button><button type="button" disabled={submittingId === id} onClick={() => handleSubmit(id)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{submittingId === id ? "Submitting..." : "Submit to EA"}</button></> : item.projectId && <><button type="button" onClick={() => navigate(`/project/${item.projectId}`)} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-600"><Eye size={14} />View Project</button>{isMetaAds && <button type="button" onClick={() => { setReasonTarget(item); setUnableReason(""); }} className="rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50">Unable to submit</button>}</>}</div></div>; })}</div>}
    </div>

    {!totalPending && <div className="mt-6 flex flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mb-3 text-emerald-600" size={32} /><h2 className="font-bold text-slate-900">All obligations completed. You can logout.</h2></div>}
    {reasonTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><form onSubmit={handleUnableReasonSubmit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Unable to submit today&apos;s report?</h2><p className="mt-1 text-sm text-slate-500">Send your reason to HR for approval.</p></div><button type="button" onClick={() => setReasonTarget(null)} className="text-slate-500 hover:text-slate-900" aria-label="Close reason form"><X /></button></div><p className="mt-5 rounded-xl bg-orange-50 p-3 text-sm font-semibold text-orange-800">{itemTitle(reasonTarget)}</p><textarea autoFocus required rows={5} value={unableReason} onChange={(event) => setUnableReason(event.target.value)} placeholder="Why can&apos;t you submit today&apos;s report?" className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setReasonTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button><button type="submit" disabled={submittingReason} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{submittingReason ? "Sending..." : "Send to HR"}</button></div></form></div>}
    {selectedTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{taskName(selectedTask)}</h2><button type="button" onClick={() => setSelectedTask(null)}><X /></button></div><div className="mt-5 space-y-3 text-sm text-slate-600"><p><strong>Project:</strong> {selectedTask.task?.projectName || selectedTask.projectName || "—"}</p><p><strong>Description:</strong> {selectedTask.task?.description || "—"}</p><p><strong>Instructions:</strong> {selectedTask.task?.instructions || "—"}</p><p><strong>Assigned by:</strong> {selectedTask.createdBy?.name || selectedTask.assignedBy || "EA"}</p><p><strong>Status:</strong> {selectedTask.status || "—"}</p><p><strong>Completion date:</strong> {selectedTask.completionDate ? new Date(selectedTask.completionDate).toLocaleString() : "—"}</p></div></div></div>}
  </div>
  );
}
