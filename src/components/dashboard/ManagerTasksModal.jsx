import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, AlertTriangle, CheckCircle2, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManagerTasksModal({ isOpen, onClose, title, icon: Icon, color, bg, tasks = [] }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[80vh] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={24} className={color} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-sm font-medium text-slate-500">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"} found
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {tasks.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <FileText size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No tasks here</h3>
                <p className="text-sm text-slate-500 mt-1">There are currently no tasks in this category.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 group hover:border-indigo-200 transition-colors cursor-pointer"
                    onClick={() => navigate('/projects')}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                          {task.status}
                        </span>
                        {task.taskItem?.dueDate && (
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            Due: {new Date(task.taskItem.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-800 line-clamp-1 mb-1">
                        {task.taskItem?.title || "Untitled Task"}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-black">
                          {task.employee?.name?.[0]}
                        </span>
                        Assigned to {task.employee?.name}
                      </p>
                    </div>
                    
                    <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
