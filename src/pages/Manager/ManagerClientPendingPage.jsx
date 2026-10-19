import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Clock3, LoaderCircle, MessageSquareText, Plus, RefreshCw } from "lucide-react";
import API from "../../services/api";

const DEPARTMENTS = [
  { value: "seo", label: "SEO" },
  { value: "marketing", label: "Meta Ads" },
  { value: "social", label: "Social Media" },
];

const getToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function ManagerClientPendingPage() {
  const [department, setDepartment] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dueDate, setDueDate] = useState(getToday);
  const [note, setNote] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!department) return undefined;

    let active = true;
    API.get("/api/projects/client-pending", { params: { department } })
      .then((response) => {
        if (!active) return;
        const nextProjects = response.data?.data || [];
        setProjects(nextProjects);
        setSelectedProjectId((current) =>
          nextProjects.some((project) => project.id === current) ? current : nextProjects[0]?.id || "",
        );
      })
      .catch((requestError) => {
        console.error("Unable to load assigned client projects:", requestError);
        if (active) {
          setError(requestError.response?.data?.message || "Could not load your projects for this department.");
          setProjects([]);
          setSelectedProjectId("");
        }
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });

    return () => {
      active = false;
    };
  }, [department]);

  const refreshProjects = async () => {
    if (!department) return;
    setLoadingProjects(true);
    setError("");
    try {
      const response = await API.get("/api/projects/client-pending", { params: { department } });
      const nextProjects = response.data?.data || [];
      setProjects(nextProjects);
      setSelectedProjectId((current) =>
        nextProjects.some((project) => project.id === current) ? current : nextProjects[0]?.id || "",
      );
    } catch (requestError) {
      console.error("Unable to refresh assigned client projects:", requestError);
      setError(requestError.response?.data?.message || "Could not refresh your projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const addPendingItem = async (event) => {
    event.preventDefault();
    if (!selectedProjectId || !dueDate || !note.trim()) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await API.post(`/api/projects/${selectedProjectId}/pending-items`, {
        dueDate,
        note: note.trim(),
      });
      const newItem = response.data.data;
      setProjects((current) => current.map((project) => (
        project.id === selectedProjectId
          ? { ...project, pendingItems: [...project.pendingItems, newItem].sort(
            (left, right) => new Date(left.dueDate) - new Date(right.dueDate),
          ) }
          : project
      )));
      setNote("");
      setDueDate(getToday());
      setSuccess("Pending item added. It will appear in the client’s combined message preview.");
    } catch (requestError) {
      console.error("Unable to save pending item:", requestError);
      setError(requestError.response?.data?.message || "Could not save this pending item.");
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const totalPendingItems = projects.reduce((total, project) => total + project.pendingItems.length, 0);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
              <MessageSquareText size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 md:text-3xl">Pending from your side</h1>
              <p className="mt-1 text-sm text-slate-500">Choose a department to review and manage all its project follow-ups.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshProjects}
            disabled={!department || loadingProjects}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loadingProjects ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p>}

        <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">1. Select department</span>
            <select
              value={department}
              onChange={(event) => {
                const selectedDepartment = event.target.value;
                setDepartment(selectedDepartment);
                setProjects([]);
                setSelectedProjectId("");
                setLoadingProjects(Boolean(selectedDepartment));
                setError("");
                setSuccess("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Choose SEO, Meta Ads, or Social Media</option>
              {DEPARTMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">2. Select project</span>
            <select
              value={selectedProjectId}
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
                setSuccess("");
              }}
              disabled={!department || loadingProjects || projects.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            >
              <option value="">
                {loadingProjects ? "Loading projects..." : projects.length ? "Choose a project" : "Select a department first"}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectName} · {project.clientName || "Client"}
                </option>
              ))}
            </select>
          </label>
          {department && !loadingProjects && projects.length === 0 && !error && (
            <p className="text-sm text-slate-500 md:col-span-2">No projects are assigned to you in this department.</p>
          )}
        </section>

        {selectedProject && (
          <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{selectedProject.department.name}</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Add follow-up for {selectedProject.projectName}</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedProject.clientName || "Client"}</p>
            </div>
            <form onSubmit={addPendingItem} className="grid gap-4 md:grid-cols-[190px_minmax(0,1fr)_auto] md:items-end">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Date</span>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">What are we waiting on?</span>
                <textarea
                  required
                  maxLength={2000}
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Write the pending item or follow-up note..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="text-xs text-slate-400">{note.length}/2000</span>
              </label>
              <button
                type="submit"
                disabled={saving || !note.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                Add pending item
              </button>
            </form>
          </section>
        )}

        {department && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  All {DEPARTMENTS.find((item) => item.value === department)?.label} pending items
                </h2>
                <p className="mt-1 text-sm text-slate-500">Review notes across all your projects in this department.</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                {projects.length} projects · {totalPendingItems} items
              </span>
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <LoaderCircle size={18} className="animate-spin" /> Loading department projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                No assigned projects are available for this department.
              </div>
            ) : totalPendingItems === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <MessageSquareText size={26} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">No pending items have been added for these projects yet.</p>
                <p className="mt-1 text-xs text-slate-400">Choose a project above to add the first follow-up.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.filter((project) => project.pendingItems.length > 0).map((project) => (
                  <article key={project.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{project.projectName}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{project.clientName || "Client"}</p>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {project.pendingItems.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {project.pendingItems.map((item) => (
                        <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                              <CalendarDays size={13} />
                              {formatDate(item.dueDate)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock3 size={12} />
                              Added {formatDate(item.createdAt)} by {item.createdBy?.name || "Project team"}
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
