import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FolderOpen,
  Loader2,
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Eye,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─────────────────────────────────────────────────────────
// Single Upload Card
// ─────────────────────────────────────────────────────────
function UploadCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const isToday =
    new Date(item.uploadDate).toISOString().slice(0, 10) === todayISO();

  const contentLinks = item.contentUploadLinks || [];
  const videoLinks = item.videoUploadLinks || [];
  const hasLinks = contentLinks.length > 0 || videoLinks.length > 0;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all ${
        isToday ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"
      }`}
    >
      {isToday && (
        <div className="flex items-center gap-2 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2">
          <span className="text-xs font-bold text-white tracking-wide">📌 TODAY'S UPLOAD</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {item.projectName}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item.clientName}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-indigo-400" />
                {formatDate(item.uploadDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Package size={14} className="text-indigo-400" />
                {item.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasLinks && (
              <button
                onClick={() => setExpanded((p) => !p)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Links List */}
        {expanded && hasLinks && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {contentLinks.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Eye size={16} /> Content Uploads
                </div>
                <div className="flex flex-wrap gap-2">
                  {contentLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 transition"
                    >
                      <ExternalLink size={14} /> Link {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {videoLinks.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Sparkles size={16} /> Video Uploads
                </div>
                <div className="flex flex-wrap gap-2">
                  {videoLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 transition"
                    >
                      <ExternalLink size={14} /> Link {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
const HrUploads = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterMode, setFilterMode] = useState("date"); // "date" | "all"

  // ── Fetch from Content Calendar (Monthly Sheets) ─────────
  const fetchUploads = async () => {
    setLoading(true);
    try {
      const projectsRes = await API.get("/api/projects");
      const projects = projectsRes.data?.data || [];

      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const sheetRes = await API.get(`/api/projects/${project.id}/monthly-sheets`);
            const sheets = sheetRes.data?.data || [];

            return (sheets || []).flatMap((sheet) =>
              (sheet.days || []).map((day) => ({
                id: `${sheet.id}-${day.id}`,
                projectName: project.projectName,
                clientName: project.clientName || "-",
                uploadDate: day.date,
                title: day.title || "Uploaded Content",
                contentUploadLinks: day.contentUploadLinks || [],
                videoUploadLinks: day.videoUploadLinks || [],
                projectId: project.id,
              }))
            );
          } catch (err) {
            return [];
          }
        })
      );

      // Sort globally by date (descending)
      const flatResults = results.flat().sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setUploads(flatResults);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  // ── Filter ────────────────────────────────────────────
  const filteredUploads = useMemo(() => {
    let list = uploads;

    if (filterMode === "date" && selectedDate) {
      list = list.filter((u) => {
        const d = new Date(u.uploadDate).toISOString().slice(0, 10);
        return d === selectedDate;
      });
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((u) =>
        [u.projectName, u.clientName, u.title, ...(u.contentUploadLinks || []), ...(u.videoUploadLinks || [])]
          .some((v) => String(v || "").toLowerCase().includes(term))
      );
    }

    return list;
  }, [uploads, selectedDate, search, filterMode]);

  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
            <FolderOpen className="text-indigo-600" size={28} />
            Content Calendar Uploads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View uploads and links sourced directly from the Content Calendar (Monthly Sheets).
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project, client, or links…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 transition shadow-sm"
          />
        </div>

        {/* Date / All toggle */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm">
          <button
            onClick={() => setFilterMode("date")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterMode === "date"
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            By Date
          </button>
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filterMode === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All
          </button>
        </div>

        {filterMode === "date" && (
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 shadow-sm transition"
            />
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
          <Loader2 className="mr-3 animate-spin text-indigo-600" size={22} />
          <span className="text-slate-500">Loading uploads from content calendar…</span>
        </div>
      ) : filteredUploads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <FolderOpen className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-500 font-medium">No uploads found.</p>
          <p className="text-slate-400 text-sm mt-1">
            {filterMode === "date"
              ? `No entries found for ${formatDate(selectedDate + "T00:00:00")} in the content calendar.`
              : "No entries yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            {filteredUploads.length} result{filteredUploads.length !== 1 ? "s" : ""}
          </p>
          {filteredUploads.map((item) => (
            <UploadCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HrUploads;
