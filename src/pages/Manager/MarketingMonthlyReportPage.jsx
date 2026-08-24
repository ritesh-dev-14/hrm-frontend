import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, LoaderCircle, Plus, Trash2, TrendingUp, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { notifyError, notifySuccess } from "../../utils/toast";

const currentDate = new Date();
const INITIAL_ROW = {
  projectId: "",
  clientName: "",
  currentlyRunning: "",
  awarenessEnabled: "",
  awarenessArea: "",
  awarenessFunds: "",
  leadAdsEnabled: "",
  leadsFund: "",
  leadArea: "",
  requiredLeads: "",
  adsStartingDate: "",
  monthlyBudget: "",
};

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data || payload?.projects || payload?.rows || [];
};

const projectName = (project) => project?.projectName || project?.name || project?.title || "Unnamed project";
const clientName = (project) => project?.clientName || project?.client?.name || project?.client?.clientName || "";

const toFormRow = (row = {}, projects) => {
  const project = projects.find((item) => String(item.id || item._id) === String(row.projectId)) || null;
  return {
    projectId: row.projectId || "",
    clientName: row.clientName || clientName(project),
    currentlyRunning: row.currentlyRunning === true ? "yes" : row.currentlyRunning === false ? "no" : row.currentlyRunning || "",
    awarenessEnabled: typeof row.awarenessEnabled === "boolean" ? String(row.awarenessEnabled) : "",
    awarenessArea: row.awarenessArea || "",
    awarenessFunds: row.awarenessFunds ?? "",
    leadAdsEnabled: typeof row.leadAdsEnabled === "boolean" ? String(row.leadAdsEnabled) : "",
    leadsFund: row.leadsFund ?? "",
    leadArea: row.leadArea || "",
    requiredLeads: row.requiredLeads ?? "",
    adsStartingDate: row.adsStartingDate ? String(row.adsStartingDate).split("T")[0] : "",
    monthlyBudget: row.monthlyBudget ?? "",
  };
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

export default function MarketingMonthlyReportPage() {
  const { role } = useAuth();
  const normalizedRole = String(role || "").trim().toUpperCase();
  const canEdit = ["ADMIN", "HR", "EA"].includes(normalizedRole);
  const [projects, setProjects] = useState([]);
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [rows, setRows] = useState([{ ...INITIAL_ROW }]);
  const [remarks, setRemarks] = useState([]);
  const [remark, setRemark] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [remarkSaving, setRemarkSaving] = useState(false);
  const [runningFilter, setRunningFilter] = useState("");

  useEffect(() => {
    let active = true;
    API.get("/api/marketing-monthly-reports/projects")
      .then((response) => {
        if (active) setProjects(asList(response.data));
      })
      .catch((error) => notifyError(errorMessage(error, "Unable to load Marketing projects.")))
      .finally(() => active && setProjectsLoading(false));
    return () => { active = false; };
  }, []);

  const loadReport = async () => {
    if (month < 1 || month > 12 || !/^\d{4}$/.test(String(year))) return;
    setReportLoading(true);
    try {
      const response = await API.get(`/api/marketing-monthly-reports?month=${month}&year=${year}`);
      const data = response.data && Object.prototype.hasOwnProperty.call(response.data, "data")
        ? response.data.data
        : response.data;
      setReport(data || null);
      setRows(data?.rows?.length ? data.rows.map((row) => toFormRow(row, projects)) : [{ ...INITIAL_ROW }]);
      setRemarks(data?.remarks || []);
    } catch (error) {
      notifyError(errorMessage(error, "Unable to load the monthly calendar."));
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (!projectsLoading) loadReport();
    // The selected period, not project changes, controls report loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, projectsLoading]);

  const projectById = useMemo(() => new Map(projects.map((item) => [String(item.id || item._id), item])), [projects]);
  const visibleRows = rows.filter((row) => !runningFilter || row.currentlyRunning === runningFilter);
  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      if (field !== "projectId") return { ...row, [field]: value };
      const project = projectById.get(String(value));
      return { ...row, projectId: value, clientName: clientName(project) };
    }));
  };

  const validate = () => {
    if (month < 1 || month > 12) return "Month must be between 1 and 12.";
    if (!/^\d{4}$/.test(String(year))) return "Year must be a four-digit year.";
    if (!rows.length) return "Add at least one campaign row.";
    if (rows.some((row) => !row.projectId)) return "Select a project in every campaign row.";
    const projectIds = rows.map((row) => row.projectId).filter(Boolean);
    if (new Set(projectIds).size !== projectIds.length) {
      return "The same project cannot be added more than once to this calendar.";
    }
    if (rows.some((row) => !["yes", "no"].includes(row.currentlyRunning))) {
      return "Choose Yes or No for Currently Running in every row.";
    }
    if (rows.some((row) => !["true", "false"].includes(row.awarenessEnabled) || !["true", "false"].includes(row.leadAdsEnabled))) {
      return "Choose Yes or No for both ad types in every row.";
    }
    const numericFields = ["awarenessFunds", "leadsFund", "requiredLeads", "monthlyBudget"];
    if (rows.some((row) => numericFields.some((field) => row[field] !== "" && (!Number.isFinite(Number(row[field])) || Number(row[field]) < 0)))) {
      return "Funds, leads, and budget values cannot be negative or invalid.";
    }
    return null;
  };

  const apiRow = (row) => ({
    projectId: row.projectId,
    awarenessEnabled: row.awarenessEnabled === "true",
    currentlyRunning: row.currentlyRunning,
    awarenessArea: row.awarenessArea.trim(),
    awarenessFunds: row.awarenessFunds === "" ? null : Number(row.awarenessFunds),
    leadAdsEnabled: row.leadAdsEnabled === "true",
    leadsFund: row.leadsFund === "" ? null : Number(row.leadsFund),
    leadArea: row.leadArea.trim(),
    requiredLeads: row.requiredLeads === "" ? null : Number(row.requiredLeads),
    adsStartingDate: row.adsStartingDate || null,
    monthlyBudget: row.monthlyBudget === "" ? null : Number(row.monthlyBudget),
  });

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) return notifyError(validationError);
    setSaving(true);
    try {
      const payload = { month: Number(month), year: Number(year), rows: rows.map(apiRow) };
      if (report?.id || report?._id) {
        await API.patch(`/api/marketing-monthly-reports/${report.id || report._id}`, { rows: payload.rows });
        notifySuccess("Monthly calendar updated successfully.");
      } else {
        await API.post("/api/marketing-monthly-reports", payload);
        notifySuccess("Monthly calendar created successfully.");
      }
      await loadReport();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to save the monthly calendar."));
    } finally {
      setSaving(false);
    }
  };

  const addRemark = async (event) => {
    event.preventDefault();
    if (!report?.id && !report?._id) return notifyError("Save the report before adding a remark.");
    if (!remark.trim()) return notifyError("Enter a remark first.");
    setRemarkSaving(true);
    try {
      await API.post(`/api/marketing-monthly-reports/${report.id || report._id}/remarks`, { remark: remark.trim() });
      setRemark("");
      notifySuccess("Remark added successfully.");
      await loadReport();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to add the remark."));
    } finally {
      setRemarkSaving(false);
    }
  };

  const deleteRemark = async (remarkId) => {
    try {
      await API.delete(`/api/marketing-monthly-reports/remarks/${remarkId}`);
      notifySuccess("Remark deleted successfully.");
      await loadReport();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to delete the remark."));
    }
  };

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100";
  const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-500 p-3"><TrendingUp size={22} /></div><div><h1 className="text-2xl font-bold">Marketing Monthly Calendar</h1><p className="text-sm text-slate-300">Company-level campaign planning and remarks</p></div></div>
          <div className="flex gap-3"><label className="text-sm text-slate-300">Month<select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="mt-1 block rounded-lg border-0 bg-white px-3 py-2 text-slate-800">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2000, index).toLocaleString("en", { month: "long" })}</option>)}</select></label><label className="text-sm text-slate-300">Year<input value={year} onChange={(event) => setYear(event.target.value)} inputMode="numeric" maxLength={4} className="mt-1 block w-24 rounded-lg border-0 bg-white px-3 py-2 text-slate-800" /></label></div>
        </header>

        {reportLoading || projectsLoading ? <div className="flex items-center justify-center py-20 text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={22} />Loading report...</div> : <>
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">Campaign rows</h2><p className="text-sm text-slate-500">{report ? "Existing calendar loaded" : "No calendar exists for this period"}</p>{!canEdit && <p className="mt-1 text-xs font-medium text-amber-700">You are viewing this calendar as {normalizedRole || "a viewer"}. Only Admin, HR, and EA users can create or update it.</p>}</div><div className="flex flex-wrap items-center gap-2">{[ ["", "All", "border-slate-300 text-slate-600"], ["yes", "Running", "border-emerald-300 text-emerald-700"], ["no", "Not Running", "border-red-300 text-red-700"] ].map(([value, label, color]) => <button key={label} type="button" onClick={() => setRunningFilter(value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${color} ${runningFilter === value ? "bg-slate-100 ring-2 ring-slate-200" : "bg-white"}`}>{label}</button>)}{canEdit && <button type="button" onClick={() => setRows((current) => [...current, { ...INITIAL_ROW }])} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Plus size={16} />Add Campaign Row</button>}</div></div>
            <div className="overflow-x-auto"><div className="min-w-[1250px] p-4">{visibleRows.map((row) => { const index = rows.indexOf(row); return <div key={index} className={`mb-4 rounded-xl border p-4 last:mb-0 ${row.currentlyRunning === "yes" ? "border-emerald-300 bg-emerald-50" : row.currentlyRunning === "no" ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}><div className="mb-4 flex items-center justify-between"><h3 className={`font-semibold ${row.currentlyRunning === "yes" ? "text-emerald-800" : row.currentlyRunning === "no" ? "text-red-800" : "text-slate-700"}`}>Campaign {index + 1}</h3>{canEdit && rows.length > 1 && <button type="button" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"><Trash2 size={15} />Remove Row</button>}</div><div className="grid grid-cols-6 gap-3"><label><span className={labelClass}>Project / Client</span><select disabled={!canEdit || projectsLoading} value={row.projectId} onChange={(event) => updateRow(index, "projectId", event.target.value)} className={inputClass}><option value="">Select project</option>{projects.map((project) => <option disabled={rows.some((candidate, candidateIndex) => candidateIndex !== index && candidate.projectId === String(project.id || project._id))} key={project.id || project._id} value={project.id || project._id}>{projectName(project)}</option>)}</select></label><label><span className={labelClass}>Currently Running</span><select disabled={!canEdit} value={row.currentlyRunning} onChange={(event) => updateRow(index, "currentlyRunning", event.target.value)} className={`${inputClass} ${row.currentlyRunning === "yes" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : row.currentlyRunning === "no" ? "border-red-500 bg-red-50 text-red-700" : ""}`}><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select></label><label><span className={labelClass}>Awareness Ads</span><select disabled={!canEdit} value={row.awarenessEnabled} onChange={(event) => updateRow(index, "awarenessEnabled", event.target.value)} className={inputClass}><option value="">Choose</option><option value="true">Yes</option><option value="false">No</option></select></label><label><span className={labelClass}>Awareness Area</span><input disabled={!canEdit} value={row.awarenessArea} onChange={(event) => updateRow(index, "awarenessArea", event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Awareness Funds</span><input disabled={!canEdit} type="number" min="0" value={row.awarenessFunds} onChange={(event) => updateRow(index, "awarenessFunds", event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Lead Ads</span><select disabled={!canEdit} value={row.leadAdsEnabled} onChange={(event) => updateRow(index, "leadAdsEnabled", event.target.value)} className={inputClass}><option value="">Choose</option><option value="true">Yes</option><option value="false">No</option></select></label><label><span className={labelClass}>Leads Fund</span><input disabled={!canEdit} type="number" min="0" value={row.leadsFund} onChange={(event) => updateRow(index, "leadsFund", event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Lead Area</span><input disabled={!canEdit} value={row.leadArea} onChange={(event) => updateRow(index, "leadArea", event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Required Leads</span><input disabled={!canEdit} type="number" min="0" value={row.requiredLeads} onChange={(event) => updateRow(index, "requiredLeads", event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Ads Starting Date</span><input disabled={!canEdit} type="date" value={row.adsStartingDate} onChange={(event) => updateRow(index, "adsStartingDate", event.target.value)} className={inputClass} /></label><label><span className={labelClass}>Monthly Budget</span><input disabled={!canEdit} type="number" min="0" value={row.monthlyBudget} onChange={(event) => updateRow(index, "monthlyBudget", event.target.value)} className={inputClass} /></label></div></div>; })}</div></div>
            {canEdit && <div className="flex justify-end border-t border-slate-200 p-4"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}Create</button></div>}
          </form>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-semibold text-slate-900">Remarks</h2>{remarks.length ? <div className="space-y-3">{remarks.map((item) => <div key={item.id || item._id} className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3"><div><p className="text-sm text-slate-800">{item.remark}</p><p className="mt-1 text-xs text-slate-500">{item.manager?.name || item.managerName || item.createdBy?.name || "Manager"} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Date unavailable"}</p></div>{canEdit && <button type="button" title="Delete remark" onClick={() => deleteRemark(item.id || item._id)} className="text-red-600 hover:text-red-700"><Trash2 size={16} /></button>}</div>)}</div> : <p className="text-sm text-slate-500">No remarks for this period.</p>}{canEdit && <form onSubmit={addRemark} className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="Add a remark" className={`${inputClass} flex-1`} /><button disabled={remarkSaving || !report} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{remarkSaving && <LoaderCircle size={16} className="animate-spin" />}Add Remark</button></form>}</section>
        </>}
      </div>
    </main>
  );
}