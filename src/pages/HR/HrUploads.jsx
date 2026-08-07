import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Eye, FolderOpen, Loader2, Search, Sparkles } from "lucide-react";
import API from "../../services/api";
import { notifyError } from "../../utils/toast";

const HrUploads = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

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
              (sheet.days || [])
                .filter((day) => new Date(day.date).toISOString().slice(0, 10) === selectedDate)
                .map((day) => ({
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

      setUploads(results.flat());
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to load today's uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [selectedDate]);

  const filteredUploads = useMemo(() => {
    const term = search.toLowerCase();
    return uploads.filter((item) => {
      const fields = [
        item.projectName,
        item.clientName,
        item.title,
        ...(item.contentUploadLinks || []),
        ...(item.videoUploadLinks || []),
      ];
      return fields.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [uploads, search]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Today's Uploads</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            See monthly sheet uploads scheduled for the selected date.
          </p>
        </div>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, client, or link"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
          <Loader2 className="mr-3 animate-spin text-indigo-600" size={20} />
          Loading today's uploads...
        </div>
      ) : filteredUploads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 shadow-sm">
          No uploads found for this date.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUploads.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {item.projectName}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {item.clientName}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays size={16} className="text-indigo-500" />
                  {new Date(item.uploadDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FolderOpen size={16} className="text-indigo-500" />
                  {item.title}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(item.contentUploadLinks || []).length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Eye size={16} /> Content Uploads
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(item.contentUploadLinks || []).map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                        >
                          <ExternalLink size={14} /> View Link {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(item.videoUploadLinks || []).length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Sparkles size={16} /> Video Uploads
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(item.videoUploadLinks || []).map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"
                        >
                          <ExternalLink size={14} /> Video Link {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(item.contentUploadLinks || []).length === 0 && (item.videoUploadLinks || []).length === 0 && (
                  <div className="text-sm text-slate-500">No links uploaded for this day.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HrUploads;
