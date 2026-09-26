import { useEffect, useMemo, useState } from "react";
import { Code2, Search, Globe, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import CreateTaskButton from "../components/taskCreation/CreateTaskButton";
import CreateTaskModal from "../components/taskCreation/CreateTaskModal";
import ProfessionalLoader from "../components/ProfessionalLoader";

const isWebDevelopmentProject = (project) =>
  project?.department?.name?.toLowerCase().includes("web") ||
  project?.department?.name?.toLowerCase().includes("development");

export default function WebDevelopmentProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) {
        setCurrentPage(1); // Reset page on new search
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [search, debouncedSearch]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
        department: "Web Development",
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await API.get(`/api/projects?${params.toString()}`);
      const responseData = response?.data;
      
      const allProjects = responseData?.data?.data || responseData?.data || [];
      const pagination = responseData?.pagination || responseData?.data?.pagination || {};

      setProjects(allProjects);
      setTotalPages(pagination.totalPages || 1);
      setTotalProjects(pagination.total || allProjects.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentPage, debouncedSearch]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600">
              <Code2 size={14} /> Web Development Department
            </p>
            <h1 className="mt-2 text-3xl font-black">Web Development</h1>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            {role !== "MANAGER" && <CreateTaskButton title="Add Project" onClick={() => setOpenModal(true)} />}
          </div>
        </header>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search web development projects..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {loading ? <ProfessionalLoader text="Loading. Please wait..." /> : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-300"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none transition group-hover:from-blue-100" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${project.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {project.status}
                    </span>
                    {project.clientTier && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {project.clientTier.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative z-10">
                    <h2 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition">{project.projectName}</h2>
                    {project.clientName && (
                      <p className="text-sm font-semibold text-slate-500 mt-1">{project.clientName}</p>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 relative z-10">
                    {project.domainName && (
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} className="text-blue-500" />
                        <span className="truncate max-w-[140px]">{project.domainName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{new Date(project.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </button>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Showing page <span className="font-bold text-slate-700">{currentPage}</span> of <span className="font-bold text-slate-700">{totalPages}</span> ({totalProjects} total projects)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="py-24 text-center text-slate-500">No Web Development projects found.</div>
        )}
      </div>

      {role !== "MANAGER" && <CreateTaskModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onTaskCreated={(project) => setProjects((previous) => [project, ...previous])}
          defaultDepartmentName="web development"
        />}
    </div>
  );
}
