import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import {
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  X,
  CheckCircle2,
  XCircle,
  BarChart3,
  DollarSign,
  Users,
  Eye,
  Calendar,
  Filter,
} from "lucide-react";

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
  projectId: "",
  clientName: "",
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
  date: new Date().toISOString().split("T")[0],
};

/* ─── component ───────────────────────────────────────────────────────────── */
export default function MarketingReportsPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  /* toast helper */
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ─── load manager's projects ─────────────────────────────────────────── */
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await API.get("/api/projects");
        const all = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.projects || [];
        const mine = all.filter((p) =>
          p.assignments?.some((a) => a.managerId === user?.id)
        );
        setProjects(mine.length ? mine : all);
      } catch {
        showToast("error", "Failed to load projects.");
      }
    };
    if (user?.id) loadProjects();
  }, [user?.id]);

  /* ─── load reports for selected project ──────────────────────────────── */
  const loadReports = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/marketing-reports?projectId=${projectId}`);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setReports(data);
    } catch {
      showToast("error", "Failed to load marketing reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProject) loadReports(selectedProject.id);
  }, [selectedProject, loadReports]);

  /* ─── form helpers ─────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({
      ...INITIAL_FORM,
      projectId: selectedProject?.id || "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowForm(true);
  };

  const openEdit = (report) => {
    setEditTarget(report);
    setForm({
      projectId: report.projectId || "",
      clientName: report.clientName || "",
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
      date: report.date ? report.date.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) return showToast("error", "Please select a project.");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        todayReachObtained: form.todayReachObtained !== "" ? Number(form.todayReachObtained) : null,
        todayAmountSpend: form.todayAmountSpend !== "" ? Number(form.todayAmountSpend) : null,
        leadObtained: form.leadObtained !== "" ? Number(form.leadObtained) : null,
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
      loadReports(form.projectId);
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
    );
  });

  /* ─── summary stats ───────────────────────────────────────────────────── */
  const totalSpend = reports.reduce((s, r) => s + (r.todayAmountSpend || 0), 0);
  const totalReach = reports.reduce((s, r) => s + (r.todayReachObtained || 0), 0);
  const totalLeads = reports.reduce((s, r) => s + (r.leadObtained || 0), 0);

  const inputCls =
    "w-full bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-3.5 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all";
  const selectCls =
    "w-full appearance-none bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all pr-8";

  /* ─── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 pb-20">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "bg-red-500/20 border-red-500/40 text-red-300"
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Marketing Reports
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Track campaign performance and ad spend
              </p>
            </div>
          </div>

          {selectedProject && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all"
            >
              <Plus size={16} />
              Add Report
            </button>
          )}
        </div>

        {/* Project selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
            Select Project
          </label>
          <div className="relative max-w-sm">
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                setSelectedProject(p || null);
                setReports([]);
              }}
              className="w-full appearance-none bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-medium pr-10 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="">— Choose a project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName || p.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Stats */}
        {selectedProject && reports.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BarChart3, label: "Total Reports", value: reports.length, color: "from-indigo-500 to-purple-500", glow: "shadow-indigo-500/20" },
              { icon: DollarSign, label: "Total Spend", value: fmtCur(totalSpend), color: "from-pink-500 to-rose-500", glow: "shadow-pink-500/20" },
              { icon: Eye, label: "Total Reach", value: fmt(totalReach), color: "from-cyan-500 to-blue-500", glow: "shadow-cyan-500/20" },
              { icon: Users, label: "Total Leads", value: fmt(totalLeads), color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20" },
            ].map((s) => (
              <div key={s.label} className={`bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 shadow-lg ${s.glow}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}>
                  <s.icon size={18} className="text-white" />
                </div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-white text-lg font-black">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + refresh */}
        {selectedProject && (
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                className="w-full bg-slate-800/50 border border-slate-700/40 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => loadReports(selectedProject.id)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}

        {/* Empty state */}
        {!selectedProject && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mb-5 shadow-xl">
              <Filter size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Select a Project</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Choose a project from the dropdown above to view and manage its marketing reports.
            </p>
          </div>
        )}

        {selectedProject && loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}

        {selectedProject && !loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
              <TrendingUp size={28} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No reports yet</h3>
            <p className="text-slate-400 text-sm">Add your first marketing report for this project.</p>
          </div>
        )}

        {/* Reports table */}
        {selectedProject && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-700/40 shadow-xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700/40">
                  {["Date","Client","Area","Ad Running","Type of Ads","Reach","Spend","Leads","Campaign Period","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className={`border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}`}>
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-500" />{fmtDate(r.date)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-white font-semibold">{r.clientName || "—"}</td>
                    <td className="px-4 py-3.5 text-slate-300">{r.areaName || "—"}</td>
                    <td className="px-4 py-3.5">
                      {r.isAdRunning === true ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg"><CheckCircle2 size={12} /> Yes</span>
                      ) : r.isAdRunning === false ? (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg"><XCircle size={12} /> No</span>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{r.typeOfAds || "—"}</td>
                    <td className="px-4 py-3.5 text-cyan-400 font-semibold">{fmt(r.todayReachObtained)}</td>
                    <td className="px-4 py-3.5 text-pink-400 font-semibold">{fmtCur(r.todayAmountSpend)}</td>
                    <td className="px-4 py-3.5 text-emerald-400 font-semibold">{fmt(r.leadObtained)}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{fmtDate(r.campaignStartDate)} – {fmtDate(r.campaignEndDate)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => openEdit(r)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Form Modal ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editTarget ? "Edit Marketing Report" : "New Marketing Report"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Project */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Project *</label>
                <div className="relative">
                  <select required value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className={selectCls}>
                    <option value="">— Select —</option>
                    {projects.map((p) => (<option key={p.id} value={p.id}>{p.projectName || p.name}</option>))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Client Name</label>
                  <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="e.g. ABC Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Area Name</label>
                  <input value={form.areaName} onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))} placeholder="e.g. Mumbai North" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Video Link</label>
                <input value={form.videoLink} onChange={(e) => setForm((f) => ({ ...f, videoLink: e.target.value }))} placeholder="https://..." className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Is Ad Running?</label>
                  <div className="relative">
                    <select value={form.isAdRunning} onChange={(e) => setForm((f) => ({ ...f, isAdRunning: e.target.value }))} className={selectCls}>
                      <option value="">— Select —</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Type of Ads</label>
                  <input value={form.typeOfAds} onChange={(e) => setForm((f) => ({ ...f, typeOfAds: e.target.value }))} placeholder="e.g. Meta, Google" className={inputCls} />
                </div>
              </div>

              {form.isAdRunning === "false" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reason Not Running</label>
                  <textarea value={form.reasonNotRunning} onChange={(e) => setForm((f) => ({ ...f, reasonNotRunning: e.target.value }))} rows={2} placeholder="Describe reason..." className={inputCls + " resize-none"} />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Today's Reach</label>
                  <input type="number" min="0" value={form.todayReachObtained} onChange={(e) => setForm((f) => ({ ...f, todayReachObtained: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Amount Spent (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.todayAmountSpend} onChange={(e) => setForm((f) => ({ ...f, todayAmountSpend: e.target.value }))} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Leads Obtained</label>
                  <input type="number" min="0" value={form.leadObtained} onChange={(e) => setForm((f) => ({ ...f, leadObtained: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Campaign Start</label>
                  <input type="date" value={form.campaignStartDate} onChange={(e) => setForm((f) => ({ ...f, campaignStartDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Campaign End</label>
                  <input type="date" value={form.campaignEndDate} onChange={(e) => setForm((f) => ({ ...f, campaignEndDate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Report Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-semibold text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {submitting ? <RefreshCw size={15} className="animate-spin" /> : editTarget ? "Update Report" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
