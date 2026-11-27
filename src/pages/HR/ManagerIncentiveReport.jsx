import { useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, FileText, RefreshCw, TrendingUp, XCircle } from "lucide-react";
import API from "../../services/api";

const getTodayDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatDate = (date) =>
  date
    ? new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const periods = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function ManagerIncentiveReport() {
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState(getTodayDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestReport = useCallback(
    () => API.get("/api/manager-incentives", { params: { period, date } }),
    [date, period],
  );

  useEffect(() => {
    let active = true;
    requestReport()
      .then((response) => {
        if (!active) return;
        setReport(response.data?.data || null);
        setError("");
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError?.response?.data?.message || "Unable to load manager incentive scores.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestReport]);

  const loadReport = useCallback(() => {
    setLoading(true);
    setError("");
    requestReport()
      .then((response) => {
        setReport(response.data?.data || null);
      })
      .catch((requestError) => {
        setError(requestError?.response?.data?.message || "Unable to load manager incentive scores.");
      })
      .finally(() => setLoading(false));
  }, [requestReport]);

  const managers = report?.managers || [];
  const expectedTotal = managers.reduce((sum, manager) => sum + manager.expectedCount, 0);
  const completedTotal = managers.reduce((sum, manager) => sum + manager.completedCount, 0);
  const scoreTotal = expectedTotal ? Math.round((completedTotal / expectedTotal) * 100) : null;
  const periodLabel = periods.find((item) => item.value === period)?.label || "Daily";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
              <TrendingUp size={15} /> Manager performance
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Incentive Scores</h1>
            <p className="mt-1 text-sm text-slate-500">
              Meta Ads, SEO, and Coordinator-assigned tasks, scored out of 100.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {periods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={period === item.value}
                  onClick={() => {
                        setLoading(true);
                        setPeriod(item.value);
                      }}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    period === item.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <CalendarDays size={16} className="text-slate-400" />
              <input
                type="date"
                value={date}
                max={getTodayDate()}
                onChange={(event) => {
                  setLoading(true);
                  setDate(event.target.value);
                }}
                className="min-w-0 bg-transparent text-sm font-semibold outline-none"
              />
            </label>
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        {report && (
          <p className="text-sm font-medium text-slate-500">
            {periodLabel} period: {formatDate(report.fromDate)} – {formatDate(report.toDate)}
            {report.toDate !== report.fromDate && report.toDate === getTodayDate() && " (through today)"}
          </p>
        )}

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Managers", value: managers.length, icon: FileText, tone: "text-indigo-600 bg-indigo-50" },
            { label: "Expected tasks", value: expectedTotal, icon: CalendarDays, tone: "text-amber-600 bg-amber-50" },
            { label: "Counted tasks", value: completedTotal, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
            { label: "Overall score", value: scoreTotal == null ? "—" : `${scoreTotal}/100`, icon: TrendingUp, tone: "text-violet-600 bg-violet-50" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={19} />
              </div>
              <p className="text-2xl font-black">{loading ? "…" : value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Manager breakdown</h2>
            <p className="mt-1 text-xs text-slate-500">
              SEO and Meta Ads reasons require screenshot evidence. Coordinator tasks count when completed or when a reason is submitted; no screenshot is required for Coordinator task reasons.
            </p>
          </div>
          {loading ? (
            <div className="p-10 text-center text-sm font-medium text-slate-500">Loading incentive scores…</div>
          ) : managers.length === 0 ? (
            <div className="p-10 text-center text-sm font-medium text-slate-500">
              No assigned SEO projects, Meta Ads campaigns, or Coordinator tasks in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Manager</th>
                    <th className="px-5 py-3">SEO</th>
                    <th className="px-5 py-3">Meta Ads</th>
                    <th className="px-5 py-3">Coordinator tasks</th>
                    <th className="px-5 py-3">Completed</th>
                    <th className="px-5 py-3">Expected</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managers.map((manager) => (
                    <tr key={manager.managerId} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{manager.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{manager.employeeId}</p>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className="font-semibold">{manager.seoCompletedCount}/{manager.seoExpectedCount}</span>
                        <span className="ml-2 text-xs text-slate-500">{manager.seoScore == null ? "—" : `${manager.seoScore}%`}</span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className="font-semibold">{manager.metaAdsCompletedCount}/{manager.metaAdsExpectedCount}</span>
                        <span className="ml-2 text-xs text-slate-500">{manager.metaAdsScore == null ? "—" : `${manager.metaAdsScore}%`}</span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <span className="font-semibold">{manager.coordinatorCompletedCount}/{manager.coordinatorExpectedCount}</span>
                        <span className="ml-2 text-xs text-slate-500">{manager.coordinatorScore == null ? "—" : `${manager.coordinatorScore}%`}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-emerald-700">{manager.completedCount}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{manager.expectedCount}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-lg px-2.5 py-1 text-sm font-black ${
                          manager.score >= 80 ? "bg-emerald-50 text-emerald-700" : manager.score >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        }`}>
                          {manager.score}/100
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-bold text-indigo-700 hover:text-indigo-900">
                            View tasks
                          </summary>
                          <div className="mt-3 min-w-[360px] space-y-2">
                            {manager.tasks.map((task, index) => (
                              <div key={`${task.date}-${task.category}-${task.itemName}-${index}`} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                      {task.category === "META_ADS"
                                        ? "Meta Ads"
                                        : task.category === "COORDINATOR"
                                          ? "Coordinator task"
                                          : "SEO"} · {formatDate(task.date)}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                      {task.category === "COORDINATOR"
                                        ? task.itemName
                                        : `${task.projectName}${task.category === "META_ADS" ? ` · ${task.itemName}` : ""}`}
                                    </p>
                                    {task.assignedBy && (
                                      <p className="mt-1 text-xs text-slate-500">Assigned by {task.assignedBy}</p>
                                    )}
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${task.completed ? "text-emerald-700" : "text-red-700"}`}>
                                    {task.completed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                    {task.category === "COORDINATOR"
                                      ? task.completed
                                        ? task.completionType === "UNABLE_TO_SUBMIT" ? "Reason submitted" : "Task completed"
                                        : task.status === "SUBMITTED" ? "Awaiting approval" : "Not counted"
                                      : task.completed
                                        ? task.completionType === "UNABLE_TO_SUBMIT" ? "Reason submitted" : "Report submitted"
                                        : "Not counted"}
                                  </span>
                                </div>
                                {task.reason && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{task.reason}</p>}
                                {task.screenshotUrl && (
                                  <a href={task.screenshotUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-indigo-700 underline">
                                    View evidence screenshot
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
