import { useCallback, useEffect, useState } from "react";
import { BarChart3, CheckCircle2, FileText, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { refreshManagerLogoutStatus } from "../../utils/managerLogoutStatus";

const today = () => new Date().toISOString().split("T")[0];
const isMarketing = (project) => String(project?.department?.name || project?.department || "").toLowerCase().includes("marketing");
const errorText = (error) => {
  if (error?.response?.status === 400) return error.response.data?.message || "Please check the report details.";
  if (error?.response?.status === 403) return "You are not allowed to perform this action.";
  if (error?.response?.status === 404) return "Report or project not found.";
  return error?.response?.data?.message || "Unable to complete this request.";
};
const statusText = (status) => ({ PENDING: "Waiting for HR approval", APPROVED: "Approved by HR", REJECTED: "Needs correction" }[status] || "Report not submitted");
const statusStyle = (status) => status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : status === "PENDING" ? "bg-amber-50 text-amber-700" : status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600";

export default function MarketingReportsPage() {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [message, setMessage] = useState(null);

  const loadData = useCallback(async () => {
    if (role !== "MANAGER" || !user?.id) return;
    setLoading(true);
    try {
      const [projectsResponse, logoutStatus] = await Promise.all([API.get("/api/projects"), refreshManagerLogoutStatus()]);
      const allProjects = projectsResponse.data?.data || projectsResponse.data || [];
      const assignedProjects = allProjects.filter((project) => isMarketing(project) && project.assignments?.some((assignment) => String(assignment.managerId || assignment.manager?.id) === String(user.id)));
      const reportResults = await Promise.all(assignedProjects.map(async (project) => {
        const projectId = project.id || project._id;
        try {
          const response = await API.get(`/api/marketing-reports?projectId=${encodeURIComponent(projectId)}`);
          const reports = response.data?.data || response.data || [];
          const todayReport = (Array.isArray(reports) ? reports : []).find((report) => String(report.date || "").split("T")[0] === today());
          return [String(projectId), todayReport];
        } catch {
          return [String(projectId), null];
        }
      }));
      const reportsByProject = Object.fromEntries(reportResults);
      const pending = logoutStatus?.pendingMarketingReports || [];
      setProjects(assignedProjects.map((project) => ({
        ...project,
        todayReport: reportsByProject[String(project.id || project._id)] || null,
      })));
      setPendingReports(pending);
    } catch (error) {
      setMessage({ type: "error", text: errorText(error) });
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateForm = (id, values) => setForms((current) => ({ ...current, [id]: { ...(current[id] || {}), ...values } }));
  const pendingFor = (project) => {
    const id = project.id || project._id;
    return pendingReports.find((report) => String(report.projectId) === String(id)) || project.todayReport;
  };

  const submitReport = async (event, project) => {
    event.preventDefault();
    const projectId = project.id || project._id;
    const form = forms[projectId] || {};
    const unable = true;
    if (!form.unableToSubmitReason?.trim()) return setMessage({ type: "error", text: "Please provide a reason before submitting." });
    setSubmittingId(projectId);
    setMessage(null);
    try {
      const payload = unable
        ? { projectId, clientName: project.clientName || project.projectName || project.name, unableToSubmitReason: form.unableToSubmitReason.trim(), date: today() }
        : { projectId, clientName: project.clientName || project.projectName || project.name, isAdRunning: form.isAdRunning === "true", ...(form.isAdRunning === "false" ? { reasonNotRunning: form.reasonNotRunning.trim() } : {}), ...(form.todayReachObtained ? { todayReachObtained: Number(form.todayReachObtained) } : {}), ...(form.todayAmountSpend ? { todayAmountSpend: Number(form.todayAmountSpend) } : {}), date: today() };
      await API.post("/api/marketing-reports", payload);
      await loadData();
      setMessage({ type: "success", text: unable ? "Reason submitted. Waiting for HR approval." : "Report submitted. Waiting for HR approval." });
    } catch (error) {
      setMessage({ type: "error", text: errorText(error) });
    } finally {
      setSubmittingId(null);
    }
  };

  if (role !== "MANAGER") return null;
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div><p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600"><BarChart3 size={15} /> Marketing Department</p><h1 className="text-3xl font-black tracking-tight text-slate-950">Today&apos;s Reports</h1><p className="mt-2 text-sm text-slate-500">Submit a report or reason for each assigned project.</p></div>
          <button type="button" onClick={loadData} aria-label="Refresh reports" className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm hover:border-indigo-300 hover:text-indigo-600"><RefreshCw size={17} /></button>
        </header>
        {message && <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{message.text}</div>}
        {projects.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No assigned Marketing projects found.</div> : <div className="grid gap-5 lg:grid-cols-2">{projects.map((project) => {
          const projectId = project.id || project._id;
          const pending = pendingFor(project);
          const form = forms[projectId] || {};
          const status = pending?.reportStatus || pending?.approvalStatus || "NOT_SUBMITTED";
          const locked = status === "PENDING" || status === "APPROVED";
          const rejected = status === "REJECTED";
          return <article key={projectId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><h2 className="text-lg font-black text-slate-900">{project.projectName || project.name}</h2><p className="mt-1 text-sm text-slate-500">Client: {project.clientName || project.projectName || "-"}</p></div><span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusStyle(status)}`}>{statusText(status)}</span></div>
            {rejected && <div className="mt-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><TriangleAlert size={17} /><span>{pending?.reviewNote || "HR requested a correction. Please resubmit."}</span></div>}
            {locked ? <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18} />{status === "APPROVED" ? "Today's report was approved by HR." : "Submitted and waiting for HR approval."}</div> : <form onSubmit={(event) => submitReport(event, project)} className="mt-6 space-y-4">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-sm font-bold text-orange-800">Unable to fill today&apos;s report?</p><p className="mt-1 text-xs text-orange-700">Tell HR why this project cannot be completed today.</p></div>
              <textarea required value={form.unableToSubmitReason || ""} onChange={(event) => updateForm(projectId, { unableToSubmitReason: event.target.value })} placeholder="Why can't you fill today's report?" className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              <button type="submit" disabled={submittingId === projectId} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">{submittingId === projectId ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}Submit reason for HR approval</button>
            </form>}
          </article>;
        })}</div>}
      </div>
    </main>
  );
}
