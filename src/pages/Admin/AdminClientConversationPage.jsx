import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  Headphones,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Target,
  UserRound,
  Volume2,
} from "lucide-react";
import API from "../../services/api";

const DEPARTMENTS = [
  { value: "marketing", label: "Meta Ads" },
  { value: "social", label: "Social Media" },
  { value: "seo", label: "SEO" },
];

const matchesDepartment = (project, category) => {
  const name = String(project.department?.name || "").toLowerCase();
  if (category === "marketing") return name.includes("marketing") || name.includes("meta") || name.includes("ads");
  if (category === "social") return name.includes("social") || name.includes("smm");
  return name.includes("seo");
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "Date unavailable";

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

async function fetchAllProjects() {
  const first = await API.get("/api/projects", { params: { limit: 100, page: 1 } });
  const firstProjects = first.data?.data || [];
  const pages = Number(first.data?.pagination?.totalPages) || 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      API.get("/api/projects", { params: { limit: 100, page: index + 2 } }),
    ),
  );
  return [
    ...firstProjects,
    ...rest.flatMap((response) => response.data?.data || []),
  ].filter((project) => DEPARTMENTS.some((department) => matchesDepartment(project, department.value)));
}

export default function AdminClientConversationPage() {
  const [projects, setProjects] = useState([]);
  const [department, setDepartment] = useState("");
  const [conversations, setConversations] = useState({});
  const [conversationErrors, setConversationErrors] = useState({});
  const [marketingTotals, setMarketingTotals] = useState(null);
  const [marketingTotalsError, setMarketingTotalsError] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const departmentProjects = useMemo(
    () => projects.filter((project) => matchesDepartment(project, department)),
    [projects, department],
  );
  const loadingConversation = departmentProjects.some((project) =>
    !Object.hasOwn(conversations, project.id) && !conversationErrors[project.id],
  );

  useEffect(() => {
    let active = true;
    fetchAllProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch((requestError) => {
        console.error("Unable to load projects for client conversations:", requestError);
        if (active) setError(requestError.response?.data?.message || "Could not load projects.");
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (department !== "marketing") return undefined;

    let active = true;
    API.get("/api/reports/projects-overview", { params: { type: "meta-ads" } })
      .then((response) => {
        if (!active) return;
        const projectsById = Object.fromEntries(
          (response.data?.data?.metaAds || []).map((project) => [project.projectId, project]),
        );
        setMarketingTotals(projectsById);
      })
      .catch((requestError) => {
        console.error("Unable to load Meta Ads reach and lead totals:", requestError);
        if (active) {
          setMarketingTotalsError(
            requestError.response?.data?.message || "Could not load Meta Ads reach and lead totals.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [department, refreshKey]);

  useEffect(() => {
    if (!department || loadingProjects || !departmentProjects.length) return undefined;

    let active = true;
    const loadConversations = async () => {
      for (let index = 0; index < departmentProjects.length; index += 5) {
        const batch = departmentProjects.slice(index, index + 5);
        const results = await Promise.all(batch.map(async (project) => {
          try {
            const response = await API.get(`/api/projects/${project.id}/client-conversation`);
            return {
              projectId: project.id,
              conversation: response.data?.data || { voiceReports: [], pendingItems: [] },
            };
          } catch (requestError) {
            console.error(`Unable to load conversation for project ${project.id}:`, requestError);
            return {
              projectId: project.id,
              error: requestError.response?.data?.message || "Could not load this project’s conversation.",
            };
          }
        }));

        if (!active) return;
        setConversations((current) => ({
          ...current,
          ...Object.fromEntries(results
            .filter((result) => "conversation" in result)
            .map((result) => [result.projectId, result.conversation])),
        }));
        setConversationErrors((current) => ({
          ...current,
          ...Object.fromEntries(results
            .filter((result) => "error" in result)
            .map((result) => [result.projectId, result.error])),
        }));
      }

    };

    loadConversations();
    return () => {
      active = false;
    };
  }, [department, departmentProjects, loadingProjects]);

  const selectDepartment = (value) => {
    setDepartment(value);
    setConversations({});
    setConversationErrors({});
    setMarketingTotals(null);
    setMarketingTotalsError("");
    setError("");
  };

  const refresh = () => {
    setError("");
    setLoadingProjects(true);
    setConversations({});
    setConversationErrors({});
    setMarketingTotals(null);
    setMarketingTotalsError("");
    setRefreshKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-600 p-3 text-white shadow-lg shadow-sky-200">
              <Headphones size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Admin workspace</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">Client Conversation</h1>
              <p className="mt-1 text-sm text-slate-500">Review weekly voice recordings and pending follow-ups by project.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loadingProjects || loadingConversation}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loadingProjects || loadingConversation ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {department === "marketing" && marketingTotalsError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {marketingTotalsError}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">1. Select department</span>
            <select
              value={department}
              onChange={(event) => selectDepartment(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Choose Meta Ads, Social Media, or SEO</option>
              {DEPARTMENTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {department && (
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    All {DEPARTMENTS.find((item) => item.value === department)?.label} projects
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Recordings and follow-ups are shown under each project.</p>
                </div>
                {!loadingProjects && departmentProjects.length > 0 && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {departmentProjects.length} {departmentProjects.length === 1 ? "project" : "projects"}
                  </span>
                )}
              </div>
              {loadingProjects ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" /> Loading projects...
                </div>
              ) : departmentProjects.length ? (
                <div className="space-y-5">
                  {departmentProjects.map((project) => {
                    const conversation = conversations[project.id];
                    const projectError = conversationErrors[project.id];
                    const hasConversation = Object.hasOwn(conversations, project.id);
                    const voiceReports = conversation?.voiceReports || [];
                    const pendingItems = conversation?.pendingItems || [];
                    return (
                      <article
                        key={project.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                      >
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="rounded-lg bg-sky-50 p-2 text-sky-700">
                            <BriefcaseBusiness size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold uppercase tracking-wider text-sky-700">{project.department?.name}</p>
                              <h3 className="truncate text-lg font-black text-slate-900">{project.projectName}</h3>
                              <p className="truncate text-sm text-slate-500">{project.clientName || "Client"}</p>
                            </div>
                          </div>
                          {!projectError && (
                            <div className="flex gap-2">
                              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                {voiceReports.length} recordings
                              </span>
                              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                                {pendingItems.length} follow-ups
                              </span>
                            </div>
                          )}
                        </div>

                        {department === "marketing" && (
                          <div className="mb-5 grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
                              <span className="rounded-lg bg-white p-2 text-sky-700">
                                <Eye size={18} />
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-500">Total Reach</p>
                                <p className="text-lg font-black text-slate-900">
                                  {marketingTotals
                                    ? formatCount(marketingTotals[project.id]?.totalReach)
                                    : marketingTotalsError ? "Unavailable" : "Loading..."}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                              <span className="rounded-lg bg-white p-2 text-emerald-700">
                                <Target size={18} />
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-slate-500">Leads Obtained</p>
                                <p className="text-lg font-black text-slate-900">
                                  {marketingTotals
                                    ? formatCount(marketingTotals[project.id]?.totalLeads)
                                    : marketingTotalsError ? "Unavailable" : "Loading..."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {projectError ? (
                          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            {projectError}
                          </div>
                        ) : !hasConversation ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                            <LoaderCircle size={18} className="animate-spin" /> Loading project details...
                          </div>
                        ) : (
                          <div className="grid gap-5 xl:grid-cols-2">
                            <section>
                              <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                                <Volume2 size={18} className="text-sky-600" />
                                Weekly voice recordings
                              </h4>
                              {voiceReports.length ? (
                                <div className="space-y-3">
                                  {voiceReports.map((report) => (
                                    <div key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700">
                                          <CalendarDays size={14} className="text-sky-600" />
                                          Week {report.weekNumber}, {report.year}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                          <UserRound size={14} />
                                          {report.manager?.name || "Manager"}
                                        </span>
                                      </div>
                                      <audio controls preload="none" src={report.audioUrl} className="w-full">
                                        Your browser does not support audio playback.
                                      </audio>
                                      <p className="mt-2 text-xs text-slate-400">Submitted {formatDate(report.submittedAt)}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                                  No voice recordings found for this project.
                                </p>
                              )}
                            </section>

                            <section>
                              <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                                <MessageSquareText size={18} className="text-indigo-600" />
                                Pending from your side
                              </h4>
                              {pendingItems.length ? (
                                <div className="space-y-3">
                                  {pendingItems.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
                                          <CalendarDays size={14} />
                                          {formatDate(item.dueDate)}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                          Added by {item.createdBy?.name || "Project team"} · {formatDate(item.createdAt)}
                                        </span>
                                      </div>
                                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.note}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                                  No pending follow-ups for this project.
                                </p>
                              )}
                            </section>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
                  No projects found for this department.
                </p>
              )}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
