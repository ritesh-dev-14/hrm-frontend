import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Edit3,
  Layers3,
  RefreshCw,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import API from "../services/api";

const EMPTY_PROJECT = {
  projectId: "",
  projectName: "Unnamed project",
  clientName: "Client unavailable",
  phone: "",
  totalPlanned: 0,
  totalPosted: 0,
  totalLeftToPost: 0,
  totalEdited: 0,
  totalLeftToEdit: 0,
  postedProgress: 0,
  editProgress: 0,
};

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeProject = (project = {}) => {
  return {
    ...EMPTY_PROJECT,
    ...project,
    projectId: project.projectId ?? project.project?.id ?? project.id ?? project._id ?? "",
    projectName: project.projectName ?? project.project?.projectName ?? project.name ?? EMPTY_PROJECT.projectName,
    clientName: project.clientName ?? project.client?.name ?? EMPTY_PROJECT.clientName,
    phone: project.phone ?? project.client?.phone ?? "",
    totalPlanned: numberValue(project.totalPlanned),
    totalPosted: numberValue(project.totalPosted),
    totalLeftToPost: numberValue(project.totalLeftToPost),
    totalEdited: numberValue(project.totalEdited),
    totalLeftToEdit: numberValue(project.totalLeftToEdit),
    postedProgress: numberValue(project.postedProgress),
    editProgress: numberValue(project.editProgress),
  };
};

/**
 * Extracts the data payload from an Axios response.
 * Handles both { data: { data: ... } } and { data: ... } shapes.
 */
const extractPayload = (response) =>
  response?.data?.data ?? response?.data ?? null;

/**
 * Normalizes any payload (single object or array) to an array of
 * normalized project objects.
 */
const normalizeToArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeProject);
  const candidates =
    payload.projects ?? payload.items ?? payload.summary;
  if (Array.isArray(candidates)) return candidates.map(normalizeProject);
  // Single-object payload — treat it as one project
  return [normalizeProject(payload)];
};

/**
 * Extracts a single project from the per-project detail endpoint payload.
 * The backend contract returns a single object for
 * GET /api/reports/social-media-data-summary/:projectId
 */
const extractSingleProject = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload.length ? normalizeProject(payload[0]) : null;
  const candidates = payload.projects ?? payload.items ?? payload.summary;
  if (Array.isArray(candidates)) return candidates.length ? normalizeProject(candidates[0]) : null;
  return normalizeProject(payload);
};

const formatCount = (value) => new Intl.NumberFormat("en-IN").format(numberValue(value));

const ProgressBar = ({ value, tone = "blue" }) => (
  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`h-full rounded-full ${tone === "green" ? "bg-emerald-500" : "bg-amber-500"}`}
    />
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
    <div className="flex items-center justify-between gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={19} />
      </span>
      <span className="text-2xl font-black tracking-tight text-slate-900">
        {formatCount(value)}
      </span>
    </div>
    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
      {label}
    </p>
  </div>
);

const StatusBadge = ({ value, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
      value >= 100
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700"
    }`}
  >
    {value >= 100 ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
    {label}: {Math.round(value)}%
  </span>
);

/** Colored metric tile used in the detail modal */
const MetricBox = ({ value, label, valueCls, bgCls }) => (
  <div className={`rounded-xl p-4 ${bgCls}`}>
    <p className={`text-2xl font-black ${valueCls}`}>{formatCount(value)}</p>
    <p
      className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${valueCls} opacity-70`}
    >
      {label}
    </p>
  </div>
);

const DataDashboardPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // silent post-approval refresh
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState("");

  // Stable ref so event-listener callbacks always read the current projectId
  const projectIdRef = useRef(projectId);
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  /* ── Load all projects summary ─────────────────────────────────────────── */
  const loadSummary = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      const response = await API.get("/api/reports/social-media-data-summary", {
        params: { _ts: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });

      const normalized = normalizeToArray(extractPayload(response));
      setProjects(normalized);

      // Also patch selectedProject if its data is in the refreshed list
      setSelectedProject((prev) => {
        if (!prev) return prev;
        const updated = normalized.find((p) => p.projectId === prev.projectId);
        return updated ?? prev;
      });
    } catch (requestError) {
      console.error("Failed to load social media data summary:", requestError);
      setError(
        requestError.response?.data?.message ||
          "We could not load the social media data right now."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /* ── Load single project detail ────────────────────────────────────────── */
  const loadProjectDetail = useCallback(async (id) => {
    const targetId = id ?? projectIdRef.current;
    if (!targetId) return;
    try {
      setIsDetailLoading(true);

      const response = await API.get(
        `/api/reports/social-media-data-summary/${targetId}`,
        {
          params: { _ts: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        }
      );

      const project = extractSingleProject(extractPayload(response));
      if (project) setSelectedProject(project);
    } catch (requestError) {
      console.error("Failed to load social media project detail:", requestError);
      setError(
        requestError.response?.data?.message ||
          "We could not load this project detail."
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, []); // stable — reads projectIdRef for default

  /* ── Initial load ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let isActive = true;
    const init = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await API.get(
          "/api/reports/social-media-data-summary",
          {
            params: { _ts: Date.now() },
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          }
        );
        if (isActive)
          setProjects(normalizeToArray(extractPayload(response)));
      } catch (requestError) {
        console.error("Failed to load social media data summary:", requestError);
        if (isActive)
          setError(
            requestError.response?.data?.message ||
              "We could not load the social media data right now."
          );
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    init();
    return () => { isActive = false; };
  }, []); // run once on mount

  /* ── Load detail when projectId URL param changes ──────────────────────── */
  useEffect(() => {
    if (!projectId) {
      setSelectedProject(null);
      return;
    }
    const timer = window.setTimeout(() => loadProjectDetail(projectId), 0);
    return () => window.clearTimeout(timer);
  }, [projectId, loadProjectDetail]);

  /* ── React to approval / verification events ───────────────────────────── */
  useEffect(() => {
    const handleDataUpdated = () => {
      loadSummary({ silent: true });
      if (projectIdRef.current) loadProjectDetail(projectIdRef.current);
    };
    window.addEventListener("social-media-data-updated", handleDataUpdated);
    return () =>
      window.removeEventListener("social-media-data-updated", handleDataUpdated);
  }, [loadSummary, loadProjectDetail]);

  /* ── Refresh on tab focus / visibility ─────────────────────────────────── */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadSummary({ silent: true });
        if (projectIdRef.current) loadProjectDetail(projectIdRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadSummary, loadProjectDetail]);

  /* ── Polling while detail modal is open (8 s) ──────────────────────────── */
  useEffect(() => {
    if (!projectId) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadSummary({ silent: true });
        loadProjectDetail(projectId);
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [projectId, loadSummary, loadProjectDetail]);

  /* ── Derived state ─────────────────────────────────────────────────────── */
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      `${project.projectName} ${project.clientName}`
        .toLowerCase()
        .includes(query)
    );
  }, [projects, searchQuery]);

  const totals = useMemo(
    () =>
      projects.reduce(
        (acc, p) => ({
          planned: acc.planned + p.totalPlanned,
          posted: acc.posted + p.totalPosted,
          left: acc.left + p.totalLeftToPost,
          edited: acc.edited + p.totalEdited,
          leftToEdit: acc.leftToEdit + p.totalLeftToEdit,
        }),
        { planned: 0, posted: 0, left: 0, edited: 0, leftToEdit: 0 }
      ),
    [projects]
  );

  const openProject = (project) => navigate(`/data/${project.projectId}`);

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-[#f5f7fa] px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              <BarChart3 size={15} /> Social media intelligence
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Data overview
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
              A clear view of content production, publishing, and editing
              momentum across every project.
            </p>
          </div>
          <button
            onClick={() => loadSummary({ silent: false })}
            disabled={isLoading || isRefreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={isLoading || isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </button>
        </header>

        {/* Aggregate stat cards */}
        <section className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total projects" value={projects.length} icon={Layers3} color="bg-blue-50 text-blue-600" />
          <StatCard label="Total planned" value={totals.planned} icon={ClipboardList} color="bg-sky-50 text-sky-600" />
          <StatCard label="Total posted" value={totals.posted} icon={Send} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Left to post" value={totals.left} icon={CircleDashed} color="bg-amber-50 text-amber-600" />
          <StatCard label="Total edited" value={totals.edited} icon={Edit3} color="bg-green-50 text-green-600" />
          <StatCard label="Left to edit" value={totals.leftToEdit} icon={BarChart3} color="bg-orange-50 text-orange-600" />
        </section>

        {/* Search + count */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project or client"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
          <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            {filteredProjects.length} project
            {filteredProjects.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Loading state (initial only) */}
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center text-sm font-semibold text-slate-500">
            <RefreshCw className="mx-auto mb-3 animate-spin text-blue-500" />
            Loading project data...
          </div>
        ) : error && projects.length === 0 ? (
          /* Error state */
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-500" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={() => loadSummary({ silent: false })}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <ClipboardList className="mx-auto mb-3 text-slate-300" size={34} />
            <h2 className="font-bold text-slate-700">No project data found</h2>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery
                ? "Try another project or client name."
                : "Social media projects will appear here once data is available."}
            </p>
          </div>
        ) : (
          /* Project cards */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <motion.button
                key={project.projectId || project.projectName}
                onClick={() => openProject(project)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)]"
              >
                {/* Card header */}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="line-clamp-1 text-lg font-black text-slate-900">
                      {project.projectName}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <UserRound size={13} />{project.clientName}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                  />
                </div>

                {/* Card metrics — all 5 backend fields */}
                <div className="mb-5 grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-center">
                  <div>
                    <p className="text-xl font-black text-blue-600">{formatCount(project.totalPlanned)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Planned</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-600">{formatCount(project.totalPosted)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Posted</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-amber-600">{formatCount(project.totalLeftToPost)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Left to post</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-green-600">{formatCount(project.totalEdited)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Edited</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-orange-600">{formatCount(project.totalLeftToEdit)}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Left to edit</p>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Posting progress</span>
                      <span className="text-emerald-600">{Math.round(project.postedProgress)}%</span>
                    </div>
                    <ProgressBar value={project.postedProgress} tone="green" />
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Editing progress</span>
                      <span className="text-amber-600">{Math.round(project.editProgress)}%</span>
                    </div>
                    <ProgressBar value={project.editProgress} tone="amber" />
                  </div>
                </div>

                {/* Status badges */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge value={project.postedProgress} label="Posted" />
                  <StatusBadge value={project.editProgress} label="Edited" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── Project detail modal ─────────────────────────────────────────── */}
      {projectId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => navigate("/data")}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8"
          >
            {/* Modal header */}
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <button
                  onClick={() => navigate("/data")}
                  className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                >
                  <ArrowLeft size={14} /> Back to all data
                </button>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Project detail
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {isDetailLoading
                    ? "Loading…"
                    : selectedProject?.projectName || "Project detail"}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedProject?.clientName || ""}
                  {selectedProject?.phone ? ` · ${selectedProject.phone}` : ""}
                </p>
              </div>
              <button
                onClick={() => navigate("/data")}
                aria-label="Close detail"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            {isDetailLoading ? (
              <div className="py-20 text-center text-sm font-semibold text-slate-500">
                <RefreshCw className="mx-auto mb-3 animate-spin text-blue-500" />
                Loading project detail…
              </div>
            ) : selectedProject ? (
              <>
                {/* 5 metric boxes — directly from backend summary contract */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetricBox
                    value={selectedProject.totalPlanned}
                    label="Planned"
                    valueCls="text-blue-700"
                    bgCls="bg-blue-50"
                  />
                  <MetricBox
                    value={selectedProject.totalPosted}
                    label="Posted"
                    valueCls="text-emerald-700"
                    bgCls="bg-emerald-50"
                  />
                  <MetricBox
                    value={selectedProject.totalEdited}
                    label="Edited"
                    valueCls="text-amber-700"
                    bgCls="bg-amber-50"
                  />
                  <MetricBox
                    value={selectedProject.totalLeftToPost}
                    label="Left to post"
                    valueCls="text-slate-700"
                    bgCls="bg-slate-100"
                  />
                  <MetricBox
                    value={selectedProject.totalLeftToEdit}
                    label="Left to edit"
                    valueCls="text-orange-700"
                    bgCls="bg-orange-50"
                  />
                </div>

                {/* Progress bars */}
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex justify-between text-sm font-bold">
                      <span>Planned vs posted</span>
                      <span className="text-emerald-600">
                        {Math.round(selectedProject.postedProgress)}%
                      </span>
                    </div>
                    <ProgressBar value={selectedProject.postedProgress} tone="green" />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {formatCount(selectedProject.totalPosted)} posted of{" "}
                      {formatCount(selectedProject.totalPlanned)} planned,{" "}
                      {formatCount(selectedProject.totalLeftToPost)} remaining.
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm font-bold">
                      <span>Planned vs edited</span>
                      <span className="text-amber-600">
                        {Math.round(selectedProject.editProgress)}%
                      </span>
                    </div>
                    <ProgressBar value={selectedProject.editProgress} tone="amber" />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {formatCount(selectedProject.totalEdited)} edited of{" "}
                      {formatCount(selectedProject.totalPlanned)} planned,{" "}
                      {formatCount(selectedProject.totalLeftToEdit)} remaining.
                    </p>
                  </div>
                </div>

                {/* Manual refresh inside modal */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => loadProjectDetail(projectId)}
                    disabled={isDetailLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={14}
                      className={isDetailLoading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-sm font-semibold text-slate-500">
                <AlertCircle className="mx-auto mb-3 text-red-400" />
                Unable to display this project.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default DataDashboardPage;