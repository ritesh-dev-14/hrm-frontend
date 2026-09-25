import React from "react";
import {
  AlertTriangle,
  Clock,
  Camera,
  FileText,
  DollarSign,
  Users,
  ShieldAlert,
  PhoneOff,
  Activity,
  Loader2,
  Building2,
} from "lucide-react";

export default function AdminControlTower({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-center min-h-[150px]">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-semibold">Loading Control Tower...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="bg-slate-900 p-2 rounded-xl text-white">
          <Activity size={20} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">CEO Control Tower</h2>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Morning Briefing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Section */}
        <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 space-y-4">
          <h3 className="text-xs font-black text-rose-800 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={16} /> Urgent Attention
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-2xl p-4 border border-rose-100/50 text-center shadow-sm">
              <p className="text-3xl font-black text-rose-600">{data.critical.overdueDeliverables}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Deliverables<br/>Overdue</p>
            </div>
            <div className="bg-white/70 rounded-2xl p-4 border border-rose-100/50 text-center shadow-sm">
              <p className="text-3xl font-black text-rose-600">{data.critical.oldApprovals}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Approvals<br/>Stuck &gt;3d</p>
            </div>
          </div>
        </div>

        {/* This Week Section */}
        <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 space-y-4">
          <h3 className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} /> This Week's Output
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-xl font-black text-indigo-600">{data.thisWeek.shootsScheduled}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Shoots</p>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-xl font-black text-indigo-600">{data.thisWeek.contentPiecesDue}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Assets</p>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-sm font-black text-indigo-600 flex justify-center items-center">
                <DollarSign size={12} />{data.thisWeek.adSpendPlanned > 1000 ? (data.thisWeek.adSpendPlanned/1000).toFixed(1) + 'k' : data.thisWeek.adSpendPlanned}
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Spend</p>
            </div>
          </div>
        </div>

        {/* People Section */}
        <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 space-y-4">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            <Users size={16} /> Team Bottlenecks
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/70 rounded-2xl p-4 border border-amber-100/50 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-2xl font-black text-amber-600">{data.people.editorsWithOverdueCount}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Staff with overdue tasks</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 space-y-4">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 size={16} /> Client Health
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-2xl p-4 border border-emerald-100/50 text-center shadow-sm">
              <p className="text-3xl font-black text-rose-500">{data.clients.atRisk}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Clients<br/>At Risk</p>
            </div>
            <div className="bg-white/70 rounded-2xl p-4 border border-emerald-100/50 text-center shadow-sm">
              <p className="text-3xl font-black text-amber-500">{data.clients.notContacted7Days}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Ignored<br/>&gt; 7 Days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
