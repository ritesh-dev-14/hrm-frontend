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

export default function MarketingReportsApprovalPage() {
  const [allReports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState(null);
  const [selectedDate, setSelectedDate] = useState(localToday);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const projectsResponse = await API.get("/api/projects");
      const projects = getReports(projectsResponse).filter((project) =>
        String(project?.department?.name || project?.department || "").toLowerCase().includes("marketing"),
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
      setReports(reportResponses.flat());
    } catch (error) {
      setMessage({ type: "error", text: getMessage(error, "Unable to load marketing reports.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const reports = allReports.filter((report) => dateKey(report.date) === selectedDate);
  const filteredReports = reports;

  const reviewReport = async (reportId, status) => {
    if (status === "REJECTED" && !reviewNote.trim()) {
      setMessage({ type: "error", text: "Please provide a review note when rejecting a report." });
      return;
    }
    setReviewingId(reportId);
    setMessage(null);
    try {
      await API.patch(`/api/marketing-reports/${reportId}/review`, {
        status,
        reviewNote: reviewNote.trim() || "Approved",
      });
      setReviewNote("");
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
          <div><p className="text-xs font-bold uppercase tracking-widest text-pink-600">Marketing Department</p><h1 className="mt-1 text-3xl font-black text-slate-900">Marketing Reports Approval</h1><p className="mt-1 text-sm text-slate-500">Review today&apos;s manager reports and unable-to-submit reasons.</p></div>
          <div className="flex items-center gap-3">
            <label className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="sr-only">Filter reports by date</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent text-sm font-semibold text-slate-600 outline-none" aria-label="Filter reports by date" />
            </label>
            <button type="button" onClick={loadReports} disabled={loading} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-100 disabled:opacity-50" aria-label="Refresh reports"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
          </div>
        </div>
        {message && <div className={`mb-6 rounded-xl border p-4 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div> : reports.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No marketing reports found.</div> : <div className="space-y-4">{reports.map((report) => { const id = report.id || report._id; const status = report.approvalStatus || report.status || "PENDING"; return <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">{report.projectName || report.project?.projectName || "Marketing project"}</h2><p className="mt-1 text-sm text-slate-600">Manager: {report.managerName || report.manager?.name || report.createdBy?.name || "—"}</p><p className="mt-1 text-xs text-slate-500">Date: {report.date ? new Date(report.date).toLocaleDateString() : "—"} · Running: {report.isAdRunning == null ? "Unable to submit" : report.isAdRunning ? "Yes" : "No"}</p></div><span className={`rounded-lg px-3 py-1 text-xs font-black ${status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{status}</span></div>{(report.reasonNotRunning || report.unableToSubmitReason || report.reviewNote) && <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{report.reasonNotRunning && <p><strong>Not running reason:</strong> {report.reasonNotRunning}</p>}{report.unableToSubmitReason && <p><strong>Unable-to-submit reason:</strong> {report.unableToSubmitReason}</p>}{report.reviewNote && <p><strong>Review note:</strong> {report.reviewNote}</p>}</div>}{status !== "APPROVED" && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><input value={reviewingId === id ? reviewNote : ""} onChange={(event) => setReviewNote(event.target.value)} placeholder="Review note (required for rejection)" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /><button type="button" disabled={reviewingId === id} onClick={() => reviewReport(id, "APPROVED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Approve</button><button type="button" disabled={reviewingId === id} onClick={() => reviewReport(id, "REJECTED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><XCircle size={15} />Reject</button></div>}</article>; })}</div>}
          {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div> : filteredReports.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">No marketing reports found.</div> : <div className="space-y-4">{reports.map((report) => { const id = report.id || report._id; const status = report.approvalStatus || report.status || "PENDING"; return <article key={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">{report.projectName || report.project?.projectName || "Marketing project"}</h2><p className="mt-1 text-sm text-slate-600">Manager: {report.managerName || report.manager?.name || report.createdBy?.name || "—"}</p><p className="mt-1 text-xs text-slate-500">Date: {report.date ? new Date(report.date).toLocaleDateString() : "—"} · Running: {report.isAdRunning == null ? "Unable to submit" : report.isAdRunning ? "Yes" : "No"}</p></div><span className={`rounded-lg px-3 py-1 text-xs font-black ${status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{status}</span></div>{(report.reasonNotRunning || report.unableToSubmitReason || report.reviewNote) && <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{report.reasonNotRunning && <p><strong>Not running reason:</strong> {report.reasonNotRunning}</p>}{report.unableToSubmitReason && <p><strong>Unable-to-submit reason:</strong> {report.unableToSubmitReason}</p>}{report.reviewNote && <p><strong>Review note:</strong> {report.reviewNote}</p>}</div>}{status !== "APPROVED" && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><input value={reviewingId === id ? reviewNote : ""} onChange={(event) => setReviewNote(event.target.value)} placeholder="Review note (required for rejection)" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /><button type="button" disabled={reviewingId === id} onClick={() => reviewReport(id, "APPROVED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 size={15} />Approve</button><button type="button" disabled={reviewingId === id} onClick={() => reviewReport(id, "REJECTED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><XCircle size={15} />Reject</button></div>}</article>; })}</div>}
      </div>
    </div>
  );
}
