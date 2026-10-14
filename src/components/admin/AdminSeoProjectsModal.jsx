import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, Search, X } from "lucide-react";
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

const formatDate = (dateValue) => new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
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
            error.response?.data?.message || error.message || "Unable to load SEO reports for this date.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSubmittedProjects(false);
      });

    return () => {
      isMounted = false;
    };
  }, [appliedDate]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = !normalizedQuery || [project.projectName, project.clientName, project.department?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesDate = !appliedDate || submittedProjectIds.includes(String(project.id || project._id));
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
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-emerald-700 to-teal-800 px-5 py-5 text-white sm:px-7">
          <div>
            <h2 id="admin-seo-projects-title" className="text-xl font-black sm:text-2xl">SEO &amp; Organic Projects</h2>
            <p className="mt-1 text-xs text-emerald-100">Select a project to review manager reports, keyword rankings, and screenshots.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close SEO projects" className="rounded-xl p-2 text-emerald-100 transition hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Filter by manager report submission date</h3>
              <p className="mt-1 text-xs text-slate-500">
                {appliedDate
                  ? `Showing projects with an SEO report submitted on ${formatDate(appliedDate)}.`
                  : "Apply a date to see projects whose manager submitted an SEO report that day."}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Submitted on
                <input
                  type="date"
                  value={draftDate}
                  onChange={(event) => setDraftDate(event.target.value)}
                  className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
                />
              </label>
              <button
                type="button"
                onClick={applyDateFilter}
                disabled={!draftDate || loadingSubmittedProjects || draftDate === appliedDate}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Filter
              </button>
              {appliedDate && (
                <button type="button" onClick={removeDateFilter} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100">
                  Remove Filter
                </button>
              )}
            </div>
          </div>

          {loadingSubmittedProjects && (
            <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              <Loader2 size={14} className="animate-spin" /> Loading SEO submissions for {formatDate(appliedDate || draftDate)}…
            </p>
          )}
          {submittedProjectsError && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700" role="alert">{submittedProjectsError}</p>
          )}

          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search SEO projects..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{appliedDate ? `Projects with reports submitted ${formatDate(appliedDate)}` : "All SEO projects"}</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{filteredProjects.length}</span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-700">{projects.length ? "No projects match this filter" : "No SEO projects found"}</p>
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
                return (
                  <button
                    key={projectId}
                    type="button"
                    onClick={() => onSelectProject(projectId)}
                    className="group flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-slate-900 transition group-hover:text-emerald-700">{project.projectName || project.clientName || "Unnamed project"}</h3>
                        {project.clientName && project.clientName !== project.projectName && (
                          <p className="mt-1 truncate text-xs text-slate-500">{project.clientName}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${project.status === "PAUSED" ? "bg-amber-50 text-amber-700" : project.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {project.status || "ONGOING"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{project.department?.name || "SEO"}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-400 transition group-hover:text-emerald-700">View details <ChevronRight size={14} /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSeoProjectsModal;
