import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCw,
  UserRound,
} from "lucide-react";
import API from "../../services/api";

const summaryCards = [
  { id: "total", label: "Tasks Assigned", icon: ClipboardList, color: "indigo" },
  { id: "completed", label: "Completed", icon: CheckCircle2, color: "emerald" },
  { id: "inProgress", label: "In Progress", icon: Clock3, color: "blue" },
  { id: "pending", label: "Awaiting Action", icon: BarChart3, color: "amber" },
];

const colorStyles = {
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
};

const statusStyles = {
  ASSIGNED: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  SUBMITTED: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
  UNABLE_TO_SUBMIT: "bg-rose-50 text-rose-700",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export default function CoordinatorTaskProgressPage() {
  const [summary, setSummary] = useState(null);
  const [expandedRecipientId, setExpandedRecipientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/api/coordinator-assignments/my-assignment-summary");
      setSummary(response?.data?.data || null);
    } catch (loadError) {
      console.error("Failed to load coordinator task progress:", loadError);
      setError(loadError?.response?.data?.message || "Unable to load task progress.");
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

  const recipients = summary?.recipients || [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
              <BarChart3 size={14} /> Coordinator reports
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Task Progress by Assignee
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              See how many tasks you assigned to each person and their completion status.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span>{error}</span>
            <button type="button" onClick={loadSummary} className="font-bold underline">
              Try again
            </button>
          </div>
        )}

        <section aria-label="Task totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ id, label, icon: Icon, color }) => (
            <article key={id} className={`rounded-2xl border p-5 ${colorStyles[color]}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-3xl font-black">
                {loading ? "—" : summary?.[id] ?? 0}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Progress by employee</h2>
              <p className="mt-1 text-xs text-slate-500">
                Includes employees, managers, HR, and Admins assigned tasks by your account.
              </p>
            </div>
            {!loading && (
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {recipients.length} {recipients.length === 1 ? "assignee" : "assignees"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center text-slate-400">
              <Loader2 size={26} className="animate-spin" />
            </div>
          ) : recipients.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <UserRound size={30} className="mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">No assigned tasks yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Tasks you assign will be summarized here by recipient.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recipients.map((recipient) => {
                const isExpanded = expandedRecipientId === recipient.user.id;
                const progress = recipient.total
                  ? Math.round((recipient.completed / recipient.total) * 100)
                  : 0;

                return (
                  <article key={recipient.user.id}>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedRecipientId(isExpanded ? null : recipient.user.id)}
                      className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:grid-cols-[minmax(200px,1.4fr)_repeat(4,minmax(90px,0.65fr))_minmax(140px,1fr)_20px] sm:items-center sm:px-6"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                          {(recipient.user.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800">
                            {recipient.user.name}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {recipient.user.email}
                          </span>
                          <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                            {recipient.user.role}
                          </span>
                        </span>
                      </span>
                      <Metric label="Assigned" value={recipient.total} />
                      <Metric label="Completed" value={recipient.completed} valueClass="text-emerald-700" />
                      <Metric label="In progress" value={recipient.inProgress} valueClass="text-blue-700" />
                      <Metric label="Submitted" value={recipient.submitted} valueClass="text-violet-700" />
                      <span>
                        <span className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Completion</span><span>{progress}%</span>
                        </span>
                        <span className="block h-2 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="block h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </span>
                      </span>
                      <ChevronDown
                        size={17}
                        className={`hidden text-slate-400 transition-transform sm:block ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 bg-slate-50 px-5 py-4 sm:px-6">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Assigned tasks ({recipient.tasks.length})
                        </p>
                        {recipient.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span>
                              <span className="block text-sm font-semibold text-slate-800">{task.title}</span>
                              <span className="mt-1 block text-xs text-slate-400">
                                Due {formatDate(task.completionDate)}
                                {task.completedAt ? ` · Completed ${formatDate(task.completedAt)}` : ""}
                              </span>
                            </span>
                            <span className={`self-start rounded-md px-2.5 py-1 text-[11px] font-bold ${statusStyles[task.status] || "bg-slate-100 text-slate-600"}`}>
                              {String(task.status).replaceAll("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, valueClass = "text-slate-800" }) {
  return (
    <span className="flex items-baseline justify-between gap-2 sm:block">
      <span className="text-[11px] font-medium text-slate-400 sm:block">{label}</span>
      <span className={`text-lg font-black ${valueClass}`}>{value}</span>
    </span>
  );
}
