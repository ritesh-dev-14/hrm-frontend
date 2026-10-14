import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Mic,
  RefreshCw,
  X,
} from "lucide-react";
import API from "../../services/api";

const getWeeklyClients = (report) => {
  if (Array.isArray(report.clients)) return report.clients;
  if (typeof report.clients === "string") {
    try {
      const clients = JSON.parse(report.clients);
      return Array.isArray(clients) ? clients : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isWeeklyReportForProject = (report, project) => {
  const projectId = String(project.id || project._id);
  const projectNames = [project.projectName, project.clientName]
    .filter(Boolean)
    .map((name) => name.trim().toLowerCase());

  return getWeeklyClients(report).some((client) => {
    const clientProjectId = client?.id ?? client?.projectId;
    if (clientProjectId) return String(clientProjectId) === projectId;

    const clientName = (client?.name || client?.projectName || client?.clientName || "")
      .trim()
      .toLowerCase();
    return clientName && projectNames.includes(clientName);
  });
};

const isOnDate = (value, selectedDate) => {
  if (!selectedDate) return true;
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const localDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return localDate === selectedDate;
};

const getLocalDateBounds = (dateValue) => {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
};

const getToday = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const AdminAdsMarketingReportsModal = ({ projects, onClose }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [marketingReports, setMarketingReports] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [loadingProjectReports, setLoadingProjectReports] = useState(false);
  const [loadingWeeklyReports, setLoadingWeeklyReports] = useState(true);
  const [projectReportsError, setProjectReportsError] = useState("");
  const [weeklyReportsError, setWeeklyReportsError] = useState("");
  const [submittedProjectIds, setSubmittedProjectIds] = useState([]);
  const [loadingSubmittedProjects, setLoadingSubmittedProjects] = useState(false);
  const [submittedProjectsError, setSubmittedProjectsError] = useState("");
  const [draftSubmissionDate, setDraftSubmissionDate] = useState(getToday);
  const [submissionDate, setSubmissionDate] = useState("");

  const runningProjects = useMemo(
    () => projects.filter((project) =>
      project.isRunning === true
      && (!submissionDate || submittedProjectIds.includes(String(project.id || project._id))),
    ),
    [projects, submissionDate, submittedProjectIds],
  );
  const notRunningProjects = useMemo(
    () => projects.filter((project) =>
      project.isRunning !== true
      && (!submissionDate || submittedProjectIds.includes(String(project.id || project._id))),
    ),
    [projects, submissionDate, submittedProjectIds],
  );

  const loadWeeklyReports = async () => {
    try {
      const response = await API.get("/api/weekly-voice-reports");
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load weekly voice and screenshot reports.");
      }
      setWeeklyReportsError("");
      setWeeklyReports(response.data.data || []);
    } catch (error) {
      setWeeklyReportsError(
        error.response?.data?.message || error.message || "Unable to load weekly voice and screenshot reports.",
      );
    } finally {
      setLoadingWeeklyReports(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    API.get("/api/weekly-voice-reports")
      .then((response) => {
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to load weekly voice and screenshot reports.");
        }
        if (isMounted) {
          setWeeklyReportsError("");
          setWeeklyReports(response.data.data || []);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setWeeklyReportsError(
            error.response?.data?.message || error.message || "Unable to load weekly voice and screenshot reports.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingWeeklyReports(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!submissionDate) return undefined;

    let isMounted = true;
    const bounds = getLocalDateBounds(submissionDate);
    API.get("/api/marketing-reports/submitted-projects", { params: bounds })
      .then((response) => {
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to find projects with submitted reports.");
        }
        if (isMounted) {
          setSubmittedProjectIds((response.data.data || []).map(String));
          setSubmittedProjectsError("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSubmittedProjectIds([]);
          setSubmittedProjectsError(
            error.response?.data?.message || error.message || "Unable to find projects with submitted reports.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSubmittedProjects(false);
      });
    return () => {
      isMounted = false;
    };
  }, [submissionDate]);

  useEffect(() => {
    if (!selectedProject) {
      return undefined;
    }

    let isCurrentRequest = true;
    const loadProjectReports = async () => {
      try {
        setLoadingProjectReports(true);
        setProjectReportsError("");
        setMarketingReports([]);
        const projectId = selectedProject.id || selectedProject._id;
        const response = await API.get("/api/marketing-reports", { params: { projectId } });
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Unable to load this project's marketing reports.");
        }
        if (isCurrentRequest) setMarketingReports(response.data.data || []);
      } catch (error) {
        if (isCurrentRequest) {
          setProjectReportsError(
            error.response?.data?.message || error.message || "Unable to load this project's marketing reports.",
          );
        }
      } finally {
        if (isCurrentRequest) setLoadingProjectReports(false);
      }
    };

    loadProjectReports();
    return () => {
      isCurrentRequest = false;
    };
  }, [selectedProject]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedWeeklyReports = useMemo(
    () => selectedProject
      ? weeklyReports.filter((report) => isWeeklyReportForProject(report, selectedProject))
      : [],
    [weeklyReports, selectedProject],
  );
  const filteredWeeklyReports = selectedWeeklyReports;
  const filteredMarketingReports = useMemo(
    () => marketingReports.filter((report) => !submissionDate || isOnDate(report.createdAt, submissionDate)),
    [marketingReports, submissionDate],
  );

  const applySubmissionDateFilter = () => {
    if (!draftSubmissionDate) return;
    setSelectedProject(null);
    setSubmittedProjectIds([]);
    setLoadingSubmittedProjects(true);
    setSubmittedProjectsError("");
    setSubmissionDate(draftSubmissionDate);
  };

  const removeSubmissionDateFilter = () => {
    setSubmissionDate("");
    setDraftSubmissionDate(getToday());
    setSubmittedProjectIds([]);
    setLoadingSubmittedProjects(false);
    setSubmittedProjectsError("");
    setSelectedProject(null);
  };

  const selectProject = (project) => {
    setSelectedProject(project);
  };

  const renderProjectList = (title, items, running) => (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
      <header className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${running ? "border-emerald-100 bg-emerald-50/70" : "border-slate-100 bg-slate-50"}`}>
        <h3 className={`flex items-center gap-2 text-sm font-extrabold ${running ? "text-emerald-800" : "text-slate-700"}`}>
          {running ? <Activity size={16} /> : <X size={16} />}
          {title}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${running ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
          {items.length}
        </span>
      </header>
      <div className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">No projects in this group.</p>
        ) : items.map((project) => {
          const projectId = String(project.id || project._id);
          const selected = String(selectedProject?.id || selectedProject?._id) === projectId;
          return (
            <button
              key={projectId}
              type="button"
              onClick={() => selectProject(project)}
              aria-pressed={selected}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${selected ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{project.projectName || project.clientName || "Unnamed project"}</span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-400">{project.department?.name || "Marketing"}</span>
              </span>
              {running
                ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                : <span className="shrink-0 text-[10px] font-bold uppercase text-slate-400">Stopped</span>}
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ads-marketing-dialog-title"
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 bg-slate-950 px-5 py-4 text-white sm:px-7">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Megaphone size={15} /> Admin reports
            </div>
            <h2 id="ads-marketing-dialog-title" className="text-xl font-black sm:text-2xl">Ads &amp; Marketing</h2>
            <p className="mt-1 text-xs text-slate-300">Choose a project to review its ad activity and manager submissions.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Ads and Marketing reports" className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Filter by manager report submission date</h3>
              <p className="mt-1 text-xs text-slate-500">
                {submissionDate
                  ? `Showing projects with an Ads & Marketing report submitted on ${formatDate(submissionDate)}.`
                  : "Choose a date and apply the filter to find projects with an Ads & Marketing report submitted that day. Weekly recordings remain available separately."}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Submitted on
                <input
                  type="date"
                  value={draftSubmissionDate}
                  onChange={(event) => setDraftSubmissionDate(event.target.value)}
                  className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
                />
              </label>
              <button
                type="button"
                onClick={applySubmissionDateFilter}
                disabled={!draftSubmissionDate || loadingSubmittedProjects}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply Filter
              </button>
              {submissionDate && (
                <button
                  type="button"
                  onClick={removeSubmissionDateFilter}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Remove Filter
                </button>
              )}
            </div>
          </div>

          {loadingSubmittedProjects && (
            <p className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
              <Loader2 size={14} className="animate-spin" /> Loading projects with reports submitted on {formatDate(submissionDate)}…
            </p>
          )}
          {submittedProjectsError && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700" role="alert">
              {submittedProjectsError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderProjectList(`Ads Running${submissionDate ? ` · ${formatDate(submissionDate)}` : ""}`, runningProjects, true)}
            {renderProjectList(`Ads Not Running${submissionDate ? ` · ${formatDate(submissionDate)}` : ""}`, notRunningProjects, false)}
          </div>

          {selectedProject ? (
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Selected project</p>
                  <h3 className="truncate text-lg font-black text-slate-900">{selectedProject.projectName || selectedProject.clientName}</h3>
                  <p className="text-xs text-slate-500">{selectedProject.department?.name || "Marketing"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Megaphone size={15} className="text-indigo-500" /> Marketing reports</h4>
                {loadingProjectReports ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-slate-500"><Loader2 size={15} className="animate-spin" /> Loading project reports…</div>
                ) : projectReportsError ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-3 text-xs text-rose-700" role="alert">
                    <span>{projectReportsError}</span>
                    <button type="button" onClick={() => selectProject({ ...selectedProject })} className="font-bold underline">Retry</button>
                  </div>
                ) : filteredMarketingReports.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-4 text-xs text-slate-500">
                    {submissionDate
                      ? `No reports were submitted for this project on ${formatDate(submissionDate)}.`
                      : "No marketing reports are available for this project."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredMarketingReports.map((report) => (
                      <article key={report.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-extrabold text-slate-800">Submitted {formatDate(report.createdAt)} <span className="font-medium text-slate-500">· {report.manager?.name || "Manager"}</span></p>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${report.isAdRunning ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {report.isAdRunning ? "Ads running" : "Ads not running"}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <p><span className="text-slate-400">Spend</span><strong className="ml-1 text-slate-700">₹{Number(report.todayAmountSpend || 0).toLocaleString("en-IN")}</strong></p>
                          <p><span className="text-slate-400">Reach</span><strong className="ml-1 text-slate-700">{Number(report.todayReachObtained || 0).toLocaleString("en-IN")}</strong></p>
                          <p><span className="text-slate-400">Leads</span><strong className="ml-1 text-slate-700">{report.leadObtained ?? 0}</strong></p>
                          <p><span className="text-slate-400">Type</span><strong className="ml-1 text-slate-700">{report.typeOfAds || "—"}</strong></p>
                        </div>
                        {report.reasonNotRunning && <p className="mt-2 text-xs text-slate-600">Reason: {report.reasonNotRunning}</p>}
                        {report.unableToSubmitReason && <p className="mt-2 text-xs text-slate-600">Submission note: {report.unableToSubmitReason}</p>}
                        {(Array.isArray(report.videoLinks) ? report.videoLinks : report.videoLink ? [report.videoLink] : []).filter(Boolean).map((url, index) => (
                          <a key={`${report.id}-video-${index}`} href={url} target="_blank" rel="noreferrer" className="mt-2 mr-3 inline-block text-xs font-bold text-indigo-600 underline">Open campaign video {index + 1}</a>
                        ))}
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Mic size={15} className="text-blue-500" /> Weekly manager reports</h4>
                  <button type="button" onClick={() => { setLoadingWeeklyReports(true); loadWeeklyReports(); }} disabled={loadingWeeklyReports} aria-label="Refresh weekly reports" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50">
                    <RefreshCw size={14} className={loadingWeeklyReports ? "animate-spin" : ""} />
                  </button>
                </div>
                {loadingWeeklyReports ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-slate-500"><Loader2 size={15} className="animate-spin" /> Loading weekly manager reports…</div>
                ) : weeklyReportsError ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-3 text-xs text-rose-700" role="alert">
                    <span>{weeklyReportsError}</span>
                    <button type="button" onClick={() => { setLoadingWeeklyReports(true); loadWeeklyReports(); }} className="font-bold underline">Retry</button>
                  </div>
                ) : filteredWeeklyReports.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-4 text-xs text-slate-500">No weekly voice or screenshot reports are available for this project.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredWeeklyReports.map((report) => {
                      const screenshots = Array.isArray(report.screenshots) ? report.screenshots : [];
                      const isUnable = report.reportType === "UNABLE_TO_SUBMIT" || report.status === "Unable to Submit";
                      return (
                        <article key={report.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-extrabold text-slate-800">{report.manager?.name || "Manager"} <span className="font-medium text-slate-500">· Week {report.weekNumber}, {report.year}</span></p>
                            <span className="text-[10px] font-bold text-slate-500">{formatDate(report.reportDate || report.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">{report.reportType === "SCREENSHOTS" ? "Screenshot submission" : report.reportType === "VOICE" ? "Voice submission" : "Unable to submit"}</p>
                          {isUnable ? (
                            <p className="mt-2 text-xs text-slate-600">{getWeeklyClients(report).find((client) => String(client?.id ?? client?.projectId) === String(selectedProject.id || selectedProject._id))?.reason || "Manager could not submit a recording or screenshot."}</p>
                          ) : null}
                          {report.audioUrl && <audio controls preload="none" src={report.audioUrl} className="mt-3 h-10 w-full" />}
                          {screenshots.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {screenshots.map((url, index) => (
                                <a key={`${report.id}-image-${index}`} href={url} target="_blank" rel="noreferrer" className="group relative aspect-video overflow-hidden rounded-lg border border-blue-100 bg-white">
                                  <img src={url} alt={`Weekly report screenshot ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                                  <span className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-white"><ImageIcon size={12} /></span>
                                </a>
                              ))}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
              {submissionDate
                ? `Select a project with a report submitted on ${formatDate(submissionDate)} to review its marketing report and weekly manager submissions.`
                : "Select a project above to review its marketing reports and weekly manager submissions."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAdsMarketingReportsModal;
