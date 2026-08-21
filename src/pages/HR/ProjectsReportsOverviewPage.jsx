import { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Megaphone,
  TrendingUp,
  Download,
  Calendar,
  Search,
  RefreshCw,
  Film,
  ImageIcon,
  DollarSign,
  Users,
  Eye,
  BarChart3,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import ProfessionalLoader from "../../components/ProfessionalLoader";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));
const fmtCurrency = (n) =>
  n == null
    ? "—"
    : "₹" +
      Number(n).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

const getPreset = (preset) => {
  const today = new Date();
  const toISO = (d) => d.toISOString().split("T")[0];
  if (preset === "today")
    return { startDate: toISO(today), endDate: toISO(today) };
  if (preset === "3days") {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    return { startDate: toISO(d), endDate: toISO(today) };
  }
  if (preset === "weekly") {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { startDate: toISO(d), endDate: toISO(today) };
  }
  if (preset === "monthly") {
    const d = new Date(today);
    d.setDate(1);
    return { startDate: toISO(d), endDate: toISO(today) };
  }
  return { startDate: "", endDate: "" };
};

function exportToExcel(tab, data, startDate, endDate) {
  let rows = [];
  const range =
    startDate && endDate ? `${startDate} to ${endDate}` : "All Time";
  const escapeCell = (val) => `"${String(val || "").replace(/"/g, '""')}"`;

  rows.push(escapeCell(`Reports Overview - ${tab.toUpperCase()}`));
  rows.push(escapeCell(`Date Range: ${range}`));
  rows.push("");

  if (tab === "social-media") {
    rows.push(
      [
        "Project",
        "Total Planned",
        "Reels Planned",
        "Reels Uploaded",
        "Post Planned",
        "Post Uploaded",
        "Total Uploads",
      ].join(","),
    );
    (data.socialMedia || []).forEach((p) => {
      const totalPlanned = (p.reelsPlanned || 0) + (p.postsPlanned || 0);
      const totalUploaded = (p.reelsPosted || 0) + (p.postsPosted || 0);
      rows.push(
        [
          escapeCell(p.projectName),
          totalPlanned,
          p.reelsPlanned ?? 0,
          p.reelsPosted ?? 0,
          p.postsPlanned ?? 0,
          p.postsPosted ?? 0,
          totalUploaded,
        ].join(","),
      );
    });
  } else if (tab === "meta-ads") {
    rows.push(
      [
        "Project",
        "Client",
        "Total Reach",
        "Total Spend",
        "Total Leads",
        "Reports",
      ].join(","),
    );
    (data.metaAds || []).forEach((p) =>
      rows.push(
        [
          escapeCell(p.projectName),
          escapeCell(p.clientName),
          p.totalReach ?? 0,
          p.totalSpend ?? 0,
          p.totalLeads ?? 0,
          p.reportCount ?? 0,
        ].join(","),
      ),
    );
  } else if (tab === "seo") {
    rows.push(
      [
        "Project",
        "Client",
        "Keywords",
        "Ranking",
        "Last Checked",
        "Remarks",
        "Manager",
      ].join(","),
    );
    (data.seo || []).forEach((p) => {
      const lr = p.latestReport;
      rows.push(
        [
          escapeCell(p.projectName),
          escapeCell(p.clientName),
          escapeCell((lr?.keywords || []).join(", ")),
          lr?.rankingNo ?? "—",
          lr ? fmtDate(lr.checkDate) : "—",
          escapeCell(lr?.remarks),
          escapeCell(lr?.managerName),
        ].join(","),
      );
    });
  }

  const blob = new Blob(["\ufeff" + rows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tab}-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Elevated Stat Card with subtle glowing backgrounds and precise typography
function StatCard({ icon: Icon, label, value, colorClass, bgClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4 relative overflow-hidden group hover:border-slate-200 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={`p-2.5 rounded-xl ${bgClass} ${colorClass} shadow-sm border border-white/50`}
        >
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight relative z-10">
        {value}
      </p>
    </motion.div>
  );
}

function EmptyState({ label }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white/50 rounded-2xl border border-slate-200 border-dashed backdrop-blur-sm"
    >
      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 shadow-inner">
        <BarChart3 size={28} className="text-slate-300" />
      </div>
      <p className="font-semibold text-slate-700 text-lg">{label}</p>
      <p className="text-sm mt-1 text-slate-500">
        Adjust the date range or try a different filter.
      </p>
    </motion.div>
  );
}

function SocialMediaTab({ data, search }) {
  const [expanded, setExpanded] = useState(null);
  const [projectReasons, setProjectReasons] = useState({});
  const [loadingReasons, setLoadingReasons] = useState(null);

  const projects = (data?.socialMedia || []).filter(
    (p) =>
      !search ||
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = projects.reduce(
    (acc, p) => ({
      reelsPlanned: acc.reelsPlanned + (p.reelsPlanned || 0),
      reelsPosted: acc.reelsPosted + (p.reelsPosted || 0),
      postsPlanned: acc.postsPlanned + (p.postsPlanned || 0),
      postsPosted: acc.postsPosted + (p.postsPosted || 0),
    }),
    { reelsPlanned: 0, reelsPosted: 0, postsPlanned: 0, postsPosted: 0 },
  );

  const getReasons = (project) => {
    const reasons = projectReasons[project.projectId] ?? project.reasons ?? [];
    return [...reasons].sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  };

  const toggleProject = async (project) => {
    if (expanded === project.projectId) {
      setExpanded(null);
      return;
    }

    setExpanded(project.projectId);
    if (projectReasons[project.projectId]) return;

    setLoadingReasons(project.projectId);
    try {
      const response = await API.get(`/api/projects/${project.projectId}`);
      const projectData = response.data?.data || response.data || {};
      setProjectReasons((current) => ({
        ...current,
        [project.projectId]: projectData.reasons || [],
      }));
    } catch (error) {
      console.error("Failed to load Deviation:", error);
      setProjectReasons((current) => ({
        ...current,
        [project.projectId]: project.reasons || [],
      }));
    } finally {
      setLoadingReasons(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Film}
          label="Reels Planned"
          value={fmt(totals.reelsPlanned)}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50"
        />
        <StatCard
          icon={Film}
          label="Reels Uploaded"
          value={fmt(totals.reelsPosted)}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          icon={ImageIcon}
          label="Posts Planned"
          value={fmt(totals.postsPlanned)}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard
          icon={ImageIcon}
          label="Posts Uploaded"
          value={fmt(totals.postsPosted)}
          colorClass="text-pink-600"
          bgClass="bg-pink-50"
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState label="No Social Media projects found" />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Project Details
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Planned
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reels Planned
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reels Uploaded
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Post Planned
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Post Uploaded
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Uploads
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map((p, i) => {
                const totalPlanned =
                  (p.reelsPlanned || 0) + (p.postsPlanned || 0);
                const totalUploaded =
                  (p.reelsPosted || 0) + (p.postsPosted || 0);
                const uploadPct =
                  totalPlanned > 0
                    ? Math.round((totalUploaded / totalPlanned) * 100)
                    : 0;
                const reasons = getReasons(p);
                const latestReason = reasons[0];

                return [
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.projectId}
                    onClick={() => toggleProject(p)}
                    className={`cursor-pointer hover:bg-slate-50/50 transition-colors group ${expanded === p.projectId ? "bg-slate-50/70" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <ChevronDown
                          size={18}
                          className={`mt-0.5 shrink-0 text-indigo-500 transition-transform ${expanded === p.projectId ? "rotate-180" : ""}`}
                        />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {p.projectName || "—"}
                          </p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {p.clientName}
                          </p>
                          {latestReason && (
                            <p
                              className="text-xs text-amber-700 mt-2 max-w-xs truncate"
                              title={latestReason.reason || latestReason.text}
                            >
                              Latest reason:{" "}
                              {latestReason.reason || latestReason.text || "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700 bg-slate-50/30">
                      {fmt(totalPlanned)}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-500">
                      {fmt(p.reelsPlanned)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900">
                      {fmt(p.reelsPosted)}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-500">
                      {fmt(p.postsPlanned)}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-900">
                      {fmt(p.postsPosted)}
                    </td>
                    <td className="px-6 py-4 min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 w-8">
                          {fmt(totalUploaded)}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden hidden sm:block shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(uploadPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 w-8 text-right hidden sm:block">
                          {uploadPct}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>,
                  expanded === p.projectId && (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={`${p.projectId}-reasons`}
                      className="bg-amber-50/40"
                    >
                      <td colSpan={7} className="px-6 py-5">
                        <div className="ml-9 rounded-xl border border-amber-100 bg-white p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-800">
                              Deviation
                            </h4>
                            <span className="text-xs font-semibold text-amber-700">
                              {reasons.length}{" "}
                              {reasons.length === 1 ? "reason" : "reasons"}
                            </span>
                          </div>
                          {loadingReasons === p.projectId ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Loader2 size={16} className="animate-spin" />{" "}
                              Loading reasons...
                            </div>
                          ) : reasons.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              No reasons added for this project.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {reasons.map((reason, reasonIndex) => (
                                <div
                                  key={
                                    reason.id || `${p.projectId}-${reasonIndex}`
                                  }
                                  className="flex items-start gap-3 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
                                >
                                  <Calendar
                                    size={15}
                                    className="mt-0.5 shrink-0 text-amber-500"
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">
                                      {reason.reason || reason.text || "—"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      {fmtDate(reason.date)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

function MetaAdsTab({ data, search }) {
  const [expanded, setExpanded] = useState(null);
  const projects = (data?.metaAds || []).filter(
    (p) =>
      !search ||
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()),
  );
  const totals = projects.reduce(
    (acc, p) => ({
      reach: acc.reach + (p.totalReach || 0),
      spend: acc.spend + (p.totalSpend || 0),
      leads: acc.leads + (p.totalLeads || 0),
    }),
    { reach: 0, spend: 0, leads: 0 },
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatCard
          icon={Eye}
          label="Total Reach"
          value={fmt(totals.reach)}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spend"
          value={fmtCurrency(totals.spend)}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          icon={Users}
          label="Total Leads"
          value={fmt(totals.leads)}
          colorClass="text-amber-600"
          bgClass="bg-amber-50"
        />
      </div>

      {projects.length === 0 ? (
        <EmptyState label="No Meta Ads reports found" />
      ) : (
        <div className="space-y-4">
          {projects.map((p, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={p.projectId}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expanded === p.projectId ? "border-blue-200 shadow-[0_8px_30px_rgb(59,130,246,0.08)]" : "border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-slate-200"}`}
            >
              <button
                className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
                onClick={() =>
                  setExpanded(expanded === p.projectId ? null : p.projectId)
                }
              >
                <div className="flex items-center gap-4 text-left mb-4 md:mb-0">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
                    <Megaphone size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-[15px]">
                      {p.projectName}
                    </p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                      {p.clientName || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right pr-2">
                  <div className="hidden sm:block">
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Reach
                    </p>
                    <p className="font-semibold text-slate-900">
                      {fmt(p.totalReach)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Spend
                    </p>
                    <p className="font-semibold text-slate-900">
                      {fmtCurrency(p.totalSpend)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-blue-500 uppercase tracking-widest font-bold mb-1">
                      Leads
                    </p>
                    <p className="font-bold text-blue-600 text-lg">
                      {fmt(p.totalLeads)}
                    </p>
                  </div>
                  <div
                    className={`p-2 rounded-full transition-colors ${expanded === p.projectId ? "bg-blue-50" : "bg-slate-50"}`}
                  >
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-300 ${expanded === p.projectId ? "rotate-180 text-blue-600" : ""}`}
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expanded === p.projectId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-4 ml-1">
                        Daily Breakdown
                      </p>
                      <div className="overflow-hidden bg-white rounded-xl border border-slate-200/60 shadow-sm">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              {[
                                "Date",
                                "Reach",
                                "Spend",
                                "Leads",
                                "Status",
                                "Type",
                                "Area",
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="px-5 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider text-xs"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {(p.reports || []).map((r) => (
                              <tr
                                key={r.id}
                                className="text-slate-600 hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="px-5 py-3.5 text-slate-900 font-semibold">
                                  {fmtDate(r.date)}
                                </td>
                                <td className="px-5 py-3.5 font-medium">
                                  {fmt(r.reach)}
                                </td>
                                <td className="px-5 py-3.5 font-medium">
                                  {fmtCurrency(r.spend)}
                                </td>
                                <td className="px-5 py-3.5 font-bold text-blue-600">
                                  {fmt(r.leads)}
                                </td>
                                <td className="px-5 py-3.5">
                                  {r.isAdRunning === null ? (
                                    "—"
                                  ) : r.isAdRunning ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                                      <CheckCircle2 size={12} strokeWidth={3} />{" "}
                                      Running
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-full">
                                      <AlertCircle size={12} strokeWidth={3} />{" "}
                                      Paused
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 font-medium">
                                  {r.typeOfAds || "—"}
                                </td>
                                <td className="px-5 py-3.5 text-slate-500">
                                  {r.areaName || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function SeoTab({ data, search }) {
  const [expanded, setExpanded] = useState(null);
  const projects = (data?.seo || []).filter(
    (p) =>
      !search ||
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {projects.length === 0 ? (
        <EmptyState label="No SEO reports found" />
      ) : (
        projects.map((p, i) => {
          const lr = p.latestReport;
          const rankColor = !lr?.rankingNo
            ? "text-slate-400"
            : lr.rankingNo <= 3
              ? "text-blue-600"
              : lr.rankingNo <= 10
                ? "text-emerald-600"
                : "text-slate-700";

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={p.projectId}
              className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expanded === p.projectId ? "border-emerald-200 shadow-[0_8px_30px_rgb(16,185,129,0.08)]" : "border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-slate-200"}`}
            >
              <button
                className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
                onClick={() =>
                  setExpanded(expanded === p.projectId ? null : p.projectId)
                }
              >
                <div className="flex items-center gap-4 text-left mb-4 md:mb-0">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm">
                    <TrendingUp size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-[15px]">
                      {p.projectName}
                    </p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                      {p.clientName || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right pr-2">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Ranking
                    </p>
                    <p className={`font-bold text-xl ${rankColor}`}>
                      {lr?.rankingNo ? `#${lr.rankingNo}` : "—"}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                      Last Checked
                    </p>
                    <p className="font-semibold text-slate-900">
                      {fmtDate(lr?.checkDate)}
                    </p>
                  </div>
                  <div
                    className={`p-2 rounded-full transition-colors ${expanded === p.projectId ? "bg-emerald-50" : "bg-slate-50"}`}
                  >
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-300 ${expanded === p.projectId ? "rotate-180 text-emerald-600" : ""}`}
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expanded === p.projectId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5">
                      {lr && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Search size={14} className="text-emerald-500" />{" "}
                              Top Keywords
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {(lr.keywords || []).map((kw, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/60 shadow-sm"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                              <TrendingUp size={14} className="text-blue-500" />{" "}
                              Remarks
                            </p>
                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                              {lr.remarks || "No remarks logged."}
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3 ml-1">
                          Historical Data
                        </p>
                        <div className="overflow-hidden bg-white rounded-xl border border-slate-200/60 shadow-sm">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                {[
                                  "Date",
                                  "Rank",
                                  "Keywords",
                                  "Manager",
                                  "Report",
                                ].map((h) => (
                                  <th
                                    key={h}
                                    className="px-5 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider text-xs"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {(p.reports || []).map((r) => (
                                <tr
                                  key={r.id}
                                  className="text-slate-600 hover:bg-slate-50/80 transition-colors"
                                >
                                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                                    {fmtDate(r.checkDate)}
                                  </td>
                                  <td className="px-5 py-3.5 font-bold text-slate-800">
                                    {r.rankingNo ? `#${r.rankingNo}` : "—"}
                                  </td>
                                  <td className="px-5 py-3.5 font-medium truncate max-w-[250px]">
                                    {(r.keywords || []).join(", ")}
                                  </td>
                                  <td className="px-5 py-3.5 font-medium">
                                    {r.managerName || "—"}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    {r.screenshotUrl ? (
                                      <a
                                        href={r.screenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-bold text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                      >
                                        <ExternalLink size={14} /> View
                                      </a>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}
    </motion.div>
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
    {
      id: "social-media",
      label: "Social Media",
      icon: Share2,
      activeClass: "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
    {
      id: "meta-ads",
      label: "Meta Ads",
      icon: Megaphone,
      activeClass: "bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
    {
      id: "seo",
      label: "SEO",
      icon: TrendingUp,
      activeClass:
        "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-900/5",
      inactiveClass: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await API.get(`/api/reports/projects-overview?${params}`);
      setData(res.data?.data || {});
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (p) => {
    setPreset(p);
    const r = getPreset(p);
    setStart(r.startDate);
    setEnd(r.endDate);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-4 md:p-8 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header - Premium SaaS styling */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Reports Overview
            </h1>
            <p className="text-[15px] text-slate-500 mt-1.5 font-medium">
              Monitor and export project performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 shadow-sm transition-all duration-200"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin text-blue-600" : ""}
              />
            </button>
            <button
              onClick={() => exportToExcel(tab, data, startDate, endDate)}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:from-slate-700 hover:to-slate-800 active:scale-[0.98] transition-all duration-200"
            >
              <Download
                size={16}
                className="text-slate-300 group-hover:text-white transition-colors"
              />{" "}
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters Panel - Clean & Integrated */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-[0_2px_8px_rgb(0,0,0,0.02)] flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="flex items-center gap-1 p-2">
            {[
              { id: "today", label: "Today" },
              { id: "3days", label: "3 Days" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "", label: "All Time" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${preset === p.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto p-2 pt-0 xl:p-2 xl:pl-0">
            <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl px-3.5 py-2 flex-1 md:flex-none focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPreset("");
                }}
                className="bg-transparent text-[13px] font-semibold text-slate-700 outline-none w-full md:w-32 cursor-pointer"
              />
            </div>
            <span className="text-slate-300 font-medium">—</span>
            <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl px-3.5 py-2 flex-1 md:flex-none focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPreset("");
                }}
                className="bg-transparent text-[13px] font-semibold text-slate-700 outline-none w-full md:w-32 cursor-pointer"
              />
            </div>

            <div className="w-px h-6 bg-slate-200 hidden md:block mx-1"></div>

            <div className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl px-4 py-2 flex-1 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records..."
                className="bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder-slate-400 w-full md:w-48"
              />
            </div>
          </div>
        </div>

        {/* Floating Segmented Control */}
        <div className="flex items-center justify-center md:justify-start">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${tab === t.id ? t.activeClass : t.inactiveClass}`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <ProfessionalLoader text="Loading. Please wait..." />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "social-media" && (
                  <SocialMediaTab data={data} search={search} />
                )}
                {tab === "meta-ads" && (
                  <MetaAdsTab data={data} search={search} />
                )}
                {tab === "seo" && <SeoTab data={data} search={search} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
