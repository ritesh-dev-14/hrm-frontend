import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Loader2,
  CalendarDays,
  User2,
  ChevronRight,
  Search,
  Edit,
  ClipboardList,
} from "lucide-react";
import ProfessionalLoader from "../components/ProfessionalLoader";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import CreateTaskButton from "../components/taskCreation/CreateTaskButton";
import MetaAdsProjectModal from "../components/projects/MetaAdsProjectModal";

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

// Keywords that identify the Marketing Department
const MARKETING_KEYWORDS = [
  "marketing",
  "marketing department",
  "performance marketing",
];

const isMarketingProject = (project) => {
  const deptName = project?.department?.name?.toLowerCase()?.trim() ?? "";
  return MARKETING_KEYWORDS.some((kw) => deptName.includes(kw));
};

const getMetaAdsDetails = (project) =>
  project?.metaAds ||
  project?.metaAdsDetails ||
  project?.marketingDetails ||
  project?.projectDetails ||
  project?.metadata ||
  {};

const normalizeMetaAdsProject = (project) => {
  const details = getMetaAdsDetails(project);
  const assignments = project?.assignments || details?.assignments || [];
  return {
    ...project,
    clientName: project?.clientName || details?.clientName || project?.client?.name || "",
    monthlyBudget: project?.monthlyBudget ?? details?.monthlyBudget,
    objective: project?.objective || details?.objective || "",
    area: project?.area || details?.area || details?.areaName || "",
    fundsAddedBy: project?.fundsAddedBy || details?.fundsAddedBy || "",
    assignments,
  };
};

