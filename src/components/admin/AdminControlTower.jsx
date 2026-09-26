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
  IndianRupee,
  X,
} from "lucide-react";

export default function AdminControlTower({ data, loading }) {
  const [showBudgetModal, setShowBudgetModal] = React.useState(false);
  const [showSpendModal, setShowSpendModal] = React.useState(false);
  const [showTeamModal, setShowTeamModal] = React.useState(false);

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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-xl font-black text-indigo-600">{data.thisWeek.shootsScheduled}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Shoots</p>
            </div>
            <div className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center">
              <p className="text-xl font-black text-indigo-600">{data.thisWeek.contentPiecesDue}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Assets</p>
            </div>
            <div 
              onClick={() => setShowBudgetModal(true)}
              className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-sm font-black text-indigo-600 flex justify-center items-center group-hover:scale-105 transition">
                <IndianRupee size={12} />{data.thisWeek.totalMonthlyBudget > 1000 ? (data.thisWeek.totalMonthlyBudget/1000).toFixed(1) + 'k' : data.thisWeek.totalMonthlyBudget}
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Budget</p>
            </div>
            <div 
              onClick={() => setShowSpendModal(true)}
              className="bg-white/70 rounded-2xl p-3 border border-indigo-100/50 text-center shadow-sm flex flex-col justify-center cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <p className="text-sm font-black text-indigo-600 flex justify-center items-center group-hover:scale-105 transition">
                <IndianRupee size={12} />{data.thisWeek.totalMonthlySpent > 1000 ? (data.thisWeek.totalMonthlySpent/1000).toFixed(1) + 'k' : data.thisWeek.totalMonthlySpent}
              </p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Spent(MTD)</p>
            </div>
          </div>
        </div>

        {/* People Section */}
        <div className="bg-amber-50 rounded-3xl p-5 border border-amber-100 space-y-4">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            <Users size={16} /> Team Bottlenecks
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div 
              onClick={() => setShowTeamModal(true)}
              className="bg-white/70 rounded-2xl p-4 border border-amber-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:bg-white hover:shadow-md transition group"
            >
              <div>
                <p className="text-2xl font-black text-amber-600 group-hover:scale-105 transition origin-left">{data.people.editorsWithOverdueCount}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Staff with overdue tasks</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition">
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

      {/* Budget Breakdown Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <IndianRupee size={18} className="text-indigo-600" /> Monthly Budget Allocation
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Total budget set for all active projects</p>
              </div>
              <button 
                onClick={() => setShowBudgetModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.thisWeek.budgetBreakdown && data.thisWeek.budgetBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.thisWeek.budgetBreakdown.map((proj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{proj.projectName}</p>
                        <p className="text-xs text-slate-500">{proj.clientName}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm">
                        <IndianRupee size={14} />
                        {proj.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No active projects with a budget found.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Monthly Budget</span>
              <span className="text-lg font-black text-slate-900 flex items-center">
                <IndianRupee size={18} />
                {data.thisWeek.totalMonthlyBudget.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Spend Breakdown Modal */}
      {showSpendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <IndianRupee size={18} className="text-indigo-600" /> Month-To-Date Spend
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Actual spend from daily Marketing Reports</p>
              </div>
              <button 
                onClick={() => setShowSpendModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.thisWeek.spentBreakdown && data.thisWeek.spentBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.thisWeek.spentBreakdown.map((proj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{proj.projectName}</p>
                        <p className="text-xs text-slate-500">{proj.clientName}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm">
                        <IndianRupee size={14} />
                        {proj.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  No daily marketing reports found this month.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Spent (MTD)</span>
              <span className="text-lg font-black text-slate-900 flex items-center">
                <IndianRupee size={18} />
                {data.thisWeek.totalMonthlySpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Team Bottlenecks Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-amber-600" /> Overdue Tasks by Employee
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Staff members with missed deadlines</p>
              </div>
              <button 
                onClick={() => setShowTeamModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {data.people.editorsWithOverdue && data.people.editorsWithOverdue.length > 0 ? (
                <div className="space-y-3">
                  {data.people.editorsWithOverdue.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-500">ID: {emp.employeeId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-sm border border-rose-100">
                        <AlertTriangle size={14} />
                        {emp.overdueCount} Tasks
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-sm font-medium">
                  Hooray! No staff members have overdue tasks.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
