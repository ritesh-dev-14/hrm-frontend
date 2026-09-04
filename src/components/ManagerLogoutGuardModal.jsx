import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ClipboardList,
  BarChart2,
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * ManagerLogoutGuardModal
 *
 * Shown when a manager tries to logout but has:
 *  - Pending EA-assigned tasks for today
 *  - Marketing Department projects without today report
 */
export default function ManagerLogoutGuardModal({ status, onClose }) {
  const navigate = useNavigate();

  if (!status) return null;

  const hasPendingTasks = status.pendingEaTasks?.length > 0;
  const hasPendingReports = status.pendingMarketingReports?.length > 0;

  const STATUS_COLORS = {
    ASSIGNED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    IN_PROGRESS: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };

  const getStatusStyle = (s) =>
    STATUS_COLORS[s] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Cannot Logout Yet</h2>
                <p className="text-sm text-red-100 mt-0.5">
                  Complete today&apos;s obligations before leaving
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">

            {/* EA Tasks Section */}
            {hasPendingTasks && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <ClipboardList size={15} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Pending EA Tasks for Today
                  </p>
                  <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {status.pendingEaTasks.length} pending
                  </span>
                </div>
                <div className="space-y-2">
                  {status.pendingEaTasks.map((task, i) => {
                    const s = getStatusStyle(task.status);
                    return (
                      <div
                        key={task.assignmentId || i}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${s.border} ${s.bg}`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">
                            {task.projectName || "Untitled Task"}
                          </p>
                          {task.assignedBy?.name && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Assigned by: {task.assignedBy.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${s.bg} ${s.text} border ${s.border}`}
                        >
                          {task.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate("/projects");
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 py-2.5 rounded-xl border border-indigo-200 transition-colors"
                >
                  Go to Tasks
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Divider */}
            {hasPendingTasks && hasPendingReports && (
              <div className="border-t border-slate-100" />
            )}

            {/* Marketing Reports Section */}
            {hasPendingReports && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                    <BarChart2 size={15} className="text-orange-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Missing Marketing Reports (Today)
                  </p>
                  <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {status.pendingMarketingReports.length} missing
                  </span>
                </div>
                <div className="space-y-2">
                  {status.pendingMarketingReports.map((project, i) => (
                    <div
                      key={project.projectId || i}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">
                          {project.projectName || "Unnamed Project"}
                        </p>
                        {project.clientName && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Client: {project.clientName}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                        Report Missing
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-slate-400" />
              Complete all items above to unlock logout
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
