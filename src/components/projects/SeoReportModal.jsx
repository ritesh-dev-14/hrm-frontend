import { useState, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Loader2,
  ImageIcon,
  TrendingUp,
  Calendar,
  Hash,
  FileText,
  Search,
  CheckCircle2,
} from "lucide-react";
import API from "../../services/api";

const SeoReportModal = ({ projectId, onClose, onSuccess }) => {
  const [keywords, setKeywords] = useState([""]);
  const [rankingNo, setRankingNo] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);

  // Keyword management
  const handleKeywordChange = (index, value) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const addKeyword = () => {
    if (keywords.length < 20) setKeywords([...keywords, ""]);
  };

  const removeKeyword = (index) => {
    if (keywords.length === 1) return;
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshot(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanKeywords = keywords.map((k) => k.trim()).filter(Boolean);
    if (cleanKeywords.length === 0) {
      setError("Please enter at least one keyword.");
      return;
    }
    if (!rankingNo || isNaN(Number(rankingNo))) {
      setError("Please enter a valid ranking number.");
      return;
    }
    if (!checkDate) {
      setError("Please select a check date.");
      return;
    }
    if (!screenshot) {
      setError("Please upload a screenshot.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("keywords", JSON.stringify(cleanKeywords));
      formData.append("rankingNo", rankingNo);
      formData.append("checkDate", checkDate);
      if (remarks) formData.append("remarks", remarks);
      formData.append("screenshot", screenshot);

      await API.post("/api/seo-reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to submit report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Submit SEO Report</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Keyword ranking check
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              Report Submitted!
            </p>
            <p className="text-sm text-slate-500 text-center">
              Your SEO keyword report has been recorded successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
                <X size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Keywords */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Search size={12} />
                Keywords
                <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {keywords.map((kw, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition">
                      <Hash size={13} className="text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={kw}
                        onChange={(e) =>
                          handleKeywordChange(idx, e.target.value)
                        }
                        placeholder={`Keyword ${idx + 1}`}
                        className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400"
                        autoFocus={idx === keywords.length - 1 && idx !== 0}
                      />
                    </div>
                    {keywords.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeKeyword(idx)}
                        className="h-9 w-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {keywords.length < 20 && (
                <button
                  type="button"
                  onClick={addKeyword}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition"
                >
                  <Plus size={13} />
                  Add another keyword
                </button>
              )}
            </div>

            {/* Ranking No + Check Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  Ranking No.
                  <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition">
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={rankingNo}
                    onChange={(e) => setRankingNo(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Check Date
                  <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition">
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ImageIcon size={12} />
                Screenshot
                <span className="text-red-400">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshotChange}
              />
              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotPreview(null);
                      fileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-xl bg-white shadow-md flex items-center justify-center text-slate-500 hover:text-red-500 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-400 hover:text-emerald-600 transition-all group"
                >
                  <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={18} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload screenshot</p>
                    <p className="text-xs mt-0.5 text-slate-400">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileText size={12} />
                Remarks
                <span className="text-slate-300 font-normal">(Optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Any additional notes or observations..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition resize-none placeholder-slate-400"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading & Submitting...
                </>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Submit SEO Report
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SeoReportModal;
