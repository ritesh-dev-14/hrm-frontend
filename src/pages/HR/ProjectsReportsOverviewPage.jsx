import { useState, useEffect, useCallback } from "react";
import {
  Share2, Megaphone, TrendingUp, Download, Calendar, Search,
  RefreshCw, Film, ImageIcon, DollarSign, Users, Eye, BarChart3,
  ChevronDown, ExternalLink, AlertCircle, Loader2, CheckCircle2,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const fmt = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");
const fmtCurrency = (n) => n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";

const getPreset = (preset) => {
  const today = new Date();
  const toISO = (d) => d.toISOString().split("T")[0];
  if (preset === "today") return { startDate: toISO(today), endDate: toISO(today) };
  if (preset === "3days") { const d = new Date(today); d.setDate(d.getDate() - 2); return { startDate: toISO(d), endDate: toISO(today) }; }
  if (preset === "weekly") { const d = new Date(today); d.setDate(d.getDate() - 6); return { startDate: toISO(d), endDate: toISO(today) }; }
  if (preset === "monthly") { const d = new Date(today); d.setDate(1); return { startDate: toISO(d), endDate: toISO(today) }; }
  return { startDate: "", endDate: "" };
};

function exportToExcel(tab, data, startDate, endDate) {
  let rows = [];
  const range = startDate && endDate ? `${startDate} to ${endDate}` : "All Time";
  rows.push(`"Reports Overview - ${tab.toUpperCase()}"`);
  rows.push(`"Date Range: ${range}"`);
  rows.push("");
  if (tab === "social-media") {
    rows.push(["Project", "Client", "Reels Planned", "Reels Posted", "Posts Planned", "Posts Posted"].join(","));
    (data.socialMedia || []).forEach(p => rows.push([`"${p.projectName || ""}"`, `"${p.clientName || ""}"`, p.reelsPlanned ?? 0, p.reelsPosted ?? 0, p.postsPlanned ?? 0, p.postsPosted ?? 0].join(",")));
  } else if (tab === "meta-ads") {
    rows.push(["Project", "Client", "Total Reach", "Total Spend", "Total Leads", "Reports"].join(","));
    (data.metaAds || []).forEach(p => rows.push([`"${p.projectName || ""}"`, `"${p.clientName || ""}"`, p.totalReach ?? 0, p.totalSpend ?? 0, p.totalLeads ?? 0, p.reportCount ?? 0].join(",")));
  } else if (tab === "seo") {
    rows.push(["Project", "Client", "Keywords", "Ranking", "Last Checked", "Remarks", "Manager"].join(","));
    (data.seo || []).forEach(p => {
      const lr = p.latestReport;
      rows.push([`"${p.projectName || ""}"`, `"${p.clientName || ""}"`, `"${(lr?.keywords || []).join(", ")}"`, lr?.rankingNo ?? "—", lr ? fmtDate(lr.checkDate) : "—", `"${lr?.remarks || ""}"`, `"${lr?.managerName || ""}"`].join(","));
    });
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${tab}-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md relative overflow-hidden">
      <div className={`p-4 rounded-2xl ${bgColor} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </motion.div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
      <div className="p-4 bg-slate-50 rounded-full mb-4">
        <BarChart3 size={40} className="text-slate-300" />
      </div>
      <p className="font-bold text-slate-800 text-lg">{label}</p>
      <p className="text-sm mt-1 text-slate-500">Try adjusting the date range or filters.</p>
    </div>
  );
}

function SocialMediaTab({ data, search }) {
  const projects = (data?.socialMedia || []).filter(p => !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase()));
  const totals = projects.reduce((acc, p) => ({ reelsPlanned: acc.reelsPlanned + (p.reelsPlanned || 0), reelsPosted: acc.reelsPosted + (p.reelsPosted || 0), postsPlanned: acc.postsPlanned + (p.postsPlanned || 0), postsPosted: acc.postsPosted + (p.postsPosted || 0) }), { reelsPlanned: 0, reelsPosted: 0, postsPlanned: 0, postsPosted: 0 });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Film} label="Reels Planned" value={fmt(totals.reelsPlanned)} color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard icon={Film} label="Reels Posted" value={fmt(totals.reelsPosted)} color="text-indigo-500" bgColor="bg-indigo-50/60" />
        <StatCard icon={ImageIcon} label="Posts Planned" value={fmt(totals.postsPlanned)} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard icon={ImageIcon} label="Posts Posted" value={fmt(totals.postsPosted)} color="text-purple-500" bgColor="bg-purple-50/60" />
      </div>
      {projects.length === 0 ? <EmptyState label="No Social Media projects found" /> : (
        <div className="overflow-x-auto rounded-3xl bg-white border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                {["Project", "Client", "Reels Planned", "Reels Posted", "Posts Planned", "Posts Posted", "Progress"].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map(p => {
                const reelPct = p.reelsPlanned ? Math.round((p.reelsPosted / p.reelsPlanned) * 100) : 0;
                const postPct = p.postsPlanned ? Math.round((p.postsPosted / p.postsPlanned) * 100) : 0;
                const avg = Math.round((reelPct + postPct) / 2);
                return (
                  <tr key={p.projectId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{p.projectName || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{p.clientName || "—"}</td>
                    <td className="px-6 py-4 text-indigo-700 font-bold">{fmt(p.reelsPlanned)}</td>
                    <td className="px-6 py-4 text-indigo-600 font-bold">{fmt(p.reelsPosted)}</td>
                    <td className="px-6 py-4 text-purple-700 font-bold">{fmt(p.postsPlanned)}</td>
                    <td className="px-6 py-4 text-purple-600 font-bold">{fmt(p.postsPosted)}</td>
                    <td className="px-6 py-4 min-w-[150px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(avg, 100)}%` }} />
                        </div>
                        <span className="text-xs font-black text-slate-700 w-8 text-right">{avg}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MetaAdsTab({ data, search }) {
  const [expanded, setExpanded] = useState(null);
  const projects = (data?.metaAds || []).filter(p => !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase()));
  const totals = projects.reduce((acc, p) => ({ reach: acc.reach + (p.totalReach || 0), spend: acc.spend + (p.totalSpend || 0), leads: acc.leads + (p.totalLeads || 0) }), { reach: 0, spend: 0, leads: 0 });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Total Reach" value={fmt(totals.reach)} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard icon={DollarSign} label="Total Spend" value={fmtCurrency(totals.spend)} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard icon={Users} label="Total Leads" value={fmt(totals.leads)} color="text-amber-600" bgColor="bg-amber-50" />
      </div>
      {projects.length === 0 ? <EmptyState label="No Meta Ads reports found" /> : (
        <div className="space-y-4">
          {projects.map(p => (
            <div key={p.projectId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
              <button className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors" onClick={() => setExpanded(expanded === p.projectId ? null : p.projectId)}>
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 rounded-2xl bg-blue-50"><Megaphone size={20} className="text-blue-600" /></div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{p.projectName}</p>
                    <p className="text-sm text-slate-500 font-medium">{p.clientName || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-right pr-4">
                  <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Reach</p><p className="font-black text-blue-700 text-lg">{fmt(p.totalReach)}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Spend</p><p className="font-black text-emerald-700 text-lg">{fmtCurrency(p.totalSpend)}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Leads</p><p className="font-black text-amber-600 text-lg">{fmt(p.totalLeads)}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Reports</p><p className="font-black text-slate-700 text-lg">{p.reportCount}</p></div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform ${expanded === p.projectId ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expanded === p.projectId && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">Daily Breakdown</p>
                  <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50 border-b border-slate-200">{["Date", "Reach", "Spend", "Leads", "Ad Running", "Type", "Area"].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-xs">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {(p.reports || []).map(r => (
                          <tr key={r.id} className="text-slate-700 hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold">{fmtDate(r.date)}</td>
                            <td className="px-4 py-3 text-blue-700 font-bold">{fmt(r.reach)}</td>
                            <td className="px-4 py-3 text-emerald-700 font-bold">{fmtCurrency(r.spend)}</td>
                            <td className="px-4 py-3 text-amber-700 font-bold">{fmt(r.leads)}</td>
                            <td className="px-4 py-3">{r.isAdRunning === null ? "—" : r.isAdRunning ? <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg w-fit"><CheckCircle2 size={14} />Yes</span> : <span className="flex items-center gap-1.5 text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-lg w-fit"><AlertCircle size={14} />No</span>}</td>
                            <td className="px-4 py-3 font-medium">{r.typeOfAds || "—"}</td>
                            <td className="px-4 py-3 text-slate-500">{r.areaName || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SeoTab({ data, search }) {
  const [expanded, setExpanded] = useState(null);
  const projects = (data?.seo || []).filter(p => !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-4">
      {projects.length === 0 ? <EmptyState label="No SEO reports found" /> : projects.map(p => {
        const lr = p.latestReport;
        const rankColor = !lr?.rankingNo ? "text-slate-400" : lr.rankingNo <= 3 ? "text-amber-500" : lr.rankingNo <= 10 ? "text-emerald-600" : "text-slate-600";
        return (
          <div key={p.projectId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
            <button className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors" onClick={() => setExpanded(expanded === p.projectId ? null : p.projectId)}>
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 rounded-2xl bg-teal-50"><TrendingUp size={20} className="text-teal-600" /></div>
                <div><p className="font-bold text-slate-900 text-lg">{p.projectName}</p><p className="text-sm text-slate-500 font-medium">{p.clientName || "—"}</p></div>
              </div>
              <div className="flex items-center gap-8 text-right pr-4">
                <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Ranking</p><p className={`font-black text-2xl ${rankColor}`}>{lr?.rankingNo ? `#${lr.rankingNo}` : "—"}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Last Checked</p><p className="font-bold text-slate-800 text-base">{fmtDate(lr?.checkDate)}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Reports</p><p className="font-black text-slate-700 text-xl">{p.reports?.length || 0}</p></div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${expanded === p.projectId ? "rotate-180" : ""}`} />
              </div>
            </button>
            {expanded === p.projectId && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5 space-y-6">
                {lr && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><Search size={14}/> Top Keywords</p><div className="flex flex-wrap gap-2">{(lr.keywords || []).map((kw, i) => <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">{kw}</span>)}</div></div>
                    <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp size={14}/> Analyst Remarks</p><p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{lr.remarks || "No remarks logged."}</p></div>
                    {lr.screenshotUrl && <div className="col-span-2 pt-2 border-t border-slate-100"><a href={lr.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl transition-colors"><ExternalLink size={16} />View Latest Screenshot Report</a></div>}
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">Historical Checks</p>
                  <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-slate-50 border-b border-slate-200">{["Date Checked", "Ranking #", "Keywords", "Manager", "Screenshot"].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase text-xs">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {(p.reports || []).map(r => (
                          <tr key={r.id} className="text-slate-700 hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold">{fmtDate(r.checkDate)}</td>
                            <td className={`px-4 py-3 font-black text-lg ${!r.rankingNo ? "text-slate-400" : r.rankingNo <= 3 ? "text-amber-500" : r.rankingNo <= 10 ? "text-emerald-600" : ""}`}>{r.rankingNo ? `#${r.rankingNo}` : "—"}</td>
                            <td className="px-4 py-3 font-medium text-slate-600">{(r.keywords || []).slice(0, 2).join(", ")}{r.keywords?.length > 2 ? "…" : ""}</td>
                            <td className="px-4 py-3 text-slate-600">{r.managerName || "—"}</td>
                            <td className="px-4 py-3">{r.screenshotUrl ? <a href={r.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100"><ExternalLink size={14} /></a> : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectsReportsOverviewPage() {
  const [tab, setTab] = useState("social-media");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [preset, setPreset] = useState("");

  const tabs = [
    { id: "social-media", label: "Social Media", icon: Share2, color: "text-indigo-600", activeBg: "bg-indigo-600", activeText: "text-white" },
    { id: "meta-ads", label: "Meta Ads", icon: Megaphone, color: "text-blue-600", activeBg: "bg-blue-600", activeText: "text-white" },
    { id: "seo", label: "SEO", icon: TrendingUp, color: "text-teal-600", activeBg: "bg-teal-600", activeText: "text-white" },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await API.get(`/api/reports/projects-overview?${params}`);
      setData(res.data?.data || {});
    } catch { toast.error("Failed to load reports"); }
    finally { setLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (p) => { setPreset(p); const r = getPreset(p); setStart(r.startDate); setEnd(r.endDate); };
  const activeTab = tabs.find(t => t.id === tab);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
              {activeTab && (
                <div className={`p-3 rounded-2xl ${activeTab.activeBg} shadow-lg shadow-slate-200`}>
                  <activeTab.icon size={24} className="text-white" />
                </div>
              )}
              Reports Overview
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Social Media · Meta Ads · SEO — filter by date &amp; export your performance data easily.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button onClick={load} disabled={loading} className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm transition-all">
              <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600" : ""} />
            </button>
            <button onClick={() => exportToExcel(tab, data, startDate, endDate)} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-indigo-600 transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95">
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col xl:flex-row gap-6 xl:items-center xl:justify-between">
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              {[{ id: "today", label: "Today" }, { id: "3days", label: "3 Days" }, { id: "weekly", label: "Weekly" }, { id: "monthly", label: "Monthly" }, { id: "", label: "All Time" }].map(p => (
                <button key={p.id} onClick={() => applyPreset(p.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${preset === p.id ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>{p.label}</button>
              ))}
            </div>
            
            {/* Custom Range & Search */}
            <div className="flex flex-col md:flex-row items-center gap-4 flex-wrap w-full xl:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 flex-1 md:flex-none">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" value={startDate} onChange={e => { setStart(e.target.value); setPreset(""); }} className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full md:w-36 cursor-pointer" />
              </div>
              <span className="text-slate-400 font-bold text-sm hidden md:block">TO</span>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 flex-1 md:flex-none">
                <Calendar size={16} className="text-slate-400" />
                <input type="date" value={endDate} onChange={e => { setEnd(e.target.value); setPreset(""); }} className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full md:w-36 cursor-pointer" />
              </div>
              
              <div className="w-px h-8 bg-slate-200 hidden md:block mx-2"></div>
              
              <div className="flex items-center gap-2 bg-white border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl px-4 py-2 flex-1 transition-all">
                <Search size={16} className="text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or clients..." className="bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder-slate-400 w-full md:w-48" />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none pt-4 border-t border-slate-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all border whitespace-nowrap ${tab === t.id ? `${t.activeBg} ${t.activeText} border-transparent shadow-md` : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                <t.icon size={18} className={tab === t.id ? "text-white" : t.color} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Tab Content */}
        <div className="animate-fadeIn">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200/50">
              <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500 font-medium">Fetching reports overview...</p>
            </div>
          ) : (
            <>
              {tab === "social-media" && <SocialMediaTab data={data} search={search} />}
              {tab === "meta-ads" && <MetaAdsTab data={data} search={search} />}
              {tab === "seo" && <SeoTab data={data} search={search} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
