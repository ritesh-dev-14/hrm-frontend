import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Loader2, Search, X } from "lucide-react";
import API from "../../services/api";

const getToday = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

const getLocalDateBounds = (dateValue) => {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
};

const formatDate = (dateValue) =>
  new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const AdminSeoProjectsModal = ({ projects, onClose, onSelectProject }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [draftDate, setDraftDate] = useState(getToday);
  const [appliedDate, setAppliedDate] = useState("");
  const [submittedProjectIds, setSubmittedProjectIds] = useState([]);
  const [loadingSubmittedProjects, setLoadingSubmittedProjects] = useState(false);
  const [submittedProjectsError, setSubmittedProjectsError] = useState("");

  // Selected project inline view
  const [selectedProject, setSelectedProject] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [loadingPendingItems, setLoadingPendingItems] = useState(false);
  const [pendingItemsError, setPendingItemsError] = useState("");

  useEffect(() => {
    if (!appliedDate) return undefined;

    let isMounted = true;
    API.get("/api/seo-reports/submitted-projects", { params: getLocalDateBounds(appliedDate) })
      .then((response) => {
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to load SEO reports for this date.");
        }
        if (isMounted) {
          setSubmittedProjectIds((response.data.data || []).map(String));
          setSubmittedProjectsError("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSubmittedProjectIds([]);
          setSubmittedProjectsError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load SEO reports for this date.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSubmittedProjects(false);
      });

    return () => { isMounted = false; };
  }, [appliedDate]);

  // Fetch pending items when a project is selected
  useEffect(() => {
    if (!selectedProject) {
      setPendingItems([]);
      return undefined;
    }
    let active = true;
    setLoadingPendingItems(true);
    setPendingItemsError("");
    setPendingItems([]);
    const projectId = selectedProject.id || selectedProject._id;
    API.get(`/api/projects/${projectId}/pending-items`)
      .then((res) => {
        if (active) setPendingItems(res.data?.data || []);
      })
      .catch((err) => {
        if (active)
          setPendingItemsError(
            err.response?.data?.message || "Could not load pending items.",
          );
      })
      .finally(() => {
        if (active) setLoadingPendingItems(false);
      });
    return () => { active = false; };
  }, [selectedProject]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        !normalizedQuery ||
        [project.projectName, project.clientName, project.department?.name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesDate =
        !appliedDate || submittedProjectIds.includes(String(project.id || project._id));
      return matchesSearch && matchesDate;
    });
  }, [projects, searchQuery, appliedDate, submittedProjectIds]);

  const applyDateFilter = () => {
    if (!draftDate) return;
    setLoadingSubmittedProjects(true);
    setSubmittedProjectIds([]);
    setSubmittedProjectsError("");
    setAppliedDate(draftDate);
  };

  const removeDateFilter = () => {
    setAppliedDate("");
    setDraftDate(getToday());
    setSubmittedProjectIds([]);
    setLoadingSubmittedProjects(false);
    setSubmittedProjectsError("");
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-seo-projects-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Admin directory</p>
            <h2 id="admin-seo-projects-title" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              SEO &amp; Organic Projects
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review project status, keyword rankings, and pending follow-ups.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close SEO projects"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Filter by submission date</h3>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                {appliedDate
                  ? `Showing projects with an SEO report submitted on ${formatDate(appliedDate)}.`
                  : "Apply a date to see projects whose manager submitted an SEO report that day."}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
              <label className="text-xs font-medium text-slate-600">
                Submitted on
                <input
                  type="date"
                  value={draftDate}
                  onChange={(event) => setDraftDate(event.target.value)}
                  className="mt-1 block min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <button
                type="button"
                onClick={applyDateFilter}
                disabled={!draftDate || loadingSubmittedProjects || draftDate === appliedDate}
                className="min-h-10 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Filter
              </button>
              {appliedDate && (
                <button
                  type="button"
                  onClick={removeDateFilter}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Remove Filter
                </button>
              )}
            </div>
          </div>

          {loadingSubmittedProjects && (
            <p className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              <Loader2 size={14} className="animate-spin" /> Loading SEO submissions for{" "}
              {formatDate(appliedDate || draftDate)}…
            </p>
          )}
          {submittedProjectsError && (
            <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {submittedProjectsError}
            </p>
          )}

          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>
              {appliedDate ? `Projects with reports submitted ${formatDate(appliedDate)}` : "All SEO projects"}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {filteredProjects.length}
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-700">
                {projects.length ? "No projects match this filter" : "No SEO projects found"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {projects.length
                  ? appliedDate && !submittedProjectsError
                    ? `No SEO reports were submitted on ${formatDate(appliedDate)}.`
                    : "Try a different project or client name."
                  : "Projects assigned to the SEO department will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const projectId = project.id || project._id;
                const isSelected =
                  String(selectedProject?.id || selectedProject?._id) === String(projectId);
                return (
                  <button
                    key={projectId}
                    type="button"
                    onClick={() => setSelectedProject(isSelected ? null : project)}
                    aria-pressed={isSelected}
                    className={`group flex min-h-28 flex-col justify-between rounded-xl border bg-white p-4 text-left transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-200"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className={`truncate text-sm font-semibold text-slate-900 transition ${
                            isSelected ? "text-indigo-700" : "group-hover:text-indigo-700"
                          }`}
                        >
                          {project.projectName || project.clientName || "Unnamed project"}
                        </h3>
                        {project.clientName && project.clientName !== project.projectName && (
                          <p className="mt-1 truncate text-xs text-slate-500">{project.clientName}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                          project.status === "PAUSED"
                            ? "bg-amber-50 text-amber-700"
                            : project.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {project.status || "ONGOING"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-slate-500">
                        {project.department?.name || "SEO"}
                      </span>
                      <span
                        className={`flex shrink-0 items-center gap-1 text-xs font-bold transition ${
                          isSelected ? "text-indigo-700" : "text-slate-400 group-hover:text-indigo-700"
                        }`}
                      >
                        {isSelected ? "Selected \u2713" : "View details"} <ChevronRight size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* SELECTED PROJECT INLINE PANEL */}
          {selectedProject && (
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Selected project
                  </p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
                    {selectedProject.projectName || selectedProject.clientName}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {selectedProject.department?.name || "SEO"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectProject(selectedProject.id || selectedProject._id)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  View Full Details <ChevronRight size={14} />
                </button>
              </div>

              {/* Pending from your side */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ClipboardList size={16} className="text-slate-500" />
                  Pending from your side
                  {pendingItems.length > 0 && (
                    <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {pendingItems.length}
                    </span>
                  )}
                </h4>

                {loadingPendingItems ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                    <Loader2 size={15} className="animate-spin" /> Loading pending items…
                  </div>
                ) : pendingItemsError ? (
                  <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700">
                    {pendingItemsError}
                  </p>
                ) : pendingItems.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No pending items have been recorded for this project.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingItems.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                            <CalendarDays size={13} />
                            {formatDateTime(item.dueDate)}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Added by{" "}
                            <span className="font-bold text-slate-600">
                              {item.createdBy?.name || "Manager"}
                            </span>
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5 text-slate-700">
                          {item.note}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSeoProjectsModal;
