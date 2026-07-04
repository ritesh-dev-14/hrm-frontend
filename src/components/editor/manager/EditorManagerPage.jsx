import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../services/api'
import { 
  FolderPlus, 
  Calendar, 
  Layers, 
  Clock, 
  Loader2, 
  Plus, 
  ChevronRight, 
  Briefcase, 
  AlertCircle, 
  FileText,
  Search,
  Filter,
  BriefcaseBusiness,
  Building2,
  MapPin
} from 'lucide-react'

const EditorManagerPage = () => {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Assigned Projects Catalogs for Dropdown
  const [assignedProjects, setAssignedProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')

  // Create Modal Controls
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    startDate: '',
    endDate: ''
  })

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await API.get('/api/manager/tasks')
      if (response.data?.success) {
        setTasks(response.data.data)
      } else {
        setError('Failed to pull workspace pipelines.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong fetching pipelines.')
    } finally {
      setLoading(false)
    }
  }

  // Lazy resolution handler for fetching assigned projects options
  const handleOpenCreateModal = async () => {
    setIsModalOpen(true)
    try {
      setLoadingProjects(true)
      const response = await API.get('/api/projects/assigned')
      if (response.data?.success) {
        setAssignedProjects(response.data.data || [])
      }
    } catch (err) {
      console.error('Failed to resolve assigned projects catalog:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  // Dynamic project selection handler parsing payloads straight from the drop-down menu
  const handleProjectSelectChange = (e) => {
    const projId = e.target.value
    setSelectedProjectId(projId)
    
    if (!projId) {
      setFormData({ projectName: '', description: '', startDate: '', endDate: '' })
      return
    }

    const targetedProject = assignedProjects.find(p => p.id === projId)
    if (targetedProject) {
      setFormData({
        projectName: targetedProject.projectName || '',
        description: targetedProject.description || '',
        // Format incoming database ISO timestamps strictly back down into standard HTML date inputs (YYYY-MM-DD)
        startDate: targetedProject.startDate ? targetedProject.startDate.split('T')[0] : '',
        endDate: targetedProject.endDate ? targetedProject.endDate.split('T')[0] : ''
      })
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!selectedProjectId) {
      alert('Please select a valid assigned project option from the dropdown sequence.')
      return
    }
    
    setSubmitting(true)
    
    // Transform input structures into standard ISO strings expected by backend repositories
    const payload = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
    }

    try {
      const response = await API.post('/api/manager/tasks', payload)
      if (response.data?.success) {
        setIsModalOpen(false)
        setSelectedProjectId('')
        setFormData({ projectName: '', description: '', startDate: '', endDate: '' })
        await fetchTasks()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to construct task architecture structure.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter Logic Matrix
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Helper utility for professional status badges styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-50 text-slate-700 border-slate-200'
      case 'ACTIVE': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      default: return 'bg-amber-50 text-amber-700 border-amber-100'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-3 bg-slate-50/40">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500 tracking-tight">Accessing core management pipelines...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans text-slate-800">
      
      {/* Top Banner Control Framework */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Workspace Editor Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">Designate assignments, organize production milestones, and monitor project status streams.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all text-xs font-bold shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Production Task
        </button>
      </div>

      {/* Overview Analytics Metrics Row */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total </span>
          <span className="block text-2xl font-black text-slate-900 mt-1">{tasks.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Draft Sequences</span>
          <span className="block text-2xl font-black text-indigo-600 mt-1">
            {tasks.filter(t => t.status === 'DRAFT').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Production Volume</span>
          <span className="block text-2xl font-black text-slate-700 mt-1">
            {tasks.reduce((acc, curr) => acc + (curr.totalItems || 0), 0)} subtasks
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operator ID</span>
          <span className="block text-xs font-mono font-bold text-slate-500 truncate mt-2">
            {tasks[0]?.createdBy?.employeeId || 'CC-MGR-001'}
          </span>
        </div>
      </div>

      {/* Filtering Control Matrix Bar */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search matching projects, descriptions..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status Fields</option>
            <option value="DRAFT">Draft Setup</option>
            <option value="ACTIVE">Active Matrix</option>
            <option value="COMPLETED">Completed Pipelines</option>
          </select>
        </div>
      </div>

      {/* Main Framework Interactive Tabular Matrix Container */}
      <div className="max-w-7xl mx-auto">
        {error ? (
          <div className="p-6 bg-white border border-rose-200 rounded-xl text-center max-w-md mx-auto my-10 shadow-xs">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">{error}</p>
            <button onClick={fetchTasks} className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-600 rounded-lg transition">Retry Matrix Link</button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center shadow-2xs">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No active workflows matched criteria</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Configure your structure frameworks by hitting the Create Production button above.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Project Metadata / Blueprint</th>
                    <th className="py-4 px-6">Lifecycle Status</th>
                    <th className="py-4 px-6">Timeline Duration</th>
                    <th className="py-4 px-6 text-center">Subtasks Count</th>
                    <th className="py-4 px-6 text-right">Actions Matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTasks.map((task) => (
                    <tr 
                      key={task.id}
                      onClick={() => navigate(`/editor/${task.id}`)} 
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-6 max-w-sm">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm tracking-tight">{task.projectName}</div>
                        <div className="text-slate-400 truncate mt-0.5 font-medium">{task.description || 'No descriptive tags specified.'}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wide border rounded-md uppercase ${getStatusStyle(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '—'}
                            <span className="text-slate-300 mx-1">→</span>
                            {task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
                          {task.totalItems ?? 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          Enter Workspace <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal System Setup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform scale-100 transition-all">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Initialize Production Workspace</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Select a pre-assigned project option to load pipeline parameters.</p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedProjectId('')
                  setFormData({ projectName: '', description: '', startDate: '', endDate: '' })
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 hover:bg-slate-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              {/* API Option Select Framework */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Assigned Project</label>
                <div className="relative">
                  {loadingProjects ? (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                      Resolving project vectors catalog...
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedProjectId}
                      onChange={handleProjectSelectChange}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 transition appearance-none"
                    >
                      <option value="">-- Choose Assigned Project Blueprint --</option>
                      {assignedProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.projectName} {project.department?.name ? `(${project.department.name})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Immutable Context Review Blocks (Populated strictly by selection) */}
              {selectedProjectId && (
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 space-y-3 animate-fade-in text-xs">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Project Blueprint Identity</span>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                      <BriefcaseBusiness className="w-3.5 h-3.5 text-indigo-500" />
                      {formData.projectName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Operational Description Outline</span>
                    <p className="text-slate-600 font-medium mt-0.5 leading-relaxed bg-white border border-slate-200/60 p-2 rounded-lg">
                      {formData.description || <span className="text-slate-300 italic">No descriptive data specified.</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Sync Start Date</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Deadline target</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsModalOpen(false)
                    setSelectedProjectId('')
                    setFormData({ projectName: '', description: '', startDate: '', endDate: '' })
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedProjectId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Deploy Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorManagerPage