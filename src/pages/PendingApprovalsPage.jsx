import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Search, Calendar, BriefcaseBusiness
} from "lucide-react";
import API from "../services/api";
import ProfessionalLoader from "../components/ProfessionalLoader";

export default function PendingApprovalsPage() {
  const [approvalGroups, setApprovalGroups] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/approvals/pending");
      if (res.data?.success) {
        setApprovalGroups(res.data.data.grouped || []);
        setTotalPending(res.data.data.total || 0);
      } else {
        setError("Failed to load pending approvals.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = approvalGroups.filter(g => 
    g.projectName.toLowerCase().includes(search.toLowerCase()) ||
    g.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) return <ProfessionalLoader text="Loading pending approvals..." />;
  if (error) return (
    <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-xl max-w-md mx-auto mt-10">
      <AlertCircle className="w-10 h-10 mx-auto mb-2" />
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <ClipboardCheck className="text-amber-500" /> Pending Client Approvals
            </h1>
            <p className="text-slate-500 mt-1">
              Tracking <strong>{totalPending}</strong> assets waiting for client sign-off across all projects.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search project or client..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Approval List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredGroups.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-slate-200 text-slate-500">
              No pending approvals found. Great job!
            </div>
          ) : (
            filteredGroups.map(group => (
              <motion.div 
                key={group.projectName}
                variants={itemVariants}
                className={`bg-white border ${group.hasOverdue ? 'border-red-200' : 'border-slate-200'} rounded-2xl shadow-sm overflow-hidden`}
              >
                {/* Project Row Header */}
                <div 
                  onClick={() => setExpandedProject(expandedProject === group.projectName ? null : group.projectName)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${group.hasOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      <BriefcaseBusiness size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{group.projectName}</h3>
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        {group.clientName} • {group.departmentName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:gap-10">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Assets</p>
                      <p className="text-xl font-black text-slate-800">{group.items.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Max Waiting</p>
                      <p className={`text-xl font-black ${group.hasOverdue ? "text-red-600" : "text-amber-500"}`}>
                        {group.maxDaysWaiting} <span className="text-sm font-medium">days</span>
                      </p>
                    </div>
                    
                    <div className="text-slate-400">
                      {expandedProject === group.projectName ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedProject === group.projectName && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`border-t ${group.hasOverdue ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50/50'}`}
                    >
                      <div className="p-5">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="pb-2 font-bold">Asset Title</th>
                                <th className="pb-2 font-bold">Type</th>
                                <th className="pb-2 font-bold">Sent For Approval On</th>
                                <th className="pb-2 font-bold">Days Waiting</th>
                                <th className="pb-2 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.items.map((item) => (
                                <tr key={item.id} className="hover:bg-white transition-colors">
                                  <td className="py-3 font-medium text-slate-700">
                                    {item.title || "Untitled Asset"}
                                  </td>
                                  <td className="py-3 text-slate-600">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-200 text-slate-700">
                                      {item.mediaType}
                                    </span>
                                  </td>
                                  <td className="py-3 flex items-center gap-1.5 text-slate-600">
                                    <Calendar size={14} className={item.isOverdue ? "text-red-500" : "text-slate-400"}/>
                                    {new Date(item.verifiedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3">
                                    <span className={`font-black ${item.isOverdue ? "text-red-600" : "text-amber-500"}`}>
                                      {item.daysWaiting} days
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    {item.isOverdue ? (
                                      <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                        <AlertCircle size={14} /> ACTION REQUIRED
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                        <Clock size={14} /> PENDING
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
