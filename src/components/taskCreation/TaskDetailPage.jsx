import { useEffect, useState } from "react";
import { 
  Calendar, 
  Building2, 
  User2, 
  RefreshCw, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import API from "../../services/api";

const ProjectDetailsView = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        setError("");
        
        // Dynamic API call based on your endpoint format
        const response = await API.get(`/api/projects/${projectId}`);
        
        if (response?.data?.success) {
          setProject(response.data.data);
        } else {
          setError("Failed to fetch project information.");
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || 
          "An error occurred while loading the project details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  // Format utility for standard date display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-slate-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading project information...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full max-w-xl mx-auto mt-12 p-6 rounded-3xl bg-red-50 border border-red-100 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-red-900">Error Loading Details</h3>
        <p className="text-sm text-red-600 mt-1 mb-4">{error || "Project data could not be parsed."}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  // Check if conditional details exist in your data payload
  const hasRenewalInfo = project.renewalDate || project.frequency;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      {/* ACTION BAR / HEADER ENTRY */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Tasks
      </button>

      {/* CORE INFO CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden">
        
        {/* TOP OVERVIEW HERO */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm">
                <Building2 size={12} />
                {project.department?.name || "No Department Assigned"}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
                {project.projectName}
              </h1>
            </div>
            
            <div className="text-xs text-slate-400 flex flex-col gap-1 md:text-right md:self-end">
              <span className="flex items-center md:justify-end gap-1.5">
                <Clock size={12} /> Created: {formatDate(project.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* DETAILS LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* MAIN COLUMN (LEFT/MID) */}
          <div className="lg:col-span-2 p-8 space-y-8">
            {/* DESCRIPTION */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Project Details & Scope
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {project.description || "No project description provided."}
              </p>
            </div>

            {/* ASSIGNED MANAGERS SECTION */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Assigned Team Managers ({project.assignments?.length || 0})
              </h3>
              
              {!project.assignments || project.assignments.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No managers assigned to this project yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.assignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-slate-300 transition"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-600 flex-shrink-0">
                        <User2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {assignment.manager?.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {assignment.manager?.position || "Manager"}
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 font-medium">
                          {assignment.manager?.employeeId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* META SIDEBAR COLUMN (RIGHT) */}
          <div className="p-8 bg-slate-50/30 space-y-6">
            
            {/* PROJECT TIMELINE */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Project Schedule
              </h3>
              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <span className="block text-xs text-slate-400 font-medium">Start Date</span>
                    <span className="font-medium text-slate-800">{formatDate(project.startDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <div>
                    <span className="block text-xs text-slate-400 font-medium">End Date</span>
                    <span className="font-medium text-slate-800">{formatDate(project.endDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CONDITIONAL RENEWALS & FREQUENCY DISPLAY */}
            {hasRenewalInfo && (
              <div className="pt-5 border-t border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Renewal Architecture
                </h3>
                <div className="space-y-3.5">
                  {project.renewalDate && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <RefreshCw size={16} className="text-slate-400" />
                      <div>
                        <span className="block text-xs text-slate-400 font-medium">Next Renewal</span>
                        <span className="font-medium text-slate-800">{formatDate(project.renewalDate)}</span>
                      </div>
                    </div>
                  )}
                  {project.frequency && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock size={16} className="text-slate-400" />
                      <div>
                        <span className="block text-xs text-slate-400 font-medium">Billing Frequency</span>
                        <span className="font-medium text-slate-800 capitalize">{project.frequency}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CREATED BY SECTION */}
            {project.createdBy && (
              <div className="pt-5 border-t border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Author Details
                </h3>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">{project.createdBy.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{project.createdBy.role} Officer</p>
                  <span className="inline-block mt-1 text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    ID: {project.createdBy.employeeId}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsView;