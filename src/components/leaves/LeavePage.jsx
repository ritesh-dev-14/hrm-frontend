import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import LeaveModal from "./LeaveModel";
import LeaveStats from "./LeaveStats";
import LeaveTable from "./LeaveTable";
import useLeaves from "./leaveUtils";

export default function LeaveManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { leaves, stats, loading, applyLeave, fetchLeaves } =
    useLeaves();

  const handleSubmit = async (formData) => {
    const success = await applyLeave(formData);

    if (success) {
      setIsModalOpen(false);
      fetchLeaves();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Leave Management
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Your leave history and requests
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus size={17} />
            Apply Leave
          </button>
        </div>

        {/* STATS */}
        <div className="mb-6">
          <LeaveStats stats={stats} />
        </div>

        {/* TABLE */}
        <LeaveTable leaves={leaves} loading={loading} />
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <LeaveModal
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}