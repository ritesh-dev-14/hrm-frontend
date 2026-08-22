import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  CalendarDays,
  User2,
  ChevronRight,
  ClipboardList,
  TrendingUp,
} from "lucide-react";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProfessionalLoader from "../components/ProfessionalLoader";
import CreateTaskButton from "../components/taskCreation/CreateTaskButton";
import CreateTaskModal from "../components/taskCreation/CreateTaskModal";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ASSIGNED: "bg-blue-50 text-blue-600 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  PENDING: "bg-orange-50 text-orange-600 border-orange-200",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// Keywords that identify the SEO Department
const SEO_KEYWORDS = ["seo", "seo department"];

const isSEOProject = (project) => {
  const deptName = project?.department?.name?.toLowerCase()?.trim() ?? "";
  return SEO_KEYWORDS.some((kw) => deptName.includes(kw));
};

const SEOProjectsPage = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();
  const { role } = useAuth();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/api/projects");
      const projects = response?.data?.data || [];
      // Filter only SEO Department projects
      setAllProjects(projects.filter(isSEOProject));
    } catch (error) {
      console.error("Failed to load SEO projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allProjects.filter(
      (p) =>
        p.projectName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [allProjects, searchQuery]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleProjectCreated = (project) => {
    setAllProjects((previous) => [project, ...previous]);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        >
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 mb-1 flex items-center gap-1.5">
              <TrendingUp size={13} />
              SEO Department
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              SEO
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              All projects assigned to the SEO Department
            </p>
          </div>

          {role !== "MANAGER" && <CreateTaskButton title="Add Project" onClick={() => setOpenModal(true)} />}

          {/* Stats pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-white border border-emerald-100 rounded-2xl px-5 py-3 shadow-sm"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/30">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {allProjects.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                Total Projects
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-4 md:p-6 shadow-sm"
        >
          <div className="relative w-full group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Search SEO projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-white"
            />
          </div>
        </motion.div>

        {/* PROJECTS GRID */}
        {isLoading ? (
          <ProfessionalLoader text="Loading. Please wait..." />
        ) : filteredProjects.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-300 rounded-full flex items-center justify-center mb-6">
              <ClipboardList size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              No SEO Projects Found
            </h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              {searchQuery
                ? "No projects match your search. Try a different keyword."
                : "There are no projects assigned to the SEO Department yet."}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                >
                  {/* Status + Arrow */}
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        statusStyles[project.status] || statusStyles.DRAFT
                      }`}
                    >
                      {project.status}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-emerald-500" />
                    </div>
                  </div>

                  {/* Dept badge */}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg mb-3 self-start">
                    <TrendingUp size={10} />
                    {project.department?.name || "SEO"}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {project.projectName}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-6 line-clamp-3 flex-1">
                    {project.description ||
                      "No detailed description provided for this project."}
                  </p>

                  {/* Footer */}
                  <div className="space-y-4 mt-auto border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        <span>{formatDate(project.startDate)}</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        <span>{formatDate(project.endDate)}</span>
                      </div>
                    </div>

                    {project.createdBy && (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <User2 size={16} className="text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {project.createdBy.name}
                          </p>
                          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate mt-0.5">
                            {project.createdBy.employeeId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      {role !== "MANAGER" && <CreateTaskModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onTaskCreated={handleProjectCreated}
          defaultDepartmentName="seo"
        />}
    </div>
  );
};

export default SEOProjectsPage;
