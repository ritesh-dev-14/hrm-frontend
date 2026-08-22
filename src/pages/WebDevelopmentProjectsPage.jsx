import { useEffect, useMemo, useState } from "react";
import { Code2, Search } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/projects");
      const allProjects = response?.data?.data || [];
      setProjects(allProjects.filter(isWebDevelopmentProject));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase();
    return projects.filter((project) =>
      `${project.projectName || ""} ${project.description || ""}`.toLowerCase().includes(query),
    );
  }, [projects, search]);

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
          {role !== "MANAGER" && <CreateTaskButton title="Add Project" onClick={() => setOpenModal(true)} />}
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
            {filteredProjects.map((project) => (
              <button
                type="button"
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="rounded-2xl border border-blue-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{project.status}</span>
                <h2 className="mt-3 text-xl font-black">{project.projectName}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-500">{project.description || "No description provided."}</p>
              </button>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
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
