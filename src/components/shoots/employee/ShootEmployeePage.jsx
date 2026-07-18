import React, { useState, useEffect, useMemo } from 'react'
import API from '../../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Image as ImageIcon, 
  Video, 
  Layers, 
  Link2, 
  AlertTriangle, 
  AlertOctagon,
  CheckCircle2, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  Briefcase,
  Loader2, 
  X, 
  ExternalLink 
} from 'lucide-react'

const ShootEmployeePage = () => {
  const [shoots, setShoots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedShootId, setExpandedShootId] = useState(null)

  // Modal States
  const [selectedTask, setSelectedTask] = useState(null)
  const [actionType, setActionType] = useState('submit') // 'submit' | 'unable'
  const [submissionLinksRaw, setSubmissionLinksRaw] = useState('')
  const [submissionNote, setSubmissionNote] = useState('')
  const [unableReason, setUnableReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch Tasks on Mount
  useEffect(() => {
    fetchMyTasks()
  }, [])

  const fetchMyTasks = async () => {
    try {
      setLoading(true)
      const response = await API.get('/api/shoot-workspaces/my-tasks')
      if (response.data?.success) {
        setShoots(response.data.data)
      } else {
        setError('Failed to fetch assigned tasks.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong while fetching tasks.')
    } finally {
      setLoading(false)
    }
  }

  // Determine current lifecycle status of a subtask
  const getStatus = (subtask) => {
    if (subtask.status) return subtask.status
    if (subtask.submissionLinks?.length > 0) return 'SUBMITTED'
    if (subtask.unableToSubmitReason) return 'REJECTED'
    return 'PENDING'
  }

  // Predicate: checks if a deliverable requires immediate attention/resubmission
  const needsResubmission = (subtask) => getStatus(subtask) === 'REJECTED'

  const totalNeedingResubmission = shoots.reduce(
    (sum, shoot) => sum + (shoot.subtasks?.filter(needsResubmission).length || 0),
    0
  )

  const totalSubtasks = shoots.reduce(
    (sum, shoot) => sum + (shoot.subtasks?.length || 0),
    0
  )

  const filteredShoots = useMemo(() => {
    if (!searchTerm.trim()) return shoots
    const lowerTerm = searchTerm.toLowerCase()
    return shoots.filter(shoot => 
      shoot.title?.toLowerCase().includes(lowerTerm) ||
      shoot.workspaceName?.toLowerCase().includes(lowerTerm) ||
      shoot.description?.toLowerCase().includes(lowerTerm) ||
      shoot.subtasks?.some(subtask => subtask.title?.toLowerCase().includes(lowerTerm))
    )
  }, [shoots, searchTerm])

  const toggleExpand = (shootId) => {
    setExpandedShootId(prev => prev === shootId ? null : shootId)
  }

  // Open modal container with operational mappings
  const openActionModal = (shootId, taskId, subtask, type) => {
    setSelectedTask({ shootId, taskId, subtask })
    setActionType(type)
    setSubmissionLinksRaw(subtask.submissionLinks ? subtask.submissionLinks.join(', ') : '')
    setSubmissionNote(subtask.submissionNote || '')
    setUnableReason('')
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTask) return

    const { shootId, taskId, subtask } = selectedTask
    const subtaskId = subtask.id

    if (!shootId || !taskId || !subtaskId) {
      alert("Error: Missing parameters required for delivery tracking operations.")
      return
    }

    let payload

    if (actionType === 'submit') {
      const parsedLinks = submissionLinksRaw
        .split(',')
        .map(link => link.trim())
        .filter(link => link.length > 0)

      if (parsedLinks.length === 0) {
        alert('Please provide at least one submission link.')
        return
      }

      payload = {
        submissionLinks: parsedLinks,
        note: submissionNote.trim() || undefined
      }
    } else {
      payload = { unableToSubmitReason: unableReason.trim() }
    }

    setSubmitting(true)

    try {
      const response = await API.post(
        `/api/shoot-workspaces/${shootId}/tasks/${taskId}/subtasks/${subtaskId}/submit`, 
        payload
      )

      if (response.data?.success) {
        await fetchMyTasks()
        setSelectedTask(null)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed. Please verify submission format.')
    } finally {
      setSubmitting(false)
    }
  }

  // Variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 bg-slate-50/50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading assigned shoots pipeline...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-white border border-rose-200 text-center shadow-sm">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-slate-800 font-bold text-sm mb-4">{error}</p>
        <button 
          onClick={fetchMyTasks} 
          className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 p-6 md:p-10 font-sans selection:bg-indigo-100 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 max-w-5xl mx-auto relative z-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          My Shoots
          {totalNeedingResubmission > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-2 text-xs font-bold text-white bg-rose-500 rounded-full shadow-sm" title="Deliverables rejected — resubmission needed">
              {totalNeedingResubmission}
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Manage, monitor, and submit your content deliverables dynamically.</p>
        
        {/* Stats & Search Block */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Workspaces</p>
                <p className="text-xl font-black text-slate-800">{shoots.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Hash className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Subtasks</p>
                <p className="text-xl font-black text-slate-800">{totalSubtasks}</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium shadow-sm"
              placeholder="Search shoots, tasks, or workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {filteredShoots.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 max-w-5xl mx-auto bg-white/60 backdrop-blur-xl border border-slate-100/60 rounded-[2rem] shadow-sm relative z-10">
          <Layers className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
          <p className="text-slate-800 font-bold text-lg">
            {searchTerm ? 'No matching shoots found' : 'No assigned shoots found'}
          </p>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {searchTerm ? 'Try a different search term.' : "You're completely caught up with your schedule framework."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6 relative z-10">
          {filteredShoots.map((shoot) => {
            const currentShootId = shoot.workspaceId;
            const currentTaskId = shoot.id;
            const shootNeedingResubmissionCount = shoot.subtasks?.filter(needsResubmission).length || 0;
            const isExpanded = expandedShootId === currentTaskId;
            
            return (
              <motion.div 
                variants={itemVariants}
                key={currentTaskId} 
                className={`bg-white/60 backdrop-blur-xl border ${isExpanded ? 'border-indigo-200/80 shadow-md' : 'border-slate-100/60 shadow-sm hover:shadow-md hover:border-indigo-100'} rounded-[2rem] overflow-hidden transition-all group`}
              >
                {/* Header Information Section - Clickable to expand */}
                <div 
                  className={`p-6 md:p-8 cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : 'bg-white/40'} grid grid-cols-1 md:grid-cols-12 gap-6 items-center transition-colors`}
                  onClick={() => toggleExpand(currentTaskId)}
                >
                  <div className="space-y-2 md:col-span-8">
                    <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {shoot.workspaceName || 'Shoot Area'}
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight pt-1 flex items-center gap-3">
                      {shoot.title}
                      {shootNeedingResubmissionCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-white bg-rose-500 rounded-full shadow-sm" title="Deliverables rejected — resubmission needed">
                          {shootNeedingResubmissionCount}
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl line-clamp-2">{shoot.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{new Date(shoot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{shoot.arrivalTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span>{shoot.subtasks?.length || 0} tasks</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-center sm:items-end justify-between md:justify-center gap-4 md:gap-2 text-right">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-sm font-bold text-slate-700">{shoot.noOfPics} <span className="text-[10px] text-slate-400 uppercase tracking-widest">Pics</span></span>
                      </div>
                      <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-2">
                        <Video className="w-3.5 h-3.5 text-pink-400" />
                        <span className="text-sm font-bold text-slate-700">{shoot.noOfReels} <span className="text-[10px] text-slate-400 uppercase tracking-widest">Reels</span></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50/50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition">
                      {isExpanded ? 'Hide Details' : 'View Tasks'}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-100/60 bg-slate-50/30"
                    >
                      <div className="p-6 md:p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Task Matrix Breakdown</h3>
                          {shoot.location && (
                            <a 
                              href={shoot.location} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 rounded-xl transition text-indigo-600 text-xs font-bold border border-slate-200 hover:border-indigo-200 shadow-sm"
                            >
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                              Open Location
                              <ExternalLink className="w-3 h-3 text-indigo-400" />
                            </a>
                          )}
                        </div>
                        
                        {shoot.subtasks?.map((subtask) => {
                          const status = getStatus(subtask)
                          const isUnable = !!subtask.unableToSubmitReason && status !== 'REJECTED'
                          const rejectionReason = subtask.reviewReason || subtask.reason || subtask.rejectionReason
                          const currentSubtaskId = subtask.id;

                          return (
                            <div 
                              key={currentSubtaskId} 
                              className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all gap-5"
                            >
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-base font-bold text-slate-800 tracking-tight">{subtask.title}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                    subtask.type === 'REEL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {subtask.type} {subtask.videoType ? `(${subtask.videoType})` : ''}
                                  </span>

                                  {/* Lifecycle Status Indicators */}
                                  {status === 'APPROVED' && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                                    </span>
                                  )}
                                  {status === 'SUBMITTED' && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Awaiting Review
                                    </span>
                                  )}
                                  {status === 'REJECTED' && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Rejected — Resubmit
                                    </span>
                                  )}
                                  {status === 'DRAFT' && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                                      <Layers className="w-3.5 h-3.5 text-slate-500" /> Draft / Pending
                                    </span>
                                  )}
                                  {isUnable && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Blocked
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 font-medium max-w-2xl">{subtask.description}</p>

                                {/* Reference Material Access Links */}
                                {subtask.referenceLinks?.length > 0 && (
                                  <div className="flex flex-wrap gap-3 pt-2">
                                    {subtask.referenceLinks.map((ref, idx) => (
                                      <a 
                                        key={idx} 
                                        href={ref} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition"
                                      >
                                        <Link2 className="w-3.5 h-3.5" /> Reference #{idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {/* Render Existing Submissions Content */}
                                {subtask.submissionLinks?.length > 0 && (status === 'SUBMITTED' || status === 'APPROVED' || status === 'REJECTED') && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {subtask.submissionLinks.map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100 font-bold shadow-sm transition truncate max-w-[240px]"
                                      >
                                        Deliverable {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {/* Review Framework / Correction Alerts */}
                                {status === 'REJECTED' && rejectionReason && (
                                  <div className="mt-3 bg-rose-50/80 px-4 py-2 rounded-xl border border-rose-100 text-xs inline-block">
                                    <span className="text-rose-700 font-bold">Rejection Reason: </span>
                                    <span className="text-slate-700 font-medium">{rejectionReason}</span>
                                  </div>
                                )}

                                {/* Unsubmitted Constraints Reason Output */}
                                {isUnable && (
                                  <div className="mt-3 bg-rose-50/80 px-4 py-2 rounded-xl border border-rose-100 text-xs inline-block">
                                    <span className="text-rose-700 font-bold">Reason for Unsubmit: </span>
                                    <span className="text-slate-700 font-medium">{subtask.unableToSubmitReason}</span>
                                  </div>
                                )}
                              </div>

                              {/* Interactive Workflow Controls */}
                              {(status === 'PENDING' || status === 'DRAFT' || status === 'SUBMITTED' || status === 'REJECTED') && (
                                <div className="flex items-center gap-3 self-stretch md:self-auto justify-end border-t border-slate-100 md:border-0 pt-4 md:pt-0 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openActionModal(currentShootId, currentTaskId, subtask, 'unable')}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                  >
                                    Unable to Submit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openActionModal(currentShootId, currentTaskId, subtask, 'submit')}
                                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                                  >
                                    {status === 'REJECTED' 
                                      ? 'Resubmit Deliverable' 
                                      : status === 'SUBMITTED' 
                                      ? 'Update Submission' 
                                      : 'Submit Deliverable'} 
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Submission & Action Dialogue Drawer */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100/60 bg-white/50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {actionType === 'submit' ? 'Submit Finished Task' : 'Unable to Submit'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">{selectedTask.subtask.title}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="p-6 space-y-6">
                {actionType === 'submit' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Submission Deliverable Links
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://docs.google.com/..., https://drive.google.com/..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                      value={submissionLinksRaw}
                      onChange={(e) => setSubmissionLinksRaw(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400 font-medium">Separate multiple links with commas (Google Sheets, Drive, Frame.io, etc.).</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Reason for Inability to Complete / Submit
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe specific constraints, technical hitches or blockers causing task disruption..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all font-medium"
                      value={unableReason}
                      onChange={(e) => setUnableReason(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400 font-medium">This alerts managers directly via system tracking reports logs streams.</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setSelectedTask(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2 text-white ${
                      actionType === 'submit' 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'bg-rose-600 hover:bg-rose-700'
                    } disabled:opacity-50`}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {actionType === 'submit' ? 'Confirm Submission' : 'Submit Reason'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShootEmployeePage