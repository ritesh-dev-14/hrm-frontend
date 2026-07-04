import React, { useState, useEffect } from 'react'
import API from '../../../services/api'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Image as ImageIcon, 
  Video, 
  Layers, 
  Link2, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  X, 
  ExternalLink 
} from 'lucide-react'

const ShootEmployeePage = () => {
  const [shoots, setShoots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Modal States
  const [selectedTask, setSelectedTask] = useState(null)
  const [actionType, setActionType] = useState('submit') // 'submit' | 'unable'
  const [submissionUrl, setSubmissionUrl] = useState('')
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

  // Open Action Modal with corrected parameter references from schema tracking mappings
  const openActionModal = (shootId, taskId, subtask, type) => {
    setSelectedTask({ shootId, taskId, subtask })
    setActionType(type)
    setSubmissionUrl('')
    setUnableReason('')
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTask) return

    const { shootId, taskId, subtask } = selectedTask
    const subtaskId = subtask.id

    if (!shootId || !taskId || !subtaskId) {
      alert("Error: Missing parameters required for delivery tracking sequence framework details.")
      return
    }
    
    setSubmitting(true)

    const payload = actionType === 'submit' 
      ? { submissionLinks: [submissionUrl.trim()] }
      : { unableToSubmitReason: unableReason.trim() }

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 bg-slate-50/50">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-600" />
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
    <div className="min-h-screen bg-slate-50/50 text-slate-800 p-6 md:p-10 font-sans selection:bg-indigo-100">
      <header className="mb-8 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          My Shoots
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage, monitor, and submit your content deliverables dynamically.</p>
      </header>

      {shoots.length === 0 ? (
        <div className="text-center py-20 max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">No assigned shoots found</p>
          <p className="text-xs text-slate-400 mt-0.5">You're completely caught up with your schedule framework.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          {shoots.map((shoot) => {
            // EXPLICIT ALIGNMENT: workspaceId mapped to shoot id, shoot.id mapped to taskId setup
            const currentShootId = shoot.workspaceId;
            const currentTaskId = shoot.id;
            
            return (
              <div 
                key={currentTaskId} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Shoot Top Details Panel */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div className="space-y-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700">
                      {shoot.workspaceName || 'Shoot Area'}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight pt-1">{shoot.title}</h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{shoot.description}</p>
                  </div>

                  {/* Logistics Info Block */}
                  <div className="space-y-2 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{new Date(shoot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Call Time: <strong className="text-slate-800 font-bold">{shoot.arrivalTime}</strong></span>
                    </div>
                    {shoot.location && (
                      <a 
                        href={shoot.location} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg transition text-indigo-600 text-[11px] font-bold border border-slate-200 shadow-sm"
                      >
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Open Location Map
                        <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                      </a>
                    )}
                  </div>

                  {/* Target Deliverables Metrics Layout */}
                  <div className="flex flex-wrap md:justify-end gap-2">
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-center min-w-[75px] shadow-xs">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pics Goal</span>
                      <span className="text-base font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> {shoot.noOfPics}
                      </span>
                    </div>
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-center min-w-[75px] shadow-xs">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reels Goal</span>
                      <span className="text-base font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <Video className="w-3.5 h-3.5 text-slate-400" /> {shoot.noOfReels}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtasks Tracker Timeline */}
                <div className="p-6 bg-white space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Required Subtasks Breakdown</h3>
                  
                  {shoot.subtasks?.map((subtask) => {
                    const isSubmitted = subtask.submissionLinks?.length > 0
                    const isUnable = !!subtask.unableToSubmitReason
                    const currentSubtaskId = subtask.id;

                    return (
                      <div 
                        key={currentSubtaskId} 
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50/30 border border-slate-200 rounded-xl hover:border-indigo-100 transition gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-800 tracking-tight">{subtask.title}</h4>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              subtask.type === 'REEL' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {subtask.type} {subtask.videoType ? `(${subtask.videoType})` : ''}
                            </span>

                            {/* Status Flags */}
                            {isSubmitted && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Submitted
                              </span>
                            )}
                            {isUnable && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                <AlertTriangle className="w-3 h-3 text-rose-500" /> Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 max-w-2xl">{subtask.description}</p>

                          {/* References */}
                          {subtask.referenceLinks?.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {subtask.referenceLinks.map((ref, idx) => (
                                <a 
                                  key={idx} 
                                  href={ref} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 underline transition"
                                >
                                  <Link2 className="w-2.5 h-2.5" /> Reference Layout #{idx + 1}
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Submission Link Display */}
                          {isSubmitted && (
                            <div className="mt-2 bg-white p-2 rounded-lg border border-slate-200 text-[11px] inline-block max-w-md truncate shadow-2xs">
                              <span className="text-slate-400 font-medium">Deliverable Vector: </span>
                              <a href={subtask.submissionLinks[0]} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-semibold">
                                {subtask.submissionLinks[0]}
                              </a>
                            </div>
                          )}

                          {/* Failure Reason Display */}
                          {isUnable && (
                            <div className="mt-2 bg-rose-50/60 px-2.5 py-1 rounded-lg border border-rose-100 text-[11px] inline-block">
                              <span className="text-rose-700 font-bold">Reason for Unsubmit: </span>
                              <span className="text-slate-600 font-medium">{subtask.unableToSubmitReason}</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Controls */}
                        {!isSubmitted && !isUnable && (
                          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t border-slate-100 md:border-0 pt-2 md:pt-0 shrink-0">
                            <button
                              type="button"
                              onClick={() => openActionModal(currentShootId, currentTaskId, subtask, 'unable')}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              Unable to Submit
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal(currentShootId, currentTaskId, subtask, 'submit')}
                              className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition flex items-center gap-1"
                            >
                              Submit Deliverable <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Workspace Modal Container */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md shadow-xl overflow-hidden transform scale-100 transition-all">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {actionType === 'submit' ? 'Submit Finished Task' : 'Unable to submit'}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedTask.subtask.title}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Input Matrix */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              {actionType === 'submit' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Submission Deliverable Asset URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/... or shared cloud link"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 font-medium">Provide complete assets deployment paths (Google Sheets, Drive, Frame.io, etc.).</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Reason for Inability to Complete / Submit
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe specific constraints, technical hitches or blockers causing task disruption..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none transition"
                    value={unableReason}
                    onChange={(e) => setUnableReason(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 font-medium">This alerts managers directly via system tracking reports logs streams.</p>
                </div>
              )}

              {/* Controls Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 text-white ${
                    actionType === 'submit' 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50`}
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {actionType === 'submit' ? 'Confirm Submission' : 'Submit Reason'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}

export default ShootEmployeePage