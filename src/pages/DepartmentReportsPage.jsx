import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  Filter,
  Loader2,
  ExternalLink,
  UserRound,
  X,
} from "lucide-react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const ALLOWED_ROLES = ["ADMIN", "HR", "EA", "MANAGER"];
const PAGE_SIZE = 12;

const DEPARTMENTS = [
  { value: "all", label: "All", color: "slate" },
  { value: "marketing", label: "Marketing", color: "pink" },
  { value: "seo", label: "SEO", color: "emerald" },
  { value: "web-development", label: "Web Development", color: "blue" },
];

const REPORT_FIELDS = {
  marketing: [
    ["clientName", "Client name"],
    ["adStatus", "Ad status"],
    ["reach", "Reach"],
    ["amountSpent", "Amount spent"],
    ["leads", "Leads"],
    ["adType", "Ad type"],
    ["area", "Area"],
    ["approvalStatus", "Approval status"],
    ["reviewNote", "Review note"],
  ],
  seo: [
    ["keywords", "Keywords"],
    ["rankingNumber", "Ranking"],
    ["checkDate", "Check date"],
    ["screenshot", "Screenshot"],
    ["remarks", "Remarks"],
    ["clientContactNumber", "Client contact"],
  ],
  "web-development": [
    ["content", "Content"],
    ["lastWorking", "Last working"],
    ["lastDiscussion", "Last discussion"],
    ["nextStep", "Next step"],
    ["blockers", "Blockers"],
    ["taskProgress", "Task progress"],
    ["project", "Project"],
    ["employee", "Employee"],
  ],
};

const departmentStyles = {
  marketing: "bg-pink-50 text-pink-700 border-pink-200",
  seo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "web-development": "bg-blue-50 text-blue-700 border-blue-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

const getPayload = (response) => response?.data?.data ?? response?.data ?? {};

const getReportType = (report) => {
  const rawType = report?.type || report?.project?.department?.name || "";
  const type = String(rawType).toLowerCase().trim();
  if (type.includes("web") || type.includes("development")) return "web-development";
  if (type.includes("seo")) return "seo";
  if (type.includes("marketing") || type.includes("meta")) return "marketing";
  return type || "other";
};

const getReportName = (report) => report?.submittedBy?.name || report?.submittedBy?.employeeName || "Unknown user";

const formatDate = (value, includeTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const formatLabel = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    return value.name || value.projectName || value.employeeName || value.title || JSON.stringify(value);
  }
  return String(value);
};

const isUrl = (value) => typeof value === "string" && /^https?:\/\//i.test(value);

const isTechnicalKey = (key) => [
  "id",
  "_id",
  "project",
  "manager",
  "managerId",
  "createdAt",
  "updatedAt",
  "date",
].includes(key);

const getFieldValue = (reportData, key) => {
  const aliases = {
    rankingNumber: ["rankingNumber", "ranking", "rank", "position"],
    checkDate: ["checkDate", "checkedAt", "date"],
    clientContactNumber: ["clientContactNumber", "clientContact", "contactNumber"],
    amountSpent: ["amountSpent", "spend", "amount"],
    taskProgress: ["taskProgress", "progress"],
  };
  const keys = aliases[key] || [key];
  const matchedKey = keys.find((candidate) => reportData?.[candidate] !== undefined);
  return matchedKey ? reportData[matchedKey] : undefined;
};

const SummaryCard = ({ label, value, icon: Icon, tone }) => (
  <div className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <Icon size={19} className="text-slate-500" />
    </div>
    <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
  </div>
);

const DepartmentBadge = ({ type }) => {
  const label = DEPARTMENTS.find((item) => item.value === type)?.label || formatLabel(type);
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${departmentStyles[type] || departmentStyles.default}`}>
      {label}
    </span>
  );
};

const ReportSummary = ({ item }) => {
  const type = getReportType(item);
  const fields = REPORT_FIELDS[type] || Object.keys(item?.report || {}).slice(0, 4).map((key) => [key, formatLabel(key)]);
  const populatedFields = fields.filter(([key]) => getFieldValue(item?.report || {}, key) !== undefined);

  if (!populatedFields.length) return <p className="text-sm text-slate-400">No summary fields provided.</p>;

  return (
    <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
      {populatedFields.slice(0, 6).map(([key, label]) => (
        <div key={key} className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="truncate text-sm font-semibold text-slate-700" title={formatValue(getFieldValue(item.report, key))}>
            {formatValue(getFieldValue(item.report, key))}
          </p>
        </div>
      ))}
    </div>
  );
};

const DetailValue = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">Not provided</span>;
  }

  if (isUrl(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 truncate text-indigo-600 hover:text-indigo-800 hover:underline">
        <span className="truncate">Open link</span>
        <ExternalLink size={13} className="shrink-0" />
      </a>
    );
  }

  if (Array.isArray(value)) {
    return value.length ? (
      <div className="flex flex-wrap gap-1.5">
        {value.map((entry, index) => (
          <span key={`${formatValue(entry)}-${index}`} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            {formatValue(entry)}
          </span>
        ))}
      </div>
    ) : <span className="text-slate-400">Not provided</span>;
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        {Object.entries(value).map(([key, entry]) => (
          <div key={key} className="flex gap-2">
            <span className="font-bold text-slate-400">{formatLabel(key)}:</span>
            <span className="min-w-0 break-words">{formatValue(entry)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="break-words">{String(value)}</span>;
};

const DetailField = ({ label, value, wide = false }) => (
  <div className={`${wide ? "sm:col-span-2" : ""} rounded-2xl border border-slate-100 bg-white p-4 shadow-sm`}>
    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <div className="text-sm font-semibold leading-6 text-slate-700"><DetailValue value={value} /></div>
  </div>
);

const ReportDetailsModal = ({ item, onClose }) => {
  if (!item) return null;
  const type = getReportType(item);
  const reportData = item.report || {};
  const preferredFields = REPORT_FIELDS[type] || [];
  const preferredKeys = new Set(preferredFields.map(([key]) => key));
  const availablePreferredFields = preferredFields.filter(([key]) => getFieldValue(reportData, key) !== undefined);
  const additionalFields = Object.entries(reportData).filter(([key]) => !preferredKeys.has(key) && !isTechnicalKey(key));
  const approvalStatus = getFieldValue(reportData, "approvalStatus");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Report details">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-slate-50 shadow-2xl">
        <div className="relative overflow-hidden bg-slate-900 px-5 py-6 text-white sm:px-8 sm:py-7">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2"><DepartmentBadge type={type} />{approvalStatus && <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-200"><CheckCircle2 size={13} /> {formatValue(approvalStatus)}</span>}</div>
              <h2 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{item.project?.projectName || "Department report"}</h2>
              <p className="mt-2 text-sm font-medium text-slate-300">{item.project?.department?.name || formatLabel(type)} report</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close report details" className="relative rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"><X size={21} /></button>
          </div>
          <div className="relative mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-white/10 p-2"><UserRound size={16} /></span><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Submitted by</p><p className="text-sm font-bold">{getReportName(item)}</p><p className="text-xs text-slate-400">{item.submittedBy?.employeeId || "No employee ID"}</p></div></div>
            <div className="flex items-center gap-3"><span className="rounded-xl bg-white/10 p-2"><CalendarDays size={16} /></span><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Submitted on</p><p className="text-sm font-bold">{formatDate(item.date)}</p><p className="text-xs text-slate-400">{formatDate(item.date, true).split(", ").slice(-1)[0]}</p></div></div>
            <div className="flex items-center gap-3"><span className="rounded-xl bg-white/10 p-2"><FileText size={16} /></span><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Report reference</p><p className="truncate text-sm font-bold">{item.id || item._id || "Not available"}</p><p className="text-xs text-slate-400">{Object.keys(reportData).length} fields submitted</p></div></div>
          </div>
        </div>
        <div className="max-h-[calc(92vh-270px)] overflow-y-auto p-5 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-slate-900">Report summary</h3><p className="mt-1 text-sm text-slate-500">Key information submitted for this update.</p></div><span className="hidden rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm sm:inline-flex">{formatDate(item.createdAt || item.date)}</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {availablePreferredFields.map(([key, label]) => <DetailField key={key} label={label} value={getFieldValue(reportData, key)} wide={key === "reviewNote" || key === "remarks" || key === "content" || key === "nextStep"} />)}
          </div>
          {additionalFields.length > 0 && <><div className="mb-4 mt-8"><h3 className="text-lg font-black text-slate-900">Additional details</h3><p className="mt-1 text-sm text-slate-500">Other information included in the submitted report.</p></div><div className="grid gap-3 sm:grid-cols-2">{additionalFields.map(([key, value]) => <DetailField key={key} label={formatLabel(key)} value={value} wide={typeof value === "object" || String(value).length > 100} />)}</div></>}
          {!availablePreferredFields.length && !additionalFields.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">No report details were provided.</div>}
        </div>
      </div>
    </div>
  );
};

export default function DepartmentReportsPage() {
  const { role } = useAuth();
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({});
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ department: "all", projectId: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    API.get("/api/projects")
      .then((response) => {
        const data = getPayload(response);
        const list = Array.isArray(data) ? data : data?.projects || data?.items || [];
        if (active) setProjects(list);
      })
      .catch(() => {
        if (active) setProjects([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadReports = async () => {
      setLoading(true);
      setError("");
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value && value !== "all"));
        const response = await API.get("/api/department-reports", { params });
        const data = getPayload(response);
        if (!active) return;
        setReports(Array.isArray(data?.reports) ? data.reports : []);
        setCounts(data?.counts || {});
        setPage(1);
      } catch (requestError) {
        if (active) {
          setReports([]);
          setCounts({});
          setError(requestError.response?.data?.message || "Unable to load department reports right now.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadReports();
    return () => { active = false; };
  }, [filters]);

  const total = Number(counts.marketing || 0) + Number(counts.seo || 0) + Number(counts["web-development"] || 0);
  const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const visibleReports = useMemo(() => reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [reports, page]);
  const projectOptions = useMemo(() => {
    const unique = new Map();
    projects.forEach((project) => {
      const id = project?.id || project?._id;
      if (id) unique.set(String(id), project);
    });
    return [...unique.values()].sort((a, b) => String(a.projectName || a.name || "").localeCompare(String(b.projectName || b.name || "")));
  }, [projects]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ department: "all", projectId: "", from: "", to: "" });
  const hasFilters = Object.entries(filters).some(([key, value]) => key === "department" ? value !== "all" : Boolean(value));

  if (!ALLOWED_ROLES.includes(String(role || "").toUpperCase())) return null;

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-6 text-slate-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600"><BarChart3 size={15} /> Operations overview</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Department Reports</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">Review submitted updates across Marketing, SEO, and Web Development.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FileText size={16} /> {reports.length} loaded report{reports.length === 1 ? "" : "s"}</div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Marketing reports" value={counts.marketing || 0} icon={BarChart3} tone="border-pink-100 bg-pink-50/60" />
          <SummaryCard label="SEO reports" value={counts.seo || 0} icon={BarChart3} tone="border-emerald-100 bg-emerald-50/60" />
          <SummaryCard label="Web development" value={counts["web-development"] || 0} icon={BarChart3} tone="border-blue-100 bg-blue-50/60" />
          <SummaryCard label="Total reports" value={total} icon={FileText} tone="border-slate-200 bg-white" />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {DEPARTMENTS.map((department) => (
              <button key={department.value} type="button" onClick={() => updateFilter("department", department.value)} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${filters.department === department.value ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
                {department.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 pt-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_auto]">
            <label className="text-xs font-bold text-slate-500">From<input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" /></label>
            <label className="text-xs font-bold text-slate-500">To<input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10" /></label>
            <label className="text-xs font-bold text-slate-500 md:col-span-2 xl:col-span-1">Project<select value={filters.projectId} onChange={(event) => updateFilter("projectId", event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"><option value="">All projects</option>{projectOptions.map((project) => <option key={project.id || project._id} value={project.id || project._id}>{project.projectName || project.name || "Unnamed project"}</option>)}</select></label>
            <button type="button" onClick={clearFilters} disabled={!hasFilters} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"><Filter size={16} /> Clear filters</button>
          </div>
        </section>

        {error && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><CircleAlert size={18} className="mt-0.5 shrink-0" /> <span>{error}</span></div>}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 size={30} className="animate-spin text-indigo-600" /><span className="ml-3 text-sm font-semibold text-slate-500">Loading reports...</span></div>
        ) : reports.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center"><FileText size={32} className="mb-3 text-slate-300" /><h2 className="font-black text-slate-800">No department reports found</h2><p className="mt-1 text-sm text-slate-500">Try widening the date range or clearing the filters.</p></div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-[0.15em] text-slate-500"><tr><th className="px-5 py-4">Department</th><th className="px-5 py-4">Project</th><th className="px-5 py-4">Submitted by</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Summary</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleReports.map((item) => <tr key={item.id || item._id} className="align-top hover:bg-slate-50/70"><td className="px-5 py-5"><DepartmentBadge type={getReportType(item)} /></td><td className="max-w-[190px] px-5 py-5"><p className="truncate font-bold text-slate-800">{item.project?.projectName || "Unnamed project"}</p><p className="mt-1 text-xs text-slate-400">{item.project?.department?.name || formatLabel(getReportType(item))}</p></td><td className="px-5 py-5"><p className="font-semibold text-slate-700">{getReportName(item)}</p><p className="mt-1 font-mono text-xs text-slate-400">{item.submittedBy?.employeeId || "No employee ID"}</p></td><td className="whitespace-nowrap px-5 py-5 text-sm font-semibold text-slate-600">{formatDate(item.date)}</td><td className="max-w-[280px] px-5 py-5"><ReportSummary item={item} /></td><td className="px-5 py-5 text-right"><button type="button" onClick={() => setSelectedReport(item)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-600"><Eye size={14} /> View details</button></td></tr>)}</tbody></table></div>
            </div>
            <div className="grid gap-4 md:hidden">{visibleReports.map((item) => <article key={item.id || item._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><DepartmentBadge type={getReportType(item)} /><span className="text-xs font-semibold text-slate-400">{formatDate(item.date)}</span></div><h2 className="mt-4 font-black text-slate-900">{item.project?.projectName || "Unnamed project"}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500"><span>{getReportName(item)}</span><span>{item.submittedBy?.employeeId || "No employee ID"}</span></div><div className="mt-5 border-t border-slate-100 pt-4"><ReportSummary item={item} /></div><button type="button" onClick={() => setSelectedReport(item)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white"><Eye size={16} /> View details</button></article>)}</div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-semibold text-slate-500">Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, reports.length)} of {reports.length}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page" className="rounded-xl border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronLeft size={16} /></button><span className="text-xs font-bold text-slate-600">Page {page} of {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page" className="rounded-xl border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
          </>
        )}
      </div>
      <ReportDetailsModal item={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  );
}
