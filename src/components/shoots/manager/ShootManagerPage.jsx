import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../services/api";
import { 
  Plus, 
  Video, 
  Folder, 
  Users, 
  ListTodo, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  X,
  AlertCircle,
  Clapperboard,
  Camera,
  Search
} from "lucide-react";

const ShootManagerPage = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Workspace Form State
  const [formData, setFormData] = useState({
    brandName: "",
    description: "",
  });

  // Fetch All Workspaces
  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/api/shoot-workspaces");
      if (res.data?.success) {
        setWorkspaces(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching shoot workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Assigned Projects for Dropdown selection
  const fetchAssignedProjects = async () => {
    try {
      const res = await API.get("/api/projects/assigned");
      if (res.data?.success) {
        setAssignedProjects(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchAssignedProjects();
  }, []);

  // Handle Dropdown Change Event
  const handleProjectSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setFormData({ brandName: "", description: "" });
      return;
    }

    const selectedProject = assignedProjects.find((p) => p.id === selectedId);
    if (selectedProject) {
      setFormData({
        brandName: selectedProject.projectName || "",
        description: selectedProject.description || "",
      });
    }
  };

  // Handle Form Submission
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!formData.brandName.trim()) return;

    try {
      setIsSubmitLoading(true);
      setErrorMessage("");
      
      const res = await API.post("/api/shoot-workspaces", {
        brandName: formData.brandName.trim(),
        description: formData.description.trim(),
      });

      if (res.data?.success) {
        // Reset state, close modal, and update list
        setFormData({ brandName: "", description: "" });
        setIsModalOpen(false);
        fetchWorkspaces();
      } else {
        setErrorMessage(res.data?.message || "Failed to create shoot workspace.");
      }
    } catch (error) {
      console.error("Error creating shoot workspace:", error);
      setErrorMessage(
        error.response?.data?.message || "An error occurred while creating the workspace."
      );
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const filteredWorkspaces = workspaces.filter(ws => 
    (ws.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ws.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-fuchsia-400/10 blur-[100px]" />
      </div>

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white/60 backdrop-blur-xl border border-white/80 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Camera size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight">
                Shoot Management
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Organize, track, and monitor media production campaigns globally.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-indigo-600/30 w-full md:w-auto justify-center"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Launch Workspace
          </button>
        </motion.div>

        {/* LIST SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden mb-12">
          
          {/* TOP */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clapperboard size={20} className="text-indigo-500" />
              All Production Shoots
            </h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search shoots..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold text-indigo-600 rounded-xl shadow-sm whitespace-nowrap">
                {filteredWorkspaces.length} Records
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Loader2 className="h-10 w-10 text-indigo-500 mb-4" />
              </motion.div>
              <p className="text-sm font-semibold text-indigo-900 tracking-wide">
                Synchronizing Workspaces...
              </p>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-sm">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Clapperboard size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No Shoots Found
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm">
                No matching workspaces found. Initialize a new production workspace to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <motion.table variants={containerVariants} initial="hidden" animate="show" className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Shoot Metadata / Brand</th>
                    <th className="py-4 px-6 text-center">Tasks Count</th>
                    <th className="py-4 px-6 text-center">Crew Members</th>
                    <th className="py-4 px-6 text-right">Actions Matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredWorkspaces.map((shoot) => (
                    <motion.tr 
                      variants={itemVariants}
                      key={shoot.id}
                      onClick={() => navigate(`/shoot/${shoot.id}`)} 
                      className="hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-6 max-w-sm">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                            <Video size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm tracking-tight">{shoot.name}</div>
                            <div className="text-slate-400 truncate mt-0.5 font-medium">{shoot.description || 'No descriptive tags specified.'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100/80 px-2 py-1 rounded-md text-[11px] uppercase tracking-wider">
                          <ListTodo size={14} className="text-slate-400" />
                          {shoot.tasks?.length || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100/80 px-2 py-1 rounded-md text-[11px] uppercase tracking-wider">
                          <Users size={14} className="text-slate-400" />
                          {shoot.members?.length || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            </div>
          )}
        </motion.div>

        {/* CREATE WORKSPACE POPUP MODAL DIALOG */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => !isSubmitLoading && setIsModalOpen(false)}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-white/50"
              >
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase block mb-1">INITIALIZATION</span>
                    <h2 className="text-xl font-black text-slate-900">Configure Workspace</h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setErrorMessage("");
                      setFormData({ brandName: "", description: "" });
                    }}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Form Content */}
                <form onSubmit={handleCreateWorkspace} className="p-8">
                  
                  {errorMessage && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm font-semibold rounded-2xl flex items-center gap-3 border border-rose-100/50">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        Target Project Assignment <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        onChange={handleProjectSelect}
                        className="w-full px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium text-slate-800 transition-all cursor-pointer"
                      >
                        <option value="">-- Select Linked Project --</option>
                        {assignedProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.projectName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <AnimatePresence>
                      {formData.brandName && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 space-y-4 overflow-hidden"
                        >
                          <div>
                            <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Brand Entity</span>
                            <p className="text-sm font-bold text-slate-900 mt-1">{formData.brandName}</p>
                          </div>
                          <div>
                            <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Operational Directive</span>
                            <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed bg-white/60 p-3 rounded-xl max-h-32 overflow-y-auto">
                              {formData.description || "No specific operational directives provided."}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Trigger Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-8 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isSubmitLoading}
                      onClick={() => {
                        setIsModalOpen(false);
                        setErrorMessage("");
                        setFormData({ brandName: "", description: "" });
                      }}
                      className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitLoading || !formData.brandName.trim()}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                    >
                      {isSubmitLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Deploy Workspace"
                      )}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ShootManagerPage;