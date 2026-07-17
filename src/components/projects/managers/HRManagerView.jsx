import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Calendar, 
  Link as LinkIcon, 
  MapPin, 
  Phone, 
  User, 
  Eye, 
  EyeOff, 
  Globe,
  Save, 
  Settings,
  Trash2,
  Edit
} from 'lucide-react';

const HRManagerView = ({ projectId }) => {
  const navigate = useNavigate();

  // State Management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Password Visibility States
  const [showFbPassword, setShowFbPassword] = useState(false);
  const [showInstaPassword, setShowInstaPassword] = useState(false);
  const [showYoutubePassword, setShowYoutubePassword] = useState(false);
  const [showLinkedinPassword, setShowLinkedinPassword] = useState(false);
  const [showTwitterPassword, setShowTwitterPassword] = useState(false);

  const logoInputRef = useRef(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    endDate: '',
    frequency: 'monthly',
    renewalDate: '',
    assignTo: [],
    clientName: '',
    location: '',
    phone: '',
    projectStartDate: '',
    referenceLink: '',
    tasteLink: '',
    fbEmail: '',
    fbPassword: '',
    instaEmail: '',
    instaPassword: '',
    youtubeEmail: '',
    youtubePassword: '',
    linkedinEmail: '',
    linkedinPassword: '',
    twitterEmail: '',
    twitterPassword: ''
  });

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/api/projects/${projectId}`);
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        const projectData = resData.data;
        setProject(projectData);
        
        setFormData({
          projectName: projectData?.projectName || '',
          description: projectData?.description || '',
          endDate: projectData?.endDate ? projectData.endDate.split('T')[0] : '',
          frequency: projectData?.frequency || 'monthly',
          renewalDate: projectData?.renewalDate ? projectData.renewalDate.split('T')[0] : '',
          assignTo: projectData?.assignments?.map(a => a?.manager?.employeeId).filter(Boolean) || [],
          clientName: projectData?.clientName || '',
          location: projectData?.location || '',
          phone: projectData?.phone || '',
          projectStartDate: projectData?.projectStartDate ? projectData.projectStartDate.split('T')[0] : '',
          referenceLink: projectData?.referenceLink || '',
          tasteLink: projectData?.tasteLink || '',
          fbEmail: projectData?.fbEmail || '',
          fbPassword: projectData?.fbPassword || '',
          instaEmail: projectData?.instaEmail || '',
          instaPassword: projectData?.instaPassword || '',
          youtubeEmail: projectData?.youtubeEmail || '',
          youtubePassword: projectData?.youtubePassword || '',
          linkedinEmail: projectData?.linkedinEmail || '',
          linkedinPassword: projectData?.linkedinPassword || '',
          twitterEmail: projectData?.twitterEmail || '',
          twitterPassword: projectData?.twitterPassword || ''
        });
      } else {
        setError(resData?.message || 'Failed to fetch project details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    } else {
      setError("No project ID passed to this component view.");
      setLoading(false);
    }
  }, [projectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssigneeChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, assignTo: selectedValues }));
  };

  const handleLogoClick = () => {
    if (logoInputRef.current && !isUploadingLogo) {
      logoInputRef.current.click();
    }
  };

  const handleLogoFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const data = new FormData();
      data.append("logo", file);

      await API.patch(`/api/projects/${projectId}/logo`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchProjectDetails();
    } catch (err) {
      alert("Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        projectName: formData.projectName?.trim() || null,
        description: formData.description?.trim() || null,
        frequency: formData.frequency,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        renewalDate: formData.renewalDate ? new Date(formData.renewalDate).toISOString() : null,
        projectStartDate: formData.projectStartDate ? new Date(formData.projectStartDate).toISOString() : null,
        assignTo: formData.assignTo,
        clientName: formData.clientName?.trim() || null,
        location: formData.location?.trim() || null,
        phone: formData.phone?.trim() || null,
        referenceLink: formData.referenceLink?.trim() || null,
        tasteLink: formData.tasteLink?.trim() || null,
        fbEmail: formData.fbEmail?.trim() || null,
        fbPassword: formData.fbPassword || null,
        instaEmail: formData.instaEmail?.trim() || null,
        instaPassword: formData.instaPassword || null,
        youtubeEmail: formData.youtubeEmail?.trim() || null,
        youtubePassword: formData.youtubePassword || null,
        linkedinEmail: formData.linkedinEmail?.trim() || null,
        linkedinPassword: formData.linkedinPassword || null,
        twitterEmail: formData.twitterEmail?.trim() || null,
        twitterPassword: formData.twitterPassword || null
      };

      const config = { headers: { 'Content-Type': 'application/json' } };

      await API.patch(`/api/projects/${projectId}`, payload, config);
      setIsEditing(false);
      fetchProjectDetails(); 
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update project.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await API.delete(`/api/projects/${projectId}`);
        navigate('/projects'); 
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete project.');
      }
    }
  };

  const renderPasswordField = (label, name, value, visible, setVisible, placeholder, Icon) => (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-indigo-500" />}
        {label}
      </label>
      <div className="relative group">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full h-11 pl-4 pr-12 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading HR Project View...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-md w-full border border-red-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <h3 className="font-bold text-lg mb-2">Error Loading Project</h3>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-20">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase rounded-full">
                HR Project View
              </span>
              <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-full">
                ID: {project?.id?.toUpperCase().slice(0, 8)}
              </span>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-bold uppercase rounded-full">
                {project?.department?.name || 'General'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-4">
              {project?.projectName || "Unnamed Project"}
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-xl">
              {project?.description || "No project overview available."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl font-bold transition-all ${isEditing ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25'}`}
            >
              {isEditing ? 'Cancel Edit' : <><Edit size={16} /> Edit Project</>}
            </button>
            {!isEditing && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
              >
                <Trash2 size={16} />
                Delete Project
              </button>
            )}
          </div>
        </motion.header>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          
          {isEditing ? (
            <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={20} className="text-indigo-500" /> Edit Project Configuration</h2>
              
              <form onSubmit={handleUpdate} className="space-y-8">
                
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full lg:w-64">
                    <label className="text-xs font-bold tracking-wider uppercase text-slate-400 self-start lg:self-center">Client Logo</label>
                    <input type="file" accept="image/*" style={{ display: "none" }} ref={logoInputRef} onChange={handleLogoFileSelected} />
                    <div 
                      onClick={handleLogoClick}
                      className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                        isUploadingLogo ? 'border-slate-300 bg-slate-50' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400'
                      }`}
                    >
                      {project?.logo ? (
                        <img src={project.logo} alt="Client Logo" className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center text-indigo-400 gap-2">
                          <UploadCloud size={32} />
                          <span className="text-sm font-semibold">Upload Image</span>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={handleLogoClick} disabled={isUploadingLogo} className="text-xs font-semibold px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors w-full">
                      {isUploadingLogo ? "Uploading..." : project?.logo ? "Replace Logo" : "Select Logo"}
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Project Title / Name</label>
                      <input type="text" name="projectName" required value={formData.projectName} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. Q3 Social Media Campaign" />
                    </div>
                    <div className="flex flex-col space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Project Description</label>
                      <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" rows="3" placeholder="Provide clear scopes..." />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Frequency</label>
                      <select name="frequency" value={formData.frequency} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Assign Managers <span className="text-slate-400 font-normal">(Ctrl/Cmd for multiple)</span></label>
                      <select multiple value={formData.assignTo} onChange={handleAssigneeChange} className="w-full h-24 p-2 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                        <option value="SM-MGR-001">Lovprit (Social Media)</option>
                        <option value="CC-MGR-001">Abhijeet (Content & Creative)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><User size={14} className="inline text-indigo-500 mr-1"/> Client Name</label>
                    <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><MapPin size={14} className="inline text-indigo-500 mr-1"/> Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><Phone size={14} className="inline text-indigo-500 mr-1"/> Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><Calendar size={14} className="inline text-indigo-500 mr-1"/> Project Start Date</label>
                    <input type="date" name="projectStartDate" value={formData.projectStartDate} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><Calendar size={14} className="inline text-indigo-500 mr-1"/> Contract Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><Calendar size={14} className="inline text-indigo-500 mr-1"/> Target End Date</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600"><Calendar size={14} className="inline text-indigo-500 mr-1"/> Renewal Date</label>
                    <input type="date" name="renewalDate" value={formData.renewalDate} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4">Social Media Credentials & Links</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600"><LinkIcon size={14} className="inline text-indigo-500 mr-1"/> Reference Link</label>
                      <input type="url" name="referenceLink" value={formData.referenceLink} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600"><LinkIcon size={14} className="inline text-indigo-500 mr-1"/> Taste Link</label>
                      <input type="url" name="tasteLink" value={formData.tasteLink} onChange={handleInputChange} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white/50 text-sm font-medium outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Facebook Email</label>
                        <input type="text" name="fbEmail" value={formData.fbEmail} onChange={handleInputChange} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                      </div>
                      {renderPasswordField("Facebook Password", "fbPassword", formData.fbPassword, showFbPassword, setShowFbPassword, "Password", Globe)}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Instagram Email</label>
                        <input type="text" name="instaEmail" value={formData.instaEmail} onChange={handleInputChange} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                      </div>
                      {renderPasswordField("Instagram Password", "instaPassword", formData.instaPassword, showInstaPassword, setShowInstaPassword, "Password", Globe)}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">YouTube Email</label>
                        <input type="text" name="youtubeEmail" value={formData.youtubeEmail} onChange={handleInputChange} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                      </div>
                      {renderPasswordField("YouTube Password", "youtubePassword", formData.youtubePassword, showYoutubePassword, setShowYoutubePassword, "Password", Globe)}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">LinkedIn Email</label>
                        <input type="text" name="linkedinEmail" value={formData.linkedinEmail} onChange={handleInputChange} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                      </div>
                      {renderPasswordField("LinkedIn Password", "linkedinPassword", formData.linkedinPassword, showLinkedinPassword, setShowLinkedinPassword, "Password", Globe)}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-4">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Twitter Email</label>
                        <input type="text" name="twitterEmail" value={formData.twitterEmail} onChange={handleInputChange} className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm outline-none" />
                      </div>
                      {renderPasswordField("Twitter Password", "twitterPassword", formData.twitterPassword, showTwitterPassword, setShowTwitterPassword, "Password", Globe)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button type="submit" className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all">
                    <Save size={18} /> Save Project Details
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <>
              {/* DISPLAY MODE */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Core Info */}
                <div className="lg:col-span-2 space-y-6">
                  
                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 p-6 md:p-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {project?.logo ? <img src={project.logo} alt="Logo" className="w-full h-full object-contain" /> : <User size={32} className="text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Client Identity</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client Name</p>
                            <p className="font-medium text-slate-900">{project?.clientName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                            <p className="font-medium text-slate-900 flex items-center gap-1"><MapPin size={14} className="text-indigo-500"/> {project?.location || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Phone</p>
                            <p className="font-medium text-slate-900 flex items-center gap-1"><Phone size={14} className="text-indigo-500"/> {project?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Frequency</p>
                            <p className="font-medium text-slate-900 capitalize">{project?.frequency || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 p-6 md:p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-indigo-500"/> Key Dates & Milestones</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Project Start</p>
                        <p className="font-bold text-slate-900">{project?.projectStartDate ? new Date(project.projectStartDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contract Start</p>
                        <p className="font-bold text-slate-900">{project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Contract End</p>
                        <p className="font-bold text-slate-900">{project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Renewal</p>
                        <p className="font-bold text-slate-900 text-indigo-600">{project?.renewalDate ? new Date(project.renewalDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Stakeholders & Links */}
                <div className="space-y-6">
                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-indigo-500"/> Campaign Links</h3>
                    <div className="space-y-3">
                      <a href={project?.referenceLink || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Reference Link</span>
                        <LinkIcon size={14} className="text-slate-400" />
                      </a>
                      <a href={project?.tasteLink || '#'} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">Taste Link</span>
                        <LinkIcon size={14} className="text-slate-400" />
                      </a>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><User size={16} className="text-indigo-500"/> Stakeholders</h3>
                    {project?.assignments?.length > 0 ? (
                      <div className="space-y-3">
                        {project.assignments.map(assignment => (
                          <div key={assignment.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {assignment.manager?.name?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">{assignment.manager?.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">{assignment.manager?.position || 'Manager'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-4">No managers assigned.</p>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Bottom Section: Social Credentials */}
              <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100/60 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={20} className="text-indigo-500"/> Social Media Credentials</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                  {[
                    { name: 'Facebook', email: project?.fbEmail, pass: project?.fbPassword, Icon: Globe, show: showFbPassword, setShow: setShowFbPassword, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { name: 'Instagram', email: project?.instaEmail, pass: project?.instaPassword, Icon: Globe, show: showInstaPassword, setShow: setShowInstaPassword, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { name: 'YouTube', email: project?.youtubeEmail, pass: project?.youtubePassword, Icon: Globe, show: showYoutubePassword, setShow: setShowYoutubePassword, color: 'text-red-600', bg: 'bg-red-50' },
                    { name: 'LinkedIn', email: project?.linkedinEmail, pass: project?.linkedinPassword, Icon: Globe, show: showLinkedinPassword, setShow: setShowLinkedinPassword, color: 'text-blue-700', bg: 'bg-blue-50' },
                    { name: 'Twitter / X', email: project?.twitterEmail, pass: project?.twitterPassword, Icon: Globe, show: showTwitterPassword, setShow: setShowTwitterPassword, color: 'text-slate-800', bg: 'bg-slate-100' },
                  ].map((cred, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cred.bg} ${cred.color}`}>
                          <cred.Icon size={16} />
                        </div>
                        <span className="font-bold text-sm text-slate-800">{cred.name}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Email / Username</p>
                          <p className="text-xs font-medium text-slate-800 truncate" title={cred.email}>{cred.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Password</p>
                          <div className="flex items-center justify-between group">
                            <p className="text-xs font-medium text-slate-800 font-mono tracking-wider">
                              {cred.show ? (cred.pass || '—') : '••••••••'}
                            </p>
                            {cred.pass && (
                              <button onClick={() => cred.setShow(!cred.show)} className="text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                {cred.show ? <EyeOff size={14}/> : <Eye size={14}/>}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HRManagerView;
