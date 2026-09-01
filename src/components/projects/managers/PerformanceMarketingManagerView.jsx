import React, { useState, useEffect, useCallback } from "react";
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
export default function PerformanceMarketingManagerView({ projectId }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [monthlyCalendar, setMonthlyCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [adTypeFilter, setAdTypeFilter] = useState("");
  const [toast, setToast] = useState(null);

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

      // Load marketing reports
      const repRes = await API.get(`/api/marketing-reports?projectId=${projectId}`);
      const data = Array.isArray(repRes.data)
        ? repRes.data
        : repRes.data?.data || [];
      setReports(data);

      const today = new Date();
      const monthlyRes = await API.get(
        `/api/marketing-monthly-reports?month=${today.getMonth() + 1}&year=${today.getFullYear()}`,
      );
      const monthlyData = monthlyRes?.data && Object.prototype.hasOwnProperty.call(monthlyRes.data, "data")
        ? monthlyRes.data.data
        : monthlyRes?.data;
      setMonthlyCalendar(monthlyData || null);
    } catch {
      showToast("error", "Failed to load marketing details.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
    if (!["Awareness", "Lead"].includes(form.typeOfAds)) return showToast("error", "Please select Awareness or Lead.");
    if (!["true", "false"].includes(form.isAdRunning)) return showToast("error", "Please select whether the ad is running.");
    if (form.typeOfAds !== "Lead" && form.decidedDailyBudget !== "" && Number(form.decidedDailyBudget) < 0) return showToast("error", "Decided daily budget cannot be negative.");
    if (form.typeOfAds === "Lead" && !["true", "false"].includes(form.leadSentToClient)) return showToast("error", "Please select whether the lead was sent to the client.");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        projectId,
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
        await API.post("/api/marketing-reports", payload);
        showToast("success", "Report submitted successfully!");
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to save report.");
    } finally {
      setSubmitting(false);
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
  const monthlyRows = (monthlyCalendar?.rows || []).filter(
    (row) => String(row.projectId || row.project?.id) === String(projectId),
  );
  const monthlyStats = [
    { icon: BarChart3, label: "Monthly Campaigns", value: monthlyRows.length, color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: CheckCircle2, label: "Currently Running", value: monthlyRows.filter((row) => row.currentlyRunning === true || row.currentlyRunning === "yes").length, color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Users, label: "Required Leads", value: fmt(monthlyRows.reduce((total, row) => total + Number(row.requiredLeads || 0), 0)), color: "text-blue-600", bg: "bg-blue-50" },
    { icon: DollarSign, label: "Ad Funds", value: fmtCur(monthlyRows.reduce((total, row) => total + Number(row.awarenessFunds || 0) + Number(row.leadsFund || 0), 0)), color: "text-orange-600", bg: "bg-orange-50" },
    { icon: Calendar, label: "Monthly Budget", value: fmtCur(monthlyRows.reduce((total, row) => total + Number(row.monthlyBudget || 0), 0)), color: "text-violet-600", bg: "bg-violet-50" },
  ];

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
          Back to Projects
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

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            Add Marketing Report
          </button>
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
                  Marketing Department
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {project?.projectName || "Marketing Project"}
                </h1>
              </div>
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

            <div className="mt-8 border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Monthly Calendar</h2>
                  <p className="text-xs text-slate-500">Current month stats for this project</p>
                </div>
                <button onClick={() => navigate("/marketing-monthly-reports")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Open Calendar</button>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {monthlyStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}><stat.icon size={17} className={stat.color} /></div>
                    <p className="text-lg font-black text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
        </>
      )}

      {/* ─── Form Modal ─────────────────────────────────────────────────────── */}
      {showForm && (
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