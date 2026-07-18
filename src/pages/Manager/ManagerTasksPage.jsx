import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Loader2,
  CalendarDays,
  User2,
  ChevronRight,
  Briefcase
} from "lucide-react";

import TaskStats from "../../components/taskCreation/TaskStats";
import CreateTaskModal from "../../components/taskCreation/CreateTaskModal";

import API from "../../services/api";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ASSIGNED: "bg-indigo-50 text-indigo-600 border-indigo-200",
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
const ManagerTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetching all workspace project resources
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

  // Redirecting click events seamlessly to the project detail view
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

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-2">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">
              Workspace Overview
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Briefcase size={32} className="text-indigo-600" />
              Assigned Projects
            </h1>
          </div>

          {/* <CreateTaskButton
            title="Create Project"
            onClick={() => setOpenModal(true)}
          /> */}
        </motion.div>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <TaskStats tasks={tasks} />
        </motion.div>

        {/* LIST SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
          
          {/* TOP */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList size={20} className="text-indigo-500" />
              All Projects
            </h2>
            <div className="px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-indigo-600 rounded-full shadow-sm">
              {tasks.length} Records
            </div>
          </div>

          {/* LOADING */}
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader2 size={36} className="animate-spin text-indigo-500 mb-4" />
              <p className="text-sm font-semibold text-indigo-900 tracking-wide">
                Loading projects...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ClipboardList size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No Projects Found
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm">
                Any assigned projects will appear here for your management.
              </p>
            </div>
          ) : (
            <div>
              {/* TABLE HEADER - DESKTOP */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 border-b border-slate-100/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="col-span-5">Project Details</div>
                <div className="col-span-2">Start Date</div>
                <div className="col-span-2">End Date</div>
                <div className="col-span-3">Assigned User</div>
              </div>
              {/* ROWS */}
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100/60">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      variants={itemVariants}
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="group px-6 sm:px-8 py-6 cursor-pointer hover:bg-indigo-50/30 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* DESKTOP VIEW */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 pr-4">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {task.projectName}
                          </h3>
                          <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1">
                            {task.description || "No description provided"}
                          </p>
                        </div>

                        <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm transition-all">
                            <CalendarDays size={16} />
                          </div>
                          {formatDate(task.startDate)}
                        </div>

                        <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-violet-500 group-hover:shadow-sm transition-all">
                            <CalendarDays size={16} />
                          </div>
                          {formatDate(task.endDate)}
                        </div>

                        <div className="col-span-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center shrink-0">
                              <User2 size={16} className="text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-900">
                                {task.createdBy?.name || "Unassigned"}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate mt-0.5">
                                {task.createdBy?.employeeId || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <ChevronRight size={16} className="text-indigo-600" />
                          </div>
                        </div>
                      </div>

                      {/* MOBILE VIEW */}
                      <div className="lg:hidden flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">
                              {task.projectName}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 line-clamp-2">
                              {task.description || "No description"}
                            </p>
                          </div>
                          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-50 flex items-center justify-center shadow-sm">
                            <ChevronRight size={16} className="text-indigo-500" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Start Date
                            </p>
                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                              <CalendarDays size={14} className="text-indigo-400" />
                              {formatDate(task.startDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              End Date
                            </p>
                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                              <CalendarDays size={14} className="text-violet-400" />
                              {formatDate(task.endDate)}
                            </p>
                          </div>
                        </div>

                        {task.createdBy && (
                          <div className="flex items-center gap-3 pt-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center">
                              <User2 size={18} className="text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {task.createdBy.name}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
            </div>
          )}
        </motion.div>

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

export default ManagerTaskPage;