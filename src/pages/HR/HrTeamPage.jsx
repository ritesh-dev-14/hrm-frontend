import { useState, useMemo, useCallback } from "react";
import {
  Search,
  Edit3,
  Trash2,
  Plus,
  ShieldCheck,
  Users,
  UserPlus,
  Briefcase,
  ChevronRight,
  Filter,
  Layers,
  CircleDot
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTeamData } from "./hooks/useTeamData";
import API from "../../services/api"; 
import { motion } from "framer-motion";

import HrAddEmployee from "./HrAddEmployee";
import HrAddManager from "./HrAddManager";
import HrAddDepartment from "./HrAddDepartment.jsx";
import HrViewDepartments from "./HrViewDepartments.jsx";
import HrEditEmployee from "./HrEditEmployee.jsx";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function HrTeamPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { staff, loading, error, refresh } = useTeamData();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get("role") || "ALL");

  const [modal, setModal] = useState({
    type: null,
    data: null,
  });

  const closeModal = useCallback(() => {
    setModal({
      type: null,
      data: null,
    });
  }, []);

  const filteredStaff = useMemo(() => {
    let result = staff || [];

    if (roleFilter !== "ALL") {
      result = result.filter((p) => p.role === roleFilter);
    }

    const term = search.toLowerCase().trim();
    if (term) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.role?.toLowerCase().includes(term) ||
          (p.department?.name || "General").toLowerCase().includes(term) ||
          p.employeeId?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [staff, search, roleFilter]);

  const handleAction = useCallback((e, type, data = null) => {
    e.stopPropagation();
    setModal({
      type,
      data,
    });
  }, []);

  const handleDelete = useCallback(async (e, person) => {
    e.stopPropagation();
    
    const targetId = person.employeeId || person.id || "";
    if (!targetId) {
      alert("Could not identify a valid record ID for this user.");
      return;
    }
    
    const confirmDelete = window.confirm(`Are you sure you want to permanently remove ${person.name || "this staff member"}?`);
    if (!confirmDelete) return;

    const endpoint = person.role === "MANAGER"
      ? `/api/hr/manager/${targetId}`
      : `/api/hr/employee/${targetId}`;

    try {
      const res = await API.delete(endpoint);
      
      if (res?.data?.success || res?.status === 200) {
        alert(res?.data?.message || "Record successfully removed.");
        refresh();
      } else {
        alert("Server received the request but did not confirm data deletion.");
      }
    } catch (err) {
      console.error("Deletion lifecycle failure:", err);
      const backendError = err?.response?.data?.message || "Internal database error.";
      alert(`Deletion Failed:\n${backendError}`);
    }
  }, [refresh]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 mb-1 block">HR Workspace</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-1">
              Team Directory
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-xl">
              Manage corporate positioning, edit assignments, and structure organizational departments beautifully.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={(e) => handleAction(e, "VIEW_DEPARTMENTS")}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-sm font-semibold text-slate-700 hover:bg-white hover:border-slate-300 hover:text-indigo-600 hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
            >
              <Layers size={16} />
              Departments
            </button>
            <button
              onClick={(e) => handleAction(e, "DEPARTMENT")}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-sm font-semibold text-slate-700 hover:bg-white hover:border-slate-300 hover:text-indigo-600 hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
            >
              <Briefcase size={16} />
              New Dept
            </button>
            <button
              onClick={(e) => handleAction(e, "MANAGER")}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-sm font-semibold text-slate-700 hover:bg-white hover:border-slate-300 hover:text-indigo-600 hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
            >
              <UserPlus size={16} />
              Add Manager
            </button>
            <button
              onClick={(e) => handleAction(e, "EMPLOYEE")}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Add Employee
            </button>
          </div>
        </motion.header>

        {/* MAIN CONTAINER */}
        <motion.main variants={itemVariants} initial="hidden" animate="show" className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* SEARCH & FILTERS ROW */}
          <div className="p-6 md:p-8 border-b border-slate-100/70 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/50">
            <div className="relative w-full lg:max-w-md group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, department, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white/80 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50 w-full lg:w-auto overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setRoleFilter("ALL")}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${
                  roleFilter === "ALL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                All Members ({staff?.length || 0})
              </button>
              <button
                onClick={() => setRoleFilter("MANAGER")}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${
                  roleFilter === "MANAGER" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Managers ({staff?.filter(p => p.role === "MANAGER").length || 0})
              </button>
              <button
                onClick={() => setRoleFilter("EMPLOYEE")}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${
                  roleFilter === "EMPLOYEE" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                Employees ({staff?.filter(p => p.role === "EMPLOYEE").length || 0})
              </button>
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="flex-1 bg-slate-50/30 overflow-x-auto">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <p className="text-indigo-900 font-semibold text-sm tracking-wide animate-pulse">Loading team members...</p>
              </div>
            ) : error ? (
              <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                  <CircleDot size={28} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Sync Error</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm mb-4">{error}</p>
                <button
                  onClick={refresh}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Retry Connection
                </button>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                <Filter size={40} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Profiles Found</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm">
                  Adjust your search or filter settings to see other team members.
                </p>
              </div>
            ) : (
              <div className="min-w-[900px] w-full">
                {/* HEADERS */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
                  <div className="col-span-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Staff Details</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Reference ID</div>
                  <div className="col-span-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</div>
                  <div className="col-span-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Designation</div>
                  <div className="col-span-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Controls</div>
                </div>

                {/* ROWS */}
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-slate-100">
                  {filteredStaff.map((person) => (
                    <motion.div
                      variants={itemVariants}
                      key={person.id}
                      onClick={() => navigate(`/hr/team/${person.employeeId || person.id}`)}
                      className="grid grid-cols-12 gap-4 items-center px-8 py-4 hover:bg-slate-50/80 transition-all group cursor-pointer"
                    >
                      {/* STAFF DETAILS */}
                      <div className="col-span-4 flex items-center gap-4 pr-4">
                        <div className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${
                          person.role === "MANAGER"
                            ? "bg-slate-900 border-slate-800 text-white shadow-slate-900/10"
                            : "bg-white border-slate-200 text-indigo-600 shadow-slate-200/50"
                        }`}>
                          {person.name?.substring(0, 2)?.toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                            {person.name}
                          </span>
                          <span className="block text-xs font-medium text-slate-400 mt-0.5 truncate">
                            Click to view full profile
                          </span>
                        </div>
                      </div>

                      {/* REFERENCE ID */}
                      <div className="col-span-2 font-mono text-xs font-bold text-slate-500">
                        {person.employeeId || person.id?.substring(0, 8)}
                      </div>

                      {/* DEPARTMENT */}
                      <div className="col-span-3 text-sm text-slate-700 font-semibold truncate pr-4">
                        {person?.department?.name || "General"}
                      </div>

                      {/* DESIGNATION */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-sm ${
                          person.role === "MANAGER"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {person.role === "MANAGER" ? <ShieldCheck size={12} className="text-indigo-500" /> : <Users size={12} className="text-slate-400" />}
                          {person.role}
                        </span>
                      </div>

                      {/* CONTROLS */}
                      <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleAction(e, "EDIT_EMPLOYEE", person)}
                          className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center text-slate-400 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, person)}
                          className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 flex items-center justify-center text-slate-400 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Remove Profile"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-slate-300 group-hover:text-slate-600 transition-colors ml-1">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        </motion.main>
      </div>

      {/* COMPONENT DRAWER EXTENSIONS */}
      <HrAddDepartment isOpen={modal.type === "DEPARTMENT"} onClose={closeModal} onSave={refresh} />
      <HrAddEmployee isOpen={modal.type === "EMPLOYEE"} onClose={closeModal} onSave={refresh} />
      <HrAddManager isOpen={modal.type === "MANAGER"} onClose={closeModal} onSave={refresh} />
      <HrViewDepartments isOpen={modal.type === "VIEW_DEPARTMENTS"} onClose={closeModal} />
      <HrEditEmployee isOpen={modal.type === "EDIT_EMPLOYEE"} employeeData={modal.data} onClose={closeModal} onSave={refresh} />
    </div>
  );
}