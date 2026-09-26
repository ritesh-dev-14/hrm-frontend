import React, { useEffect, useState } from "react";
import { getPendingAppeals, approveSidebarAppeal, rejectSidebarAppeal } from "../../services/attendanceApi";
import { Check, X, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

export default function SidebarAppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const res = await getPendingAppeals();
      setAppeals(res.data?.data || []);
    } catch (error) {
      toast.error("Failed to load appeals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveSidebarAppeal(id);
      toast.success("Appeal approved");
      fetchAppeals();
    } catch (error) {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectSidebarAppeal(id);
      toast.success("Appeal rejected");
      fetchAppeals();
    } catch (error) {
      toast.error("Failed to reject");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sidebar Access Appeals</h1>
          <p className="text-slate-500">Review pending requests from users who stopped attendance but need sidebar access.</p>
        </div>
      </div>

      {appeals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 font-medium">No pending appeals found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">
                  {appeal.user?.name} <span className="text-sm font-normal text-slate-500">({appeal.user?.employeeId})</span>
                </h3>
                <p className="text-sm text-indigo-600 font-medium mb-2">{appeal.user?.department?.name || 'Department'}</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900 mr-2">Reason:</span>
                  {appeal.sidebarAccessReason || "No reason provided."}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReject(appeal.id)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X size={16} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(appeal.id)}
                  className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200"
                >
                  <Check size={16} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
