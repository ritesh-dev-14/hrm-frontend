import { useEffect, useState } from "react";
import { BriefcaseBusiness, LoaderCircle, Megaphone, Pencil, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { notifyError, notifySuccess } from "../utils/toast";

const OBJECTIVES = ["LEAD", "AWARENESS"];
const FUND_SOURCES = ["CLIENT", "HARSH_SIR"];
const EMPTY_FORM = { clientName: "", monthlyBudget: "", objective: "", area: "", fundsAddedBy: "" };

const listFromResponse = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : data?.tasks || data?.items || [];
};

const taskFromResponse = (response) => response?.data?.data ?? response?.data;
const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

function TaskForm({ value, onChange, onSubmit, submitting, submitLabel, disabled = false }) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label><span className={labelClass}>Client Name</span><input required disabled={disabled || submitting} value={value.clientName} onChange={(e) => onChange("clientName", e.target.value)} className={inputClass} placeholder="Enter client name" /></label>
      <label><span className={labelClass}>Monthly Budget</span><input required disabled={disabled || submitting} type="number" min="0.01" step="0.01" value={value.monthlyBudget} onChange={(e) => onChange("monthlyBudget", e.target.value)} className={inputClass} placeholder="Enter positive budget" /></label>
      <label><span className={labelClass}>Objective</span><select required disabled={disabled || submitting} value={value.objective} onChange={(e) => onChange("objective", e.target.value)} className={inputClass}><option value="">Select objective</option>{OBJECTIVES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label><span className={labelClass}>Area</span><input required disabled={disabled || submitting} value={value.area} onChange={(e) => onChange("area", e.target.value)} className={inputClass} placeholder="Enter target area" /></label>
      <label className="sm:col-span-2"><span className={labelClass}>Funds Added By</span><select required disabled={disabled || submitting} value={value.fundsAddedBy} onChange={(e) => onChange("fundsAddedBy", e.target.value)} className={inputClass}><option value="">Select fund source</option>{FUND_SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <button disabled={disabled || submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">{submitting && <LoaderCircle size={16} className="animate-spin" />}{submitLabel}</button>
    </form>
  );
}

export default function MetaAdsTasksPage() {
  const { role } = useAuth();
  const isHr = String(role || "").toUpperCase() === "HR";
  const [tasks, setTasks] = useState([]);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedManager, setSelectedManager] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editingForm, setEditingForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setTasks(listFromResponse(await API.get("/api/meta-ads-tasks")));
    } catch (error) {
      notifyError(errorMessage(error, "Unable to load Meta Ads tasks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    API.get("/api/meta-ads-tasks")
      .then((response) => {
        if (active) setTasks(listFromResponse(response));
      })
      .catch((error) => {
        if (active) notifyError(errorMessage(error, "Unable to load Meta Ads tasks."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (isHr) {
      API.get("/api/hr/managers")
        .then((response) => {
          if (active) setManagers(listFromResponse(response));
        })
        .catch((error) => {
          if (active) notifyError(errorMessage(error, "Unable to load managers."));
        });
    }

    return () => {
      active = false;
    };
  }, [isHr]);

  const updateField = (setter) => (field, value) => setter((current) => ({ ...current, [field]: value }));

  const validate = (values) => {
    if (!values.clientName.trim() || !values.area.trim() || !values.monthlyBudget || !values.objective || !values.fundsAddedBy) return "All Meta Ads fields are required.";
    if (Number(values.monthlyBudget) <= 0) return "Monthly budget must be positive.";
    if (!OBJECTIVES.includes(values.objective)) return "Objective must be LEAD or AWARENESS.";
    if (!FUND_SOURCES.includes(values.fundsAddedBy)) return "Funds source must be CLIENT or HARSH_SIR.";
    return null;
  };

  const createTask = async (event) => {
    event.preventDefault();
    const validationError = validate(form);
    if (validationError) return notifyError(validationError);
    if (!selectedManager) return notifyError("Select a manager to assign this task.");
    try {
      setCreating(true);
      const created = taskFromResponse(await API.post("/api/meta-ads-tasks", { ...form, monthlyBudget: Number(form.monthlyBudget) }));
      await API.post(`/api/meta-ads-tasks/${created.id || created._id}/assign`, { assignedToId: selectedManager });
      notifySuccess("Meta Ads task created and assigned successfully.");
      setForm(EMPTY_FORM); setSelectedManager(""); setShowCreateForm(false); await loadTasks();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to create or assign Meta Ads task."));
    } finally { setCreating(false); }
  };

  const assignTask = async (taskId, assignedToId) => {
    if (!assignedToId) return;
    try {
      setAssigningId(taskId);
      await API.post(`/api/meta-ads-tasks/${taskId}/assign`, { assignedToId });
      notifySuccess("Meta Ads task assigned successfully."); await loadTasks();
    } catch (error) { notifyError(errorMessage(error, "Unable to assign Meta Ads task.")); }
    finally { setAssigningId(null); }
  };

  const beginEdit = async (task) => {
    try {
      const details = taskFromResponse(await API.get(`/api/meta-ads-tasks/${task.id || task._id}`));
      setEditingTask(details); setEditingForm({ clientName: details.clientName || "", monthlyBudget: details.monthlyBudget ?? "", objective: details.objective || "", area: details.area || "", fundsAddedBy: details.fundsAddedBy || "" });
    } catch (error) { notifyError(errorMessage(error, "Unable to load task details.")); }
  };

  const updateTask = async (event) => {
    event.preventDefault();
    const validationError = validate(editingForm);
    if (validationError) return notifyError(validationError);
    try {
      setUpdating(true);
      await API.patch(`/api/meta-ads-tasks/${editingTask.id || editingTask._id}`, { ...editingForm, monthlyBudget: Number(editingForm.monthlyBudget) });
      notifySuccess("Meta Ads task updated successfully."); setEditingTask(null); await loadTasks();
    } catch (error) { notifyError(errorMessage(error, "Unable to update Meta Ads task.")); }
    finally { setUpdating(false); }
  };

  return (
    <main className="meta-ads-tasks-page min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className={`mx-auto max-w-7xl space-y-6 ${isHr ? "meta-ads-hr" : "meta-ads-manager"}`}>
        <header className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4"><div className="rounded-2xl bg-emerald-500 p-3"><Megaphone size={24} /></div><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Marketing Operations</p><h1 className="mt-1 text-2xl font-black">Meta Ads Tasks</h1><p className="mt-1 text-sm text-slate-300">{isHr ? "Create campaigns and assign them to managers." : "Your Meta Ads assignments and campaign briefs."}</p></div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"><p className="text-2xl font-black">{tasks.length}</p><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isHr ? "Total Tasks" : "Assigned Tasks"}</p></div>
          {isHr && <button type="button" onClick={() => setShowCreateForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"><BriefcaseBusiness size={17} />Create Task</button>}
        </header>

        {isHr && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><BriefcaseBusiness size={19} /></div><div><h2 className="font-black text-slate-900">Create Meta Ads Task</h2><p className="text-xs font-medium text-slate-500">Complete the brief and choose the manager responsible for it.</p></div></div><div className="mb-4"><label className={labelClass}>Assign Manager</label><select required value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} disabled={creating} className={inputClass}><option value="">Select manager</option>{managers.map((manager) => <option key={manager.id || manager._id} value={manager.id || manager._id}>{manager.name || manager.fullName || manager.email}</option>)}</select></div><TaskForm value={form} onChange={updateField(setForm)} onSubmit={createTask} submitting={creating} submitLabel="Create and Assign Task" /></section>}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-black text-slate-900">{isHr ? "All Meta Ads Tasks" : "Assigned Meta Ads Tasks"}</h2><p className="text-xs font-medium text-slate-500">{isHr ? "Review assignments and reassign work when needed." : "Open a task to update its campaign details."}</p></div><UserRound className="text-emerald-600" size={21} /></div>{loading ? <div className="flex justify-center py-16 text-slate-500"><LoaderCircle className="animate-spin" /></div> : tasks.length === 0 ? <p className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">No Meta Ads tasks found.</p> : <div className="grid gap-4 lg:grid-cols-2">{tasks.map((task) => { const taskId = task.id || task._id; const assignedId = task.assignedToId || task.assignedTo?.id || task.assignedTo?._id || ""; return <article key={taskId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-emerald-300"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-slate-900">{task.clientName}</h3><p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{task.objective}</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{task.status || "ASSIGNED"}</span></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Budget</dt><dd className="mt-1 font-black text-slate-800">{task.monthlyBudget}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Area</dt><dd className="mt-1 font-bold text-slate-800">{task.area}</dd></div><div className="col-span-2"><dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Funds Added By</dt><dd className="mt-1 font-bold text-slate-800">{task.fundsAddedBy}</dd></div></dl>{isHr ? <div className="mt-5 border-t border-slate-200 pt-4"><label className={labelClass}>Assigned Manager</label><select value={assignedId} onChange={(e) => assignTask(taskId, e.target.value)} disabled={assigningId === taskId} className={inputClass}><option value="">Unassigned</option>{managers.map((manager) => <option key={manager.id || manager._id} value={manager.id || manager._id}>{manager.name || manager.fullName || manager.email}</option>)}</select>{assigningId === taskId && <p className="mt-2 text-xs font-semibold text-emerald-700">Saving assignment...</p>}</div> : <button type="button" onClick={() => beginEdit(task)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"><Pencil size={15} />Update Task</button>}</article>; })}</div>}</section>
        {isHr && tasks.length > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-black text-slate-900">Update Meta Ads Tasks</h2><div className="grid gap-2 sm:grid-cols-2">{tasks.map((task) => <button key={task.id || task._id} type="button" onClick={() => beginEdit(task)} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50">{task.clientName}<Pencil size={15} className="text-emerald-600" /></button>)}</div></section>}
      </div>
      {showCreateForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between"><div><p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">New Campaign Brief</p><h2 className="mt-1 text-xl font-black text-slate-900">Create Meta Ads Task</h2><p className="mt-1 text-sm text-slate-500">Add the campaign details and assign the responsible manager.</p></div><button type="button" onClick={() => setShowCreateForm(false)} disabled={creating} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Close</button></div><div className="mb-5 rounded-2xl bg-slate-50 p-4"><label className={labelClass}>Assign Manager</label><select required value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} disabled={creating} className={inputClass}><option value="">Select manager</option>{managers.map((manager) => <option key={manager.id || manager._id} value={manager.id || manager._id}>{manager.name || manager.fullName || manager.email}</option>)}</select></div><TaskForm value={form} onChange={updateField(setForm)} onSubmit={createTask} submitting={creating} submitLabel="Save and Assign Task" /></div></div>}
      {editingTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-black">Update Meta Ads Task</h2><p className="text-xs text-slate-500">Keep the backend enum values unchanged.</p></div><button type="button" onClick={() => setEditingTask(null)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Close</button></div><TaskForm value={editingForm} onChange={updateField(setEditingForm)} onSubmit={updateTask} submitting={updating} submitLabel="Save Changes" /></div></div>}
    </main>
  );
}