import React, { useState, useEffect, useRef } from "react";
import API from "../../../services/api";

// ---- small helpers for array<->string fields (referenceLinks / submissionLinks) ----
const arrayToString = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const stringToArray = (str) =>
  (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const EMPTY_DAY_SHAPE = {
  reelType: "NONE",
  postType: "NONE",
  title: "",
  videoType: "HORIZONTAL",
  referenceLinks: [],
  script: "",
  description: "",
};

const RESPONSIVE_CSS = `
  .smm-container {
    max-width: 1280px;
    margin: 32px auto;
    padding: 24px;
    box-sizing: border-box;
  }
  .smm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 32px;
  }
  .smm-logo-section {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 32px;
  }
  .smm-details-grid,
  .smm-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
  }
  .smm-manager-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  .smm-drawer-config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  .smm-drawer-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: flex-end;
    z-index: 9999;
  }
  .smm-drawer-sheet {
    width: 100%;
    max-width: 1100px;
    background-color: #ffffff;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: -10px 0 35px rgba(0,0,0,0.1);
  }
  .smm-drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 32px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .smm-table-wrapper {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
  }
  .smm-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
  }

  @media (max-width: 1024px) {
    .smm-drawer-sheet {
      max-width: 90%;
    }
  }

  @media (max-width: 768px) {
    .smm-container {
      margin: 0;
      padding: 16px;
    }
    .smm-header {
      flex-direction: column;
      align-items: stretch;
    }
    .smm-header button {
      width: 100%;
      justify-content: center;
    }
    .smm-logo-section {
      flex-direction: column;
      text-align: center;
      align-items: center;
    }
    .smm-logo-meta {
      align-items: center;
    }
    .smm-logo-meta button {
      align-self: center !important;
    }
    .smm-drawer-sheet {
      max-width: 100%;
    }
    .smm-drawer-footer {
      flex-direction: column-reverse;
      padding: 16px;
    }
    .smm-drawer-footer button {
      width: 100%;
    }
    .smm-drawer-form-body {
      padding: 16px !important;
    }
    .smm-table th, .smm-table td {
      padding: 10px 8px !important;
    }
  }
`;

const SMMManagerView = ({ projectId }) => {
  // Core Component State
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingSheet, setIsSubmittingSheet] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  // Historical Monthly Calendars State
  const [monthlySheets, setMonthlySheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [isPatchingDay, setIsPatchingDay] = useState(false);

  // NEW: tracks which sheet's day-level detail (submission links etc.) is currently being fetched
  const [loadingCalendarId, setLoadingCalendarId] = useState(null);

  const [showFbPassword, setShowFbPassword] = useState(false);
  const [showInstaPassword, setShowInstaPassword] = useState(false);
  const [showYoutubePassword, setShowYoutubePassword] = useState(false);
  const [showLinkedinPassword, setShowLinkedinPassword] = useState(false);
  const [showTwitterPassword, setShowTwitterPassword] = useState(false);

  // UI Control States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Secure Credentials Form State
  const [formData, setFormData] = useState({
    clientName: "",
    location: "",
    phone: "",
    fbEmail: "",
    fbPassword: "",
    instaEmail: "",
    instaPassword: "",
    youtubeEmail: "",
    youtubePassword: "",
    linkedinEmail: "",
    linkedinPassword: "",
    twitterEmail: "",
    twitterPassword: "",
    reference: "",
    taste: "",
    instaUsername: "",
    facebookUsername: "",
    projectStartDate: "",
  });

  const [newReference, setNewReference] = useState("");

  // Monthly Tracker Strategy Sheet Form State
  const [sheetMeta, setSheetMeta] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalReels: "",
    totalPosts: "",
    totalReelsUploaded: "",
    totalPostsUploaded: "",
    moodBoardLink: "",
  });

  const [sheetDays, setSheetDays] = useState([]);

  // Utility helper to guarantee all days of a month exist for rendering/editing
  const padCalendarDays = (calendar) => {
    if (!calendar) return null;
    const { month, year, days = [] } = calendar;
    const daysInMonth = new Date(year, month, 0).getDate();
    const completeDays = [];

    const existingDaysMap = {};
    days.forEach((day) => {
      if (day.date) {
        const datePart = day.date.split("T")[0];
        existingDaysMap[datePart] = day;
      }
    });

    for (let dayIndex = 1; dayIndex <= daysInMonth; dayIndex++) {
      const dayString = String(dayIndex).padStart(2, "0");
      const monthString = String(month).padStart(2, "0");
      const dateKey = `${year}-${monthString}-${dayString}`;
      const calculatedISODate = `${dateKey}T00:00:00.000Z`;

      if (existingDaysMap[dateKey]) {
        const matchingDay = existingDaysMap[dateKey];
        completeDays.push({
          ...EMPTY_DAY_SHAPE,
          // Extract dynamic metrics synced via the Shoot Workspace Review pipelines
          submissionLinks: matchingDay.submissionLinks || [],
          contentCreativeSubmissionLinks: matchingDay.contentCreativeSubmissionLinks || [],
          creativeSubmissionLink: matchingDay.creativeSubmissionLink || null,
          submissionStatus: matchingDay.status || matchingDay.submissionStatus || null,
          reviewedAt: matchingDay.reviewedAt || null,
          rejectionReason: matchingDay.rejectionReason || null,
          createdAt: matchingDay.createdAt || null,
          ...matchingDay,
        });
      } else {
        completeDays.push({
          date: calculatedISODate,
          ...EMPTY_DAY_SHAPE,
          submissionLinks: [],
          contentCreativeSubmissionLinks: [],
          creativeSubmissionLink: null,
          submissionStatus: null,
          reviewedAt: null,
          rejectionReason: null,
          createdAt: null,
        });
      }
    }
    return { ...calendar, days: completeDays };
  };

  // Auto-generate empty structural layout for the dynamic creation workspace
  useEffect(() => {
    if (!sheetMeta.month || !sheetMeta.year) return;

    const daysInMonth = new Date(sheetMeta.year, sheetMeta.month, 0).getDate();
    const temporaryDaysArray = [];

    for (let dayIndex = 1; dayIndex <= daysInMonth; dayIndex++) {
      const dayString = String(dayIndex).padStart(2, "0");
      const monthString = String(sheetMeta.month).padStart(2, "0");
      const calculatedISODate = `${sheetMeta.year}-${monthString}-${dayString}T00:00:00.000Z`;

      temporaryDaysArray.push({
        date: calculatedISODate,
        ...EMPTY_DAY_SHAPE,
      });
    }
    setSheetDays(temporaryDaysArray);
  }, [sheetMeta.month, sheetMeta.year]);

  // Fetch Historical Calendars (list view — summary only)
  const fetchMonthlySheets = async () => {
    try {
      setSheetsLoading(true);
      const response = await API.get(
        `/api/projects/${projectId}/monthly-sheets`,
      );
      const resData = response.data ? response.data : response;
      if (resData && resData.success) {
        setMonthlySheets(resData.data || []);
      }
    } catch (err) {
      if (err.response?.status !== 403) {
        console.error("Error pulling history sheets:", err);
      }
    } finally {
      setSheetsLoading(false);
    }
  };

  // NEW: Fetch full day-level detail for a single monthly sheet (this is what carries
  // the real submission link values per day) and set it as the active calendar.
  const fetchMonthlySheetDetail = async (sheetId) => {
    if (!sheetId) return;
    try {
      setLoadingCalendarId(sheetId);
      const response = await API.get(
        `/api/projects/${projectId}/monthly-sheets/${sheetId}`,
      );
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        setSelectedCalendar(padCalendarDays(resData.data));
      } else {
        alert(
          resData?.message || "Failed to load day-level calendar details.",
        );
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Error fetching monthly sheet day-level details.",
      );
    } finally {
      setLoadingCalendarId(null);
    }
  };

  // Fetch Project Core Parameters Context Tree
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
          clientName: projectData?.clientName || "",
          location: projectData?.location || "",
          phone: projectData?.phone || "",
          fbEmail: projectData?.fbEmail || "",
          fbPassword: projectData?.fbPassword || "",
          instaEmail: projectData?.instaEmail || "",
          instaPassword: projectData?.instaPassword || "",
          youtubeEmail: projectData?.youtubeEmail || "",
          youtubePassword: projectData?.youtubePassword || "",
          linkedinEmail: projectData?.linkedinEmail || "",
          linkedinPassword: projectData?.linkedinPassword || "",
          twitterEmail: projectData?.twitterEmail || "",
          twitterPassword: projectData?.twitterPassword || "",
          reference: arrayToString(projectData?.reference) || "",
          taste: arrayToString(projectData?.taste) || "",
          instaUsername: projectData?.instaUsername || "",
          facebookUsername: projectData?.facebookUsername || "",
          projectStartDate: projectData?.projectStartDate
            ? projectData.projectStartDate.split("T")[0]
            : "",
        });
      } else {
        setError(
          resData?.message || "Failed to capture core project parameters.",
        );
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access Denied: You are not assigned to this project. Please ask HR to assign you.");
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Error communicating with infrastructure.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchMonthlySheets();
    } else {
      setError(
        "No valid Project ID passed to SMM view module context wrapper.",
      );
      setLoading(false);
    }
  }, [projectId]);

  // State Change Tracking Interceptors
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setSheetMeta((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayFieldChange = (index, fieldName, value) => {
    const updatedDays = [...sheetDays];
    updatedDays[index] = { ...updatedDays[index], [fieldName]: value };
    setSheetDays(updatedDays);
  };

  const handleSelectedDayChange = (dayIndex, fieldName, value) => {
    if (!selectedCalendar) return;
    const updatedDays = [...selectedCalendar.days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [fieldName]: value };
    setSelectedCalendar((prev) => ({ ...prev, days: updatedDays }));
  };

  // API Call: PATCH Project Base Operational Data (plain JSON)
  const handlePatchDetails = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);

      const payload = {
        clientName: formData.clientName.trim() || null,
        location: formData.location.trim() || null,
        phone: formData.phone.trim() || null,
        fbEmail: formData.fbEmail.trim() || null,
        fbPassword: formData.fbPassword || null,
        instaEmail: formData.instaEmail.trim() || null,
        instaPassword: formData.instaPassword || null,
        youtubeEmail: formData.youtubeEmail.trim() || null,
        youtubePassword: formData.youtubePassword || null,
        linkedinEmail: formData.linkedinEmail.trim() || null,
        linkedinPassword: formData.linkedinPassword || null,
        twitterEmail: formData.twitterEmail.trim() || null,
        twitterPassword: formData.twitterPassword || null,
        reference: stringToArray(formData.reference),
        taste: stringToArray(formData.taste),
        instaUsername: formData.instaUsername.trim() || null,
        facebookUsername: formData.facebookUsername.trim() || null,
        projectStartDate: formData.projectStartDate
          ? new Date(formData.projectStartDate).toISOString()
          : null,
      };

      const response = await API.patch(`/api/projects/${projectId}`, payload);
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {

        // --- Sync to Google Sheet ---
        try {
          const dateStr = formData.projectStartDate
            ? new Date(formData.projectStartDate).toLocaleDateString()
            : "";

          const sheetPayload = {
            clientName: formData.clientName || "",
            clientLocation: formData.location || "",
            contactNumber: formData.phone || "",
            projectExecutionDate: dateStr,
            reference: formData.reference || "",
            taste: formData.taste || "",
            instaUsername: formData.instaUsername || "",
            facebookUsername: formData.facebookUsername || "",
            facebookEmail: formData.fbEmail || "",
            facebookPassword: formData.fbPassword || "",
            instagramEmail: formData.instaEmail || "",
            instagramPassword: formData.instaPassword || "",
            youtubeEmail: formData.youtubeEmail || "",
            youtubePassword: formData.youtubePassword || "",
            linkedinEmail: formData.linkedinEmail || "",
            linkedinPassword: formData.linkedinPassword || "",
            twitterEmail: formData.twitterEmail || "",
            twitterPassword: formData.twitterPassword || ""
          };

          fetch("https://script.google.com/macros/s/AKfycbzXpksZ0y4Prof1D4KMHoR2n-5jTMvSIC5GOtqooR9j1EBqahZHrREDTx5AK1hXA708IA/exec", {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain",
            },
            body: JSON.stringify(sheetPayload),
          }).catch(err => console.error("Google Sheet sync failed in background", err));
        } catch (sheetErr) {
          console.error("Failed to sync to Google Sheet", sheetErr);
        }
        // -----------------------------------

        alert(
          "Credentials and campaign operational details linked successfully!",
        );
        fetchProjectDetails();
      } else {
        alert(resData?.message || "Update request failed validation rules.");
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Failed to submit patch operational configuration.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // API Call: Upload / replace the project logo
  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const uploadForm = new FormData();
      uploadForm.append("logo", file);

      const response = await API.patch(
        `/api/projects/${projectId}/logo`,
        uploadForm,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        fetchProjectDetails();
      } else {
        alert(resData?.message || "Logo upload failed validation rules.");
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Failed to upload project logo.",
      );
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // API Call: POST Dynamic Monthly Planning Sheet Data
  const handlePostMonthlySheet = async (e) => {
    e.preventDefault();

    const activeDaysPayload = sheetDays.filter(
      (day) =>
        day.reelType !== "NONE" ||
        day.postType !== "NONE" ||
        (day.title && day.title.trim() !== "") ||
        (day.referenceLinks && day.referenceLinks.length > 0) ||
        day.script.trim() !== "" ||
        day.description.trim() !== "",
    );

    if (activeDaysPayload.length === 0) {
      alert(
        "Validation Error: Please configure details for at least one day inside the Tactical Matrix before archiving.",
      );
      return;
    }

    try {
      setIsSubmittingSheet(true);

      const payload = {
        month: parseInt(sheetMeta.month, 10),
        year: parseInt(sheetMeta.year, 10),
        totalReels: sheetMeta.totalReels
          ? parseInt(sheetMeta.totalReels, 10)
          : 0,
        totalPosts: sheetMeta.totalPosts
          ? parseInt(sheetMeta.totalPosts, 10)
          : 0,
        totalReelsUploaded: sheetMeta.totalReelsUploaded
          ? parseInt(sheetMeta.totalReelsUploaded, 10)
          : 0,
        totalPostsUploaded: sheetMeta.totalPostsUploaded
          ? parseInt(sheetMeta.totalPostsUploaded, 10)
          : 0,
        moodBoardLink: sheetMeta.moodBoardLink.trim() || null,
        days: activeDaysPayload.map((day) => ({
          date: day.date,
          // Normalise values: backend expects either "SHOOT", "AI" or null for postType/reelType
          reelType: day.reelType && day.reelType !== "NONE" ? day.reelType : null,
          postType: day.postType && day.postType !== "NONE" ? day.postType : null,
          title: day.title || "",
          videoType: day.videoType || "HORIZONTAL",
          referenceLinks: day.referenceLinks || [],
          script: day.script,
          description: day.description,
        })),
      };

      const response = await API.post(
        `/api/projects/${projectId}/monthly-sheets`,
        payload
      );
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        alert(
          `Monthly strategy sheet compiled successfully for period ${sheetMeta.month}/${sheetMeta.year}!`,
        );
        setIsDrawerOpen(false);
        fetchMonthlySheets();
        setSheetMeta((prev) => ({
          ...prev,
          totalReels: "",
          totalPosts: "",
          totalReelsUploaded: "",
          totalPostsUploaded: "",
          moodBoardLink: "",
        }));
      } else {
        alert(
          resData?.message || "Monthly configuration sheet processing failed.",
        );
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Error occurred handling sheet payload schema validation.",
      );
    } finally {
      setIsSubmittingSheet(false);
    }
  };

  const handleUpdateExistingCalendar = async () => {
    if (!selectedCalendar) return;
    try {
      setIsPatchingDay(true);

      const activeDays = selectedCalendar.days.filter(
        (day) =>
          (day.reelType && day.reelType !== "NONE") ||
          (day.postType && day.postType !== "NONE") ||
          (day.title && day.title.trim() !== "") ||
          (day.referenceLinks && day.referenceLinks.length > 0) ||
          (day.script && day.script.trim() !== "") ||
          (day.description && day.description.trim() !== ""),
      );

      const cleanedDays = activeDays.map((day) => {
        const dayObj = { date: day.date };

        if (day.reelType && day.reelType !== "NONE") dayObj.reelType = day.reelType;
        if (day.postType && day.postType !== "NONE") dayObj.postType = day.postType;
        if (day.title && day.title.trim() !== "") dayObj.title = day.title;
        if (day.videoType) dayObj.videoType = day.videoType;
        if (day.referenceLinks && day.referenceLinks.length > 0)
          dayObj.referenceLinks = day.referenceLinks;
        if (day.script && day.script.trim() !== "") dayObj.script = day.script;
        if (day.description && day.description.trim() !== "")
          dayObj.description = day.description;

        return dayObj;
      });

      const payload = { days: cleanedDays };
      const response = await API.patch(
        `/api/projects/${projectId}/monthly-sheets/${selectedCalendar.id}`,
        payload
      );
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        alert("Tactical timeline entries synchronized successfully!");
        fetchMonthlySheets();
        // Re-pull the day-level detail so submission links stay accurate post-save
        fetchMonthlySheetDetail(selectedCalendar.id);
      } else {
        alert(
          resData?.message ||
          "Operational framework update failed validations.",
        );
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        "Network exceptions occurring parsing structural elements.",
      );
    } finally {
      setIsPatchingDay(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: "#64748b", marginTop: "16px", fontSize: "14px", fontWeight: "500" }}>
          Syncing workspace environment metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorCard}>
          <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
            Module Configuration Sync Failed
          </strong>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>{error}</p>
        </div>
      </div>
    );
  }

  const renderPasswordField = (label, name, value, visible, setVisible, placeholder) => (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label} <span style={styles.optionalTag}>(optional)</span></label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleInputChange}
          style={{ ...styles.input, paddingRight: "45px" }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={styles.eyeToggleBtn}
        >
          {visible ? "Hide" : "View"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="smm-container" style={styles.container}>
      <style>{RESPONSIVE_CSS}</style>

      {/* Workspace Header Block */}
      <div style={styles.metaRow}>
        <span style={styles.idBadge}>
          PROJECT ID: {project?.id?.toUpperCase().slice(0, 8)}
        </span>
        <span style={styles.deptBadge}>
          {project?.department?.name || "Social Media"}
        </span>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={logoInputRef}
        onChange={handleLogoFileSelected}
        style={{ display: "none" }}
      />

      <div className="smm-header">
        <h1 style={styles.title}>
          {project?.projectName || "Social Media Project Profile"}
        </h1>

        <button
          onClick={() => setIsDrawerOpen(true)}
          style={styles.openDrawerBtn}
        >
          <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Create Content Calendar
        </button>
      </div>

      {/* Project Logo Block */}
      <div className="smm-logo-section">
        <div style={styles.logoBox} onClick={handleLogoClick}>
          {project?.logo ? (
            <img src={project.logo} alt="Client logo" style={styles.logoImageLarge} />
          ) : (
            <span style={styles.logoPlaceholderLarge}>No logo uploaded</span>
          )}
        </div>
        <div className="smm-logo-meta" style={styles.logoMeta}>
          <span style={styles.logoLabel}>Client Logo</span>
          <p style={styles.logoHint}>PNG or JPG, click the tile to update.</p>
          <button
            type="button"
            onClick={handleLogoClick}
            disabled={isUploadingLogo}
            style={isUploadingLogo ? styles.saveBtnDisabled : styles.logoUploadBtn}
          >
            {isUploadingLogo ? "Uploading..." : project?.logo ? "Replace Logo" : "Upload Logo"}
          </button>
        </div>
      </div>

      {/* Strategy Summary */}
      <div style={styles.descriptionBox}>
        <h4 style={styles.sectionSub}>Project Description</h4>
        <p style={{ margin: 0, color: "#334155", lineHeight: "1.6", fontSize: "14px" }}>
          {project?.description || "No strategic summary available."}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="smm-details-grid" style={{ marginBottom: "32px" }}>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Execution Cycle</span>
          <span style={styles.tileValue}>{project?.frequency || "N/A"}</span>
        </div>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Project Start</span>
          <span style={styles.tileValue}>
            {project?.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}
          </span>
        </div>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Project End</span>
          <span style={styles.tileValue}>
            {project?.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}
          </span>
        </div>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Renewal Review</span>
          <span style={styles.tileValue}>
            {project?.renewalDate ? new Date(project.renewalDate).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}
          </span>
        </div>
      </div>

      {/* Credentials Sub-Form */}
      <div style={styles.formCardContainer}>
        <h3 style={styles.formSectionHeading}>
          <svg style={{ width: "20px", height: "20px", color: "#4f46e5" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Client's Key Information
        </h3>

        <form onSubmit={handlePatchDetails} style={styles.form}>
          <div className="smm-form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>Client's Name</label>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} style={styles.input} placeholder="e.g. Acme Corporation" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Client's Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} style={styles.input} placeholder="e.g. New York, NY" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Contact Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} style={styles.input} placeholder="e.g. 1234567890" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Project Execution Date</label>
              <input type="date" name="projectStartDate" value={formData.projectStartDate} onChange={handleInputChange} style={styles.input} />
            </div>
          </div>

          <h4 style={{ ...styles.groupHeading, marginTop: "24px" }}>Reference & Taste Links</h4>
          <div className="smm-form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>References</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  style={styles.input}
                  placeholder="Enter a reference link..."
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newReference.trim()) {
                      const currentRefs = formData.reference ? formData.reference.split(",").map(s=>s.trim()).filter(Boolean) : [];
                      currentRefs.push(newReference.trim());
                      setFormData({ ...formData, reference: currentRefs.join(", ") });
                      setNewReference("");
                    }
                  }}
                  style={{ ...styles.saveBtn, padding: "0 16px", height: "42px", fontSize: "14px" }}
                >
                  Add
                </button>
              </div>
              {/* Display added links */}
              {formData.reference && formData.reference.split(",").map(s=>s.trim()).filter(Boolean).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                  {formData.reference.split(",").map(s=>s.trim()).filter(Boolean).map((ref, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", color: "#334155" }}>
                      <span style={{ wordBreak: "break-all" }}>{ref}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentRefs = formData.reference.split(",").map(s=>s.trim()).filter(Boolean);
                          currentRefs.splice(idx, 1);
                          setFormData({ ...formData, reference: currentRefs.join(", ") });
                        }}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0", fontSize: "16px", fontWeight: "bold", lineHeight: "1" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Taste <span style={styles.optionalTag}>(Medium Description)</span></label>
              <textarea 
                name="taste" 
                value={formData.taste} 
                onChange={handleInputChange} 
                style={{ ...styles.input, minHeight: "100px", resize: "vertical", paddingTop: "10px", paddingBottom: "10px" }} 
                placeholder="Medium description of taste/preferences..." 
              />
            </div>
          </div>

          <h4 style={{ ...styles.groupHeading, marginTop: "24px" }}>Social Media Credentials</h4>
          <div className="smm-form-grid">
            <div style={styles.formGroup}>
              <label style={styles.label}>Facebook Username <span style={styles.optionalTag}>(optional)</span></label>
              <input type="text" name="facebookUsername" value={formData.facebookUsername} onChange={handleInputChange} style={styles.input} placeholder="fb_username" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Facebook Email <span style={styles.optionalTag}>(optional)</span></label>
              <input type="email" name="fbEmail" value={formData.fbEmail} onChange={handleInputChange} style={styles.input} placeholder="fb@enterprise-client.com" />
            </div>
            {renderPasswordField("Facebook Password", "fbPassword", formData.fbPassword, showFbPassword, setShowFbPassword, "••••••••••••")}

            <div style={styles.formGroup}>
              <label style={styles.label}>Instagram Username <span style={styles.optionalTag}>(optional)</span></label>
              <input type="text" name="instaUsername" value={formData.instaUsername} onChange={handleInputChange} style={styles.input} placeholder="insta_username" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Instagram Email <span style={styles.optionalTag}>(optional)</span></label>
              <input type="text" name="instaEmail" value={formData.instaEmail} onChange={handleInputChange} style={styles.input} placeholder="insta_handle" />
            </div>
            {renderPasswordField("Instagram Password", "instaPassword", formData.instaPassword, showInstaPassword, setShowInstaPassword, "••••••••••••")}

            <div style={styles.formGroup}>
              <label style={styles.label}>YouTube Email <span style={styles.optionalTag}>(optional)</span></label>
              <input type="text" name="youtubeEmail" value={formData.youtubeEmail} onChange={handleInputChange} style={styles.input} placeholder="youtube@channel.com" />
            </div>
            {renderPasswordField("YouTube Password", "youtubePassword", formData.youtubePassword, showYoutubePassword, setShowYoutubePassword, "••••••••••••")}

            <div style={styles.formGroup}>
              <label style={styles.label}>LinkedIn Email <span style={styles.optionalTag}>(optional)</span></label>
              <input type="text" name="linkedinEmail" value={formData.linkedinEmail} onChange={handleInputChange} style={styles.input} placeholder="linkedin@company.com" />
            </div>
            {renderPasswordField("LinkedIn Password", "linkedinPassword", formData.linkedinPassword, showLinkedinPassword, setShowLinkedinPassword, "••••••••••••")}

            <div style={styles.formGroup}>
              <label style={styles.label}>Twitter / X Email <span style={styles.optionalTag}>(optional)</span></label>
              <input type="text" name="twitterEmail" value={formData.twitterEmail} onChange={handleInputChange} style={styles.input} placeholder="twitter_handle" />
            </div>
            {renderPasswordField("Twitter / X Password", "twitterPassword", formData.twitterPassword, showTwitterPassword, setShowTwitterPassword, "••••••••••••")}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="submit" disabled={isUpdating} style={isUpdating ? styles.saveBtnDisabled : styles.saveBtn}>
              {isUpdating ? "Updating Details..." : "Update Details"}
            </button>
          </div>
        </form>
      </div>

      {/* ================= MASTER HISTORICAL CALENDARS LIST ================= */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={styles.sectionHeading}>Monthly Content Calendars</h3>
        {sheetsLoading ? (
          <p style={{ fontSize: "14px", color: "#64748b" }}>Re-indexing calendar collection tree...</p>
        ) : monthlySheets.length > 0 ? (
          <div className="smm-table-wrapper">
            <table className="smm-table">
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.thCell}>Month</th>
                  <th style={styles.thCell}>Content Planned</th>
                  <th style={styles.thCell}>Content Uploaded</th>
                  <th style={styles.thCell}>Assigned By</th>
                  <th style={styles.thCell}>Logo &amp; Moodboard</th>
                  <th style={{ ...styles.thCell, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monthlySheets.map((sheet) => {
                  const isThisCalendarLoading = loadingCalendarId === sheet.id;
                  return (
                    <tr key={sheet.id} style={{ ...styles.tableRow, backgroundColor: selectedCalendar?.id === sheet.id ? "#f0fdf4" : "transparent" }}>
                      <td style={{ ...styles.tdCell, fontWeight: "600" }}>
                        {new Date(0, sheet.month - 1).toLocaleString(undefined, { month: "long" })} {sheet.year}
                      </td>
                      <td style={styles.tdCell}>🎬 {sheet.totalReels} R / 📝 {sheet.totalPosts} P</td>
                      <td style={styles.tdCell}>🚀 {sheet.totalReelsUploaded} R / ✨ {sheet.totalPostsUploaded} P</td>
                      <td style={styles.tdCell}>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: "#1e293b" }}>{sheet.createdBy?.name || "System Agent"}</span>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{sheet.createdBy?.employeeId}</div>
                      </td>
                      <td style={styles.tdCell}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {sheet.projectLogo || project?.logo ? (
                            <img src={sheet.projectLogo || project.logo} alt="Project logo" style={styles.logoImageSmall} />
                          ) : (
                            <div style={styles.logoPlaceholderSmall}>—</div>
                          )}
                          {sheet.moodBoardLink ? (
                            <a href={sheet.moodBoardLink} target="_blank" rel="noreferrer" style={styles.tableLink}>Blueprint 🔗</a>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>No moodboard</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...styles.tdCell, textAlign: "right" }}>
                        <button
                          onClick={() => fetchMonthlySheetDetail(sheet.id)}
                          disabled={isThisCalendarLoading}
                          style={selectedCalendar?.id === sheet.id ? styles.viewBtnActive : styles.viewBtn}
                        >
                          {isThisCalendarLoading
                            ? "Loading..."
                            : selectedCalendar?.id === sheet.id
                              ? "Viewing"
                              : "Open Calendar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>No monthly strategy planning manifests initialized yet.</div>
        )}
      </div>

      {/* ================= DRILLDOWN VIEW: SINGLE CALENDAR EDITING ================= */}
      {selectedCalendar && (
        <div style={{ ...styles.formCardContainer, marginTop: "32px", borderColor: "#10b981", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", justifyBetween: "center", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Calendar Workspace Layout — {new Date(0, selectedCalendar.month - 1).toLocaleString(undefined, { month: "long" })} {selectedCalendar.year}
            </h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleUpdateExistingCalendar} disabled={isPatchingDay} style={isPatchingDay ? styles.saveBtnDisabled : styles.saveBtn}>
                {isPatchingDay ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setSelectedCalendar(null)} style={styles.cancelBtn}>Close</button>
            </div>
          </div>

          <div className="smm-table-wrapper" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="smm-table">
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.thCell, position: "sticky", left: 0, background: "#f8fafc", zIndex: 11 }}>Day</th>
                  <th style={styles.thCell}>Reel Type</th>
                  <th style={styles.thCell}>Post Type</th>
                  <th style={styles.thCell}>Title</th>
                  <th style={styles.thCell}>Video Type</th>
                  <th style={styles.thCell}>Script</th>
                  <th style={styles.thCell}>Description</th>
                  <th style={styles.thCell}>References</th>
                  <th style={styles.thCell}>Submissions</th>
                  <th style={styles.thCell}>Status</th>
                  <th style={styles.thCell}>Reviewed At</th>
                  <th style={styles.thCell}>Rejection Feedback</th>
                </tr>
              </thead>
              <tbody>
                {selectedCalendar.days?.map((dayItem, index) => (
                  <tr key={dayItem.id || index} style={styles.tableRow}>
                    <td style={{ ...styles.tdCell, fontWeight: "600", position: "sticky", left: 0, background: "#ffffff", zIndex: 9, borderRight: "1px solid #e2e8f0" }}>
                      {new Date(dayItem.date).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}
                    </td>
                    <td style={styles.tdCell}>
                      <select value={dayItem.reelType} onChange={(e) => handleSelectedDayChange(index, "reelType", e.target.value)} style={styles.tableSelect}>
                        <option value="NONE">NONE</option>
                        <option value="SHOOT">SHOOT</option>
                        <option value="AI">AI</option>
                      </select>
                    </td>
                    <td style={styles.tdCell}>
                      <select value={dayItem.postType} onChange={(e) => handleSelectedDayChange(index, "postType", e.target.value)} style={styles.tableSelect}>
                        <option value="NONE">NONE</option>
                        <option value="SHOOT">SHOOT</option>
                        <option value="AI">AI</option>
                      </select>
                    </td>
                    <td style={styles.tdCell}>
                      <input type="text" value={dayItem.title || ""} onChange={(e) => handleSelectedDayChange(index, "title", e.target.value)} style={styles.tableInput} placeholder="Title..." />
                    </td>
                    <td style={styles.tdCell}>
                      <select value={dayItem.videoType || "HORIZONTAL"} onChange={(e) => handleSelectedDayChange(index, "videoType", e.target.value)} style={styles.tableSelect}>
                        <option value="HORIZONTAL">HORIZONTAL</option>
                        <option value="VERTICAL">VERTICAL</option>
                      </select>
                    </td>
                    <td style={styles.tdCell}>
                      <input type="text" value={dayItem.script || ""} onChange={(e) => handleSelectedDayChange(index, "script", e.target.value)} style={styles.tableInput} placeholder="Script lines..." />
                    </td>
                    <td style={styles.tdCell}>
                      <input type="text" value={dayItem.description || ""} onChange={(e) => handleSelectedDayChange(index, "description", e.target.value)} style={styles.tableInput} placeholder="Frames..." />
                    </td>
                    <td style={styles.tdCell}>
                      <input type="text" value={arrayToString(dayItem.referenceLinks)} onChange={(e) => handleSelectedDayChange(index, "referenceLinks", stringToArray(e.target.value))} style={styles.tableInput} placeholder="Links..." />
                    </td>
                    <td style={styles.tdCell}>
                      {/* --- RENDER SUBMISSIONS TRACKER LOGIC ---
                          These values now come straight from the day-level detail
                          endpoint (GET /monthly-sheets/:id), so submissionLinks (and
                          any creative/content submission links) reflect real, current
                          values instead of the stale list-endpoint copy. */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {/* 1. Shoot Submission Links */}
                        {dayItem.submissionLinks?.length > 0 && dayItem.submissionLinks.map((link, i) => (
                          <a key={`shoot-${i}`} href={link} target="_blank" rel="noreferrer" style={styles.tableLink}>Shoot Asset {i + 1} 🔗</a>
                        ))}

                        {/* 2. Content Creative Shared Array Assets */}
                        {dayItem.contentCreativeSubmissionLinks?.length > 0 && dayItem.contentCreativeSubmissionLinks.map((link, i) => (
                          <a key={`creative-arr-${i}`} href={link} target="_blank" rel="noreferrer" style={{ ...styles.tableLink, color: "#10b981" }}>Creative Asset {i + 1} 🔗</a>
                        ))}

                        {/* 3. Base Single Creative Asset Vector Link Anchor */}
                        {dayItem.creativeSubmissionLink && (
                          <a href={dayItem.creativeSubmissionLink} target="_blank" rel="noreferrer" style={{ ...styles.tableLink, color: "#d946ef" }}>Design Asset 🔗</a>
                        )}

                        {/* Fallback empty view template layout indicator */}
                        {(!dayItem.submissionLinks?.length && !dayItem.contentCreativeSubmissionLinks?.length && !dayItem.creativeSubmissionLink) && (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.tdCell}>
                      {dayItem.submissionStatus ? (
                        <span style={styles.statusBadge(dayItem.submissionStatus)}>
                          {dayItem.submissionStatus}
                        </span>
                      ) : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ ...styles.tdCell, color: "#64748b", whiteSpace: "nowrap" }}>
                      {formatDateTime(dayItem.reviewedAt)}
                    </td>
                    <td style={{ ...styles.tdCell, color: "#ef4444" }}>
                      {dayItem.rejectionReason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Co-Assigned Managers */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={styles.sectionHeading}>Co-Assigned Project Stakeholders</h3>
        {project?.assignments?.length > 0 ? (
          <div className="smm-manager-grid">
            {project.assignments.map((assignment) => (
              <div key={assignment.id} style={styles.managerCard}>
                <div style={styles.avatar}>{assignment.manager?.name?.charAt(0) || "M"}</div>
                <div>
                  <div style={styles.mgrName}>{assignment.manager?.name}</div>
                  <div style={styles.mgrRole}>{assignment.manager?.position || "Manager"}</div>
                  <div style={styles.mgrId}>ID: {assignment.manager?.employeeId}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No other management stakeholders assigned.</div>
        )}
      </div>

      {/* ================= CREATE NEW STRATEGY WORKSPACE (DRAWER SIDE-MODAL) ================= */}
      {isDrawerOpen && (
        <div className="smm-drawer-overlay">
          <div className="smm-drawer-sheet">
            <div style={styles.drawerHeader}>
              <div>
                <span style={styles.drawerSubtitle}>WORKSPACE ENGINE</span>
                <h2 style={styles.drawerTitle}>Deploy Strategy Manifest</h2>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} style={styles.closeDrawerBtn}>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePostMonthlySheet} className="smm-drawer-form-body" style={styles.drawerFormBody}>
              <div className="smm-drawer-config-grid">
                <div style={{ ...styles.formCardContainer, backgroundColor: "#ffffff" }}>
                  <h4 style={styles.groupHeading}>Target Calendar Window</h4>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Month</label>
                      <select name="month" value={sheetMeta.month} onChange={handleMetaChange} style={styles.input}>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString(undefined, { month: "long" })}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>Year</label>
                      <select name="year" value={sheetMeta.year} onChange={handleMetaChange} style={styles.input}>
                        {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ ...styles.formCardContainer, backgroundColor: "#ffffff" }}>
                  <h4 style={styles.groupHeading}>Target Deliverable Milestones</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={styles.label}>Planned Reels</label>
                      <input type="number" name="totalReels" min="0" value={sheetMeta.totalReels} onChange={handleMetaChange} style={styles.input} placeholder="e.g. 15" required />
                    </div>
                    <div>
                      <label style={styles.label}>Planned Posts</label>
                      <input type="number" name="totalPosts" min="0" value={sheetMeta.totalPosts} onChange={handleMetaChange} style={styles.input} placeholder="e.g. 10" required />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Shared Blueprint Moodboard Asset URL Link</label>
                  <input type="url" name="moodBoardLink" value={sheetMeta.moodBoardLink} onChange={handleMetaChange} style={styles.input} placeholder="https://figma.com/... or Pinterest space links" />
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "260px" }}>
                <h4 style={styles.groupHeading}>Daily Tactical Matrix Breakdown</h4>
                <div className="smm-table-wrapper" style={{ flex: 1, maxHeight: "340px", overflowY: "auto" }}>
                  <table className="smm-table">
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={{ ...styles.thCell, position: "sticky", left: 0, background: "#f8fafc", zIndex: 11 }}>Day</th>
                        <th style={styles.thCell}>Reel Type</th>
                        <th style={styles.thCell}>Post Type</th>
                        <th style={styles.thCell}>Title</th>
                        <th style={styles.thCell}>Video Type</th>
                        <th style={styles.thCell}>Script Concept</th>
                        <th style={styles.thCell}>Frame Details</th>
                        <th style={styles.thCell}>Visual References</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetDays.map((dayItem, idx) => (
                        <tr key={idx} style={styles.tableRow}>
                          <td style={{ ...styles.tdCell, fontWeight: "600", position: "sticky", left: 0, background: "#ffffff", zIndex: 9, borderRight: "1px solid #e2e8f0" }}>
                            {new Date(dayItem.date).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}
                          </td>
                          <td style={styles.tdCell}>
                            <select value={dayItem.reelType} onChange={(e) => handleDayFieldChange(idx, "reelType", e.target.value)} style={styles.tableSelect}>
                              <option value="NONE">null</option>
                              <option value="SHOOT">SHOOT</option>
                              <option value="AI">AI</option>
                            </select>
                          </td>
                          <td style={styles.tdCell}>
                            <select value={dayItem.postType} onChange={(e) => handleDayFieldChange(idx, "postType", e.target.value)} style={styles.tableSelect}>
                              <option value="NONE">null</option>
                              <option value="SHOOT">SHOOT</option>
                              <option value="AI">AI</option>
                            </select>
                          </td>
                          <td style={styles.tdCell}>
                            <input type="text" value={dayItem.title || ""} onChange={(e) => handleDayFieldChange(idx, "title", e.target.value)} style={styles.tableInput} placeholder="Title..." />
                          </td>
                          <td style={styles.tdCell}>
                            <select value={dayItem.videoType || "HORIZONTAL"} onChange={(e) => handleDayFieldChange(idx, "videoType", e.target.value)} style={styles.tableSelect}>
                              <option value="HORIZONTAL">HORIZONTAL</option>
                              <option value="VERTICAL">VERTICAL</option>
                              <option value="SQUARE">SQUARE</option>
                            </select>
                          </td>
                          <td style={styles.tdCell}>
                            <input type="text" value={dayItem.script} onChange={(e) => handleDayFieldChange(idx, "script", e.target.value)} style={styles.tableInput} placeholder="Scripts..." />
                          </td>
                          <td style={styles.tdCell}>
                            <input type="text" value={dayItem.description} onChange={(e) => handleDayFieldChange(idx, "description", e.target.value)} style={styles.tableInput} placeholder="Directives..." />
                          </td>
                          <td style={styles.tdCell}>
                            <input type="text" value={arrayToString(dayItem.referenceLinks)} onChange={(e) => handleDayFieldChange(idx, "referenceLinks", stringToArray(e.target.value))} style={styles.tableInput} placeholder="https://..." />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="smm-drawer-footer">
                <button type="button" onClick={() => setIsDrawerOpen(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmittingSheet} style={isSubmittingSheet ? styles.sheetBtnDisabled : styles.sheetBtn}>
                  {isSubmittingSheet ? "Compiling Matrix..." : "Deploy Strategy Manifest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  },
  centerContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    alignItems: "center",
  },
  idBadge: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  deptBadge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  title: { fontSize: "26px", fontWeight: "700", color: "#0f172a", margin: 0 },
  logoBox: {
    width: "80px",
    height: "80px",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImageLarge: { width: "100%", height: "100%", objectFit: "cover" },
  logoImageSmall: { width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover", border: "1px solid #e2e8f0" },
  logoPlaceholderLarge: { fontSize: "10px", color: "#94a3b8", textAlign: "center", fontWeight: "500" },
  logoPlaceholderSmall: { fontSize: "12px", color: "#cbd5e1" },
  logoMeta: { display: "flex", flexDirection: "column", gap: "4px" },
  logoLabel: { fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" },
  logoHint: { margin: 0, fontSize: "13px", color: "#64748b" },
  logoUploadBtn: {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    alignSelf: "flex-start",
  },
  descriptionBox: {
    borderLeft: "4px solid #4f46e5",
    paddingLeft: "16px",
    marginBottom: "28px",
  },
  sectionSub: { margin: "0 0 4px 0", color: "#4f46e5", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" },
  infoTile: {
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  tileLabel: { fontSize: "11px", fontWeight: "600", textTransform: "uppercase", color: "#64748b" },
  tileValue: { fontSize: "14px", fontWeight: "600", color: "#0f172a", marginTop: "4px" },
  formCardContainer: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    backgroundColor: "#ffffff",
  },
  formSectionHeading: { display: "flex", alignItems: "center", gap: "8px", margin: "0 0 20px 0", fontSize: "16px", fontWeight: "600" },
  groupHeading: {
    margin: "0 0 16px 0",
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "6px",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "13px", fontWeight: "500", color: "#334155" },
  optionalTag: { fontSize: "11px", color: "#94a3b8" },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    width: "100%",
    boxSizing: "border-box",
  },
  eyeToggleBtn: { position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "12px" },
  saveBtn: { backgroundColor: "#0f172a", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  saveBtnDisabled: { backgroundColor: "#94a3b8", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "not-allowed" },
  openDrawerBtn: { display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#10b981", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  viewBtn: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#334155", cursor: "pointer", fontSize: "12px" },
  viewBtnActive: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #10b981", backgroundColor: "#10b981", color: "#ffffff", fontSize: "12px" },
  drawerHeader: { display: "flex", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", justifyContent: "space-between" },
  drawerTitle: { margin: 0, fontSize: "18px", fontWeight: "700" },
  drawerSubtitle: { fontSize: "10px", fontWeight: "700", color: "#10b981" },
  closeDrawerBtn: { border: "none", backgroundColor: "transparent", cursor: "pointer", color: "#64748b" },
  drawerFormBody: { padding: "32px", display: "flex", flexDirection: "column", gap: "24px", flex: 1, overflowY: "auto" },
  thRow: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  thCell: { padding: "12px 14px", color: "#475569", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" },
  tableRow: { borderBottom: "1px solid #f1f5f9" },
  tdCell: { padding: "12px 14px", verticalAlign: "middle", color: "#334155" },
  tableSelect: { padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", minWidth: "90px" },
  tableInput: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", minWidth: "130px" },
  tableLink: { color: "#4f46e5", textDecoration: "none", fontWeight: "500", fontSize: "13px" },
  statusBadge: (status) => {
    const map = { PENDING: { bg: "#fef9c3", col: "#854d0e" }, SUBMITTED: { bg: "#e0f2fe", col: "#0369a1" }, APPROVED: { bg: "#dcfce7", col: "#166534" }, REJECTED: { bg: "#fee2e2", col: "#991b1b" } };
    const colors = map[status] || { bg: "#f1f5f9", col: "#475569" };
    return { display: "inline-block", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600", backgroundColor: colors.bg, color: colors.col };
  },
  cancelBtn: { backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  sheetBtn: { backgroundColor: "#10b981", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  sheetBtnDisabled: { backgroundColor: "#94a3b8", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: "6px" },
  sectionHeading: { fontSize: "16px", fontWeight: "600", color: "#0f172a", marginBottom: "16px" },
  managerCard: { display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "14px" },
  mgrName: { fontSize: "14px", fontWeight: "500", color: "#0f172a" },
  mgrRole: { fontSize: "12px", color: "#64748b" },
  mgrId: { fontSize: "11px", color: "#94a3b8" },
  emptyState: { padding: "32px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: "8px", fontSize: "14px" },
  errorCard: { padding: "16px 20px", backgroundColor: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "6px", color: "#991b1b" },
  spinner: { width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTop: "3px solid #4f46e5", borderRadius: "50%" },
};

export default SMMManagerView;