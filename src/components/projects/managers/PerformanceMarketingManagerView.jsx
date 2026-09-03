import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import API from "../../../services/api";
import {
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  XCircle,
  BarChart3,
  DollarSign,
  Users,
  Eye,
  Calendar,
  ArrowLeft,
  Trash2,
  Edit3,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  n != null ? Number(n).toLocaleString("en-IN") : "—";
const fmtCur = (n) =>
  n != null
    ? "₹ " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })
    : "—";
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const labelClass = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500";

const INITIAL_FORM = {
  clientName: "",
  clientContactNumber: "",
  videoLink: "",
  areaName: "",
  isAdRunning: "",
  campaignStartDate: "",
  campaignEndDate: "",
  todayReachObtained: "",
  todayAmountSpend: "",
  reasonNotRunning: "",
  typeOfAds: "",
  leadObtained: "",
  decidedDailyBudget: "",
  leadSentToClient: "",
  startDate: "",
  date: new Date().toISOString().split("T")[0],
};

/* ─── component ───────────────────────────────────────────────────────────── */
export default function PerformanceMarketingManagerView({ projectId, campaignId = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [adTypeFilter, setAdTypeFilter] = useState("");
  const [toast, setToast] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignCount, setCampaignCount] = useState("1");
  const [campaignNames, setCampaignNames] = useState([""]);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignReports, setCampaignReports] = useState({});
  const canManageCampaigns = user?.role === "MANAGER";
  const isAssignedManager = project?.assignments?.some((assignment) =>
    String(assignment.managerId || assignment.manager?.id || assignment.manager?.employeeId) === String(user?.id || user?.employeeId),
  );

  /* toast helper */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteProject = async () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        await API.delete(`/api/projects/${projectId}`);
        navigate("/projects");
      } catch (err) {
        showToast("error", err.response?.data?.message || err.message || "Failed to delete project.");
      }
    }
  };

  /* ─── load project & reports ─────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Load project details
      const projRes = await API.get(`/api/projects/${projectId}`);
      setProject(projRes.data?.data || null);

      if (campaignId) {
        const campaignRes = await API.get(`/api/campaigns/${campaignId}`);
        const campaignData = campaignRes.data?.data ?? campaignRes.data;
        setCampaigns(campaignData ? [campaignData] : []);
      } else {
        setCampaignLoading(true);
        const campaignRes = await API.get(`/api/projects/${projectId}/campaigns`);
        const campaignData = campaignRes.data?.data ?? campaignRes.data;
        const loadedCampaigns = Array.isArray(campaignData) ? campaignData : campaignData?.items || [];
        setCampaigns(loadedCampaigns);
        const reportEntries = await Promise.all(loadedCampaigns.map(async (campaign) => {
          try {
            const reportResponse = await API.get(`/api/campaigns/${campaign.id}/reports`);
            const reportData = reportResponse.data?.data ?? reportResponse.data;
            return [campaign.id, Array.isArray(reportData) ? reportData : []];
          } catch {
            return [campaign.id, []];
          }
        }));
        const reportsByCampaign = Object.fromEntries(reportEntries);
        setCampaignReports(reportsByCampaign);
        setReports(Object.values(reportsByCampaign).flat());
        setCampaignLoading(false);
      }

      // Load reports at the project or campaign scope.
      if (campaignId) {
        const repRes = await API.get(`/api/campaigns/${campaignId}/reports`);
        const data = Array.isArray(repRes.data) ? repRes.data : repRes.data?.data || [];
        setReports(data);
      }

    } catch (error) {
      setCampaignLoading(false);
      if (!campaignId) setCampaignError(error?.response?.data?.message || "Failed to load campaigns.");
      showToast("error", error?.response?.data?.message || "Failed to load marketing details.");
    } finally {
      setLoading(false);
    }
  }, [projectId, campaignId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── form helpers ─────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({
      ...INITIAL_FORM,
      date: new Date().toISOString().split("T")[0],
    });
    setShowForm(true);
  };

  const openEdit = (report) => {
    setEditTarget(report);
    setForm({
      clientName: report.clientName || "",
      clientContactNumber: report.clientContactNumber || "",
      videoLink: report.videoLink || "",
      areaName: report.areaName || "",
      isAdRunning:
        report.isAdRunning === true
          ? "true"
          : report.isAdRunning === false
          ? "false"
          : "",
      campaignStartDate: report.campaignStartDate
        ? report.campaignStartDate.split("T")[0]
        : "",
      campaignEndDate: report.campaignEndDate
        ? report.campaignEndDate.split("T")[0]
        : "",
      todayReachObtained:
        report.todayReachObtained != null ? String(report.todayReachObtained) : "",
      todayAmountSpend:
        report.todayAmountSpend != null ? String(report.todayAmountSpend) : "",
      reasonNotRunning: report.reasonNotRunning || "",
      typeOfAds: report.typeOfAds || "",
      leadObtained: report.leadObtained != null ? String(report.leadObtained) : "",
      decidedDailyBudget: report.decidedDailyBudget != null ? String(report.decidedDailyBudget) : "",
      leadSentToClient: typeof report.leadSentToClient === "boolean" ? String(report.leadSentToClient) : "",
      startDate: report.startDate ? report.startDate.split("T")[0] : "",
      date: report.date ? report.date.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitInFlight.current) return;
    if (!["Awareness", "Lead"].includes(form.typeOfAds)) return showToast("error", "Please select Awareness or Lead.");
    if (!["true", "false"].includes(form.isAdRunning)) return showToast("error", "Please select whether the ad is running.");
    if (form.typeOfAds !== "Lead" && form.decidedDailyBudget !== "" && Number(form.decidedDailyBudget) < 0) return showToast("error", "Decided daily budget cannot be negative.");
    if (form.typeOfAds === "Lead" && !["true", "false"].includes(form.leadSentToClient)) return showToast("error", "Please select whether the lead was sent to the client.");
    const reportDate = String(form.date || "").split("T")[0];
    const duplicateReport = reports.some((report) => String(report.date || "").split("T")[0] === reportDate && String(report.id) !== String(editTarget?.id));
    if (duplicateReport) return showToast("error", "A report already exists for this date.");
    submitInFlight.current = true;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        ...(campaignId ? {} : { projectId }),
        clientContactNumber: form.clientContactNumber?.trim() || null,
        todayReachObtained: form.todayReachObtained !== "" ? Number(form.todayReachObtained) : null,
        todayAmountSpend: form.todayAmountSpend !== "" ? Number(form.todayAmountSpend) : null,
        leadObtained: form.leadObtained !== "" ? Number(form.leadObtained) : null,
        decidedDailyBudget: form.typeOfAds === "Lead" ? null : form.decidedDailyBudget !== "" ? Number(form.decidedDailyBudget) : null,
        leadSentToClient: form.leadSentToClient === "true" ? true : form.leadSentToClient === "false" ? false : null,
        startDate: form.startDate || null,
        isAdRunning: form.isAdRunning === "true" ? true : form.isAdRunning === "false" ? false : null,
      };

      if (editTarget) {
        await API.patch(`/api/marketing-reports/${editTarget.id}`, payload);
        showToast("success", "Report updated successfully!");
      } else {
        if (campaignId) {
          await API.post(`/api/campaigns/${campaignId}/reports`, payload);
        } else {
          await API.post("/api/marketing-reports", payload);
        }
        showToast("success", "Report submitted successfully!");
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to save report.");
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  const saveCampaign = async (event) => {
    event.preventDefault();
    const names = editingCampaign
      ? [campaignName.trim()]
      : campaignNames.map((name) => name.trim());
    if (names.some((name) => !name)) return showToast("error", "Every campaign name is required.");
    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) return showToast("error", "Campaign names must be unique.");
    try {
      if (editingCampaign) {
        const response = await API.patch(`/api/campaigns/${editingCampaign.id}`, { name: names[0] });
        const updated = response.data?.data || response.data;
        setCampaigns((current) => current.map((item) => item.id === updated.id ? updated : item));
        showToast("success", "Campaign renamed successfully.");
      } else {
        const created = [];
        for (const name of names) {
          const response = await API.post(`/api/projects/${projectId}/campaigns`, { name });
          created.push(response.data?.data || response.data);
        }
        setCampaigns((current) => [...current, ...created]);
        showToast("success", `${created.length} campaign${created.length === 1 ? "" : "s"} created successfully.`);
      }
      setCampaignModalOpen(false);
      setEditingCampaign(null);
      setCampaignName("");
      setCampaignCount("1");
      setCampaignNames([""]);
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Failed to save campaign.");
    }
  };

  const deleteCampaign = async (campaign) => {
    if (!window.confirm(`Delete ${campaign.name}?`)) return;
    try {
      await API.delete(`/api/campaigns/${campaign.id}`);
      setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
      showToast("success", "Campaign deleted successfully.");
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Campaign cannot be deleted because it already has reports.");
    }
  };

  /* ─── filtered list ───────────────────────────────────────────────────── */
  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.clientName?.toLowerCase().includes(q) ||
      r.areaName?.toLowerCase().includes(q) ||
      r.typeOfAds?.toLowerCase().includes(q)
    ) && (!adTypeFilter || r.typeOfAds === adTypeFilter);
  });

  /* ─── summary stats ───────────────────────────────────────────────────── */
  const totalSpend = reports.reduce((s, r) => s + (r.todayAmountSpend || 0), 0);
  const totalReach = reports.reduce((s, r) => s + (r.todayReachObtained || 0), 0);
  const totalLeads = reports.reduce((s, r) => s + (r.leadObtained || 0), 0);

  const inputCls =
    "w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all";
  const selectCls =
    "w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all";

  /* ─── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fadeIn pb-20">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <XCircle size={18} />
          )}
          {toast.msg}
        </div>
      )}

      {/* ACTION BAR */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {campaignId ? "Back to Project" : "Back to Projects"}
        </button>

        <div className="flex items-center gap-3">
          {["ADMIN", "HR", "EA", "COORDINATOR"].includes(user?.role) && (
            <button
              onClick={handleDeleteProject}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition shadow-sm"
            >
              <Trash2 size={16} />
              Delete Project
            </button>
          )}

          {campaignId && isAssignedManager && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition shadow-sm"
            >
              <Plus size={16} />
              Create Report
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* HEADER */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <TrendingUp size={22} className="text-indigo-600" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 mb-2">
                  {campaignId ? "Meta Ads Campaign" : "Marketing Department"}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                      {campaignId ? `${campaigns.find((item) => String(item.id) === String(campaignId))?.name || "Campaign"} Reports` : project?.projectName || "Marketing Project"}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
              {[
                { label: "Client", value: project?.clientName || project?.projectName || "-" },
                { label: "Monthly Budget", value: project?.monthlyBudget != null ? fmtCur(project.monthlyBudget) : "-" },
                { label: "Objective", value: project?.objective || "-" },
                { label: "Area", value: project?.area || "-" },
                { label: "Funds Added By", value: project?.fundsAddedBy === "HARSH_SIR" ? "HARSH" : project?.fundsAddedBy || "-" },
                { label: "Manager", value: project?.assignments?.map((assignment) => assignment.manager?.name || assignment.manager?.fullName || assignment.manager?.employeeId).filter(Boolean).join(", ") || "-" },
                { label: "Start Date", value: project?.startDate ? fmtDate(project.startDate) : "-" },
                { label: "End Date", value: project?.endDate ? fmtDate(project.endDate) : "-" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                  <p className="mt-1 truncate text-sm font-black text-slate-800" title={item.value}>{item.value}</p>
                </div>
              ))}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { icon: BarChart3, label: "Total Reports", value: reports.length, color: "text-indigo-600", bg: "bg-indigo-50" },
                { icon: DollarSign, label: "Total Spend", value: fmtCur(totalSpend), color: "text-pink-600", bg: "bg-pink-50" },
                { icon: Eye, label: "Total Reach", value: fmt(totalReach), color: "text-cyan-600", bg: "bg-cyan-50" },
                { icon: Users, label: "Total Leads", value: fmt(totalLeads), color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon size={18} className={s.color} />
                  </div>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-slate-900 text-lg font-black">{s.value}</p>
                </div>
              ))}
            </div>

          </div>

          {!campaignId && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Campaigns</h2>
                  <p className="text-xs text-slate-500">Create and manage campaigns inside this marketing project.</p>
                </div>
                {canManageCampaigns && isAssignedManager && <button type="button" onClick={() => { setEditingCampaign(null); setCampaignName(""); setCampaignCount("1"); setCampaignNames([""]); setCampaignModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"><Plus size={16} />Create Campaign</button>}
              </div>
              {campaignLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading campaigns...</p> : campaignError ? <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{campaignError}</p> : campaigns.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm font-semibold text-slate-500">No campaigns found.</p> : <div className="grid gap-3 md:grid-cols-2">{campaigns.map((campaign) => { const campaignReportList = campaignReports[campaign.id] || campaign.reports || []; const campaignSpend = campaignReportList.reduce((sum, report) => sum + Number(report.todayAmountSpend || 0), 0); const campaignReach = campaignReportList.reduce((sum, report) => sum + Number(report.todayReachObtained || 0), 0); const campaignLeads = campaignReportList.reduce((sum, report) => sum + Number(report.leadObtained || 0), 0); return <article key={campaign.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{campaign.name}</h3><p className="mt-1 text-xs text-slate-500">Created {fmtDate(campaign.createdAt)} · {campaignReportList.length} reports</p></div><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-600">Campaign</span></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-lg bg-slate-50 p-2"><p className="text-[9px] font-bold uppercase text-slate-400">Spend</p><p className="text-xs font-black text-slate-800">{fmtCur(campaignSpend)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[9px] font-bold uppercase text-slate-400">Reach</p><p className="text-xs font-black text-slate-800">{fmt(campaignReach)}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-[9px] font-bold uppercase text-slate-400">Leads</p><p className="text-xs font-black text-slate-800">{fmt(campaignLeads)}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => navigate(`/project/${projectId}/campaign/${campaign.id}`)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">View Reports</button>{canManageCampaigns && isAssignedManager && <><button type="button" onClick={() => { setEditingCampaign(campaign); setCampaignName(campaign.name); setCampaignModalOpen(true); }} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><Edit3 size={13} />Edit</button><button type="button" onClick={() => deleteCampaign(campaign)} className="inline-flex items-center gap-1 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={13} />Delete</button></>}</div></article>; })}</div>}
            </section>
          )}

          {campaignModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={saveCampaign} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-black">{editingCampaign ? "Rename Campaign" : "Create Campaigns"}</h2><button type="button" onClick={() => setCampaignModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>{editingCampaign ? <label><span className={labelClass}>Campaign Name</span><input autoFocus required minLength={1} maxLength={200} value={campaignName} onChange={(event) => setCampaignName(event.target.value)} className={inputCls} placeholder="Enter campaign name" /></label> : <><label><span className={labelClass}>Number Of Campaigns</span><select value={campaignCount} onChange={(event) => { const count = Number(event.target.value); setCampaignCount(event.target.value); setCampaignNames((current) => Array.from({ length: count }, (_, index) => current[index] || "")); }} className={inputCls}>{Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label><div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">{campaignNames.map((name, index) => <label key={index} className="block"><span className={labelClass}>Campaign {index + 1} Name</span><input autoFocus={index === 0} required minLength={1} maxLength={200} value={name} onChange={(event) => setCampaignNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className={inputCls} placeholder={`Enter campaign ${index + 1} name`} /></label>)}</div></>}<button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"><Save size={16} />{editingCampaign ? "Save Name" : `Create ${campaignNames.length} Campaign${campaignNames.length === 1 ? "" : "s"}`}</button></form></div>}

          {campaignId && <>
          {/* Search + refresh */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports by client, area or ad type..."
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <select value={adTypeFilter} onChange={(e) => setAdTypeFilter(e.target.value)} className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/60">
              <option value="">All Ad Types</option>
              <option value="Awareness">Awareness</option>
              <option value="Lead">Lead</option>
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Reports table */}
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <TrendingUp size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No marketing reports yet</h3>
              <p className="text-slate-500 text-sm">Add your first performance report for this project.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      {["Date","Client","Contact","Area","Ad Running","Type of Ads","Reach","Spend","Leads","Daily Budget","Lead Sent","Start Date","Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                          <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" />{fmtDate(r.date)}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-900 font-semibold">{r.clientName || "—"}</td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-xs">{r.clientContactNumber || "—"}</td>
                        <td className="px-5 py-4 text-slate-600">{r.areaName || "—"}</td>
                        <td className="px-5 py-4">
                          {r.isAdRunning === true ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg"><CheckCircle2 size={12} /> Yes</span>
                          ) : r.isAdRunning === false ? (
                            <span className="inline-flex items-center gap-1 text-red-700 text-xs font-bold bg-red-50 border border-red-100 px-2 py-1 rounded-lg"><XCircle size={12} /> No</span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{r.typeOfAds || "—"}</td>
                        <td className="px-5 py-4 text-indigo-600 font-semibold">{fmt(r.todayReachObtained)}</td>
                        <td className="px-5 py-4 text-pink-600 font-semibold">{fmtCur(r.todayAmountSpend)}</td>
                        <td className="px-5 py-4 text-emerald-600 font-semibold">{fmt(r.leadObtained)}</td>
                        <td className="px-5 py-4 text-slate-700">{fmtCur(r.decidedDailyBudget)}</td>
                        <td className="px-5 py-4">{r.leadSentToClient === true ? "Yes" : r.leadSentToClient === false ? "No" : "—"}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{fmtDate(r.startDate || r.campaignStartDate)}</td>
                        
                        <td className="px-5 py-4">
                          <button onClick={() => openEdit(r)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-colors">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </>}
        </>
      )}

      {/* ─── Form Modal ─────────────────────────────────────────────────────── */}
      {campaignId && isAssignedManager && showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editTarget ? "Edit Marketing Report" : "New Marketing Report"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Client Contact Number</label>
                  <input type="text" name="clientContactNumber" value={form.clientContactNumber || ''} onChange={(e) => setForm((f) => ({ ...f, clientContactNumber: e.target.value }))} placeholder="e.g. 9876543210" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Client Name</label>
                  <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="e.g. ABC Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Area Name</label>
                  <input value={form.areaName} onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))} placeholder="e.g. Mumbai North" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Video Link</label>
                <input value={form.videoLink} onChange={(e) => setForm((f) => ({ ...f, videoLink: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Is Ad Running?</label>
                  <select value={form.isAdRunning} onChange={(e) => setForm((f) => ({ ...f, isAdRunning: e.target.value }))} className={selectCls}>
                    <option value="">— Select —</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Type of Ads</label>
                  <select value={form.typeOfAds} onChange={(e) => setForm((f) => ({ ...f, typeOfAds: e.target.value }))} className={selectCls}>
                    <option value="">— Select —</option>
                    <option value="Awareness">Awareness</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              {form.isAdRunning === "false" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Reason Not Running</label>
                  <textarea value={form.reasonNotRunning} onChange={(e) => setForm((f) => ({ ...f, reasonNotRunning: e.target.value }))} rows={2} placeholder="Describe reason..." className={inputCls + " resize-none"} />
                </div>
              )}

              {form.typeOfAds === "Awareness" && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Today's Reach</label><input type="number" min="0" value={form.todayReachObtained} onChange={(e) => setForm((f) => ({ ...f, todayReachObtained: e.target.value }))} placeholder="0" className={inputCls} /></div>
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount Spent Today (₹)</label><input type="number" min="0" step="0.01" value={form.todayAmountSpend} onChange={(e) => setForm((f) => ({ ...f, todayAmountSpend: e.target.value }))} placeholder="0.00" className={inputCls} /></div>
                </div>
              )}

              {form.typeOfAds === "Lead" && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Leads Obtained</label><input type="number" min="0" value={form.leadObtained} onChange={(e) => setForm((f) => ({ ...f, leadObtained: e.target.value }))} placeholder="0" className={inputCls} /></div>
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Lead Sent to Client</label><select value={form.leadSentToClient} onChange={(e) => setForm((f) => ({ ...f, leadSentToClient: e.target.value }))} className={selectCls}><option value="">— Select —</option><option value="true">Yes</option><option value="false">No</option></select></div>
                  <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Amount Spent Today (₹)</label><input type="number" min="0" step="0.01" value={form.todayAmountSpend} onChange={(e) => setForm((f) => ({ ...f, todayAmountSpend: e.target.value }))} placeholder="0.00" className={inputCls} /></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Campaign Start Date</label><input type="date" value={form.campaignStartDate} onChange={(e) => setForm((f) => ({ ...f, campaignStartDate: e.target.value }))} className={inputCls} /></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Report Date</label><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} /></div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-semibold text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <RefreshCw size={15} className="animate-spin" /> : editTarget ? "Update Details" : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}