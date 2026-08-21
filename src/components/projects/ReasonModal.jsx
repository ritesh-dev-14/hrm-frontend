import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Save, Trash2, AlertCircle } from "lucide-react";
import API from "../../services/api";

const ReasonModal = ({ isOpen, onClose, project, onProjectUpdate }) => {
  const [reasons, setReasons] = useState(project?.reasons || []);
  const [newReasonText, setNewReasonText] = useState("");
  const [newReasonDate, setNewReasonDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize state when modal opens or project changes
  React.useEffect(() => {
    if (isOpen && project) {
      setReasons(project.reasons || []);
      setNewReasonText("");
      setNewReasonDate(new Date().toISOString().split("T")[0]); // Default to today
      setError(null);
    }
  }, [isOpen, project]);

  const handleAddReason = () => {
    if (!newReasonText.trim() || !newReasonDate) {
      setError("Please provide both a reason and a date.");
      return;
    }
    
    setReasons([
      ...reasons,
      {
        reason: newReasonText.trim(),
        date: newReasonDate,
        id: Date.now().toString() // Temporary ID for rendering
      }
    ]);
    
    setNewReasonText("");
    setError(null);
  };

  const handleRemoveReason = (indexToRemove) => {
    setReasons(reasons.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Strip out the temporary 'id' and ensure the keys are strictly 'reason' and 'date' strings
      const reasonsToSubmit = reasons.map((r) => {
        const reasonStr = r.reason || r.text || "Reason not provided";
        const dateStr = r.date || new Date().toISOString().split("T")[0];
        return {
          reason: String(reasonStr).trim(),
          date: String(dateStr)
        };
      });

      const payload = { reasons: reasonsToSubmit };
      console.log("🚀 Sending reasons payload:", JSON.stringify(payload, null, 2));

      const response = await API.patch(`/api/projects/${project.id}`, payload);
      
      if (response.data.success) {
        onProjectUpdate({ ...project, reasons: reasonsToSubmit });
        onClose();
      } else {
        setError(response.data.message || "Failed to update reasons");
      }
    } catch (err) {
      console.error("Error updating project reasons:", err);
      // Show full backend error details for debugging
      const detail = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      setError(`Backend error: ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Project Reasons</h2>
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{project?.projectName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-2 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Add New Reason Form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Add New Reason</h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reason</label>
                <textarea
                  value={newReasonText}
                  onChange={(e) => setNewReasonText(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 resize-none h-20"
                />
              </div>
              
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={newReasonDate}
                      onChange={(e) => setNewReasonDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleAddReason}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 h-[38px]"
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            {/* Existing Reasons List */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center justify-between">
                <span>Current Reasons</span>
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{reasons.length}</span>
              </h3>
              
              {reasons.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No reasons added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {reasons.map((r, index) => (
                    <div key={r.id || index} className="p-3 border border-slate-200 rounded-xl bg-white flex items-start justify-between gap-4 group">
                      <div>
                        <p className="text-sm text-slate-700">{r.reason || r.text}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(r.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveReason(index)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove reason"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReasonModal;
