import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, CalendarDays, Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * TodayUploadPopup
 * Props:
 *   data   – object emitted by "today-upload-popup" socket event
 *   onClose – function to dismiss the popup
 */
export default function TodayUploadPopup({ data, onClose }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const AUTO_CLOSE_MS = 10000;

  // Auto-close countdown
  useEffect(() => {
    if (!data) return;
    const step = 100 / (AUTO_CLOSE_MS / 100);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p - step <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return p - step;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [data, onClose]);

  const uploadDate = data?.uploadDate
    ? new Date(data.uploadDate).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key="today-upload-popup"
          initial={{ opacity: 0, x: 100, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed top-4 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] pointer-events-auto"
          style={{ fontFamily: "inherit" }}
        >
          {/* Card */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-2xl border border-indigo-200/60"
            style={{ background: "linear-gradient(135deg, #0f0c29, #1a1057 60%, #302b63)" }}
          >
            {/* Top sparkle bar */}
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(90deg,#818cf8,#a78bfa,#c084fc)" }}
            />

            {/* Progress bar */}
            <div
              className="absolute top-1 left-0 h-0.5 bg-white/30 transition-none"
              style={{ width: `${progress}%` }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }}
                >
                  <Upload size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-indigo-300 font-bold mb-0.5">
                    Today&apos;s Upload Alert
                  </p>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {data?.projectName || "New Upload Available"}
                  </h3>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 mb-4">
                {data?.clientName && (
                  <div className="flex items-center gap-2 text-sm text-indigo-200">
                    <Building2 size={13} className="text-indigo-400 shrink-0" />
                    <span className="font-medium">{data.clientName}</span>
                  </div>
                )}
                {uploadDate && (
                  <div className="flex items-center gap-2 text-sm text-indigo-200">
                    <CalendarDays size={13} className="text-indigo-400 shrink-0" />
                    <span>{uploadDate}</span>
                  </div>
                )}
                {data?.totalUploads != null && (
                  <div className="flex items-center gap-2 text-sm text-indigo-200">
                    <span className="font-bold text-white">{data.totalUploads}</span>
                    <span>total uploads</span>
                  </div>
                )}
              </div>

              {/* Items */}
              {data?.items && data.items.length > 0 && (
                <div
                  className="mb-4 rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <p className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold mb-2">
                    Upload Items
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.items.slice(0, 6).map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium text-white"
                        style={{
                          background: "rgba(129,140,248,0.25)",
                          border: "1px solid rgba(129,140,248,0.3)",
                        }}
                      >
                        {item.dataType}
                        {item.platform ? ` · ${item.platform}` : ""}
                      </span>
                    ))}
                    {data.items.length > 6 && (
                      <span className="px-2 py-1 rounded-lg text-[11px] font-medium text-indigo-300">
                        +{data.items.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => {
                  navigate("/uploads");
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #818cf8, #a78bfa)" }}
              >
                View Uploads
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