const MarketingProjectsPage = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [runningFilter, setRunningFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [updatingProjectId, setUpdatingProjectId] = useState(null);

  const navigate = useNavigate();
  const { role } = useAuth();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/api/projects");
      const projects = response?.data?.data || [];
      // Filter only Marketing Department projects
      const marketingProjects = projects.filter(isMarketingProject).map(normalizeMetaAdsProject);
      const detailedProjects = await Promise.all(
        marketingProjects.map(async (project) => {
          try {
            const detailResponse = await API.get(`/api/projects/${project.id || project._id}`);
            const details = detailResponse?.data?.data || detailResponse?.data;
            return normalizeMetaAdsProject({ ...project, ...details });
          } catch {
            return project;
          }
        }),
      );
      setAllProjects(detailedProjects);
    } catch (error) {
      console.error("Failed to load marketing projects:", error);
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
      (p) => {
        const matchesSearch =
          p.projectName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q);
        const isRunning = p.isRunning === true || p.isRunning === "true";
        const matchesRunningFilter =
          runningFilter === "all" ||
          (runningFilter === "running" && isRunning) ||
          (runningFilter === "not-running" && !isRunning);
        return matchesSearch && matchesRunningFilter;
      },
    );
  }, [allProjects, searchQuery, runningFilter]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleProjectCreated = (project) => {
    if (projectToEdit) {
      const editedId = String(projectToEdit.id || projectToEdit._id);
      setAllProjects((previous) =>
        previous.map((p) =>
          String(p.id || p._id) === editedId
            ? normalizeMetaAdsProject({ ...p, ...project })
            : p
        )
      );
      setProjectToEdit(null);
    } else {
      setAllProjects((previous) => [normalizeMetaAdsProject(project), ...previous]);
    }
  };

  const toggleProjectRunning = async (event, project) => {
    event.stopPropagation();
    const projectId = project.id || project._id;
    const nextIsRunning = !(project.isRunning === true || project.isRunning === "true");
    try {
      setUpdatingProjectId(projectId);
      await API.patch(`/api/projects/${projectId}`, { isRunning: nextIsRunning });
      setAllProjects((previous) => previous.map((item) => (
        String(item.id || item._id) === String(projectId)
          ? { ...item, isRunning: nextIsRunning }
          : item
      )));
    } catch (error) {
      console.error("Failed to update Meta Ads running status:", error);
    } finally {
      setUpdatingProjectId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
        >
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-pink-500 mb-1 flex items-center gap-1.5">
              <Megaphone size={13} />
              Marketing Department
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Meta Ads
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              All projects assigned to the Marketing Department
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4 sm:ml-auto">
            {role !== "MANAGER" && <CreateTaskButton title="Add Project" onClick={() => setOpenModal(true)} />}

            {/* Stats pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-white border border-pink-100 rounded-2xl px-5 py-3 shadow-sm"
            >
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md shadow-pink-500/30">
              <Megaphone size={20} className="text-white" />
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
          </div>
        </motion.div>

        {/* SEARCH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-4 md:p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative w-full group">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Search meta ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 transition-all bg-white"
            />
            </div>
            <select
              value={runningFilter}
              onChange={(event) => setRunningFilter(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 md:min-w-44"
              aria-label="Filter projects by running status"
            >
              <option value="all">All Projects</option>
              <option value="running">Running Ads</option>
              <option value="not-running">Not Running Ads</option>
            </select>
          </div>
        </motion.div>

        {/* PROJECTS GRID */}
        {isLoading ? (
          <ProfessionalLoader text="Loading. Please wait..." />
        ) : filteredProjects.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-pink-50 text-pink-300 rounded-full flex items-center justify-center mb-6">
              <ClipboardList size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              No Meta Ads Found
            </h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              {searchQuery || runningFilter !== "all"
                ? "No projects match your search. Try a different keyword."
                : "There are no projects assigned to the Marketing Department yet."}
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
                (() => {
                  const isRunning = project.isRunning === true || project.isRunning === "true";
                  return (
                <motion.div
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={project.id}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className={`${isRunning ? "bg-emerald-50/90 border-emerald-200" : "bg-red-50/90 border-red-200"} backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full border-2`}
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
                    <div className="flex gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setProjectToEdit(project); setOpenModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-pink-600 transition-colors">
                        <Edit size={16} />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} className="text-pink-500" />
                      </div>
                    </div>
                  </div>

                  {/* Dept badge */}
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 border border-pink-100 px-2.5 py-1 rounded-lg mb-3 self-start">
                    <Megaphone size={10} />
                    {project.department?.name || "Marketing"}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                    {project.projectName}
                  </h3>
                  <div className="mb-6 flex-1 space-y-2 text-xs font-semibold text-slate-600">
                    <p><span className="font-bold text-slate-400">Client:</span> {project.clientName || project.projectName || "-"}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <p><span className="font-bold text-slate-400">Budget:</span> {project.monthlyBudget ?? "-"}</p>
                      <p><span className="font-bold text-slate-400">Area:</span> {project.area || "-"}</p>
                      <p><span className="font-bold text-slate-400">Objective:</span> {project.objective || "-"}</p>
                      <p><span className="font-bold text-slate-400">Funds:</span> {project.fundsAddedBy || "-"}</p>
                    </div>
                    <p><span className="font-bold text-slate-400">Manager:</span> {project.assignments?.map((assignment) => assignment.manager?.name || assignment.manager?.fullName || assignment.manager?.employeeId || assignment.managerId).filter(Boolean).join(", ") || project.assignedTo?.name || project.assignedTo?.fullName || "-"}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p><span className="font-bold text-slate-400">Running:</span> <span className={`font-black ${isRunning ? "text-emerald-600" : "text-red-600"}`}>{isRunning ? "Yes" : "No"}</span></p>
                      {role === "MANAGER" && <button type="button" onClick={(event) => toggleProjectRunning(event, project)} disabled={updatingProjectId === (project.id || project._id)} className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition disabled:opacity-50 ${isRunning ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>{updatingProjectId === (project.id || project._id) ? "Updating" : isRunning ? "Set No" : "Set Yes"}</button>}
                    </div>
                  </div>

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
                        <div className="h-9 w-9 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
                          <User2 size={16} className="text-pink-500" />
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
                  );
                })()
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      {role !== "MANAGER" && <MetaAdsProjectModal
          open={openModal}
          onClose={() => { setOpenModal(false); setProjectToEdit(null); }}
          onProjectCreated={handleProjectCreated}
          defaultDepartmentName="marketing"
          projectToEdit={projectToEdit}
        />}
    </div>
  );
};

export default MarketingProjectsPage;
