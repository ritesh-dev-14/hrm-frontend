import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  MapPin,
  PenTool,
  X,
  Edit2,
  Trash2
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

  // Edit Modal Controls
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editFormData, setEditFormData] = useState({
    projectName: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
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

  // Open Edit Modal with prefilled values
  const handleOpenEditModal = (e, task) => {
    e.stopPropagation()
    setEditingTaskId(task.id)
    setEditFormData({
      projectName: task.projectName || '',
      description: task.description || '',
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      endDate: task.endDate ? task.endDate.split('T')[0] : '',
      status: task.status || 'DRAFT'
    })
    setIsEditModalOpen(true)
  }

  // Submit Edit Task changes
  const handleUpdateTask = async (e) => {
    e.preventDefault()
    if (!editFormData.projectName.trim()) return

    setSubmittingEdit(true)
    const payload = {
      ...editFormData,
      startDate: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : null,
      endDate: editFormData.endDate ? new Date(editFormData.endDate).toISOString() : null
    }

    try {
      const response = await API.patch(`/api/manager/tasks/${editingTaskId}`, payload)
      if (response.data?.success) {
        setIsEditModalOpen(false)
        setEditingTaskId(null)
        await fetchTasks()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task details.')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Delete Task
  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project task and all its subtasks?')) return

    try {
      setLoading(true)
      const res = await API.delete(`/api/manager/tasks/${taskId}`)
      if (res.data?.success) {
        await fetchTasks()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project task.')
    } finally {
      setLoading(false)
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
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'ACTIVE': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-3 bg-slate-50/40">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-10 h-10 text-indigo-600" />
        </motion.div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accessing core management pipelines...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-pink-400/10 blur-[100px]" />
      </div>

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-8">

        {/* Top Banner Control Framework */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/60 backdrop-blur-xl border border-white/80 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <PenTool size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight">
                Editor Management
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Designate assignments, organize production milestones, and monitor post-production status.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-indigo-600/30 w-full md:w-auto justify-center"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Create Production Task
          </button>
        </motion.div>

        {/* Overview Analytics Metrics Row */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 block">Total Workspaces</span>
            <span className="text-3xl font-black text-slate-900">{tasks.length}</span>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 block">Draft Sequences</span>
            <span className="text-3xl font-black text-indigo-600">
              {tasks.filter(t => t.status === 'DRAFT').length}
            </span>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 block">Production Volume</span>
            <span className="text-3xl font-black text-slate-700">
              {tasks.reduce((acc, curr) => acc + (curr.totalItems || 0), 0)} <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Subtasks</span>
            </span>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 block">Operator ID</span>
            <span className="text-xs font-black text-slate-500 font-mono mt-1 px-3 py-1.5 bg-slate-100 rounded-lg inline-block w-max truncate">
              {tasks[0]?.createdBy?.employeeId || 'CC-MGR-001'}
            </span>
          </div>
        </motion.div>

        {/* Filtering Control Matrix Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[1.5rem] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search matching projects, descriptions..."
              className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
              <Filter className="w-4 h-4 text-indigo-500" />
            </div>
            <select
              className="bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none cursor-pointer pr-8"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              <option value="ALL">All Status Fields</option>
              <option value="DRAFT">Draft Setup</option>
              <option value="ACTIVE">Active Matrix</option>
              <option value="COMPLETED">Completed Pipelines</option>
            </select>
          </div>
        </motion.div>

        {/* Main Framework Interactive Tabular Matrix Container */}
        <div className="w-full">
          {error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 bg-rose-50/80 backdrop-blur-xl border border-rose-200 rounded-[2rem] text-center max-w-md mx-auto my-10 shadow-sm">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="text-sm font-black text-rose-900 mb-4">{error}</p>
              <button onClick={fetchTasks} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm">Retry Connection</button>
            </motion.div>
          ) : filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 backdrop-blur-xl border border-dashed border-indigo-200 rounded-[2rem] py-24 text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="text-xl font-black text-slate-800">No active workflows found</p>
              <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mt-2">Adjust your search filters or hit the Create Production button to start a new workspace.</p>
            </motion.div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <motion.table variants={containerVariants} initial="hidden" animate="show" className="w-full text-left border-collapse">
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
                    {filteredTasks.map((task) => {
                      const submittedCount = task.submittedItemsCount ?? 0;

                      return (
                        <motion.tr
                          variants={itemVariants}
                          key={task.id}
                          onClick={() => navigate(`/editor/${task.id}`)}
                          className="hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                        >
                          <td className="py-4 px-6 max-w-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm tracking-tight">{task.projectName}</span>
                              {submittedCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm shadow-rose-500/30 animate-pulse flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                  {submittedCount} Submitted
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 truncate mt-0.5 font-medium">{task.description || 'No descriptive tags specified.'}</div>
                          </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold tracking-widest border rounded-md uppercase ${getStatusStyle(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                              <span className="text-slate-300 mx-1">→</span>
                              {task.endDate ? new Date(task.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-full font-bold">
                            {task.totalItems ?? 0}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleOpenEditModal(e, task)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={(e) => handleDeleteTask(e, task.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                            <div
                              onClick={() => navigate(`/editor/${task.id}`)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer ml-1"
                            >
                              Enter <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  </tbody>
                </motion.table>
              </div>
            </div>
          )}
        </div>

        {/* Creation Modal System Setup */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => !submitting && setIsModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-white/50"
              >
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase block mb-1">INITIALIZATION</span>
                    <h3 className="text-xl font-black text-slate-900">Configure Workspace</h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false)
                      setSelectedProjectId('')
                      setFormData({ projectName: '', description: '', startDate: '', endDate: '' })
                    }}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="p-8 space-y-6">
                  {/* API Option Select Framework */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Target Project Assignment <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      {loadingProjects ? (
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 flex items-center gap-3">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          Resolving project vectors catalog...
                        </div>
                      ) : (
                        <select
                          required
                          value={selectedProjectId}
                          onChange={handleProjectSelectChange}
                          className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition-colors appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
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

                  {/* Immutable Context Review Blocks */}
                  <AnimatePresence>
                    {selectedProjectId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 space-y-4 overflow-hidden"
                      >
                        <div>
                          <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Project Blueprint Identity</span>
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-2 mt-1">
                            <BriefcaseBusiness className="w-4 h-4 text-indigo-500" />
                            {formData.projectName}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Operational Description Outline</span>
                          <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed bg-white/60 p-3 rounded-xl max-h-32 overflow-y-auto">
                            {formData.description || <span className="text-slate-300 italic">No descriptive data specified.</span>}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-100/50">
                          <div className="bg-white/60 p-3 rounded-xl">
                            <span className="block text-[9px] font-black uppercase text-indigo-400 tracking-widest">Sync Start Date</span>
                            <span className="font-bold text-slate-700 flex items-center gap-1.5 mt-1 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                            </span>
                          </div>
                          <div className="bg-white/60 p-3 rounded-xl">
                            <span className="block text-[9px] font-black uppercase text-indigo-400 tracking-widest">Deadline target</span>
                            <span className="font-bold text-slate-700 flex items-center gap-1.5 mt-1 text-xs">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-end gap-3 pt-8 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setIsModalOpen(false)
                        setSelectedProjectId('')
                        setFormData({ projectName: '', description: '', startDate: '', endDate: '' })
                      }}
                      className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !selectedProjectId}
                      className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 transition-all flex items-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Deploy Workspace
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal System */}
        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl z-10 overflow-hidden"
              >
                <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Project Task</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Update project name, description, horizon, and status</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateTask} className="space-y-4 pt-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Name</label>
                    <input
                      type="text"
                      value={editFormData.projectName}
                      onChange={(e) => setEditFormData({ ...editFormData, projectName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Start Date</label>
                      <input
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">End Date</label>
                      <input
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={submittingEdit}
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEdit || !editFormData.projectName.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                    >
                      {submittingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Updates
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EditorManagerPage