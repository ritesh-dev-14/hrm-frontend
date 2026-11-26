import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../services/api";

const DEPARTMENT_FILTERS = [
  { value: "all", label: "All departments" },
  { value: "seo", label: "SEO" },
  { value: "marketing", label: "Meta Ads" },
  { value: "social", label: "Social Media" },
];

const getDepartmentKey = (name = "") => {
  const department = String(name).toLowerCase();
  if (department.includes("social")) return "social";
  if (department.includes("seo")) return "seo";
  if (department.includes("marketing") || department.includes("meta")) return "marketing";
  return "";
};

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const parseProjectsResponse = (response) => {
  const data = response.data?.data;
  if (!Array.isArray(data)) {
    throw new Error("The project onboarding response is invalid.");
  }
  return data;
};

const isOverdue = (item) => {
  if (item.completed) return false;
  const deadline = new Date(item.deadline);
  deadline.setHours(23, 59, 59, 999);
  return deadline < new Date();
};

export default function ProjectOnboardingPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [savingItem, setSavingItem] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await API.get("/api/project-onboarding");
      setProjects(parseProjectsResponse(response));
    } catch (error) {
      console.error("Unable to load project onboarding checklists:", error);
      setLoadError(error.response?.data?.message || error.message || "Could not load project onboarding checklists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchProjects = async () => {
      try {
        const response = await API.get("/api/project-onboarding");
        if (active) setProjects(parseProjectsResponse(response));
      } catch (error) {
        console.error("Unable to load project onboarding checklists:", error);
        if (active) {
          setLoadError(error.response?.data?.message || error.message || "Could not load project onboarding checklists.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProjects();
    return () => {
      active = false;
    };
  }, []);

  const visibleProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesDepartment = departmentFilter === "all" || getDepartmentKey(project.department) === departmentFilter;
      const matchesSearch = !normalizedSearch
        || `${project.projectName} ${project.clientName || ""} ${project.department}`.toLowerCase().includes(normalizedSearch);
      return matchesDepartment && matchesSearch;
    });
  }, [projects, search, departmentFilter]);

  const summary = useMemo(() => {
    const items = visibleProjects.flatMap((project) => project.items);
    return {
      projects: visibleProjects.length,
      completed: items.filter((item) => item.completed).length,
      overdue: items.filter(isOverdue).length,
    };
  }, [visibleProjects]);

  const toggleItem = async (project, item) => {
    const saveKey = `${project.id}:${item.key}`;
    setSavingItem(saveKey);
    try {
      const response = await API.patch(
        `/api/project-onboarding/projects/${project.id}/items/${item.key}`,
        { completed: !item.completed },
      );
      const savedItem = response.data?.data;
      setProjects((current) => current.map((entry) => (
        entry.id !== project.id
          ? entry
          : {
            ...entry,
            items: entry.items.map((currentItem) => (
              currentItem.key === item.key
                ? { ...currentItem, completed: savedItem.completed, completedAt: savedItem.completedAt }
                : currentItem
            )),
          }
      )));
    } catch (error) {
      console.error("Unable to update project onboarding item:", error);
      toast.error(error.response?.data?.message || "Could not update this checklist item. Please try again.");
    } finally {
      setSavingItem("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              <CheckCircle2 size={15} />
              Project setup tracker
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Project Onboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Track shared onboarding tasks due within 4 days and department tasks due within 1 week of project creation.
            </p>
          </div>
          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Projects</p>
            <p className="mt-2 text-3xl font-black">{summary.projects}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-700">Checklist items completed</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{summary.completed}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <p className="text-sm font-medium text-rose-700">Overdue items</p>
            <p className="mt-2 text-3xl font-black text-rose-800">{summary.overdue}</p>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="relative flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search project or client"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            aria-label="Filter by department"
          >
            {DEPARTMENT_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </section>

        {loadError && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <span className="flex items-center gap-2"><AlertCircle size={17} />{loadError}</span>
            <button type="button" onClick={loadProjects} className="font-bold underline">Try again</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-sm font-medium text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading project checklists…
          </div>
        ) : !loadError && visibleProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <CheckCircle2 size={30} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-bold text-slate-700">No projects found</h2>
            <p className="mt-1 text-sm text-slate-500">Projects in SEO, Meta Ads, and Social Media will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleProjects.map((project) => {
              const completedCount = project.items.filter((item) => item.completed).length;
              return (
                <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{project.department}</p>
                      <h2 className="mt-1 truncate text-lg font-bold">{project.projectName}</h2>
                      {project.clientName && project.clientName !== project.projectName && (
                        <p className="mt-0.5 text-sm text-slate-500">Client: {project.clientName}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />Created {formatDate(project.createdAt)}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {completedCount}/{project.items.length} complete
                      </span>
                    </div>
                  </header>

                  <div className="grid gap-5 p-5 lg:grid-cols-2">
                    {[4, 7].map((dueDays) => {
                      const items = project.items.filter((item) => item.dueDays === dueDays);
                      if (!items.length) return null;
                      return (
                        <section key={dueDays}>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Clock3 size={15} className="text-indigo-500" />
                            {dueDays === 4 ? "Common onboarding · within 4 days" : "Department tasks · within 1 week"}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item) => {
                              const saveKey = `${project.id}:${item.key}`;
                              const overdue = isOverdue(item);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => toggleItem(project, item)}
                                  disabled={Boolean(savingItem)}
                                  aria-pressed={item.completed}
                                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-wait disabled:opacity-70 ${
                                    item.completed
                                      ? "border-emerald-100 bg-emerald-50/60"
                                      : overdue
                                        ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
                                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                                  }`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                    item.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                                  }`}>
                                    {savingItem === saveKey
                                      ? <LoaderCircle size={13} className="animate-spin text-indigo-500" />
                                      : item.completed && <Check size={14} strokeWidth={3} />}
                                  </span>
                                  <span className={`min-w-0 flex-1 text-sm font-medium ${item.completed ? "text-emerald-800" : "text-slate-700"}`}>
                                    {item.label}
                                    {item.completed && item.completedAt && (
                                      <span className="mt-0.5 block text-xs font-normal text-emerald-700">Completed {formatDate(item.completedAt)}</span>
                                    )}
                                  </span>
                                  <span className={`shrink-0 text-xs ${overdue ? "font-bold text-rose-600" : "text-slate-400"}`}>
                                    Due {formatDate(item.deadline)}{overdue ? " · overdue" : ""}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
