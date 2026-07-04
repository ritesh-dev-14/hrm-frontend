import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';

const HRManagerView = ({ projectId }) => {
  const navigate = useNavigate();

  // State Management
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Password Visibility States
  const [showFbPassword, setShowFbPassword] = useState(false);
  const [showInstaPassword, setShowInstaPassword] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    endDate: '',
    frequency: '',
    renewalDate: '',
    assignTo: [] 
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
          assignTo: projectData?.assignments?.map(a => a?.manager?.employeeId).filter(Boolean) || []
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        projectName: formData.projectName,
        description: formData.description,
        frequency: formData.frequency,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        renewalDate: formData.renewalDate ? new Date(formData.renewalDate).toISOString() : null,
        assignTo: formData.assignTo
      };

      const config = { headers: { 'Content-Type': 'application/json' } };

      try {
        await API.put(`/api/projects/${projectId}`, payload, config);
      } catch (putError) {
        if (putError.response?.status === 404) {
          console.warn("PUT route returned 404, attempting fallback to PATCH method...");
          await API.patch(`/api/projects/${projectId}`, payload, config);
        } else {
          throw putError;
        }
      }
      
      setIsEditing(false);
      fetchProjectDetails(); 
      alert('Project updated successfully!');
    } catch (err) {
      console.error("Update request failure diagnostic logs:", err);
      alert(err.response?.data?.message || err.message || 'Failed to update project. Verify backend route methods.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await API.delete(`/api/projects/${projectId}`);
        alert('Project deleted successfully.');
        navigate('/projects'); 
      } catch (err) {
        alert(err.response?.data?.message || err.message || 'Failed to delete project.');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b', marginTop: '16px', fontSize: '14px', fontWeight: '500' }}>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorCard}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <svg style={{ width: '20px', height: '20px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <strong style={{ fontSize: '15px' }}>Error Encountered</strong>
          </div>
          <p style={{ margin: '8px 0 0 30px', fontSize: '14px', lineHeight: '1.5' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Upper Navigation Metadata Badge */}
      <div style={styles.metaRow}>
        <div style={styles.badgeGroup}>
          <span style={styles.idBadge}>ID: {project?.id}</span>
          <span style={styles.deptBadge}>{project?.department?.name || 'General'}</span>
        </div>
        <div style={styles.actionButtonGroup}>
          <button 
            type="button"
            style={isEditing ? styles.cancelBtn : styles.editBtn} 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Project'}
          </button>
          {!isEditing && (
            <button type="button" style={styles.deleteBtn} onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Header Action Area */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={styles.title}>{project?.projectName || 'Unnamed Project'}</h1>
      </div>

      {isEditing ? (
        /* ================= EDIT MODE FORM ================= */
        <form onSubmit={handleUpdate} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Project Title / Name</label>
            <input
              type="text"
              name="projectName"
              required
              value={formData.projectName}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="e.g. Q3 Social Media Campaign"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Project Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              style={styles.textarea}
              rows="4"
              placeholder="Provide clear scopes and requirements..."
            />
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Renewal Date</label>
              <input
                type="date"
                name="renewalDate"
                value={formData.renewalDate}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Assign Managers 
              <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>(Hold Ctrl/Cmd to select multiple)</span>
            </label>
            <select
              multiple
              value={formData.assignTo}
              onChange={handleAssigneeChange}
              style={{ ...styles.input, height: '120px', padding: '8px' }}
            >
              <option value="SM-MGR-001">Lovprit (Social Media Manager)</option>
              <option value="CC-MGR-001">Abhijeet (Content & Creative Manager)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button type="submit" style={styles.saveBtn}>Save Project Details</button>
          </div>
        </form>
      ) : (
        /* ================= DISPLAY VIEW MODE ================= */
        <div>
          {/* Project Overview */}
          <div style={styles.descriptionBox}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <svg style={{ width: '16px', height: '16px', color: '#475569' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h4 style={{ margin: 0, color: '#1e293b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Overview</h4>
            </div>
            <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: '1.6', fontWeight: '400' }}>{project?.description || 'No descriptive overview provided for this active timeline.'}</p>
          </div>

          {/* Client & Core Info Section */}
          <h3 style={styles.sectionHeading}>Client & Contact Information</h3>
          <div style={styles.detailsGrid}>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <div>
                <span style={styles.tileLabel}>Client Name</span>
                <span style={styles.tileValue}>{project?.clientName || 'N/A'}</span>
              </div>
            </div>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V6.265M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <span style={styles.tileLabel}>Location / Country</span>
                <span style={styles.tileValue}>{project?.location || 'N/A'}</span>
              </div>
            </div>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <div>
                <span style={styles.tileLabel}>Phone Number</span>
                <span style={styles.tileValue}>{project?.phone || 'N/A'}</span>
              </div>
            </div>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6H16" /></svg>
              <div>
                <span style={styles.tileLabel}>Update Frequency</span>
                <span style={styles.tileValue}>{project?.frequency}</span>
              </div>
            </div>
          </div>

          {/* Timeline Dates Grid */}
          <h3 style={{...styles.sectionHeading, marginTop: '32px'}}>Project Milestone Deadlines</h3>
          <div style={styles.detailsGrid}>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <div>
                <span style={styles.tileLabel}>Project Start Date</span>
                <span style={styles.tileValue}>
                  {project?.projectStartDate ? new Date(project.projectStartDate).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}
                </span>
              </div>
            </div>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <span style={styles.tileLabel}>Contract Start Date</span>
                <span style={styles.tileValue}>
                  {project?.startDate ? new Date(project.startDate).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}
                </span>
              </div>
            </div>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <span style={styles.tileLabel}>Target End Date</span>
                <span style={styles.tileValue}>
                  {project?.endDate ? new Date(project.endDate).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}
                </span>
              </div>
            </div>
            <div style={styles.infoTile}>
              <svg style={styles.tileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <div>
                <span style={styles.tileLabel}>Renewal Review</span>
                <span style={styles.tileValue}>
                  {project?.renewalDate ? new Date(project.renewalDate).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Social Media Credentials Section */}
          <h3 style={{...styles.sectionHeading, marginTop: '32px'}}>Social Media Accounts Credentials</h3>
          <div style={styles.credGrid}>
            {/* Facebook Card */}
            <div style={styles.credCard}>
              <div style={styles.credHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{...styles.platformIconWrapper, backgroundColor: '#e2eafc'}}>
                    <svg style={{ width: '16px', height: '16px', color: '#1877f2' }} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <strong style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>Facebook Channel</strong>
                </div>
              </div>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Email / User:</span>
                <span style={styles.credValue}>{project?.fbEmail || 'Not Provided'}</span>
              </div>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Password:</span>
                <div style={styles.passWrapper}>
                  <span style={styles.credValue}>
                    {showFbPassword ? project?.fbPassword || 'N/A' : '••••••••••••'}
                  </span>
                  {project?.fbPassword && (
                    <button type="button" onClick={() => setShowFbPassword(!showFbPassword)} style={styles.eyeButton} title={showFbPassword ? "Hide password" : "Show password"}>
                      {showFbPassword ? (
                        <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      ) : (
                        <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instagram Card */}
            <div style={styles.credCard}>
              <div style={styles.credHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{...styles.platformIconWrapper, backgroundColor: '#fce8f3'}}>
                    <svg style={{ width: '16px', height: '16px', color: '#e1306c' }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </div>
                  <strong style={{ color: '#0f172a', fontSize: '14px', fontWeight: '600' }}>Instagram Handle</strong>
                </div>
              </div>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Email / User:</span>
                <span style={styles.credValue}>{project?.instaEmail || 'Not Provided'}</span>
              </div>
              <div style={styles.credRow}>
                <span style={styles.credLabel}>Password:</span>
                <div style={styles.passWrapper}>
                  <span style={styles.credValue}>
                    {showInstaPassword ? project?.instaPassword || 'N/A' : '••••••••••••'}
                  </span>
                  {project?.instaPassword && (
                    <button type="button" onClick={() => setShowInstaPassword(!showInstaPassword)} style={styles.eyeButton} title={showInstaPassword ? "Hide password" : "Show password"}>
                      {showInstaPassword ? (
                        <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      ) : (
                        <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Management Assignments */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={styles.sectionHeading}>Assigned Team Managers</h3>
            {project?.assignments?.length > 0 ? (
              <div style={styles.managerGrid}>
                {project.assignments.map((assignment) => (
                  <div key={assignment.id} style={styles.managerCard}>
                    <div style={styles.avatar}>{assignment.manager?.name?.charAt(0) || 'M'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.mgrName}>{assignment.manager?.name}</div>
                      <div style={styles.mgrRole}>{assignment.manager?.position || 'Project Manager Lead'}</div>
                      <div style={styles.mgrId}>ID: {assignment.manager?.employeeId}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No management structures assigned yet.</div>
            )}
          </div>

          {/* Footer Metadata */}
          <div style={styles.footerContainer}>
            <span>Created by: <strong>{project?.createdBy?.name || 'System'}</strong> ({project?.createdBy?.role || 'Admin'})</span>
            <span>Logs: Updated at {project?.updatedAt ? new Date(project.updatedAt).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* Modern Premium Dashboard Styling */
const styles = {
  container: { maxWidth: '1000px', margin: '30px auto', padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)' },
  centerContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', backgroundColor: '#f8fafc' },
  metaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' },
  badgeGroup: { display: 'flex', gap: '10px', alignItems: 'center' },
  idBadge: { backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', fontFamily: 'SFMono-Regular, Consolas, monospace', border: '1px solid #e2e8f0' },
  deptBadge: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.03em', textTransform: 'uppercase', border: '1px solid #dbeafe' },
  title: { fontSize: '32px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: '1.2' },
  actionButtonGroup: { display: 'flex', gap: '12px' },
  
  editBtn: { backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s ease' },
  cancelBtn: { backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  deleteBtn: { backgroundColor: '#ffffff', color: '#b91c1c', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  saveBtn: { backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  
  descriptionBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '32px' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  infoTile: { display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' },
  tileIcon: { width: '18px', height: '18px', color: '#64748b', flexShrink: 0, marginTop: '2px' },
  tileLabel: { display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' },
  tileValue: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px', wordBreak: 'break-word' },
  
  sectionHeading: { fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' },
  
  credGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' },
  credCard: { padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' },
  credHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  platformIconWrapper: { width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  credRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' },
  credLabel: { color: '#64748b', fontWeight: '500' },
  credValue: { color: '#0f172a', fontWeight: '600', fontFamily: 'SFMono-Regular, Consolas, monospace' },
  passWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  eyeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#64748b' },
  eyeIcon: { width: '16px', height: '16px' },

  managerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
  managerCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '13px', border: '1px solid #e2e8f0', flexShrink: 0 },
  mgrName: { fontSize: '14px', fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  mgrRole: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  mgrId: { fontSize: '11px', color: '#94a3b8', fontFamily: 'SFMono-Regular, Consolas, monospace', marginTop: '4px' },
  emptyState: { padding: '32px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '13px' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.02em' },
  input: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none', transition: 'border-color 0.15s ease-in-out' },
  textarea: { padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  
  footerContainer: { marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' },
  errorCard: { padding: '20px 24px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', maxWidth: '500px' },
  spinner: { width: '28px', height: '28px', border: '2px solid #e2e8f0', borderTop: '2px solid #0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }
};

export default HRManagerView;