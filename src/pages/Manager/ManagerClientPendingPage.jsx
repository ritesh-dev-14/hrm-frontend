import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getUserRoles } from "../../utils/userRoles";

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
  const { user, role } = useAuth();
  const userRoles = getUserRoles(user, role);
  const canAddPendingItems = userRoles.some((userRole) => ["MANAGER", "ADMIN"].includes(userRole));
  const [department, setDepartment] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState("");
  const [projectForms, setProjectForms] = useState({});
  const [savingProjects, setSavingProjects] = useState({});
  const [projectErrors, setProjectErrors] = useState({});
  const [projectSearch, setProjectSearch] = useState("");

  useEffect(() => {
    if (!department) return undefined;

    let active = true;
    API.get("/api/projects/client-pending", { params: { department } })
      .then((response) => {
        if (!active) return;
        const nextProjects = response.data?.data || [];
        setProjects(nextProjects);
        setProjectForms({});
        setProjectErrors({});
        setProjectSearch("");
      })
      .catch((requestError) => {
        console.error("Unable to load assigned client projects:", requestError);
        if (active) {
          setError(requestError.response?.data?.message || "Could not load your projects for this department.");
          setProjects([]);
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
      setProjectForms({});
      setProjectErrors({});
    } catch (requestError) {
      console.error("Unable to refresh assigned client projects:", requestError);
      setError(requestError.response?.data?.message || "Could not refresh your projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const updateProjectForm = (projectId, field, value) => {
    setProjectForms((current) => ({
      ...current,
      [projectId]: {
        dueDate: current[projectId]?.dueDate || getToday(),
        note: current[projectId]?.note || "",
        ...current[projectId],
        [field]: value,
      },
    }));
    setProjectErrors((current) => ({ ...current, [projectId]: "" }));
  };

  const addPendingItem = async (event, project) => {
    event.preventDefault();
    const form = projectForms[project.id] || { dueDate: getToday(), note: "" };
    if (!form.dueDate || !form.note.trim()) return;

    setSavingProjects((current) => ({ ...current, [project.id]: true }));
    setProjectErrors((current) => ({ ...current, [project.id]: "" }));
    try {
      const response = await API.post(`/api/projects/${project.id}/pending-items`, {
        dueDate: form.dueDate,
        note: form.note.trim(),
      });
      const newItem = response.data?.data;
      if (!newItem) {
        throw new Error("The server did not return the saved pending item.");
      }

      setProjects((current) => current.map((item) => (
        item.id === project.id
          ? {
            ...item,
            pendingItems: [...(Array.isArray(item.pendingItems) ? item.pendingItems : []), newItem]
              .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate)),
          }
          : item
      )));
      setProjectForms((current) => ({
        ...current,
        [project.id]: { dueDate: getToday(), note: "" },
      }));
    } catch (requestError) {
      console.error(`Unable to add pending item for project ${project.id}:`, requestError);
      setProjectErrors((current) => ({
        ...current,
        [project.id]: requestError.response?.data?.message
          || requestError.message
          || "Could not add this pending item.",
      }));
    } finally {
      setSavingProjects((current) => ({ ...current, [project.id]: false }));
    }
  };

  const filteredProjects = projects.filter((project) => {
    const search = projectSearch.trim().toLowerCase();
    if (!search) return true;
    return [project.projectName, project.clientName]
      .some((value) => String(value || "").toLowerCase().includes(search));
  });
  const filteredPendingItems = filteredProjects.reduce(
    (total, project) => total + (Array.isArray(project.pendingItems) ? project.pendingItems.length : 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
              <MessageSquareText size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 md:text-3xl">Pending from Client Side</h1>
              <p className="mt-1 text-sm text-slate-500">
                Choose a department to view {canAddPendingItems ? "all projects and add items waiting on the client." : "all projects and items waiting on the client."}
              </p>
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
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Select department</span>
            <select
              value={department}
              onChange={(event) => {
                const selectedDepartment = event.target.value;
                setDepartment(selectedDepartment);
                setProjects([]);
                setLoadingProjects(Boolean(selectedDepartment));
                setError("");
                setProjectForms({});
                setProjectErrors({});
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 md:max-w-xl"
            >
              <option value="">Choose SEO, Meta Ads, or Social Media</option>
              {DEPARTMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {department && !loadingProjects && projects.length === 0 && !error && (
            <p className="mt-3 text-sm text-slate-500">No projects are assigned to you in this department.</p>
          )}
        </section>

        {department && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  All {DEPARTMENTS.find((item) => item.value === department)?.label} projects
                </h2>
                <p className="mt-1 text-sm text-slate-500">Add a follow-up to any project and review its existing pending items.</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  {filteredProjects.length} of {projects.length} projects · {filteredPendingItems} pending items
                </span>
                <label className="relative block w-full sm:w-80">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                    placeholder="Search project or client..."
                    aria-label="Search projects"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <LoaderCircle size={18} className="animate-spin" /> Loading department projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
                No assigned projects are available for this department.
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <Search size={24} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">No projects match “{projectSearch}”.</p>
                <button
                  type="button"
                  onClick={() => setProjectSearch("")}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredProjects.map((project) => {
                  const pendingItems = Array.isArray(project.pendingItems) ? project.pendingItems : [];
                  const form = projectForms[project.id] || { dueDate: getToday(), note: "" };
                  const isSaving = Boolean(savingProjects[project.id]);
                  return (
                    <article
                      key={project.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/60 p-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            {project.department?.name || DEPARTMENTS.find((item) => item.value === department)?.label}
                          </p>
                          <h3 className="mt-0.5 truncate font-black text-slate-900">{project.projectName}</h3>
                          <p className="truncate text-xs text-slate-500">{project.clientName || "Client"}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-extrabold text-indigo-700">
                          {pendingItems.length} {pendingItems.length === 1 ? "pending" : "pending"}
                        </span>
                      </div>

                      <div className="space-y-4 p-4">
                        {canAddPendingItems && (
                          <form onSubmit={(event) => addPendingItem(event, project)} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                          <p className="mb-3 text-xs font-bold text-slate-700">Add a pending item</p>
                          <label className="mb-3 block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Due date</span>
                            <input
                              type="date"
                              required
                              value={form.dueDate}
                              onChange={(event) => updateProjectForm(project.id, "dueDate", event.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-600">What are we waiting on?</span>
                            <textarea
                              required
                              maxLength={2000}
                              rows={2}
                              value={form.note}
                              onChange={(event) => updateProjectForm(project.id, "note", event.target.value)}
                              placeholder="Write the pending item or follow-up note..."
                              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            />
                          </label>
                          {projectErrors[project.id] && (
                            <p role="alert" className="mt-2 text-xs text-rose-700">{projectErrors[project.id]}</p>
                          )}
                          <div className="mt-3 flex justify-end">
                            <button
                              type="submit"
                              disabled={isSaving || !form.note.trim()}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSaving ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
                              {isSaving ? "Adding..." : "Add pending item"}
                            </button>
                          </div>
                          </form>
                        )}

                        <div>
                          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Existing pending items
                          </h4>
                          {pendingItems.length ? (
                            <div className="space-y-2">
                              {pendingItems.map((item) => (
                                <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
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
                          ) : (
                            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
                              No pending items yet. Add the first one above.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
