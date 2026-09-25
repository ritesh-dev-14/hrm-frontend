import React, { useState, useEffect, useMemo } from "react";
import {
  FolderOpen,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Camera,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Loader2,
  RefreshCw,
  Heart,
  Activity,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import ProfessionalLoader from "../../components/ProfessionalLoader";
import AdminProjectDetailModal from "../../components/admin/AdminProjectDetailModal";
import {
  buildHealthMap,
  getHealthConfig,
  computeClientSideFallback,
  HEALTH_CONFIG,
} from "../../utils/clientHealthScore";
export default function AdminHomePage() {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Health score state
  const [healthMap, setHealthMap] = useState({});
  const [healthLoading, setHealthLoading] = useState(false);

  // Filter States
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState("ALL"); // ALL | HEALTHY | ATTENTION | AT_RISK

  // Selected Project for Detail View Modal
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [projRes, deptRes] = await Promise.allSettled([
        API.get("/api/projects"),
        API.get("/api/departments"),
      ]);

      if (projRes.status === "fulfilled" && projRes.value?.data?.success) {
        setProjects(projRes.value.data.data || []);
      } else {
        setError("Failed to load projects list.");
      }

      if (deptRes.status === "fulfilled" && deptRes.value?.data?.data) {
        setDepartments(deptRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Error loading complete details data:", err);
      setError("An unexpected error occurred while loading projects.");
    } finally {
      setLoading(false);
    }

    // Fetch health scores separately so main list loads fast
    fetchHealthScores();
  };

  const fetchHealthScores = async () => {
    try {
      setHealthLoading(true);
      const res = await API.get("/api/health-scores");
      if (res?.data?.success) {
        setHealthMap(buildHealthMap(res.data.data || []));
      }
    } catch (err) {
      // Health scores are non-critical — fail silently
      console.warn("[HealthScore] Could not fetch health scores:", err?.message);
    } finally {
      setHealthLoading(false);
    }
  };

  /** Get health entry for a project — falls back to client-side estimate */
  const getHealth = (project) => {
    const fromApi = healthMap[project.id];
    if (fromApi) return fromApi;
    // Fallback while API is loading or if project wasn't scored
    return computeClientSideFallback(project);
  };

  const handleSelectProject = (proj) => {
    setSelectedProjectId(proj.id);
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Department Filter
      if (selectedDept !== "ALL") {
        const deptName = p.department?.name || "";
        if (selectedDept === "WEB_DEV") {
          if (
            !deptName.toLowerCase().includes("web") &&
            !deptName.toLowerCase().includes("it")
          )
            return false;
        } else if (selectedDept === "SEO") {
          if (!deptName.toLowerCase().includes("seo")) return false;
        } else if (selectedDept === "SMM") {
          if (
            !deptName.toLowerCase().includes("social") &&
            !deptName.toLowerCase().includes("smm")
          )
            return false;
        } else {
          if (p.department?.id !== selectedDept && deptName !== selectedDept)
            return false;
        }
      }

      // Status Filter
      if (statusFilter !== "ALL") {
        if (
          (p.status || "ONGOING").toUpperCase() !== statusFilter.toUpperCase()
        )
          return false;
      }

      // Health Filter
      if (healthFilter !== "ALL") {
        const h = getHealth(p);
        if (h.status !== healthFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.projectName?.toLowerCase().includes(q);
        const clientMatch = p.clientName?.toLowerCase().includes(q);
        const deptMatch = p.department?.name?.toLowerCase().includes(q);
        const managerMatch = p.assignments?.some((a) =>
          a.manager?.name?.toLowerCase().includes(q),
        );
        if (!nameMatch && !clientMatch && !deptMatch && !managerMatch)
          return false;
      }

      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, selectedDept, statusFilter, healthFilter, searchQuery, healthMap]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const webDev = projects.filter(
      (p) =>
        p.department?.name?.toLowerCase().includes("web") ||
        p.department?.name?.toLowerCase().includes("it"),
    ).length;
    const seo = projects.filter((p) =>
      p.department?.name?.toLowerCase().includes("seo"),
    ).length;
    const smm = projects.filter(
      (p) =>
        p.department?.name?.toLowerCase().includes("social") ||
        p.department?.name?.toLowerCase().includes("smm"),
    ).length;

    // Health aggregates
    const healthy = projects.filter((p) => getHealth(p).status === "HEALTHY").length;
    const attention = projects.filter((p) => getHealth(p).status === "ATTENTION").length;
    const atRisk = projects.filter((p) => getHealth(p).status === "AT_RISK").length;

    return { total, webDev, seo, smm, healthy, attention, atRisk };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, healthMap]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER SECTION */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={14} /> Admin Directory Access
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Complete Details Workspace
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Unified administrative portal for viewing and auditing all
              projects, department credentials, content calendars, shoot
              schedules, and performance metrics.
            </p>
          </div>

          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin text-indigo-600" : ""}
            />
            Refresh Directory
          </button>
        </div>

        {/* METRICS & QUICK SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.total}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Projects
              </p>
              <p className="text-lg font-bold text-slate-800">
                All Client Projects
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.webDev}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Web Development
              </p>
              <p className="text-lg font-bold text-slate-800">
                Portals & Sites
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.seo}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                SEO Department
              </p>
              <p className="text-lg font-bold text-slate-800">Search Growth</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {stats.smm}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Social Media
              </p>
              <p className="text-lg font-bold text-slate-800">
                Content & Shoots
              </p>
            </div>
          </div>
        </div>

        {/* ── CLIENT HEALTH SCORE SUMMARY STRIP ───────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-indigo-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Client Health Score
              </span>
              {healthLoading && (
                <Loader2 size={13} className="animate-spin text-slate-400" />
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Auto-computed from task activity, approvals &amp; communications
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {/* Healthy */}
            <button
              id="health-filter-healthy"
              onClick={() => setHealthFilter(healthFilter === "HEALTHY" ? "ALL" : "HEALTHY")}
              className={`flex items-center gap-3 p-4 transition hover:bg-emerald-50/60 group ${
                healthFilter === "HEALTHY" ? "bg-emerald-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">
                🟢
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-emerald-700">
                  {stats.healthy ?? "—"}
                </p>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Healthy
                </p>
                <p className="text-[10px] text-slate-400 hidden sm:block">On track</p>
              </div>
            </button>

            {/* Attention */}
            <button
              id="health-filter-attention"
              onClick={() => setHealthFilter(healthFilter === "ATTENTION" ? "ALL" : "ATTENTION")}
              className={`flex items-center gap-3 p-4 transition hover:bg-amber-50/60 group ${
                healthFilter === "ATTENTION" ? "bg-amber-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                🟡
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-amber-700">
                  {stats.attention ?? "—"}
                </p>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Attention
                </p>
                <p className="text-[10px] text-slate-400 hidden sm:block">Needs review</p>
              </div>
            </button>

            {/* At Risk */}
            <button
              id="health-filter-at-risk"
              onClick={() => setHealthFilter(healthFilter === "AT_RISK" ? "ALL" : "AT_RISK")}
              className={`flex items-center gap-3 p-4 transition hover:bg-rose-50/60 group ${
                healthFilter === "AT_RISK" ? "bg-rose-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-xl shrink-0">
                🔴
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-rose-700">
                  {stats.atRisk ?? "—"}
                </p>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  At Risk
                </p>
                <p className="text-[10px] text-slate-400 hidden sm:block">Urgent attention</p>
              </div>
            </button>
          </div>
          {healthFilter !== "ALL" && (
            <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Filtered by:{" "}
                <span className="font-bold text-slate-700">
                  {HEALTH_CONFIG[healthFilter]?.emoji}{" "}
                  {HEALTH_CONFIG[healthFilter]?.label}
                </span>
              </span>
              <button
                onClick={() => setHealthFilter("ALL")}
                className="ml-auto text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
              >
                <X size={11} /> Clear filter
              </button>
            </div>
          )}
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter size={14} /> Department:
            </span>
            {[
              { id: "ALL", label: "All Departments" },
              { id: "WEB_DEV", label: "Web Development" },
              { id: "SEO", label: "SEO Department" },
              { id: "SMM", label: "Social Media" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedDept(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  selectedDept === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Dynamic extra departments if present */}
            {departments.map((d) => {
              const dName = d.name || "";
              if (
                dName.toLowerCase().includes("web") ||
                dName.toLowerCase().includes("seo") ||
                dName.toLowerCase().includes("social")
              )
                return null;

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    selectedDept === d.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {dName}
                </button>
              );
            })}
          </div>

          {/* Search & Status Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search projects by name, client, manager, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        {/* PROJECTS GRID LIST */}
        {loading ? (
          <ProfessionalLoader text="Loading. Please wait..." />
        ) : error ? (
          <div className="bg-rose-50 rounded-3xl p-8 border border-rose-200 text-center space-y-3 text-rose-800">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-600" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchInitialData}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-800 font-bold text-lg">
              No matching projects found
            </p>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Try adjusting your department filter, status filter, or search
              query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const deptName = p.department?.name || "General";
              const isWeb =
                deptName.toLowerCase().includes("web") ||
                deptName.toLowerCase().includes("it");
              const isSeo = deptName.toLowerCase().includes("seo");
              const isSmm =
                deptName.toLowerCase().includes("social") ||
                deptName.toLowerCase().includes("smm");

              // ── Health score for this card ─────────────────────────
              const health = getHealth(p);
              const hCfg = getHealthConfig(health.status);

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden ${
                    health.status === "AT_RISK"
                      ? "border-rose-200/70 hover:border-rose-400"
                      : health.status === "ATTENTION"
                      ? "border-amber-200/70 hover:border-amber-400"
                      : "border-slate-200/80 hover:border-indigo-300"
                  }`}
                >
                  {/* Health colour accent bar at top of card */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-0.5 ${hCfg.bar}`}
                  />

                  <div className="space-y-4">
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {p.logo ? (
                          <img
                            src={p.logo}
                            alt={p.projectName}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                              isWeb
                                ? "bg-blue-600"
                                : isSeo
                                  ? "bg-emerald-600"
                                  : isSmm
                                    ? "bg-violet-600"
                                    : "bg-slate-800"
                            }`}
                          >
                            {p.projectName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                            {p.projectName}
                          </h3>
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 mt-1">
                            {deptName}
                          </span>
                        </div>
                      </div>

                      {/* Status + Health badges stacked */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            p.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "PAUSED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {p.status || "ONGOING"}
                        </span>

                        {/* ── HEALTH BADGE ── */}
                        <span
                          title={hCfg.description}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ring-1 ${hCfg.badge}`}
                        >
                          {hCfg.emoji} {hCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metadata Snippet */}
                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {p.clientName && (
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">
                            Client: {p.clientName}
                          </span>
                        </div>
                      )}

                      {p.location && (
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={13}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="truncate">{p.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar size={13} /> {formatDate(p.startDate)}
                        </span>
                        {p.renewalDate && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                            Renew: {formatDate(p.renewalDate)}
                          </span>
                        )}
                      </div>

                      {/* Managers assigned */}
                      {p.assignments && p.assignments.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                            Managers:
                          </span>
                          {p.assignments.map((asg) => (
                            <span
                              key={asg.id || asg.manager?.id}
                              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {asg.manager?.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ── HEALTH SCORE BAR ── */}
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${hCfg.textColor}`}>
                            Health Score
                          </span>
                          <span className={`text-[11px] font-black ${hCfg.textColor}`}>
                            {health.score ?? "—"}/100
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${hCfg.bar}`}
                            style={{ width: `${health.score ?? 0}%` }}
                          />
                        </div>
                        {/* Breakdown chips */}
                        {health.breakdown && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {health.breakdown.overdueTaskItems > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-semibold border border-rose-100">
                                {health.breakdown.overdueTaskItems} overdue
                              </span>
                            )}
                            {health.breakdown.pendingOldApprovals > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-semibold border border-amber-100">
                                {health.breakdown.pendingOldApprovals} approvals pending
                              </span>
                            )}
                            {health.breakdown.daysSinceLastComm !== null &&
                              health.breakdown.daysSinceLastComm > 7 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
                                {health.breakdown.daysSinceLastComm}d no comm
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:underline">
                      View Each & Everything <ChevronRight size={14} />
                    </span>
                    <button
                      onClick={() => handleSelectProject(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition shadow-sm"
                    >
                      Complete Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProjectId && (
        <AdminProjectDetailModal
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
}
