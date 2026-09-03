import { useState, useEffect } from "react";
import { refreshManagerLogoutStatus } from "../../utils/managerLogoutStatus";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, ClipboardList, BarChart2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ManagerPendingPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "MANAGER") {
      refreshManagerLogoutStatus().then((res) => {
        setStatus(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [role]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 h-full">
        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
      </div>
    );
  }

  const hasPendingTasks = status?.pendingEaTasks?.length > 0;
  const hasPendingReports = status?.pendingMarketingReports?.length > 0;
  const canLogout = status?.canLogout;

  const STATUS_COLORS = {
    ASSIGNED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    IN_PROGRESS: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };

  const getStatusStyle = (s) =>
    STATUS_COLORS[s] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  return (
    <div className="max-w-4xl mx-auto py-8 px-5 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Obligations</h1>
        <p className="text-sm text-slate-500 mt-1">Complete your assigned tasks and reports to unlock logout.</p>
      </div>

      {!hasPendingTasks && !hasPendingReports ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">All caught up!</h2>
          <p className="text-emerald-700 mt-2">You have completed all pending obligations for today.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* EA Tasks Section */}
          {hasPendingTasks && (
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <ClipboardList size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pending EA Tasks</h2>
                  <p className="text-sm text-slate-500">Tasks assigned by EA today that are not completed.</p>
                </div>
                <span className="ml-auto bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">
                  {status.pendingEaTasks.length} pending
                </span>
              </div>
              
              <div className="space-y-3">
                {status.pendingEaTasks.map((task, i) => {
                  const s = getStatusStyle(task.status);
                  return (
                    <div
                      key={task.assignmentId || i}
                      className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${s.border} ${s.bg}`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {task.projectName || "Untitled Task"}
                        </p>
                        {task.assignedBy?.name && (
                          <p className="text-sm text-slate-600 mt-1">
                            Assigned by: {task.assignedBy.name}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-bold uppercase px-3 py-1.5 rounded-xl ${s.bg} ${s.text} border ${s.border}`}>
                        {task.status}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={() => navigate("/projects")}
                className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl transition-all"
              >
                Go to Tasks
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Marketing Reports Section */}
          {hasPendingReports && (
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <BarChart2 size={20} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Missing Marketing Reports</h2>
                  <p className="text-sm text-slate-500">Running marketing projects missing today's report.</p>
                </div>
                <span className="ml-auto bg-orange-100 text-orange-700 text-sm font-bold px-3 py-1 rounded-full">
                  {status.pendingMarketingReports.length} missing
                </span>
              </div>
              
              <div className="space-y-3">
                {status.pendingMarketingReports.map((project, i) => (
                  <div
                    key={project.projectId || i}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-orange-200 bg-orange-50/50"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {project.projectName || "Unnamed Project"}
                      </p>
                      {project.clientName && (
                        <p className="text-sm text-slate-600 mt-1">
                          Client: {project.clientName}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-bold uppercase px-3 py-1.5 rounded-xl bg-orange-100 text-orange-700 border border-orange-200">
                      Report Missing
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => navigate("/marketing")}
                className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 py-3 rounded-xl transition-all"
              >
                Go to Marketing Reports
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
