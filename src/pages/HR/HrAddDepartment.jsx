import { useState } from "react";

import { X, Briefcase, Loader2 } from "lucide-react";

import API from "../../services/api";

import {
  notifyError,
  notifySuccess,
  notifyInfo,
} from "../../utils/toast";

const HrAddDepartment = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      notifyError("Department name is required");
      return;
    }

    try {
      setLoading(true);

      notifyInfo("Creating department...");

      await API.post("/api/departments", {
        name,
      });

      notifySuccess("Department created");

      setName("");

      onSave?.();

      onClose?.();
    } catch (err) {
      console.error(err);

      notifyError(
        err?.response?.data?.message ||
          "Failed to create department",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              HR Management
            </p>

            <h2 className="text-2xl font-black text-slate-900">
              Add Department
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleSubmit}
          className="p-6"
        >
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              Department Name
            </label>

            <div className="relative">
              <Briefcase
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Enter department name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-2xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-11 px-5 rounded-2xl bg-black text-white text-sm font-semibold hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Creating..."
                : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HrAddDepartment;