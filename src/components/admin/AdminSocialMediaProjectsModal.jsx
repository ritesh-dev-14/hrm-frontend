import { useMemo, useState } from "react";
import { Camera, ChevronRight, Heart, Search, X } from "lucide-react";

const AdminSocialMediaProjectsModal = ({ projects, onClose, onSelectProject }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return projects;
    return projects.filter((project) =>
      [project.projectName, project.clientName, project.department?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [projects, searchQuery]);

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
        aria-labelledby="admin-social-projects-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-violet-700 to-purple-800 px-5 py-5 text-white sm:px-7">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-200">
              <Heart size={15} /> Admin directory
            </div>
            <h2 id="admin-social-projects-title" className="text-xl font-black sm:text-2xl">Social Media Projects</h2>
            <p className="mt-1 text-xs text-violet-100">Select a project to review its content calendar, shoot workspaces, and social media details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Social Media projects" className="rounded-xl p-2 text-violet-100 transition hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Social Media projects..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>All Social Media projects</span>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">{filteredProjects.length}</span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Camera size={30} className="mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">{projects.length ? "No matching projects" : "No Social Media projects found"}</p>
              <p className="mt-1 text-xs text-slate-500">{projects.length ? "Try a different project or client name." : "Projects assigned to the Social Media department will appear here."}</p>
            </div>
          ) : (
            <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto pb-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const projectId = project.id || project._id;
                return (
                  <button
                    key={projectId}
                    type="button"
                    onClick={() => onSelectProject(projectId)}
                    className="group flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-slate-900 transition group-hover:text-violet-700">{project.projectName || project.clientName || "Unnamed project"}</h3>
                        {project.clientName && project.clientName !== project.projectName && (
                          <p className="mt-1 truncate text-xs text-slate-500">{project.clientName}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${project.status === "PAUSED" ? "bg-amber-50 text-amber-700" : project.status === "COMPLETED" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {project.status || "ONGOING"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-violet-600">{project.department?.name || "Social Media"}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-400 transition group-hover:text-violet-700">View details <ChevronRight size={14} /></span>
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

export default AdminSocialMediaProjectsModal;
