import { useEffect, useState } from "react";
import { BriefcaseBusiness, LoaderCircle, Megaphone, Pencil, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { notifyError, notifySuccess } from "../utils/toast";

const OBJECTIVES = ["LEAD", "AWARENESS", "BOTH"];
const FUND_SOURCES = ["CLIENT", "HARSH"];
const LEGACY_FUND_SOURCES = ["HARSH_SIR"];
const EMPTY_FORM = {
  projectName: "",
  clientName: "",
  monthlyBudget: "",
  objective: "",
  area: "",
  fundsAddedBy: "",
};
const EMPTY_REPORT_FORM = {
  reportDate: new Date().toISOString().split("T")[0],
  isAdRunning: "",
  reach: "",
  amountSpent: "",
  leads: "",
  dailyBudget: "",
  notes: "",
};

const getProjectName = (task = {}) => task.projectName || task.clientName || "Untitled Meta Ads Task";
const getAssignedToId = (task = {}) => task.assignedToId || task.assignedTo?.id || task.assignedTo?._id || "";
const normalizeFundsAddedBy = (value) => (value === "HARSH_SIR" ? "HARSH" : value);

const normalizeTask = (task = {}) => {
  const projectName = getProjectName(task);
  return {
    ...task,
    projectName,
    clientName: task.clientName || projectName,
    assignedToId: getAssignedToId(task),
    fundsAddedBy: normalizeFundsAddedBy(task.fundsAddedBy),
    status: task.status || (getAssignedToId(task) ? "ASSIGNED" : "DRAFT"),
  };
};

const listFromResponse = (response) => {
  const data = response?.data?.data ?? response?.data;
  const tasks = Array.isArray(data) ? data : data?.tasks || data?.items || [];
  return tasks.map((task) => normalizeTask(task));
};

const taskFromResponse = (response) => normalizeTask(response?.data?.data ?? response?.data);
const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

function TaskForm({
  value,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  disabled = false,
  managerOptions = [],
  selectedManager = "",
  onManagerChange,
}) {
  const projectValue = value.projectName ?? value.clientName ?? "";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label>
        <span className={labelClass}>Project Name</span>
        <input
          required
          disabled={disabled || submitting}
          value={projectValue}
          onChange={(e) => onChange("projectName", e.target.value)}
          className={inputClass}
          placeholder="Enter project name"
        />
      </label>
      <label>
        <span className={labelClass}>Monthly Budget</span>
        <input
          required
          disabled={disabled || submitting}
          type="number"
          min="0.01"
          step="0.01"
          value={value.monthlyBudget}
          onChange={(e) => onChange("monthlyBudget", e.target.value)}
          className={inputClass}
          placeholder="Enter positive budget"
        />
      </label>
      <label>
        <span className={labelClass}>Objective</span>
        <select
          required
          disabled={disabled || submitting}
          value={value.objective}
          onChange={(e) => onChange("objective", e.target.value)}
          className={inputClass}
        >
          <option value="">Select objective</option>
          {OBJECTIVES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        <span className={labelClass}>Area</span>
        <input
          required
          disabled={disabled || submitting}
          value={value.area}
          onChange={(e) => onChange("area", e.target.value)}
          className={inputClass}
          placeholder="Enter target area"
        />
      </label>
      <label className="sm:col-span-2">
        <span className={labelClass}>Funds Added By</span>
        <select
          required
          disabled={disabled || submitting}
          value={value.fundsAddedBy}
          onChange={(e) => onChange("fundsAddedBy", e.target.value)}
          className={inputClass}
        >
          <option value="">Select fund source</option>
          {FUND_SOURCES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      {managerOptions.length > 0 && (
        <label className="sm:col-span-2">
          <span className={labelClass}>Assign Manager (Optional)</span>
          <select
            disabled={disabled || submitting}
            value={selectedManager}
            onChange={(e) => onManagerChange?.(e.target.value)}
            className={inputClass}
          >
            <option value="">No manager assigned (Draft)</option>
            {managerOptions.map((manager) => (
              <option key={manager.id || manager._id} value={manager.id || manager._id}>
                {manager.name || manager.fullName || manager.email}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        disabled={disabled || submitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
      >
        {submitting && <LoaderCircle size={16} className="animate-spin" />}
        {submitLabel}
      </button>
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
  const [reportTask, setReportTask] = useState(null);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT_FORM);
  const [submittingReport, setSubmittingReport] = useState(false);

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

  const updateField = (setter) => (field, value) =>
    setter((current) => {
      const next = { ...current, [field]: value };
      if (field === "projectName") next.clientName = value;
      if (field === "clientName") next.projectName = value;
      return next;
    });

  const validate = (values) => {
    const projectName = (values.projectName ?? values.clientName ?? "").trim();
    const area = (values.area ?? "").trim();
    const normalizedFunds = normalizeFundsAddedBy(values.fundsAddedBy);

    if (!projectName || !area || !values.monthlyBudget || !values.objective || !normalizedFunds) {
      return "Project name, area, monthly budget, objective, and funds source are required.";
    }
    if (Number(values.monthlyBudget) <= 0) return "Monthly budget must be positive.";
    if (!OBJECTIVES.includes(values.objective)) return "Objective must be LEAD, AWARENESS, or BOTH.";
    if (!FUND_SOURCES.includes(normalizedFunds) && !LEGACY_FUND_SOURCES.includes(values.fundsAddedBy)) {
      return "Funds source must be CLIENT or HARSH.";
    }
    return null;
  };

  const createTask = async (event) => {
    event.preventDefault();
    const validationError = validate(form);
    if (validationError) return notifyError(validationError);

    const projectName = (form.projectName || form.clientName || "").trim();
    const normalizedFunds = normalizeFundsAddedBy(form.fundsAddedBy);
    const payload = {
      projectName,
      ...(selectedManager ? { assignedToId: selectedManager } : {}),
      monthlyBudget: Number(form.monthlyBudget),
      objective: form.objective,
      area: (form.area || "").trim(),
      fundsAddedBy: normalizedFunds,
      clientName: projectName,
    };

    try {
      setCreating(true);
      await API.post("/api/meta-ads-tasks", payload);
      notifySuccess(selectedManager ? "Meta Ads task created and assigned successfully." : "Meta Ads task created successfully.");
      setForm(EMPTY_FORM);
      setSelectedManager("");
      setShowCreateForm(false);
      await loadTasks();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to create Meta Ads task."));
    } finally {
      setCreating(false);
    }
  };

  const assignTask = async (taskId, assignedToId) => {
    if (!assignedToId) return;
    try {
      setAssigningId(taskId);
      await API.post(`/api/meta-ads-tasks/${taskId}/assign`, { assignedToId });
      notifySuccess("Meta Ads task assigned successfully.");
      await loadTasks();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to assign Meta Ads task."));
    } finally {
      setAssigningId(null);
    }
  };

  const openReport = (task) => {
    setReportTask(task);
    setReportForm({
      ...EMPTY_REPORT_FORM,
      reportDate: new Date().toISOString().split("T")[0],
      dailyBudget: task.monthlyBudget ? String(task.monthlyBudget) : "",
    });
  };

  const updateReportField = (field, value) => {
    setReportForm((current) => ({ ...current, [field]: value }));
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!reportTask || !reportForm.reportDate || !reportForm.isAdRunning) {
      return notifyError("Report date and ad status are required.");
    }
    if (["reach", "amountSpent", "leads", "dailyBudget"].some((field) => reportForm[field] !== "" && Number(reportForm[field]) < 0)) {
      return notifyError("Report numbers cannot be negative.");
    }

    try {
      setSubmittingReport(true);
      await API.post(`/api/meta-ads-tasks/${reportTask.id || reportTask._id}/reports`, {
        reportDate: reportForm.reportDate,
        isAdRunning: reportForm.isAdRunning === "true",
        reach: reportForm.reach === "" ? null : Number(reportForm.reach),
        amountSpent: reportForm.amountSpent === "" ? null : Number(reportForm.amountSpent),
        leads: reportForm.leads === "" ? null : Number(reportForm.leads),
        dailyBudget: reportForm.dailyBudget === "" ? null : Number(reportForm.dailyBudget),
        notes: reportForm.notes.trim() || null,
      });
      notifySuccess("Meta Ads report submitted successfully.");
      setReportTask(null);
    } catch (error) {
      notifyError(errorMessage(error, "Unable to submit Meta Ads report."));
    } finally {
      setSubmittingReport(false);
    }
  };

  const beginEdit = async (task) => {
    try {
      const details = taskFromResponse(await API.get(`/api/meta-ads-tasks/${task.id || task._id}`));
      setEditingTask(details);
      setEditingForm({
        projectName: details.projectName || details.clientName || "",
        clientName: details.clientName || details.projectName || "",
        monthlyBudget: details.monthlyBudget ?? "",
        objective: details.objective || "",
        area: details.area || "",
        fundsAddedBy: details.fundsAddedBy || "",
      });
    } catch (error) {
      notifyError(errorMessage(error, "Unable to load task details."));
    }
  };

  const updateTask = async (event) => {
    event.preventDefault();
    const validationError = validate(editingForm);
    if (validationError) return notifyError(validationError);

    const projectName = (editingForm.projectName || editingForm.clientName || "").trim();
    const normalizedFunds = normalizeFundsAddedBy(editingForm.fundsAddedBy);
    const payload = {
      projectName,
      monthlyBudget: Number(editingForm.monthlyBudget),
      objective: editingForm.objective,
      area: (editingForm.area || "").trim(),
      fundsAddedBy: normalizedFunds,
      clientName: projectName,
    };

    try {
      setUpdating(true);
      await API.patch(`/api/meta-ads-tasks/${editingTask.id || editingTask._id}`, payload);
      notifySuccess("Meta Ads task updated successfully.");
      setEditingTask(null);
      await loadTasks();
    } catch (error) {
      notifyError(errorMessage(error, "Unable to update Meta Ads task."));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="meta-ads-tasks-page min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className={`mx-auto max-w-7xl space-y-6 ${isHr ? "meta-ads-hr" : "meta-ads-manager"}`}>
        <header className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500 p-3"><Megaphone size={24} /></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Marketing Operations</p>
              <h1 className="mt-1 text-2xl font-black">Meta Ads Tasks</h1>
              <p className="mt-1 text-sm text-slate-300">{isHr ? "Create campaigns and assign them to managers." : "Your Meta Ads assignments and campaign briefs."}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <p className="text-2xl font-black">{tasks.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isHr ? "Total Tasks" : "Assigned Tasks"}</p>
          </div>
          {isHr && (
            <button type="button" onClick={() => setShowCreateForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
              <BriefcaseBusiness size={17} />Create Task
            </button>
          )}
        </header>

        {isHr && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><BriefcaseBusiness size={19} /></div>
              <div>
                <h2 className="font-black text-slate-900">Create Meta Ads Task</h2>
                <p className="text-xs font-medium text-slate-500">Complete the brief and optionally assign the responsible manager.</p>
              </div>
            </div>
            <TaskForm
              value={form}
              onChange={updateField(setForm)}
              onSubmit={createTask}
              submitting={creating}
              submitLabel="Create Task"
              managerOptions={managers}
              selectedManager={selectedManager}
              onManagerChange={setSelectedManager}
            />
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">{isHr ? "All Meta Ads Tasks" : "Assigned Meta Ads Tasks"}</h2>
              <p className="text-xs font-medium text-slate-500">{isHr ? "Review assignments and reassign work when needed." : "Open a task to update its campaign details."}</p>
            </div>
            <UserRound className="text-emerald-600" size={21} />
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-slate-500"><LoaderCircle className="animate-spin" /></div>
          ) : tasks.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">No Meta Ads tasks found.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {tasks.map((task) => {
                const taskId = task.id || task._id;
                const projectName = getProjectName(task);
                const assignedId = getAssignedToId(task);

                return (
                  <article
                    key={taskId}
                    onClick={() => openReport(task)}
                    className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{projectName}</h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{task.objective}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {task.status || (assignedId ? "ASSIGNED" : "DRAFT")}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Budget</dt>
                        <dd className="mt-1 font-black text-slate-800">{task.monthlyBudget}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Area</dt>
                        <dd className="mt-1 font-bold text-slate-800">{task.area}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Funds Added By</dt>
                        <dd className="mt-1 font-bold text-slate-800">{task.fundsAddedBy}</dd>
                      </div>
                      {assignedId && (
                        <div className="col-span-2">
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Manager</dt>
                          <dd className="mt-1 font-bold text-slate-800">{assignedId}</dd>
                        </div>
                      )}
                    </dl>

                    {isHr && (
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <select
                          onClick={(event) => event.stopPropagation()}
                          value={assignedId}
                          onChange={(event) => assignTask(taskId, event.target.value)}
                          disabled={assigningId === taskId}
                          className="min-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <option value="">Assign manager</option>
                          {managers.map((manager) => (
                            <option key={manager.id || manager._id} value={manager.id || manager._id}>
                              {manager.name || manager.fullName || manager.email}
                            </option>
                          ))}
                        </select>
                        {assigningId === taskId && <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Updating...</span>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {isHr && tasks.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-black text-slate-900">Update Meta Ads Tasks</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {tasks.map((task) => (
                <button
                  key={task.id || task._id}
                  type="button"
                  onClick={() => beginEdit(task)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  {getProjectName(task)}
                  <Pencil size={15} className="text-emerald-600" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">New Campaign Brief</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Create Meta Ads Task</h2>
                <p className="mt-1 text-sm text-slate-500">Add the campaign details and optionally assign the responsible manager.</p>
              </div>
              <button type="button" onClick={() => setShowCreateForm(false)} disabled={creating} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Close</button>
            </div>

            <TaskForm
              value={form}
              onChange={updateField(setForm)}
              onSubmit={createTask}
              submitting={creating}
              submitLabel="Save Task"
              managerOptions={managers}
              selectedManager={selectedManager}
              onManagerChange={setSelectedManager}
            />
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Update Meta Ads Task</h2>
                <p className="text-xs text-slate-500">Keep the backend enum values unchanged.</p>
              </div>
              <button type="button" onClick={() => setEditingTask(null)} className="text-sm font-bold text-slate-500 hover:text-slate-900">Close</button>
            </div>
            <TaskForm
              value={editingForm}
              onChange={updateField(setEditingForm)}
              onSubmit={updateTask}
              submitting={updating}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {reportTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Daily Campaign Update</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">{getProjectName(reportTask)}</h2>
                <p className="mt-1 text-sm text-slate-500">Fill today&apos;s Meta Ads performance report.</p>
              </div>
              <button type="button" onClick={() => setReportTask(null)} disabled={submittingReport} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Close</button>
            </div>

            <form onSubmit={submitReport} className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Report Date</span>
                <input type="date" required value={reportForm.reportDate} onChange={(event) => updateReportField("reportDate", event.target.value)} className={inputClass} disabled={submittingReport} />
              </label>
              <label>
                <span className={labelClass}>Is Ad Running?</span>
                <select required value={reportForm.isAdRunning} onChange={(event) => updateReportField("isAdRunning", event.target.value)} className={inputClass} disabled={submittingReport}>
                  <option value="">Select status</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>Reach</span>
                <input type="number" min="0" value={reportForm.reach} onChange={(event) => updateReportField("reach", event.target.value)} className={inputClass} placeholder="0" disabled={submittingReport} />
              </label>
              <label>
                <span className={labelClass}>Amount Spent</span>
                <input type="number" min="0" step="0.01" value={reportForm.amountSpent} onChange={(event) => updateReportField("amountSpent", event.target.value)} className={inputClass} placeholder="0" disabled={submittingReport} />
              </label>
              <label>
                <span className={labelClass}>Leads</span>
                <input type="number" min="0" value={reportForm.leads} onChange={(event) => updateReportField("leads", event.target.value)} className={inputClass} placeholder="0" disabled={submittingReport} />
              </label>
              <label>
                <span className={labelClass}>Daily Budget</span>
                <input type="number" min="0" step="0.01" value={reportForm.dailyBudget} onChange={(event) => updateReportField("dailyBudget", event.target.value)} className={inputClass} placeholder="0" disabled={submittingReport} />
              </label>
              <label className="sm:col-span-2">
                <span className={labelClass}>Notes</span>
                <textarea value={reportForm.notes} onChange={(event) => updateReportField("notes", event.target.value)} className={`${inputClass} min-h-24 resize-y`} placeholder="Add campaign updates or blockers" disabled={submittingReport} />
              </label>
              <button type="submit" disabled={submittingReport} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
                {submittingReport && <LoaderCircle size={16} className="animate-spin" />}
                Submit Meta Ads Report
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
