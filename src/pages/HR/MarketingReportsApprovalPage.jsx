import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import API from "../../services/api";

const getMessage = (error, fallback) => {
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "Report or project not found.";
  return error?.response?.data?.message || fallback;
};

const getReports = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : data?.items || data?.reports || [];
};

const dateKey = (value) => {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};

const localToday = () => dateKey(new Date());

const uniqueById = (items, fallbackKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.id || item?._id || fallbackKey(item);
    if (seen.has(String(key))) return false;
    seen.add(String(key));
    return true;
  });
};

const uniqueByKey = (items, keyFactory) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(keyFactory(item));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const reportBusinessKey = (report) => [
  report?.projectName || report?.project?.projectName || report?.project?.name || "project",
  dateKey(report?.date),
].map((value) => String(value).trim().toLowerCase()).join("-");

const displayValue = (value) => value == null || value === "" ? "-" : String(value);
const displayBoolean = (value) => value == null ? "-" : value ? "Yes" : "No";
const displayDate = (value) => value ? new Date(value).toLocaleDateString() : "-";

export default function MarketingReportsApprovalPage() {
  const [allReports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [message, setMessage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(localToday);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const projectsResponse = await API.get("/api/projects");
      const projects = uniqueById(
        getReports(projectsResponse).filter((project) =>
          String(project?.department?.name || project?.department || "").toLowerCase().includes("marketing"),
        ),
        (project) => `${project?.projectName || project?.name || "project"}-${project?.clientName || "client"}`,
      );
      const reportResponses = await Promise.all(
        projects.map(async (project) => {
          const projectId = project.id || project._id;
          if (!projectId) return [];
          try {
            const response = await API.get(`/api/marketing-reports?projectId=${encodeURIComponent(projectId)}`);
            return getReports(response).map((report) => ({
              ...report,
              projectName: report.projectName || project.projectName || project.name,
              clientName: report.clientName || project.clientName,
            }));
          } catch {
            return [];
          }
        }),
      );
      setReports(uniqueByKey(reportResponses.flat(), reportBusinessKey));
    } catch (error) {
      setMessage({ type: "error", text: getMessage(error, "Unable to load marketing reports.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const reports = uniqueByKey(
    allReports.filter((report) => dateKey(report.date) === selectedDate),
    reportBusinessKey,
  );

  const updateReviewNote = (reportId, value) => {
    setReviewNotes((current) => ({ ...current, [reportId]: value }));
  };

  const reviewReport = async (reportId, status) => {
    const reviewNote = reviewNotes[reportId]?.trim() || "";
    if (status === "REJECTED" && !reviewNote) {
      setMessage({ type: "error", text: "Please provide a review note when rejecting a report." });
      return;
    }
    setReviewingId(reportId);
    setMessage(null);
    try {
      await API.patch(`/api/marketing-reports/${reportId}/review`, {
        status,
        reviewNote: reviewNote || "Approved",
      });
      setReviewNotes((current) => {
        const next = { ...current };
        delete next[reportId];
        return next;
      });
      setMessage({ type: "success", text: status === "APPROVED" ? "Report approved." : "Report rejected." });
      await loadReports();
      await import("../../utils/managerLogoutStatus").then(({ refreshManagerLogoutStatus }) => refreshManagerLogoutStatus()).catch(() => {});
    } catch (error) {
      setMessage({ type: "error", text: getMessage(error, "Unable to review this report.") });
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-600">Marketing Department</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Marketing Reports Approval</h1>
            <p className="mt-1 text-sm text-slate-500">Review today&apos;s manager reports and unable-to-submit reasons.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="sr-only">Filter reports by date</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent text-sm font-semibold text-slate-600 outline-none" aria-label="Filter reports by date" />
            </label>
            <button type="button" onClick={loadReports} disabled={loading} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-100 disabled:opacity-50" aria-label="Refresh reports">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {message && <div className={`mb-6 rounded-xl border p-4 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div> : reports.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No marketing reports found.</div> : <div className="space-y-4">
          {reports.map((report) => {
            const id = report.id || report._id;
            const status = report.approvalStatus || report.status || "PENDING";
            const reviewNote = reviewNotes[id] || "";
            const isReviewing = reviewingId === id;
            return <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900">{report.projectName || report.project?.projectName || "Marketing project"}</h2>
                  <p className="mt-1 text-sm text-slate-600">Manager: {report.managerName || report.manager?.name || report.createdBy?.name || "-"}</p>
                  <p className="mt-1 text-xs text-slate-500">Date: {report.date ? new Date(report.date).toLocaleDateString() : "-"} · Running: {report.isAdRunning == null ? "Unable to submit" : report.isAdRunning ? "Yes" : "No"}</p>
                </div>
                <span className={`rounded-lg px-3 py-1 text-xs font-black ${status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{status}</span>
              </div>
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-wider text-indigo-700">Manager&apos;s submitted report</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
                  <p><span className="block text-xs text-slate-500">Ad running</span><strong className="text-slate-800">{displayBoolean(report.isAdRunning)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Type of ads</span><strong className="text-slate-800">{displayValue(report.typeOfAds)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Reach obtained</span><strong className="text-slate-800">{displayValue(report.todayReachObtained)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Amount spent</span><strong className="text-slate-800">{displayValue(report.todayAmountSpend)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Leads obtained</span><strong className="text-slate-800">{displayValue(report.leadObtained)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Daily budget</span><strong className="text-slate-800">{displayValue(report.decidedDailyBudget)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Lead sent to client</span><strong className="text-slate-800">{displayBoolean(report.leadSentToClient)}</strong></p>
                  <p><span className="block text-xs text-slate-500">Report date</span><strong className="text-slate-800">{displayDate(report.date)}</strong></p>
                  {report.campaignStartDate && <p><span className="block text-xs text-slate-500">Campaign start</span><strong className="text-slate-800">{displayDate(report.campaignStartDate)}</strong></p>}
                  {report.campaignEndDate && <p><span className="block text-xs text-slate-500">Campaign end</span><strong className="text-slate-800">{displayDate(report.campaignEndDate)}</strong></p>}
                  {report.startDate && <p><span className="block text-xs text-slate-500">Start date</span><strong className="text-slate-800">{displayDate(report.startDate)}</strong></p>}
                </div>
              </div>
              {(report.reasonNotRunning || report.unableToSubmitReason || report.reviewNote) && <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {report.reasonNotRunning && <p><strong>Not running reason:</strong> {report.reasonNotRunning}</p>}
                {report.unableToSubmitReason && <p><strong>Unable-to-submit reason:</strong> {report.unableToSubmitReason}</p>}
                {report.reviewNote && <p><strong>Review note:</strong> {report.reviewNote}</p>}
              </div>}
              {status !== "APPROVED" && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input value={reviewNote} onChange={(event) => updateReviewNote(id, event.target.value)} placeholder="Review note (required for rejection)" aria-label={`Review note for ${report.projectName || "marketing report"}`} disabled={isReviewing} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50" />
                <button type="button" disabled={isReviewing} onClick={() => reviewReport(id, "APPROVED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={15} />Approve</button>
                <button type="button" disabled={isReviewing || !reviewNote.trim()} onClick={() => reviewReport(id, "REJECTED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"><XCircle size={15} />Reject</button>
              </div>}
            </article>;
          })}
        </div>}
      </div>
    </div>
  );
}
