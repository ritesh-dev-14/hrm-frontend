import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

import AttendanceCard from "../../components/attendece/AttendenceCard";
import DashboardHero from "../../components/dashboard/DashBoardHero";
import API from "../../services/api.js";

const completedStatuses = new Set(["COMPLETED", "VERIFIED", "CANCELLED"]);

const statusStyles = {
  ASSIGNED: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  SUBMITTED: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  UNABLE_TO_SUBMIT: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error("Failed to read the signed-in user from local storage:", error);
    return {};
  }
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const isToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export default function CoordinatorHomePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeList, setActiveList] = useState(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get(
        "/api/coordinator-assignments/my-assignment-summary"
      );
      setSummary(response?.data?.data || null);
    } catch (loadError) {
      console.error("Failed to load coordinator dashboard tasks:", loadError);
      setError(
        loadError?.response?.data?.message ||
          "Unable to load your assigned task overview."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadSummary, 0);
    window.addEventListener("focus", loadSummary);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("focus", loadSummary);
    };
  }, [loadSummary]);

  useEffect(() => {
    if (!activeList) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveList(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeList]);

  const assignedTasks = useMemo(
    () =>
      (summary?.recipients || []).flatMap((recipient) =>
        (recipient.tasks || []).map((task) => ({
          ...task,
          assignee: recipient.user,
        }))
      ),
    [summary]
  );

  const todayTasks = useMemo(
    () =>
      assignedTasks
        .filter((task) => isToday(task.assignedTime))
        .sort(
          (a, b) =>
            new Date(b.assignedTime).getTime() -
            new Date(a.assignedTime).getTime()
        ),
    [assignedTasks]
  );

  const outstandingTasks = useMemo(
    () =>
      assignedTasks
        .filter((task) => !completedStatuses.has(task.status))
        .sort(
          (a, b) =>
            new Date(a.completionDate || 0).getTime() -
            new Date(b.completionDate || 0).getTime()
        ),
    [assignedTasks]
  );

  const modalTasks =
    activeList === "today" ? todayTasks : outstandingTasks;
  const modalTitle =
    activeList === "today" ? "Tasks Assigned Today" : "Tasks Not Completed";

  return (
    <main className="min-h-screen bg-[#F6F8FB] p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <DashboardHero
          name={firstName}
          title="Welcome back"
          description="Track your attendance and keep an eye on the tasks assigned to your team."
          buttonText="Open Attendance"
          onClick={() => navigate("/attendance")}
        />

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={loadSummary}
              className="inline-flex items-center gap-2 font-bold"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section
            aria-label="Your attendance"
            className="xl:col-span-7"
          >
            <div className="h-full rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
              <AttendanceCard />
            </div>
          </section>

          <section
            aria-label="Team task overview"
            className="grid gap-5 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-1"
          >
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveList("today")}
              disabled={loading && !summary}
              className="group flex min-h-40 items-center justify-between rounded-4xl border border-indigo-100 bg-white p-6 text-left shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg disabled:cursor-wait"
            >
              <span>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CalendarCheck2 size={21} />
                </span>
                <span className="mt-4 block text-sm font-bold text-slate-500">
                  Tasks Assigned Today
                </span>
                <span className="mt-1 block text-3xl font-black tracking-tight text-slate-900">
                  {loading && !summary ? (
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                  ) : (
                    todayTasks.length
                  )}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  Click to view today&apos;s assignments
                </span>
              </span>
              <ChevronRight
                size={20}
                className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
              />
            </button>

            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setActiveList("outstanding")}
              disabled={loading && !summary}
              className="group flex min-h-40 items-center justify-between rounded-4xl border border-amber-100 bg-white p-6 text-left shadow-[0_20px_60px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg disabled:cursor-wait"
            >
              <span>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <AlertCircle size={21} />
                </span>
                <span className="mt-4 block text-sm font-bold text-slate-500">
                  Tasks Not Completed
                </span>
                <span className="mt-1 block text-3xl font-black tracking-tight text-slate-900">
                  {loading && !summary ? (
                    <Loader2 size={24} className="animate-spin text-amber-500" />
                  ) : (
                    outstandingTasks.length
                  )}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  Click to view outstanding team tasks
                </span>
              </span>
              <ChevronRight
                size={20}
                className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-600"
              />
            </button>
          </section>
        </div>
      </div>

      {activeList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveList(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="coordinator-task-dialog-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="coordinator-task-dialog-title"
                  className="text-xl font-black text-slate-900"
                >
                  {modalTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assigned by you to your team.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close task list"
                onClick={() => setActiveList(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-6">
              {modalTasks.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center text-center">
                  <CheckCircle2 size={32} className="mb-3 text-emerald-500" />
                  <p className="font-bold text-slate-800">No tasks to show</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeList === "today"
                      ? "You have not assigned any tasks today."
                      : "All of your assigned tasks are completed."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalTasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-2xl border border-slate-200 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-bold text-slate-900">
                            {task.title || "Untitled task"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Assigned to{" "}
                            <span className="font-semibold text-slate-800">
                              {task.assignee?.name || "Unknown user"}
                            </span>
                            {task.assignee?.role
                              ? ` · ${task.assignee.role}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            statusStyles[task.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Clock3 size={13} />
                          {(task.status || "UNKNOWN").replaceAll("_", " ")}
                        </span>
                      </div>

                      {task.description && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold text-slate-700">
                            Assigned:
                          </span>{" "}
                          {formatDateTime(task.assignedTime)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">
                            Due:
                          </span>{" "}
                          {formatDateTime(task.completionDate)}
                        </p>
                      </div>
                      {task.reason && (
                        <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                          <span className="font-bold">Update:</span> {task.reason}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
