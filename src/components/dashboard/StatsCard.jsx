import { useState } from "react";
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Flame, 
  FileText, 
  Mail, 
  Search
} from "lucide-react";

const ManagerAnalyticsDashboard = ({ apiPayload }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Direct matching fallback for your exact API structure
  const data = apiPayload || {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    draftTasks: 0,
    totalEmployees: 0,
    employees: []
  };

  // Filter employees based on search input
  const filteredEmployees = data.employees?.filter(emp => 
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      
      {/* LEFT COLUMN: TASK METRICS */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* MAIN TASK METRIC CARD */}
        <div className="bg-gray-900 text-white rounded-3xl p-6 flex flex-col justify-between min-h-[140px]">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Work Progress</p>
            <h3 className="text-3xl font-black mt-2">
              {data.completedTasks} / {data.totalTasks} Tasks Done
            </h3>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-3 gap-4">
          {/* IN PROGRESS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Flame size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">In Progress</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{data.inProgressTasks}</p>
          </div>

          {/* DRAFT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <FileText size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Drafts</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{data.draftTasks}</p>
          </div>

          {/* COMPLETED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{data.completedTasks}</p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: EMPLOYEES ROSTER */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[292px]">
        
        {/* ROSTER HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">
              My Employees ({data.totalEmployees})
            </h2>
          </div>

          {/* Simple Search Input */}
          {data.employees?.length > 0 && (
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:bg-white focus:border-slate-900 transition-all"
              />
            </div>
          )}
        </div>

        {/* EMPLOYEES LIST VIEW */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
          {data.employees && data.employees.length > 0 ? (
            filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <div 
                  key={emp.id || emp.employeeId}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                      {emp.name ? emp.name.split(" ").map(n => n[0]).join("") : "EM"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {emp.employeeId} • <span className="text-blue-600">{emp.role}</span>
                      </p>
                    </div>
                  </div>

                  {/* Mail Action Link */}
                  {emp.email && (
                    <a 
                      href={`mailto:${emp.email}`}
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors"
                      title="Send Email"
                    >
                      <Mail size={14} />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No matching employees found.</p>
            )
          ) : (
            /* Plain Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Briefcase size={20} className="text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700 text-xs">No Employees Under Manager</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                There are currently no team members assigned to your dashboard profile.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManagerAnalyticsDashboard;