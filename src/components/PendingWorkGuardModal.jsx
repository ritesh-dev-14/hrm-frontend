import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BarChart2, ClipboardList, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const upper = (value) => String(value || "").toUpperCase();

const getItemTitle = (item, isReport) =>
  item?.title || item?.taskTitle || item?.reportTitle || item?.projectName || item?.name ||
  (isReport ? "Marketing report" : "Assigned task");

const getItemId = (item) =>
  item?.id || item?._id || item?.taskId || item?.taskItemId || item?.assignmentId ||
  item?.reportId || item?.projectId || "Not available";

const getDueDate = (item) =>
  item?.dueDate || item?.dueAt || item?.deadline || item?.date || "Not specified";

const getNavigationPath = (item, isReport, isManager) => {
  if (item?.path || item?.route) return item.path || item.route;
  const id = item?.id || item?._id || item?.taskId || item?.taskItemId || item?.assignmentId || item?.reportId || item?.projectId;
  if (isReport) return item?.projectId ? `/project/${item.projectId}` : "/marketing";
  return isManager ? "/manager-pending" : "/employee-pending";
};

const normalizeStatus = (status) => {
  const isManager = upper(status?.role) === "MANAGER" ||
    Array.isArray(status?.pendingEaTasks) || Array.isArray(status?.pendingMarketingReports);
  const taskItems = isManager
    ? status?.pendingEaTasks || []
    : [...(status?.pendingTasks || []), ...(status?.pendingEaAssignments || [])];
  const reportItems = isManager ? status?.pendingMarketingReports || [] : [];

  return {
    isManager,
    taskItems: Array.isArray(taskItems) ? taskItems : [],
    reportItems: Array.isArray(reportItems) ? reportItems : [],
  };
};

export default function PendingWorkGuardModal({ status, onClose, action = "logout" }) {
  const navigate = useNavigate();
  if (!status) return null;

  const { isManager, taskItems, reportItems } = normalizeStatus(status);
  const hasItems = taskItems.length > 0 || reportItems.length > 0;
  const message = status.message || status.errorMessage ||
    "All assigned work must be completed before you can end work or logout.";
  const openItem = (item, isReport) => {
    onClose?.();
    navigate(getNavigationPath(item, isReport, isManager));
  };

  const renderItem = (item, isReport, index) => (
    <div key={`${getItemId(item)}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{getItemTitle(item, isReport)}</p>
          <p className="mt-1 text-xs text-slate-500">ID: {getItemId(item)}</p>
          <p className="text-xs text-slate-500">Due: {getDueDate(item)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
          {item?.status || (isReport ? item?.approvalStatus : "PENDING")}
        </span>
      </div>
      <button
        type="button"
        onClick={() => openItem(item, isReport)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
      >
        Open {isReport ? "report" : "task"} <ArrowRight size={14} />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-xl overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl"
        >
          <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white">
            <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-white/20">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} />
              <div>
                <h2 className="text-xl font-bold">Cannot {action === "end-work" ? "End Work" : "Logout"} Yet</h2>
                <p className="mt-1 text-sm text-amber-50">{message}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
            {!hasItems && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Pending work details are not available yet. Refresh the status and try again.
              </p>
            )}
            {taskItems.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardList size={17} className="text-indigo-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                    {isManager ? "Pending EA tasks" : "Pending assigned tasks"}
                  </h3>
                </div>
                <div className="space-y-2">{taskItems.map((item, index) => renderItem(item, false, index))}</div>
              </section>
            )}
            {reportItems.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BarChart2 size={17} className="text-orange-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Pending marketing reports</h3>
                </div>
                <div className="space-y-2">{reportItems.map((item, index) => renderItem(item, true, index))}</div>
              </section>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}