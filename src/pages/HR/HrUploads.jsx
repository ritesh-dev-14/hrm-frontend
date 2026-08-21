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
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import ProfessionalLoader from "../../components/ProfessionalLoader";

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
function UploadCard({ item, user, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);

  const isToday =
    new Date(item.uploadDate).toISOString().slice(0, 10) === todayISO();
  const canManage = ["MANAGER", "HR"].includes(user?.role);

  const contentLinks = item.contentUploadLinks || [];
  const videoLinks = item.videoUploadLinks || [];
  const hasLinks = contentLinks.length > 0 || videoLinks.length > 0;

  // Determine styling based on status
  let cardStyles = "border-slate-200 bg-white";
  let statusBadge = null;

  if (item.uploadStatus === "APPROVED") {
    cardStyles = "border-green-300 ring-1 ring-green-200 bg-green-50/30";
    statusBadge = (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 flex items-center gap-1">
        <CheckCircle size={12} /> APPROVED
      </span>
    );
  } else if (item.uploadStatus === "REJECTED") {
    cardStyles = "border-red-300 ring-1 ring-red-200 bg-red-50/30";
    statusBadge = (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 flex items-center gap-1">
        <XCircle size={12} /> REJECTED
      </span>
    );
  } else if (isToday) {
    cardStyles = "border-indigo-300 ring-1 ring-indigo-200 bg-white";
  }

  return (
    <div
      className={`rounded-2xl border shadow-sm transition-all ${cardStyles}`}
    >
      {isToday && (!item.uploadStatus || item.uploadStatus === "PENDING") && (
        <div className="flex items-center gap-2 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2">
          <span className="text-xs font-bold text-white tracking-wide">
            📌 TODAY'S UPLOAD
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {item.projectName}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item.clientName}
              </span>
              {statusBadge}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <CalendarDays
                  size={14}
                  className={
                    item.uploadStatus === "APPROVED"
                      ? "text-green-500"
                      : item.uploadStatus === "REJECTED"
                        ? "text-red-500"
                        : "text-indigo-400"
                  }
                />
                {formatDate(item.uploadDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Package
                  size={14}
                  className={
                    item.uploadStatus === "APPROVED"
                      ? "text-green-500"
                      : item.uploadStatus === "REJECTED"
                        ? "text-red-500"
                        : "text-indigo-400"
                  }
                />
                {item.title || "Uploaded Content"}
              </span>
            </div>

            {item.uploadStatus === "REJECTED" && item.uploadRejectReason && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 inline-block">
                <strong>Reason:</strong> {item.uploadRejectReason}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManage &&
              (!item.uploadStatus || item.uploadStatus === "PENDING") && (
                <div className="flex gap-2 mr-2">
                  <button
                    onClick={() => onUpdateStatus(item, "APPROVED")}
                    className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-100 transition"
                    title="Approve Upload"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item, "REJECTED")}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-100 transition"
                    title="Reject Upload"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              )}

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
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [filterMode, setFilterMode] = useState("date"); // "date" | "all"

  // Rejection Modal State
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // ── Fetch from Content Calendar (Monthly Sheets) ─────────
  const fetchUploads = async () => {
    setLoading(true);
    try {
      const projectsRes = await API.get("/api/projects");
      const projects = projectsRes.data?.data || [];

      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const sheetRes = await API.get(
              `/api/projects/${project.id}/monthly-sheets`,
            );
            const sheets = sheetRes.data?.data || [];

            return (sheets || []).flatMap((sheet) =>
              (sheet.days || []).map((day) => ({
                id: `${sheet.id}-${day.id}`,
                projectId: project.id,
                sheetId: sheet.id,
                dayId: day.id,
                projectName: project.projectName,
                clientName: project.clientName || "-",
                uploadDate: day.date,
                title: day.title,
                contentUploadLinks: day.contentUploadLinks || [],
                videoUploadLinks: day.videoUploadLinks || [],
                uploadStatus: day.uploadStatus || "PENDING",
                uploadRejectReason: day.uploadRejectReason,
              })),
            );
          } catch (err) {
            return [];
          }
        }),
      );

      // Sort globally by date (descending)
      const flatResults = results
        .flat()
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
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

  // ── Update Status Handler ───────────────────────────────
  const handleUpdateStatus = async (item, status, reason = "") => {
    if (status === "REJECTED" && !reason) {
      setRejectItem(item);
      setRejectReason("");
      return;
    }

    setIsUpdating(true);
    try {
      await API.patch(
        `/api/projects/${item.projectId}/monthly-sheets/${item.sheetId}/days/${item.dayId}/upload-status`,
        {
          uploadStatus: status,
          uploadRejectReason: reason,
        },
      );

      toast.success(`Upload ${status.toLowerCase()} successfully`);

      // Update local state instantly
      setUploads((prev) =>
        prev.map((u) =>
          u.id === item.id
            ? { ...u, uploadStatus: status, uploadRejectReason: reason }
            : u,
        ),
      );

      setRejectItem(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const submitRejection = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    handleUpdateStatus(rejectItem, "REJECTED", rejectReason);
  };

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
        [
          u.projectName,
          u.clientName,
          u.title,
          ...(u.contentUploadLinks || []),
          ...(u.videoUploadLinks || []),
        ].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(term),
        ),
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
            View and manage uploads sourced directly from the Content Calendar
            (Monthly Sheets).
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
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
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
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
        <ProfessionalLoader text="Loading. Please wait..." />
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
            {filteredUploads.length} result
            {filteredUploads.length !== 1 ? "s" : ""}
          </p>
          {filteredUploads.map((item) => (
            <UploadCard
              key={item.id}
              item={item}
              user={user}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="text-red-500" size={20} /> Reject Upload
              </h3>
              <button
                onClick={() => setRejectItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4">
                Please provide a reason for rejecting this upload for{" "}
                <strong>{rejectItem.projectName}</strong> on{" "}
                {formatDate(rejectItem.uploadDate)}.
              </p>
              <textarea
                autoFocus
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px] resize-none"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 flex justify-end gap-3">
              <button
                onClick={() => setRejectItem(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={isUpdating || !rejectReason.trim()}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isUpdating ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : null}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrUploads;
