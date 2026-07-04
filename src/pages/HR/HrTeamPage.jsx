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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTeamData } from "./hooks/useTeamData";
import API from "../../services/api"; 

import HrAddEmployee from "./HrAddEmployee";
import HrAddManager from "./HrAddManager";
import HrAddDepartment from "./HrAddDepartment.jsx";
import HrViewDepartments from "./HrViewDepartments.jsx";
import HrEditEmployee from "./HrEditEmployee.jsx";

export default function HrTeamPage() {
  const navigate = useNavigate();
  const { staff, loading, error, refresh } = useTeamData();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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

  // 🛠️ FIX: Target the exact employeeId string string format expected by the backend parameters
  const handleDelete = useCallback(async (e, person) => {
    e.stopPropagation();
    
    // Explicitly target the human-readable string ID format (e.g. MGR-XXXXX or EMP-XXXXX)
    const targetId = person.employeeId || person.id || "";
    if (!targetId) {
      alert("Could not identify a valid record ID for this user.");
      return;
    }
    
    const confirmDelete = window.confirm(`Are you sure you want to permanently remove ${person.name || "this staff member"}?`);
    if (!confirmDelete) return;

    // Dynamically choose endpoint based on whether the role is MANAGER or EMPLOYEE
    const endpoint = person.role === "MANAGER"
      ? `/api/hr/manager/${targetId}`
      : `/api/hr/employee/${targetId}`;

    try {
      const res = await API.delete(endpoint);
      
      if (res?.data?.success || res?.status === 200) {
        alert(res?.data?.message || "Record successfully removed.");
        refresh(); // Smoothly sync and refresh the team list UI
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">HR Workspace</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 mt-1">Team Directory</h1>
            <p className="text-sm text-slate-500 mt-1">Manage corporate positioning, edit assignments, and structure organizational departments.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={(e) => handleAction(e, "VIEW_DEPARTMENTS")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors shadow-xs cursor-pointer"
            >
              <Layers size={14} />
              View Departments
            </button>
            <button
              onClick={(e) => handleAction(e, "DEPARTMENT")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Briefcase size={14} />
              Add Department
            </button>
            <button
              onClick={(e) => handleAction(e, "MANAGER")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus size={14} />
              Add Manager
            </button>
            <button
              onClick={(e) => handleAction(e, "EMPLOYEE")}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              Add Employee
            </button>
          </div>
        </header>

        {/* UTILITIES & FILTERING ROW */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, department, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setRoleFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roleFilter === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              All Members ({staff?.length || 0})
            </button>
            <button
              onClick={() => setRoleFilter("MANAGER")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roleFilter === "MANAGER" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Managers ({staff?.filter(p => p.role === "MANAGER").length || 0})
            </button>
            <button
              onClick={() => setRoleFilter("EMPLOYEE")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${roleFilter === "EMPLOYEE" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              Employees ({staff?.filter(p => p.role === "EMPLOYEE").length || 0})
            </button>
          </div>
        </div>

        {/* CORE DATA SHEET */}
        <main>
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 h-12 animate-pulse" />
              <div className="divide-y divide-slate-100">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-16 bg-white animate-pulse" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="bg-white border border-red-100 rounded-xl p-8 text-center max-w-md mx-auto">
              <p className="text-red-600 text-sm font-medium">{error}</p>
              <button
                onClick={refresh}
                className="mt-3 inline-flex items-center text-xs font-bold text-slate-900 underline hover:text-black"
              >
                Retry Request Sync
              </button>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-16 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                <Filter size={16} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">No profile matches found</h3>
              <p className="text-xs text-slate-500 mt-1">Adjust or clear your search input text to verify broader database scopes.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                      <th className="px-6 py-3.5">Staff Details</th>
                      <th className="px-6 py-3.5">ID / Reference</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Designation Scope</th>
                      <th className="px-6 py-3.5 text-right">Management Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStaff.map((person) => (
                      <tr
                        key={person.id}
                        onClick={() => navigate(`/hr/team/${person.employeeId || person.id}`)}
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                                person.role === "MANAGER"
                                  ? "bg-slate-950 border-slate-950 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              {person.name?.substring(0, 2)?.toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900 group-hover:underline decoration-slate-400">
                              {person.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500">
                          {person.employeeId || person.id?.substring(0, 8)}
                        </td>

                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                          {person?.department?.name || "General"}
                        </td>

                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${
                              person.role === "MANAGER"
                                ? "bg-slate-950 text-white border-slate-950"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {person.role === "MANAGER" ? <ShieldCheck size={10} /> : <Users size={10} />}
                            {person.role}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => handleAction(e, "EDIT_EMPLOYEE", person)}
                              title="Modify Profile Parameters"
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, person)}
                              title="Delete Resource Entry"
                              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center text-slate-300 group-hover:text-slate-700 transition-colors ml-1">
                              <ChevronRight size={15} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
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