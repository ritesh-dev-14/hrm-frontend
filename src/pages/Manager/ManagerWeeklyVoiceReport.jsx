import React, { useState, useEffect, useRef } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  UploadCloud,
  CheckCircle,
  FileAudio,
  X,
  Mic,
  Briefcase,
  Send,
  Images,
  Image as ImageIcon,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare
} from "lucide-react";

export default function ManagerWeeklyVoiceReport() {
  const [activeClients, setActiveClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Per-client submission mode: { [clientId]: 'VOICE' | 'SCREENSHOTS' }
  const [clientModes, setClientModes] = useState({});

  // Audio file per client: { [clientId]: File }
  const [clientAudio, setClientAudio] = useState({});

  // Screenshot files per client: { [clientId]: File[] }
  const [clientScreenshots, setClientScreenshots] = useState({});

  // Track which clients have been submitted: Set of clientIds
  const [submittedClients, setSubmittedClients] = useState(new Set());

  // Track submission details for completed clients: { [clientId]: { reportType, count, audioUrl, screenshots } }
  const [submittedDetails, setSubmittedDetails] = useState({});

  // Track submitting state per client: { [clientId]: boolean }
  const [submittingClients, setSubmittingClients] = useState({});

  // Lightbox Modal state: { isOpen: boolean, images: string[], currentIndex: number, clientTitle: string }
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    clientTitle: ""
  });

  const getWeekAndYear = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    const year = now.getFullYear();
    return { weekNumber, year };
  };

  useEffect(() => {
    fetchActiveClientsAndSubmissions();
  }, []);

  const fetchActiveClientsAndSubmissions = async () => {
    try {
      setLoading(true);
      const { weekNumber, year } = getWeekAndYear();

      const [clientsRes, reportsRes] = await Promise.all([
        API.get("/api/weekly-voice-reports/active-clients"),
        API.get("/api/weekly-voice-reports/my-reports", {
          params: { weekNumber, year }
        }).catch(() => ({ data: { data: [] } }))
      ]);

      const clients = clientsRes.data.data || [];
      setActiveClients(clients);

      // Parse already submitted reports for this week
      const submittedSet = new Set();
      const detailsMap = {};

      const myReports = reportsRes.data?.data || [];
      myReports.forEach((report) => {
        const clientList = Array.isArray(report.clients)
          ? report.clients
          : typeof report.clients === "string"
          ? JSON.parse(report.clients)
          : [];

        clientList.forEach((c) => {
          if (c?.id) {
            submittedSet.add(c.id);
            detailsMap[c.id] = {
              reportType: report.reportType || (report.audioUrl ? "VOICE" : "SCREENSHOTS"),
              audioUrl: report.audioUrl,
              screenshots: report.screenshots || [],
              createdAt: report.createdAt
            };
          }
        });
      });

      setSubmittedClients(submittedSet);
      setSubmittedDetails(detailsMap);
    } catch (error) {
      toast.error("Failed to load active clients");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (clientId, mode) => {
    setClientModes((prev) => ({ ...prev, [clientId]: mode }));
  };

  // Audio handlers
  const handleAudioSelect = (clientId, file) => {
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select a valid audio file.");
        return;
      }
      setClientAudio((prev) => ({ ...prev, [clientId]: file }));
    }
  };

  const handleRemoveAudio = (clientId) => {
    setClientAudio((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  };

  // Screenshots handlers
  const handleScreenshotsSelect = (clientId, fileList) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.warn(`Skipped non-image file: ${file.name}`);
        return false;
      }
      return true;
    });

    if (newFiles.length === 0) return;

    setClientScreenshots((prev) => {
      const existing = prev[clientId] || [];
      return { ...prev, [clientId]: [...existing, ...newFiles] };
    });
  };

  const handleRemoveSingleScreenshot = (clientId, indexToRemove) => {
    setClientScreenshots((prev) => {
      const current = prev[clientId] || [];
      const updated = current.filter((_, idx) => idx !== indexToRemove);
      return { ...prev, [clientId]: updated };
    });
  };

  const handleClearScreenshots = (clientId) => {
    setClientScreenshots((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  };

  // Submit Single Client Report
  const handleSubmitSingle = async (client) => {
    const mode = clientModes[client.id] || "VOICE";
    const { weekNumber, year } = getWeekAndYear();
    const department = "Marketing"; // Default fallback

    const formData = new FormData();
    formData.append("department", department);
    formData.append("weekNumber", weekNumber.toString());
    formData.append("year", year.toString());
    formData.append(
      "clients",
      JSON.stringify([{ id: client.id, name: client.projectName || client.clientName }])
    );
    formData.append("reportType", mode);

    if (mode === "VOICE") {
      const audioFile = clientAudio[client.id];
      if (!audioFile) {
        toast.error(`Please upload an audio file for ${client.projectName || client.clientName}`);
        return;
      }
      formData.append("audio", audioFile);
    } else {
      const screenshots = clientScreenshots[client.id] || [];
      if (screenshots.length === 0) {
        toast.error(`Please select at least one screenshot for ${client.projectName || client.clientName}`);
        return;
      }
      screenshots.forEach((file) => {
        formData.append("screenshots", file);
      });
    }

    setSubmittingClients((prev) => ({ ...prev, [client.id]: true }));

    try {
      const res = await API.post("/api/weekly-voice-reports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const reportData = res.data?.data;

      setSubmittedClients((prev) => new Set([...prev, client.id]));
      setSubmittedDetails((prev) => ({
        ...prev,
        [client.id]: {
          reportType: mode,
          audioUrl: reportData?.audioUrl,
          screenshots: reportData?.screenshots || [],
          createdAt: new Date().toISOString()
        }
      }));

      toast.success(
        `${mode === "VOICE" ? "Voice recording" : "Screenshots"} submitted for ${
          client.projectName || client.clientName
        }!`
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to submit for ${client.projectName || client.clientName}`
      );
      console.error(error);
    } finally {
      setSubmittingClients((prev) => ({ ...prev, [client.id]: false }));
    }
  };

  // Lightbox navigation
  const openLightbox = (images, startIndex, clientTitle) => {
    setLightbox({
      isOpen: true,
      images,
      currentIndex: startIndex,
      clientTitle
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

  const allSubmitted =
    activeClients.length > 0 && activeClients.every((c) => submittedClients.has(c.id));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-[#0B1120] rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-32 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-30 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Voice or Screenshots
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Weekly Client Reports
          </h1>
          <p className="text-blue-100/80 text-sm md:text-base max-w-2xl leading-relaxed">
            Submit your weekly client update by either uploading a voice recording or multiple screenshots of your conversations.
          </p>
        </div>

        <div className="hidden md:flex relative z-10 w-16 h-16 bg-blue-500/20 rounded-2xl items-center justify-center border border-blue-400/30 shadow-inner">
          <MessageSquare className="text-blue-300 w-8 h-8" />
        </div>
      </div>

      {allSubmitted ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xl m-6 animate-fade-in">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-500 drop-shadow-sm" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">All Client Reports Submitted!</h2>
          <p className="text-gray-500 text-base max-w-md mb-6">
            Thank you for completing this week's reports for all assigned clients.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-100/60 px-4 py-2 rounded-xl border border-green-200">
            <CheckCircle className="w-4 h-4" /> All {activeClients.length} clients are up to date
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Active Clients</h2>
              <p className="text-gray-500 text-sm mt-1">
                Choose <span className="font-semibold text-gray-700">Voice Note</span> or{" "}
                <span className="font-semibold text-gray-700">Conversation Screenshots</span> for each client.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {submittedClients.size} / {activeClients.length} Submitted
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 bg-gray-50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : activeClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-lg font-medium">No active clients assigned to you right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeClients.map((client) => {
                const isSubmitted = submittedClients.has(client.id);
                const isSubmitting = submittingClients[client.id];
                const mode = clientModes[client.id] || "VOICE";

                const audioFile = clientAudio[client.id];
                const screenshots = clientScreenshots[client.id] || [];
                const submittedInfo = submittedDetails[client.id];

                const hasSelection =
                  mode === "VOICE" ? !!audioFile : screenshots.length > 0;

                return (
                  <div
                    key={client.id}
                    className={`rounded-2xl border-2 transition-all duration-300 flex flex-col overflow-hidden ${
                      isSubmitted
                        ? "border-green-200 bg-green-50/20 shadow-sm"
                        : hasSelection
                        ? "border-blue-200 bg-blue-50/10 shadow-md"
                        : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex justify-between items-center">
                      <div className="truncate pr-2">
                        <h3 className="font-bold text-gray-800 truncate text-base">
                          {client.projectName || client.clientName}
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
                          {client.status || "Active"}
                        </p>
                      </div>
                      {isSubmitted && (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Done
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      {isSubmitted ? (
                        /* Submitted State */
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                            <CheckCircle className="w-8 h-8" />
                          </div>
                          <h4 className="font-bold text-gray-800 text-base mb-1">
                            Successfully Submitted
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mb-4">
                            {submittedInfo?.reportType === "SCREENSHOTS"
                              ? `Conversation Screenshots (${submittedInfo.screenshots?.length || 0} images)`
                              : "Voice Feedback Recording"}
                          </p>

                          {/* Preview if available */}
                          {submittedInfo?.reportType === "VOICE" && submittedInfo.audioUrl && (
                            <div className="w-full bg-white p-3 rounded-xl border border-green-200">
                              <audio
                                controls
                                src={submittedInfo.audioUrl}
                                className="w-full h-8"
                              />
                            </div>
                          )}

                          {submittedInfo?.reportType === "SCREENSHOTS" &&
                            submittedInfo.screenshots?.length > 0 && (
                              <button
                                onClick={() =>
                                  openLightbox(
                                    submittedInfo.screenshots,
                                    0,
                                    client.projectName || client.clientName
                                  )
                                }
                                className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1.5 border border-indigo-100"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View {submittedInfo.screenshots.length} Screenshots
                              </button>
                            )}
                        </div>
                      ) : (
                        /* Input State */
                        <div>
                          {/* Segmented Mode Selector */}
                          <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                            <button
                              type="button"
                              onClick={() => handleModeChange(client.id, "VOICE")}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                mode === "VOICE"
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                              Voice Recording
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeChange(client.id, "SCREENSHOTS")}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                mode === "SCREENSHOTS"
                                  ? "bg-white text-indigo-600 shadow-sm"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <Images className="w-3.5 h-3.5" />
                              Screenshots
                            </button>
                          </div>

                          {/* Mode: VOICE */}
                          {mode === "VOICE" && (
                            <div>
                              {!audioFile ? (
                                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl cursor-pointer transition-all group">
                                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-6 h-6" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">
                                    Upload Recording
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    MP3, M4A, WAV, AAC
                                  </span>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleAudioSelect(client.id, e.target.files[0])
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="w-full flex flex-col items-center relative bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                                  <button
                                    onClick={() => handleRemoveAudio(client.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full shadow-sm transition-colors"
                                    title="Remove audio"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>

                                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                    <FileAudio className="w-5 h-5" />
                                  </div>
                                  <p className="text-xs font-bold text-gray-800 w-full truncate text-center px-4">
                                    {audioFile.name}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mb-3">
                                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>

                                  <audio
                                    controls
                                    src={URL.createObjectURL(audioFile)}
                                    className="w-full h-8 mb-4 scale-95"
                                  />

                                  <button
                                    onClick={() => handleSubmitSingle(client)}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                                  >
                                    {isSubmitting ? (
                                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        Submit Voice Report
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mode: SCREENSHOTS */}
                          {mode === "SCREENSHOTS" && (
                            <div>
                              {screenshots.length === 0 ? (
                                <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition-all group">
                                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Images className="w-6 h-6" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700">
                                    Upload Screenshots
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    Multiple PNG, JPG, WEBP allowed
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) =>
                                      handleScreenshotsSelect(client.id, e.target.files)
                                    }
                                  />
                                </label>
                              ) : (
                                <div className="space-y-3">
                                  {/* Screenshots Header */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-indigo-100">
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      {screenshots.length} Screenshot
                                      {screenshots.length > 1 ? "s" : ""}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <label className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add More
                                        <input
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={(e) =>
                                            handleScreenshotsSelect(client.id, e.target.files)
                                          }
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => handleClearScreenshots(client.id)}
                                        className="text-[11px] font-semibold text-gray-400 hover:text-red-500 px-2 py-1 transition-colors"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>

                                  {/* Thumbnails Preview Grid */}
                                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border border-gray-200">
                                    {screenshots.map((file, idx) => {
                                      const url = URL.createObjectURL(file);
                                      return (
                                        <div
                                          key={idx}
                                          className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-square flex items-center justify-center shadow-xs"
                                        >
                                          <img
                                            src={url}
                                            alt={`screenshot-${idx}`}
                                            className="w-full h-full object-cover"
                                          />

                                          {/* Overlay actions */}
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openLightbox(
                                                  screenshots.map((f) => URL.createObjectURL(f)),
                                                  idx,
                                                  client.projectName || client.clientName
                                                )
                                              }
                                              className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-transform hover:scale-110 shadow-sm"
                                              title="Preview"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveSingleScreenshot(client.id, idx)
                                              }
                                              className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-transform hover:scale-110 shadow-sm"
                                              title="Remove"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Submit Screenshots Button */}
                                  <button
                                    onClick={() => handleSubmitSingle(client)}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                                  >
                                    {isSubmitting ? (
                                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        Submit Screenshots ({screenshots.length})
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in">
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white z-10 pb-4 border-b border-white/10">
            <div>
              <h3 className="font-bold text-lg">{lightbox.clientTitle}</h3>
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
                className="p-2 bg-white/10 hover:bg-red-500/80 rounded-xl text-white transition-colors"
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
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -ml-4 md:ml-0"
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
                className="p-3 bg-white/10 hover:bg-white/25 rounded-2xl text-white transition-all backdrop-blur-sm -mr-4 md:ml-0"
                title="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip at bottom */}
          {lightbox.images.length > 1 && (
            <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2">
              {lightbox.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightbox((prev) => ({ ...prev, currentIndex: idx }))}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    lightbox.currentIndex === idx
                      ? "border-blue-400 scale-105"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
