import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Headphones,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
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
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [conversation, setConversation] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [conversationRefreshKey, setConversationRefreshKey] = useState(0);

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
    if (!selectedProjectId) return undefined;
    let active = true;
    API.get(`/api/projects/${selectedProjectId}/client-conversation`)
      .then((response) => {
        if (active) setConversation(response.data?.data || null);
      })
      .catch((requestError) => {
        console.error("Unable to load project conversation:", requestError);
        if (active) setError(requestError.response?.data?.message || "Could not load this project’s conversation.");
      })
      .finally(() => {
        if (active) setLoadingConversation(false);
      });
    return () => {
      active = false;
    };
  }, [selectedProjectId, conversationRefreshKey]);

  const departmentProjects = useMemo(
    () => projects.filter((project) => matchesDepartment(project, department)),
    [projects, department],
  );
  const selectedProject = departmentProjects.find((project) => project.id === selectedProjectId);

  const selectDepartment = (value) => {
    setDepartment(value);
    setSelectedProjectId("");
    setConversation(null);
    setError("");
  };

  const refresh = () => {
    setError("");
    setLoadingProjects(true);
    setRefreshKey((current) => current + 1);
    if (selectedProjectId) {
      setConversation(null);
      setLoadingConversation(true);
      setConversationRefreshKey((current) => current + 1);
    }
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

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6">
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
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">2. Select project</span>
            <select
              value={selectedProjectId}
              onChange={(event) => {
                setSelectedProjectId(event.target.value);
                setConversation(null);
                setLoadingConversation(Boolean(event.target.value));
                setError("");
              }}
              disabled={!department || loadingProjects || departmentProjects.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50"
            >
              <option value="">
                {loadingProjects ? "Loading projects..." : departmentProjects.length ? "Choose a project" : "Select a department first"}
              </option>
              {departmentProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectName} · {project.clientName || "Client"}
                </option>
              ))}
            </select>
          </label>
          {department && !loadingProjects && departmentProjects.length === 0 && (
            <p className="text-sm text-slate-500 md:col-span-2">No projects found for this department.</p>
          )}
        </section>

        {selectedProject && (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                    {conversation?.project?.department?.name || selectedProject.department?.name}
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{selectedProject.projectName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedProject.clientName || "Client"}</p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  {conversation?.voiceReports?.length || 0} recordings
                </span>
              </div>

              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                <Volume2 size={18} className="text-sky-600" />
                Weekly voice recordings
              </h3>
              {loadingConversation ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" /> Loading recordings...
                </div>
              ) : conversation?.voiceReports?.length ? (
                <div className="space-y-3">
                  {conversation.voiceReports.map((report) => (
                    <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                    </article>
                  ))}
                </div>
              ) : (
                !loadingConversation && (
                  <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                    <Volume2 size={25} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">No voice recordings found for this project.</p>
                  </div>
                )
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                    <MessageSquareText size={19} className="text-indigo-600" />
                    Pending from your side
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Project follow-up notes entered by the team.</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  {conversation?.pendingItems?.length || 0} items
                </span>
              </div>

              {loadingConversation ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" /> Loading pending items...
                </div>
              ) : conversation?.pendingItems?.length ? (
                <div className="space-y-3">
                  {conversation.pendingItems.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                    </article>
                  ))}
                </div>
              ) : (
                !loadingConversation && (
                  <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                    <MessageSquareText size={25} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">No pending follow-ups for this project.</p>
                  </div>
                )
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
