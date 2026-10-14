import React, { useState, useEffect } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  Filter,
  Search,
  Calendar,
  User,
  Briefcase,
  RefreshCw,
  Mic,
  Volume2,
  Images,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

export default function AdminWeeklyVoiceReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [department, setDepartment] = useState("");
  const [weekNumber, setWeekNumber] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [reportType, setReportType] = useState(""); // "" | "VOICE" | "SCREENSHOTS"

  // Lightbox Modal state
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: ""
  });

  useEffect(() => {
    fetchReports();
  }, [department, weekNumber, year, reportType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (department) params.department = department;
      if (weekNumber) params.weekNumber = weekNumber;
      if (year) params.year = year;
      if (reportType) params.reportType = reportType;

      const res = await API.get("/api/weekly-voice-reports", { params });
      setReports(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setDepartment("");
    setWeekNumber("");
    setYear(new Date().getFullYear().toString());
    setReportType("");
  };

  const openLightbox = (images, startIndex, title) => {
    setLightbox({
      isOpen: true,
      images,
      currentIndex: startIndex,
      title
    });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  };

  const nextLightboxImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevLightboxImage = () => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-32 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Voice & Screenshots Reports
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Volume2 className="text-blue-400 w-9 h-9" />
            Company Weekly Reports
          </h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-2xl leading-relaxed">
            Review weekly feedback submitted by managers across departments — audio recordings and conversation screenshots.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white backdrop-blur-md transition-all border border-white/10 shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden md:inline font-semibold text-sm">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-bold mr-2 text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          Filters:
        </div>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 min-w-[160px] transition-all"
        >
          <option value="">All Departments</option>
          <option value="Marketing">Marketing (Meta Ads)</option>
          <option value="SEO">SEO</option>
        </select>

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 min-w-[160px] transition-all"
        >
          <option value="">All Submission Types</option>
          <option value="VOICE">Voice Recordings Only</option>
          <option value="SCREENSHOTS">Screenshots Only</option>
        </select>

        <input
          type="number"
          placeholder="Week No (e.g. 42)"
          value={weekNumber}
          onChange={(e) => setWeekNumber(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 w-40 transition-all"
        />

        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 w-28 transition-all"
        />

        <button
          onClick={handleResetFilters}
          className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors ml-auto bg-gray-50 hover:bg-blue-50 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-200 cursor-pointer"
        >
          Clear Filters
        </button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-3xl h-[320px] animate-pulse border border-gray-100"
            ></div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-100 border-dashed shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No Reports Found</h3>
          <p className="text-gray-500 text-base">
            There are no reports matching your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => {
            const isVoice =
              report.reportType === "VOICE" || (report.audioUrl && !report.screenshots?.length);
            const isScreenshots =
              report.reportType === "SCREENSHOTS" || report.screenshots?.length > 0;
            const screenshotsList = Array.isArray(report.screenshots)
              ? report.screenshots
              : [];

            const clientsList = Array.isArray(report.clients)
              ? report.clients
              : typeof report.clients === "string"
              ? JSON.parse(report.clients)
              : [];

            const clientNames = clientsList.map((c) => c.name || c.projectName || c.clientName).filter(Boolean);

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="p-6">
                  {/* Card Header: Manager & Week */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B1120] to-blue-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {report.manager?.name ? report.manager.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-bold text-base leading-tight">
                          {report.manager?.name || "Unknown Manager"}
                        </h3>
                        <p className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-blue-100">
                          {report.department}
                        </p>
                      </div>
                    </div>

                    <div className="text-right bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100">
                      <p className="text-xs font-black text-gray-800">WEEK {report.weekNumber}</p>
                      <p className="text-[11px] text-gray-500 font-semibold">{report.year}</p>
                    </div>
                  </div>

                  {/* Submission Details Bar */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="text-gray-400 w-3.5 h-3.5" /> Submitted
                      </span>
                      <span className="font-bold text-gray-800">
                        {new Date(report.reportDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Briefcase className="text-gray-400 w-3.5 h-3.5" /> Client
                      </span>
                      <span className="font-bold text-gray-800 truncate max-w-[160px] text-right">
                        {clientNames.length > 0 ? clientNames.join(", ") : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-200/50">
                      <span className="font-medium text-gray-500">Report Type</span>
                      {isScreenshots ? (
                        <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 border border-indigo-200">
                          <Images className="w-3 h-3" /> Screenshots ({screenshotsList.length})
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 border border-blue-200">
                          <Mic className="w-3 h-3" /> Voice Note
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Media Content Area */}
                  {isScreenshots ? (
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/70">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <ImageIcon className="w-3.5 h-3.5" /> Conversation Screenshots
                        </p>
                        <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                          {screenshotsList.length} Image{screenshotsList.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {screenshotsList.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No screenshots available.</p>
                      ) : (
                        <div>
                          {/* Thumbnails grid */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {screenshotsList.slice(0, 4).map((url, idx) => {
                              const isLast = idx === 3 && screenshotsList.length > 4;
                              return (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    openLightbox(
                                      screenshotsList,
                                      idx,
                                      `${report.manager?.name || "Manager"} - Week ${report.weekNumber}`
                                    )
                                  }
                                  className="relative aspect-square rounded-lg overflow-hidden border border-indigo-200/60 bg-white cursor-pointer group shadow-xs"
                                >
                                  <img
                                    src={url}
                                    alt={`Screenshot ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  {isLast ? (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-extrabold">
                                      +{screenshotsList.length - 3}
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <button
                            onClick={() =>
                              openLightbox(
                                screenshotsList,
                                0,
                                `${report.manager?.name || "Manager"} - Week ${report.weekNumber}`
                              )
                            }
                            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors border border-indigo-200 flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View All Screenshots ({screenshotsList.length})
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/70">
                      <p className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                        <Mic className="w-3.5 h-3.5" /> Audio Playback
                      </p>
                      {report.audioUrl ? (
                        <audio controls src={report.audioUrl} className="w-full h-10">
                          Your browser does not support the audio element.
                        </audio>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No audio recording attached.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white z-10 pb-4 border-b border-white/10">
            <div>
              <h3 className="font-bold text-lg">{lightbox.title}</h3>
              <p className="text-xs text-white/60">
                Screenshot {lightbox.currentIndex + 1} of {lightbox.images.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={lightbox.images[lightbox.currentIndex]}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Open original
              </a>
              <button
                onClick={closeLightbox}
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-xl text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Display */}
          <div className="flex-1 w-full max-w-5xl flex items-center justify-between my-4 relative">
            {lightbox.images.length > 1 && (
              <button
                onClick={prevLightboxImage}
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -ml-4 md:ml-0 cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="flex-1 h-full flex items-center justify-center p-2 overflow-hidden">
              <img
                src={lightbox.images[lightbox.currentIndex]}
                alt={`Screenshot ${lightbox.currentIndex + 1}`}
                className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
              />
            </div>

            {lightbox.images.length > 1 && (
              <button
                onClick={nextLightboxImage}
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -mr-4 md:ml-0 cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {lightbox.images.length > 1 && (
            <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2">
              {lightbox.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightbox((prev) => ({ ...prev, currentIndex: idx }))}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    lightbox.currentIndex === idx
                      ? "border-blue-400 scale-105"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
