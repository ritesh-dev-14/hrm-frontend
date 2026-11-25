import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import API from "../../services/api";

const OBJECTIVES = ["LEAD", "AWARENESS", "BOTH"];
const FUND_SOURCES = ["CLIENT", "HARSH"];
const EMPTY_FORM = { clientName: "", phone: "", monthlyBudget: "", objective: "", area: "", fundsAddedBy: "", isRunning: false, assignedToIds: [], startDate: "", endDate: "", clientPriority: "" };
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
      const assignmentManagerIds = (projectToEdit.assignments || [])
        .map((assignment) => assignment.manager?.employeeId || assignment.manager?.id || assignment.manager?._id || assignment.managerId)
        .filter(Boolean);
      const assignedManagerFallback = projectToEdit.assignedTo?.employeeId || projectToEdit.assignedTo?.id || projectToEdit.assignedTo?._id || projectToEdit.assignedToId;
      const assignedManagerIds = assignmentManagerIds.length
        ? assignmentManagerIds
        : assignedManagerFallback
          ? [assignedManagerFallback]
          : [];

      setForm({
        clientName: projectToEdit.clientName || projectToEdit.projectName || "",
        phone: projectToEdit.phone || "",
        monthlyBudget: projectToEdit.monthlyBudget || "",
        objective: projectToEdit.objective || "",
        area: projectToEdit.area || "",
        fundsAddedBy: projectToEdit.fundsAddedBy || "",
        isRunning: projectToEdit.isRunning === true || projectToEdit.isRunning === "true",
        assignedToIds: assignedManagerIds.map(String),
        startDate,
        endDate,
        clientPriority: projectToEdit.clientPriority || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    
    setError("");
    setSuccess(false);
    setLoadingOptions(true);
    Promise.all([API.get("/api/hr/managers"), API.get("/api/departments")])
      .then(([managerResponse, departmentResponse]) => {
        const managerList = getItems(managerResponse);
        setManagers(managerList);
        if (projectToEdit) {
          setForm((current) => ({
            ...current,
            assignedToIds: current.assignedToIds.map((selectedId) => {
              const manager = managerList.find((item) =>
                [item.employeeId, item.id, item._id].some(
                  (managerId) => managerId && String(managerId) === selectedId,
                ),
              );
              return String(manager?.employeeId || selectedId);
            }),
          }));
        }
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
    if (!form.clientName.trim() || !form.monthlyBudget || !form.objective || !form.area.trim() || !form.fundsAddedBy || form.assignedToIds.length === 0 || !form.startDate || !form.endDate || !departmentId) {
      setError("Client name, budget, objective, area, dates, funds source, and at least one manager are required.");
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
        phone: form.phone.trim() || (projectToEdit ? null : undefined),
        monthlyBudget: Number(form.monthlyBudget),
        objective: form.objective,
        area: form.area.trim(),
        fundsAddedBy: form.fundsAddedBy,
        isRunning: form.isRunning,
        departmentId,
        startDate: `${form.startDate}T00:00:00.000Z`,
        endDate: `${form.endDate}T00:00:00.000Z`,
        clientPriority: form.clientPriority || null,
      };
      
      let response;
      if (projectToEdit) {
        const existingAssignmentIds = (projectToEdit.assignments || [])
          .map((assignment) => {
            const manager = managers.find((item) =>
              [item.id, item._id, item.employeeId].some(
                (managerId) =>
                  managerId &&
                  String(managerId) ===
                    String(
                      assignment.manager?.employeeId ||
                        assignment.manager?.id ||
                        assignment.manager?._id ||
                        assignment.managerId,
                    ),
              ),
            );
            return String(
              manager?.employeeId ||
                assignment.manager?.employeeId ||
                assignment.manager?.id ||
                assignment.manager?._id ||
                assignment.managerId ||
                "",
            );
          })
          .filter(Boolean);
        const assignedManagerFallback =
          projectToEdit.assignedTo?.employeeId ||
          projectToEdit.assignedTo?.id ||
          projectToEdit.assignedTo?._id ||
          projectToEdit.assignedToId;
        const originalAssignmentIds = existingAssignmentIds.length
          ? existingAssignmentIds
          : assignedManagerFallback
            ? [String(assignedManagerFallback)]
            : [];
        const assignmentsChanged =
          originalAssignmentIds.length !== form.assignedToIds.length ||
          originalAssignmentIds.some(
            (managerId) => !form.assignedToIds.includes(managerId),
          );
        if (assignmentsChanged) {
          payload.assignTo = form.assignedToIds;
        }
        response = await API.patch(`/api/projects/${projectToEdit.id || projectToEdit._id}`, payload);
      } else {
        payload.assignTo = form.assignedToIds;
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
        <div><p className="text-[11px] font-black uppercase tracking-widest text-pink-600">Meta Ads Project</p><h2 className="mt-1 text-xl font-black text-slate-900">{projectToEdit ? 'Update' : 'Create'} Meta Ads Project</h2><p className="mt-1 text-sm text-slate-500">{projectToEdit ? 'Update the campaign details.' : 'Create the campaign and assign it directly to one or more managers.'}</p></div>
        <button type="button" onClick={onClose} disabled={loading} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
      </div>
      {success ? <div className="flex flex-col items-center px-6 py-16 text-center"><CheckCircle2 size={42} className="text-emerald-500" /><h3 className="mt-4 font-black">Project {projectToEdit ? 'Updated' : 'Created'}</h3></div> : <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
        <label><span className={labelClass}>Client Name</span><input required value={form.clientName} onChange={(event) => updateField("clientName", event.target.value)} className={inputClass} placeholder="Enter client name" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Client Number (Optional)</span><input type="tel" autoComplete="tel" maxLength={50} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClass} placeholder="Enter client mobile number" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Monthly Budget</span><input required type="number" min="0.01" step="0.01" value={form.monthlyBudget} onChange={(event) => updateField("monthlyBudget", event.target.value)} className={inputClass} placeholder="Enter monthly budget" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Objective</span><select required value={form.objective} onChange={(event) => updateField("objective", event.target.value)} className={inputClass} disabled={loading || loadingOptions}><option value="">Select objective</option>{OBJECTIVES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className={labelClass}>Area</span><input required value={form.area} onChange={(event) => updateField("area", event.target.value)} className={inputClass} placeholder="Enter target area" disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Start Date</span><input required type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} className={inputClass} disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>End Date</span><input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} className={inputClass} disabled={loading || loadingOptions} /></label>
        <label><span className={labelClass}>Funds Added By</span><select required value={form.fundsAddedBy} onChange={(event) => updateField("fundsAddedBy", event.target.value)} className={inputClass} disabled={loading || loadingOptions}><option value="">Select fund source</option>{FUND_SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className={labelClass}>Running</span><select value={form.isRunning ? "YES" : "NO"} onChange={(event) => updateField("isRunning", event.target.value === "YES")} className={inputClass} disabled={loading || loadingOptions}><option value="YES">Yes</option><option value="NO">No</option></select></label>
        <div>
          <span className={labelClass}>Assign Managers (select all that apply)</span>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2.5">
            {managers.map((manager) => {
              const managerId = String(manager.employeeId || manager.id || manager._id);
              const isSelected = form.assignedToIds.includes(managerId);
              return (
                <label key={managerId} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) => {
                      const nextAssignedManagerIds = event.target.checked
                        ? [...form.assignedToIds, managerId]
                        : form.assignedToIds.filter((id) => id !== managerId);
                      updateField("assignedToIds", nextAssignedManagerIds);
                    }}
                    className="accent-pink-600"
                    disabled={loading || loadingOptions}
                  />
                  <span>{manager.name || manager.fullName || manager.email || manager.employeeId}</span>
                </label>
              );
            })}
            {!loadingOptions && managers.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-slate-500">No managers available.</p>
            )}
          </div>
        </div>
        {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}

        {/* CLIENT PRIORITY */}
        <label>
          <span className={labelClass}>Priority</span>
          <select value={form.clientPriority} onChange={(event) => updateField("clientPriority", event.target.value)} className={inputClass} disabled={loading || loadingOptions}>
            <option value="">— Not Set —</option>
            <option value="P1">P1 — Critical</option>
            <option value="P2">P2 — High</option>
            <option value="P3">P3 — Medium</option>
            <option value="P4">P4 — Low</option>
          </select>
        </label>

        <button type="submit" disabled={loading || loadingOptions} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white hover:bg-pink-700 disabled:opacity-60 sm:col-span-2">{loading && <Loader2 size={16} className="animate-spin" />}{projectToEdit ? 'Update' : 'Create and Assign'} Project</button>
      </form>}
    </div>
  </div>;
}
