import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Loader2,
  CalendarDays,
  User2,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";

import TaskStats from "../../components/taskCreation/TaskStats";
import CreateTaskButton from "../../components/taskCreation/CreateTaskButton";
import CreateTaskModal from "../../components/taskCreation/CreateTaskModal";

import API from "../../services/api";

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
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const HrTaskCreation = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/api/projects");
      setTasks(response?.data?.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskClick = (task) => {
    navigate(`/project/${task.id}`);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      return task.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [tasks, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">Project Management</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Projects
            </h1>
          </div>
          <CreateTaskButton title="Create Project" onClick={() => setOpenModal(true)} />
        </motion.div>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <TaskStats tasks={tasks} />
        </motion.div>

        {/* FILTERS & SEARCH */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-white"
            />
          </div>
        </motion.div>

        {/* PROJECTS GRID */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 shadow-sm">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-semibold text-indigo-900 tracking-wide">Loading projects...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
              <ClipboardList size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Projects Found</h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              We couldn't find any projects matching your current filters. Adjust your search or create a new project.
            </p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTasks.map((task) => (
                <motion.div
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusStyles[task.status]}`}>
                      {task.status}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={16} className="text-indigo-500" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {task.projectName}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-6 line-clamp-3 flex-1">
                    {task.description || "No detailed description provided for this project."}
                  </p>

                  <div className="space-y-4 mt-auto border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        <span>{formatDate(task.startDate)}</span>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        <span>{formatDate(task.endDate)}</span>
                      </div>
                    </div>

                    {task.createdBy && (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <User2 size={16} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {task.createdBy.name}
                          </p>
                          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 truncate mt-0.5">
                            {task.createdBy.employeeId}
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

        {/* MODAL */}
        <CreateTaskModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      </div>
    </div>
  );
};

export default HrTaskCreation;
