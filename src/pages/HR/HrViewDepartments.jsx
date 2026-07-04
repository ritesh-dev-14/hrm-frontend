import { useEffect, useState } from "react";
import { X, Calendar, Layers, Trash2 } from "lucide-react";
import API from "../../services/api";
import { notifySuccess, notifyError } from "../../utils/toast";

export default function HrViewDepartments({ isOpen, onClose }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchDepartments = () => {
    setLoading(true);
    setError(null);

    API.get("/api/departments")
      .then((response) => {
        const resData = response.data;
        if (resData.success) {
          setDepartments(resData.data);
        } else {
          setError("Failed to resolve department structures");
        }
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || err.message || "Could not fetch configuration";
        setError(errorMessage);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchDepartments();
  }, [isOpen]);

  const handleDelete = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to delete the department "${deptName}"?`)) {
      return;
    }

    try {
      setDeletingId(deptId);
      const response = await API.delete(`/api/departments/${deptId}`);
      
      if (response.data?.success) {
        notifySuccess("Department deleted successfully");
        // Filter out deleted element instantly from our frontend view array
        setDepartments((prev) => prev.filter((d) => d.id !== deptId));
      } else {
        notifyError("Failed to complete action");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Failed to delete department";
      notifyError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-100">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 bg-white">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Company Departments
            </h2>
            <p className="text-xs text-slate-400">
              Active structural units registered across the organization.
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* MODAL BODY DATA VIEW */}
        <div className="px-8 py-4 overflow-y-auto bg-white flex-1">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 bg-red-50/60 rounded-2xl px-4 border border-red-100 max-w-md mx-auto">
              <p className="text-xs font-medium text-red-600">{error}</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs font-medium tracking-wide">
              No structural departments defined yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {departments.map((dept) => {
                const dateString = new Date(dept.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                });

                const deptToken = dept.name ? dept.name.substring(0, 2).toUpperCase() : "DP";

                return (
                  <div 
                    key={dept.id} 
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all group"
                  >
                    {/* LEFT BLOCK: DEPT METADATA */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-white border border-slate-200/60 rounded-xl text-slate-500 font-bold text-[10px] tracking-wider flex items-center justify-center shrink-0 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                        {deptToken}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {dept.name}
                      </h3>
                    </div>

                    {/* RIGHT BLOCK: DATE AND INTERACTIVE DELETION BUTTON */}
                    <div className="flex items-center gap-4 shrink-0 pl-2">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium group-hover:opacity-40 transition-opacity">
                        <Calendar size={11} className="text-slate-300" />
                        <span>{dateString}</span>
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === dept.id}
                        onClick={() => handleDelete(dept.id, dept.name)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:opacity-50"
                        title="Delete entry permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-8 py-5 bg-white flex justify-between items-center text-xs font-semibold text-slate-400 mt-2 border-t border-slate-50">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers size={13} className="text-slate-300" /> Total Active Units
          </span>
          <span className="text-slate-900 font-bold text-sm bg-slate-100 px-2.5 py-0.5 rounded-lg">
            {departments.length}
          </span>
        </div>
      </div>
    </div>
  );
}