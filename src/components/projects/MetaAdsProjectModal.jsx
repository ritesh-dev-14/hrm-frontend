import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import API from "../../services/api";

const OBJECTIVES = ["LEAD", "AWARENESS", "BOTH"];
const FUND_SOURCES = ["CLIENT", "HARSH"];
const EMPTY_FORM = { clientName: "", monthlyBudget: "", objective: "", area: "", fundsAddedBy: "", isRunning: false, assignedToId: "", startDate: "", endDate: "" };
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

const getItems = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : data?.items || data?.managers || [];
};

export default function MetaAdsProjectModal({ open, onClose, onProjectCreated, projectToEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [managers, setManagers] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    if (projectToEdit) {
      const startDate = projectToEdit.startDate ? new Date(projectToEdit.startDate).toISOString().split('T')[0] : "";
      const endDate = projectToEdit.endDate ? new Date(projectToEdit.endDate).toISOString().split('T')[0] : "";
      const assignedToId = projectToEdit.assignments?.[0]?.managerId || projectToEdit.assignments?.[0]?.manager?._id || projectToEdit.assignments?.[0]?.manager?.id || projectToEdit.assignedToId || projectToEdit.assignedTo?._id || projectToEdit.assignedTo?.id || "";

      setForm({
        clientName: projectToEdit.clientName || projectToEdit.projectName || "",
        monthlyBudget: projectToEdit.monthlyBudget || "",
        objective: projectToEdit.objective || "",
        area: projectToEdit.area || "",
        fundsAddedBy: projectToEdit.fundsAddedBy || "",
        isRunning: projectToEdit.isRunning === true || projectToEdit.isRunning === "true",
        assignedToId,
        startDate,
        endDate
      });
    } else {
      setForm(EMPTY_FORM);
    }
    
    setError("");
    setSuccess(false);
    setLoadingOptions(true);
    Promise.all([API.get("/api/hr/managers"), API.get("/api/departments")])
      .then(([managerResponse, departmentResponse]) => {
        setManagers(getItems(managerResponse));
        const departments = getItems(departmentResponse);
        const marketing = departments.find((department) => /marketing|meta/i.test(department.name || ""));
        setDepartmentId(marketing?.id || marketing?._id || "");
      })
      .catch(() => setError("Failed to load managers or departments."))
      .finally(() => setLoadingOptions(false));
  }, [open, projectToEdit]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.clientName.trim() || !form.monthlyBudget || !form.objective || !form.area.trim() || !form.fundsAddedBy || !form.assignedToId || !form.startDate || !form.endDate || !departmentId) {
      setError("Client name, budget, objective, area, dates, funds source, and manager are required.");
      return;
    }
    if (Number(form.monthlyBudget) <= 0) {
      setError("Monthly budget must be positive.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      
      const payload = {
        projectName: form.clientName.trim(),
        clientName: form.clientName.trim(),
        monthlyBudget: Number(form.monthlyBudget),
        objective: form.objective,
        area: form.area.trim(),
        fundsAddedBy: form.fundsAddedBy,
        isRunning: form.isRunning,
        departmentId,
        startDate: `${form.startDate}T00:00:00.000Z`,
        endDate: `${form.endDate}T00:00:00.000Z`,
      };
      
      let response;
      if (projectToEdit) {
        // When updating, we might just be updating fields and the backend throws if assignTo is provided but already assigned or invalid.
        // If the assigned manager actually changed, we'd need a specific endpoint or to pass assignTo, 
        // but to avoid the "One or more assigned managers were not found" error, we omit it for now during updates.
        // If they want to change assignments, it might need to be handled separately or fixed on the backend.
        if (form.assignedToId !== (projectToEdit.assignments?.[0]?.managerId || projectToEdit.assignments?.[0]?.manager?._id || projectToEdit.assignments?.[0]?.manager?.id || projectToEdit.assignedToId || projectToEdit.assignedTo?._id || projectToEdit.assignedTo?.id)) {
            payload.assignTo = [form.assignedToId];
        }
        response = await API.patch(`/api/projects/${projectToEdit.id || projectToEdit._id}`, payload);
      } else {
        payload.assignTo = [form.assignedToId];
        response = await API.post("/api/projects", payload);
      }
      
      setSuccess(true);
      onProjectCreated(response?.data?.data || response?.data);
      setTimeout(onClose, 900);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || `Failed to ${projectToEdit ? 'update' : 'create'} Meta Ads project.`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div><p className="text-[11px] font-black uppercase tracking-widest text-pink-600">Meta Ads Project</p><h2 className="mt-1 text-xl font-black text-slate-900">{projectToEdit ? 'Update' : 'Create'} Meta Ads Project</h2><p className="mt-1 text-sm text-slate-500">{projectToEdit ? 'Update the campaign details.' : 'Create the campaign and assign it directly to a manager.'}</p></div>
        <button type="button" onClick={onClose} disabled={loading} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
      </div>
      {success ? <div className="flex flex-col items-center px-6 py-16 text-center"><CheckCircle2 size={42} className="text-emerald-500" /><h3 className="mt-4 font-black">Project {projectToEdit ? 'Updated' : 'Created'}</h3></div> : <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
        <label><span className={labelClass}>Client Name</span><input required value={form.clientName} onChange={(event) => updateField("clientName", event.target.value)} className={inputClass} placeholder="Enter client name" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Monthly Budget</span><input required type="number" min="0.01" step="0.01" value={form.monthlyBudget} onChange={(event) => updateField("monthlyBudget", event.target.value)} className={inputClass} placeholder="Enter monthly budget" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Objective</span><select required value={form.objective} onChange={(event) => updateField("objective", event.target.value)} className={inputClass} disabled={loading || loadingOptions}><option value="">Select objective</option>{OBJECTIVES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className={labelClass}>Area</span><input required value={form.area} onChange={(event) => updateField("area", event.target.value)} className={inputClass} placeholder="Enter target area" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Start Date</span><input required type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} className={inputClass} disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>End Date</span><input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} className={inputClass} disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Funds Added By</span><select required value={form.fundsAddedBy} onChange={(event) => updateField("fundsAddedBy", event.target.value)} className={inputClass} disabled={loading || loadingOptions}><option value="">Select fund source</option>{FUND_SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className={labelClass}>Running</span><select value={form.isRunning ? "YES" : "NO"} onChange={(event) => updateField("isRunning", event.target.value === "YES")} className={inputClass} disabled={loading || loadingOptions}><option value="YES">Yes</option><option value="NO">No</option></select></label>
        <label><span className={labelClass}>Assign Manager</span><select required value={form.assignedToId} onChange={(event) => updateField("assignedToId", event.target.value)} className={inputClass} disabled={loading || loadingOptions}><option value="">Select manager</option>{managers.map((manager) => { const managerId = manager.id || manager._id || manager.employeeId; return <option key={managerId} value={managerId}>{manager.name || manager.fullName || manager.email || manager.employeeId}</option>; })}</select></label>
        {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={loading || loadingOptions} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white hover:bg-pink-700 disabled:opacity-60 sm:col-span-2">{loading && <Loader2 size={16} className="animate-spin" />}{projectToEdit ? 'Update' : 'Create and Assign'} Project</button>
      </form>}
    </div>
  </div>;
}
