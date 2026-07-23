import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../../../services/api'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Loader2, 
  Link2, 
  AlertCircle, 
  Layers, 
  ExternalLink,
  TrendingUp,
  User2,
  Plus,
  Briefcase,
  FileText,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Edit2,
  Trash2,
  X
} from 'lucide-react'

const EditorWorkspaceDetails = () => {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  
  // Core States
  const [workspace, setWorkspace] = useState(null)
  const [subtasks, setSubtasks] = useState([])
  const [employees, setAvailableEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Interactive UI Layer Controllers
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSubtask, setSelectedSubtask] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  // Verification loading tracker
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Rejection Workflow State Module
  const [rejectModal, setRejectModal] = useState({
    open: false,
    assignmentId: null, 
    reason: ""
  })

  // Edit Subtask State Module
  const [showEditSubtaskModal, setShowEditSubtaskModal] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [editSubtaskForm, setEditSubtaskForm] = useState({
    title: '',
    employeeId: '',
    dueDate: '',
    priority: 'MEDIUM',
    description: '',
    status: 'DRAFT',
    referenceLink: '',
    rawDataLink: ''
  })

  // Edit Workspace State Module
  const [showEditWorkspaceModal, setShowEditWorkspaceModal] = useState(false)
  const [editWorkspaceForm, setEditWorkspaceForm] = useState({
    projectName: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  })

  // Subtask Form Data Initial Bind Vectors
  const [subtaskForm, setSubtaskForm] = useState({
    title: '',
    employeeId: '',
    dueDate: '',
    priority: 'MEDIUM',
    description: '',
    status: 'DRAFT',
    referenceLink: '',
    rawDataLink: ''
  })

  useEffect(() => {
    if (workspaceId) {
      initialWorkspaceHandshake()
    }
  }, [workspaceId])

  const initialWorkspaceHandshake = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [workspaceRes, subtasksRes, employeesRes] = await Promise.all([
        API.get(`/api/manager/tasks/${workspaceId}`),
        API.get(`/api/manager/tasks/${workspaceId}/items`), 
        API.get('/api/manager/my-employees').catch(() => ({ data: { success: true, data: [] } })) 
      ])

      // Adjusting to handle nested structure if API wraps data under a common wrapper response
      if (workspaceRes.data?.success) {
        setWorkspace(workspaceRes.data.data?.task || workspaceRes.data.data)
      }
      
      if (subtasksRes.data?.success) {
        setSubtasks(subtasksRes.data.data?.items || [])
      }

      if (employeesRes.data?.success) {
        setAvailableEmployees(employeesRes.data.data || [])
      }

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error occurred communicating with core dataset system.')
    } finally {
      setLoading(false)
    }
  }

  const refreshSubtaskIndex = async () => {
    try {
      const subtasksRes = await API.get(`/api/manager/tasks/${workspaceId}/items`) 
      if (subtasksRes.data?.success) {
        const updatedSubtasks = subtasksRes.data.data?.items || []
        setSubtasks(updatedSubtasks)
        
        if (selectedSubtask) {
          const freshSubtask = updatedSubtasks.find(item => item.id === selectedSubtask.id)
          if (freshSubtask) {
            setSelectedSubtask(freshSubtask)
          } else {
            setSelectedSubtask(null)
            setShowDetailsModal(false)
          }
        }
      }
      const workspaceRes = await API.get(`/api/manager/tasks/${workspaceId}`)
      if (workspaceRes.data?.success) {
        setWorkspace(workspaceRes.data.data?.task || workspaceRes.data.data)
      }
    } catch (err) {
      console.error("Subtask refresh operation failed:", err)
    }
  }

  const handleFormInputChange = (e) => {
    const { name, value } = e.target
    setSubtaskForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubtaskSubmission = async (e) => {
    e.preventDefault()
    if (!subtaskForm.title.trim() || !subtaskForm.employeeId) return

    try {
      setIsActionLoading(true)
      const payload = {
        ...subtaskForm,
        title: subtaskForm.title.trim(),
        description: subtaskForm.description.trim(),
        dueDate: subtaskForm.dueDate ? new Date(subtaskForm.dueDate).toISOString() : null,
        referenceLink: subtaskForm.referenceLink.trim() || null,
        rawDataLink: subtaskForm.rawDataLink.trim() || null
      }

      const res = await API.post(`/api/task-items/${workspaceId}`, payload)
      if (res.data?.success) {
        setShowAddModal(false)
        setSubtaskForm({
          title: '', employeeId: '', dueDate: '', priority: 'MEDIUM',
          description: '', status: 'DRAFT', referenceLink: '', rawDataLink: ''
        })
        await refreshSubtaskIndex()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed pushing asset tracking criteria data to remote stream.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleApproveSubmission = async (assignmentId) => {
    if (!assignmentId) {
      alert("Missing valid assignment target vector tracking schema references.")
      return
    }
    try {
      setActionLoadingId(assignmentId)
      const res = await API.patch(`/api/task-item-submission/${assignmentId}/verify`)

      if (res.data?.success || res.status === 200) {
        await refreshSubtaskIndex()
      }
    } catch (error) {
      console.error("Frontend HTTP Handshake Error Object:", error.response || error)
      alert(error.response?.data?.message || "Verification mapping phase failed")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectSubmission = async () => {
    const { assignmentId, reason } = rejectModal
    if (!assignmentId) {
      alert("Missing active operational trace target identification arrays.")
      return
    }
    if (!reason.trim()) {
      alert("Rejection validation reason parameters are required")
      return
    }

    try {
      setActionLoadingId(assignmentId)
      const payload = { rejectionReason: reason.trim() }

      const res = await API.patch(`/api/task-item-submission/${assignmentId}/reject`, payload)

      if (res.data?.success || res.status === 200) {
        setRejectModal({ open: false, assignmentId: null, reason: "" })
        await refreshSubtaskIndex()
      }
    } catch (error) {
      console.error("Frontend HTTP Handshake Error Object:", error.response || error)
      alert(error.response?.data?.message || "Rejection logic deployment sequence failure")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Handle Open Edit Subtask Modal
  const handleOpenEditSubtask = (item) => {
    const primaryAssignment = item.assignments?.[0] || null
    const assignedEmp = primaryAssignment?.employee || null

    setEditingSubtask(item)
    setEditSubtaskForm({
      title: item.title || '',
      employeeId: assignedEmp?.employeeId || '',
      dueDate: item.dueDate ? item.dueDate.split('T')[0] : '',
      priority: item.priority || 'MEDIUM',
      description: item.description || '',
      status: item.status || 'DRAFT',
      referenceLink: item.referenceLink || '',
      rawDataLink: item.rawDataLink || ''
    })
    setShowEditSubtaskModal(true)
  }

  // Handle Submit Edit Subtask
  const handleUpdateSubtask = async (e) => {
    e.preventDefault()
    if (!editSubtaskForm.title.trim()) return

    try {
      setIsActionLoading(true)
      const payload = {
        ...editSubtaskForm,
        title: editSubtaskForm.title.trim(),
        description: editSubtaskForm.description.trim(),
        dueDate: editSubtaskForm.dueDate ? new Date(editSubtaskForm.dueDate).toISOString() : null,
        referenceLink: editSubtaskForm.referenceLink.trim() || null,
        rawDataLink: editSubtaskForm.rawDataLink.trim() || null
      }

      const res = await API.patch(`/api/task-items/${editingSubtask.id}`, payload)
      if (res.data?.success) {
        setShowEditSubtaskModal(false)
        setEditingSubtask(null)
        await refreshSubtaskIndex()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update subtask item.')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Delete Subtask
  const handleDeleteSubtask = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this subtask item?')) return

    try {
      setIsActionLoading(true)
      const res = await API.delete(`/api/task-items/${itemId}`)
      if (res.data?.success) {
        if (selectedSubtask?.id === itemId) {
          setSelectedSubtask(null)
          setShowDetailsModal(false)
        }
        await refreshSubtaskIndex()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete subtask item.')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Open Edit Workspace Modal
  const handleOpenEditWorkspace = () => {
    if (!workspace) return
    setEditWorkspaceForm({
      projectName: workspace.projectName || '',
      description: workspace.description || '',
      startDate: workspace.startDate ? workspace.startDate.split('T')[0] : '',
      endDate: workspace.endDate ? workspace.endDate.split('T')[0] : '',
      status: workspace.status || 'DRAFT'
    })
    setShowEditWorkspaceModal(true)
  }

  // Handle Submit Edit Workspace
  const handleUpdateWorkspace = async (e) => {
    e.preventDefault()
    if (!editWorkspaceForm.projectName.trim()) return

    try {
      setIsActionLoading(true)
      const payload = {
        ...editWorkspaceForm,
        startDate: editWorkspaceForm.startDate ? new Date(editWorkspaceForm.startDate).toISOString() : null,
        endDate: editWorkspaceForm.endDate ? new Date(editWorkspaceForm.endDate).toISOString() : null
      }

      const res = await API.patch(`/api/manager/tasks/${workspaceId}`, payload)
      if (res.data?.success) {
        setShowEditWorkspaceModal(false)
        await refreshSubtaskIndex()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update project workspace.')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle Delete Workspace
  const handleDeleteWorkspace = async () => {
    if (!window.confirm('Are you sure you want to delete this entire project workspace and all its subtasks?')) return

    try {
      setIsActionLoading(true)
      const res = await API.delete(`/api/manager/tasks/${workspaceId}`)
      if (res.data?.success) {
        navigate('/editor')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project workspace.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenRowDetails = (item) => {
    setSelectedSubtask(item)
    setShowDetailsModal(true)
  }

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-rose-50 text-rose-700 border-rose-100'
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'LOW': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'ACTIVE': 
      case 'ASSIGNED': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      case 'SUBMITTED': return 'bg-rose-500 text-white border-rose-600 font-black animate-pulse shadow-xs'
      case 'UNABLE_TO_SUBMIT': return 'bg-amber-500 text-white border-amber-600 font-black animate-pulse shadow-xs'
      case 'VERIFIED':
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-3 bg-slate-50/40">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500 tracking-tight">Defragmenting subtask structural nodes...</p>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-white border border-rose-200 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="text-slate-800 font-bold text-sm mb-4">{error || 'Workspace index target not found.'}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
        >
          Return to Hub Grid
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800">
      
      {/* HEADER CONTROLS VIEW STRIP */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Matrix Pipeline
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenEditWorkspace}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Edit Project"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Project
          </button>
          <button
            onClick={handleDeleteWorkspace}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition shadow-2xs"
            title="Delete Project"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Project
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Inject Subtask Element
          </button>
        </div>
      </div>

      {/* PARENT WORKSPACE SUMMARY SPECS SHEET CARD */}
      <div className="max-w-6xl mx-auto mb-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
              {workspace.status || 'Active Config'}
            </span>
            <span className="text-slate-300 font-light">|</span>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
              <User2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Manager Context: <strong className="text-slate-600">{workspace.createdBy?.name || 'Recruiter'}</strong></span>
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{workspace.projectName}</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{workspace.description || 'No specialized description parameters attached.'}</p>
        </div>

        <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 p-4 space-y-3.5 text-xs font-medium">
          <div className="flex items-center justify-between text-slate-500">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Target Horizon</span>
            <span className="text-slate-800 font-bold">
              {workspace.endDate ? new Date(workspace.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'No Target Set'}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Task Completion Engine</span>
              <span className="text-indigo-600 font-bold">{workspace.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${workspace.progress || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* HIGH QUALITY SUBTASK TABULAR MATRIX VIEW INDEX */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between pl-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" /> Operational Subtask Matrix Breakdown
          </h3>
          <span className="text-xs text-slate-400 font-medium">Total Entries: <strong>{subtasks.length}</strong></span>
        </div>

        {subtasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-2xs">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No active subtask operations mapped yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">Click the "Inject Subtask Element" button above to register an operational assignment blueprint loop.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-5">Subtask Specification</th>
                    <th className="py-3.5 px-4">Assigned Personnel</th>
                    <th className="py-3.5 px-4 text-center">Priority</th>
                    <th className="py-3.5 px-4">Lifecycle Status</th>
                    <th className="py-3.5 px-4">Due Target Horizon</th>
                    <th className="py-3.5 px-5 text-right">Action Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {subtasks.map((item) => {
                    const primaryAssignment = item.assignments?.[0] || null;
                    // FIX: Prioritize explicit assignmentId strictly over ambiguous fallbacks
                    const assignmentId = primaryAssignment?.assignmentId || primaryAssignment?.id || null;
                    const employeeData = primaryAssignment?.employee || null;
                    
                    const computedStatus = item.status || 'DRAFT';
                    const assignmentStatus = primaryAssignment?.status || computedStatus;
                    
                    // Display actions strictly when actionable or pending evaluation status
                    const isActionable = assignmentStatus === "COMPLETED";

                    return (
                      <tr 
                        key={item.id}
                        onClick={() => handleOpenRowDetails(item)}
                        className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-5 max-w-xs">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block text-sm truncate">{item.title}</span>
                          <span className="text-slate-400 block text-[11px] truncate mt-0.5">{item.description || 'No specialized description.'}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-100 font-bold border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] uppercase shrink-0">
                              {employeeData?.name?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{employeeData?.name || 'Unassigned'}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{employeeData?.employeeId || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold border rounded-md uppercase ${getPriorityStyle(item.priority)}`}>
                            {item.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-extrabold border rounded-md uppercase ${getStatusStyle(assignmentStatus)}`}>
                            {(assignmentStatus === "SUBMITTED" || assignmentStatus === "UNABLE_TO_SUBMIT") && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                            {assignmentStatus === "SUBMITTED" ? "🔴 SUBMITTED (Needs Review)" : assignmentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold whitespace-nowrap">
                          {item.dueDate ? (
                            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {new Date(item.dueDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                          ) : <span className="text-slate-300 italic">Unscheduled</span>}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap text-indigo-600 font-bold" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isActionable && assignmentId && (
                              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shadow-2xs">
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() => handleApproveSubmission(assignmentId)}
                                  className="p-1.5 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 shadow-3xs transition"
                                  title="Approve Submission"
                                >
                                  {actionLoadingId === assignmentId ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <ThumbsUp size={13} />
                                  )}
                                </button>
                                <button
                                  disabled={actionLoadingId !== null}
                                  onClick={() => setRejectModal({ open: true, assignmentId: assignmentId, reason: "" })}
                                  className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 shadow-3xs transition"
                                  title="Reject Submission"
                                >
                                  <ThumbsDown size={13} />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleOpenEditSubtask(item)}
                              className="p-1.5 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                              title="Edit Subtask"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubtask(item.id)}
                              className="p-1.5 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                              title="Delete Subtask"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleOpenRowDetails(item)}
                              className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform text-xs px-2 py-1 hover:bg-slate-50 rounded-lg ml-1"
                            >
                              Details →
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MODULE A: SUBTASK INJECTION SPECIFICATION BUILDER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Deploy Structural Subtask Node</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Initialize an atomic task assignment map vector payload.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubtaskSubmission} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Subtask Title Header</label>
                <input 
                  type="text" name="title" required
                  placeholder="e.g., Color Grading & Asset Synchronization"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 transition"
                  value={subtaskForm.title}
                  onChange={handleFormInputChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Production Employee</label>
                  <select
                    name="employeeId" required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                    value={subtaskForm.employeeId}
                    onChange={handleFormInputChange}
                  >
                    <option value="">Select Target Staff</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.employeeId}>{emp.name} ({emp.position || 'Editor'})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Horizon Due Date</label>
                  <input 
                    type="date" name="dueDate" required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600"
                    value={subtaskForm.dueDate}
                    onChange={handleFormInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority Tier Ranking</label>
                  <select
                    name="priority"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-bold text-slate-600"
                    value={subtaskForm.priority}
                    onChange={handleFormInputChange}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Guidelines Description Requirements</label>
                <textarea 
                  name="description" rows={2}
                  placeholder="Detail step specifications constraints array parameters requirements..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 resize-none transition"
                  value={subtaskForm.description}
                  onChange={handleFormInputChange}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Layout Reference Cloud Link (Optional)</label>
                <input 
                  type="url" name="referenceLink"
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 transition"
                  value={subtaskForm.referenceLink}
                  onChange={handleFormInputChange}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Raw Media Directory Datasets Link (Optional)</label>
                <input 
                  type="url" name="rawDataLink"
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 transition"
                  value={subtaskForm.rawDataLink}
                  onChange={handleFormInputChange}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button" disabled={isActionLoading}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isActionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Publish Subtask
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODULE B: SUBTASK DRILL-DOWN ANALYTICAL SPECIFICATIONS VIEWER */}
      {showDetailsModal && selectedSubtask && (() => {
        const modalAssignment = selectedSubtask.assignments?.[0] || null;
        // FIX: Prioritize explicit assignmentId strictly over ambiguous fallbacks
        const modalAssignmentId = modalAssignment?.assignmentId || modalAssignment?.id || null;
        const modalEmployee = modalAssignment?.employee || null;
        const modalSubmission = modalAssignment?.submission || null;
        
        const modalStatus = selectedSubtask.status || 'DRAFT';
        const modalAssignmentStatus = modalAssignment?.status || modalStatus;
        
        const isModalActionable = modalAssignmentStatus === "SUBMITTED";

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transform scale-100 transition-all flex flex-col">
              
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase tracking-wider rounded-md">
                    Drill-Down Inspection Panel
                  </span>
                  <h3 className="font-bold text-slate-900 text-base tracking-tight pt-0.5">{selectedSubtask.title}</h3>
                </div>
                <button 
                  onClick={() => { setShowDetailsModal(false); setSelectedSubtask(null); }}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs overflow-y-auto max-h-[70vh]">
                {/* Core Meta Properties Badge Strip */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-slate-600 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Priority Level</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border uppercase font-bold mt-1 ${getPriorityStyle(selectedSubtask.priority)}`}>
                      {selectedSubtask.priority || 'NORMAL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Lifecycle Tracking</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border uppercase font-bold mt-1 ${getStatusStyle(modalAssignmentStatus)}`}>
                      {modalAssignmentStatus}
                    </span>
                  </div>
                </div>

                {/* Assignment Personnel Block */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Operations Operator Assignment</h4>
                  <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs shadow-2xs">
                      {modalEmployee?.name?.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{modalEmployee?.name || 'No assigned operator detected.'}</span>
                      <span className="text-slate-400 font-mono text-[11px] block mt-0.5">
                        Registry Token: {modalEmployee?.employeeId || '—'} • {modalEmployee?.email || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deadline & Progress Frame */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due Target Horizon</h4>
                    <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl font-bold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{selectedSubtask.dueDate ? new Date(selectedSubtask.dueDate).toLocaleString('en-US', {dateStyle: 'medium'}) : 'Pending Sequence Calendar Block'}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Progress Evaluation</h4>
                    <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl font-bold text-indigo-600 flex items-center justify-between">
                      <span>Task Completion Node Metric:</span>
                      <span>{selectedSubtask.progress ?? 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Description Block */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Scope Specifications Requirements</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/30 border border-slate-100 p-3.5 rounded-xl whitespace-pre-wrap">
                    {selectedSubtask.description || 'No specialized description parameters attached across this workspace node element.'}
                  </p>
                </div>

                {/* Dynamic Work Submission Feedback Tray */}
                {modalSubmission && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Employee Deliverable Submission Data
                    </h4>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                      {modalSubmission.remarks && (
                        <div>
                          <span className="text-slate-400 block text-[10px]">Worker Remarks:</span>
                          <p className="text-slate-700 font-medium italic">"{modalSubmission.remarks}"</p>
                        </div>
                      )}
                      {modalSubmission.driveLink && (
                        <a 
                          href={modalSubmission.driveLink} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 font-bold hover:bg-slate-50 transition"
                        >
                          <span className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-indigo-400" /> Review Submitted Assets Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Resource Repositories Links Deployment Frame */}
                {(selectedSubtask.referenceLink || selectedSubtask.rawDataLink) && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Data Directories Links Map Vectors</h4>
                    <div className="space-y-2">
                      {selectedSubtask.referenceLink && (
                        <a 
                          href={selectedSubtask.referenceLink} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold transition-all group"
                        >
                          <span className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-indigo-400" /> Asset Reference Directory Location</span>
                          <ExternalLink className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      )}
                      {selectedSubtask.rawDataLink && (
                        <a 
                          href={selectedSubtask.rawDataLink} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100/50 text-emerald-700 font-bold transition-all group"
                        >
                          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Raw Media Footage Storage Repository</span>
                          <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Control Section directly in the drilldown panel */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2 justify-between items-center">
                <div>
                  {isModalActionable && (
                    <span className="text-[11px] font-medium text-slate-400">Review Status Workspace Action Blocks</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isModalActionable && modalAssignmentId && (
                    <>
                      <button
                        disabled={actionLoadingId !== null}
                        onClick={() => handleApproveSubmission(modalAssignmentId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        {actionLoadingId === modalAssignmentId ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                        Approve
                      </button>
                      <button
                        disabled={actionLoadingId !== null}
                        onClick={() => setRejectModal({ open: true, assignmentId: modalAssignmentId, reason: "" })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        <ThumbsDown size={12} />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowDetailsModal(false); setSelectedSubtask(null); }}
                    className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs hover:bg-slate-50 transition"
                  >
                    Dismiss Analysis View
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* REJECT MODAL FORM BLOCK */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900">Reject Subtask Verification Element</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Provide detailed validation discrepancy metrics mapping constraints mismatch parameters.</p>
            </div>

            <div className="p-5">
              <textarea
                placeholder="Detail asset validation issues context requirements..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full min-h-[120px] p-3 bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl outline-none focus:border-rose-500 resize-none text-slate-800 transition"
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
              <button
                onClick={() => setRejectModal({ open: false, assignmentId: null, reason: "" })}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmission}
                disabled={actionLoadingId === rejectModal.assignmentId}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {actionLoadingId === rejectModal.assignmentId ? <Loader2 size={12} className="animate-spin" /> : null}
                Confirm Rejection Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUBTASK MODAL SYSTEM */}
      {showEditSubtaskModal && editingSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Subtask Item</h3>
                  <p className="text-xs text-slate-500 font-medium">Update subtask specs, assigned employee, or priority</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditSubtaskModal(false)
                  setEditingSubtask(null)
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubtask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subtask Title</label>
                <input
                  type="text"
                  value={editSubtaskForm.title}
                  onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Employee</label>
                  <select
                    value={editSubtaskForm.employeeId}
                    onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employeeId}>
                        {emp.name} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={editSubtaskForm.priority}
                    onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={editSubtaskForm.dueDate}
                    onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={editSubtaskForm.status}
                    onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={editSubtaskForm.description}
                  onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Reference Link</label>
                <input
                  type="url"
                  value={editSubtaskForm.referenceLink}
                  onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, referenceLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Raw Data Link</label>
                <input
                  type="url"
                  value={editSubtaskForm.rawDataLink}
                  onChange={(e) => setEditSubtaskForm({ ...editSubtaskForm, rawDataLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => setShowEditSubtaskModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading || !editSubtaskForm.title.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                  Save Subtask Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WORKSPACE PROJECT MODAL SYSTEM */}
      {showEditWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Project Workspace</h3>
                  <p className="text-xs text-slate-500 font-medium">Update project title, description, horizon, and status</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditWorkspaceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateWorkspace} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={editWorkspaceForm.projectName}
                  onChange={(e) => setEditWorkspaceForm({ ...editWorkspaceForm, projectName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={editWorkspaceForm.description}
                  onChange={(e) => setEditWorkspaceForm({ ...editWorkspaceForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={editWorkspaceForm.startDate}
                    onChange={(e) => setEditWorkspaceForm({ ...editWorkspaceForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={editWorkspaceForm.endDate}
                    onChange={(e) => setEditWorkspaceForm({ ...editWorkspaceForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={editWorkspaceForm.status}
                  onChange={(e) => setEditWorkspaceForm({ ...editWorkspaceForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => setShowEditWorkspaceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading || !editWorkspaceForm.projectName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                  Save Workspace Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default EditorWorkspaceDetails