import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  contentUploadLinks: [],
  videoUploadLinks: [],
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
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);

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
          contentUploadLinks: matchingDay.contentUploadLinks || [],
          videoUploadLinks: matchingDay.videoUploadLinks || [],
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
          contentUploadLinks: [],
          videoUploadLinks: [],
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
        setIsEditingCredentials(false);
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
          contentUploadLinks: day.contentUploadLinks || [],
          videoUploadLinks: day.videoUploadLinks || [],
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
          (day.description && day.description.trim() !== "") ||
          (day.submissionLinks && day.submissionLinks.length > 0) ||
          (day.contentUploadLinks && day.contentUploadLinks.length > 0) ||
          (day.videoUploadLinks && day.videoUploadLinks.length > 0),
      );

      const cleanedDays = activeDays.map((day) => {
        const dayObj = { date: day.date };

        if (day.id) dayObj.id = day.id;
        if (day.reelType && day.reelType !== "NONE") dayObj.reelType = day.reelType;
        if (day.postType && day.postType !== "NONE") dayObj.postType = day.postType;
        if (day.title && day.title.trim() !== "") dayObj.title = day.title;
        if (day.videoType) dayObj.videoType = day.videoType;
        if (day.referenceLinks && day.referenceLinks.length > 0)
          dayObj.referenceLinks = day.referenceLinks;
        if (day.submissionLinks && day.submissionLinks.length > 0)
          dayObj.submissionLinks = day.submissionLinks;
        if (day.contentUploadLinks && day.contentUploadLinks.length > 0)
          dayObj.contentUploadLinks = day.contentUploadLinks;
        if (day.videoUploadLinks && day.videoUploadLinks.length > 0)
          dayObj.videoUploadLinks = day.videoUploadLinks;
        if (day.script && day.script.trim() !== "") dayObj.script = day.script;
        if (day.description && day.description.trim() !== "")
          dayObj.description = day.description;

        return dayObj;
      });

      const payload = {
        days: cleanedDays,
        totalReelsUploaded: selectedCalendar.totalReelsUploaded ? parseInt(selectedCalendar.totalReelsUploaded, 10) : 0,
        totalPostsUploaded: selectedCalendar.totalPostsUploaded ? parseInt(selectedCalendar.totalPostsUploaded, 10) : 0,
      };

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
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label} <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">Optional</span></label>
      <div className="relative flex items-center">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={handleInputChange}
          disabled={!isEditingCredentials}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm pr-16 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {visible ? "Hide" : "View"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans relative overflow-hidden pb-12">
      {/* Background ambient glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">

        <input
          type="file"
          accept="image/*"
          ref={logoInputRef}
          onChange={handleLogoFileSelected}
          style={{ display: "none" }}
        />

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                PROJECT ID: {project?.id?.toUpperCase().slice(0, 8)}
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-violet-50 text-violet-600 px-3 py-1 rounded-full border border-violet-100">
                {project?.department?.name || "Social Media"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              {project?.projectName || "Social Media Project"}
            </h1>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all whitespace-nowrap"
          >
            <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Create Content Calendar
          </button>
        </motion.div>

        {/* TOP SECTION: LOGO, SUMMARY, METRICS */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-slate-100/60 p-8 md:p-10">
              <div className="flex flex-col sm:flex-row items-start gap-8">
                <div
                  onClick={handleLogoClick}
                  className="group relative flex-shrink-0 w-32 h-32 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors"
                >
                  {project?.logo ? (
                    <>
                      <img src={project.logo} alt="Client logo" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Change Logo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">Upload Logo</span>
                    </div>
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <h3 className="text-2xl font-black text-slate-900 mb-4">Project Description</h3>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {project?.description || "No strategic summary available."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-slate-100/60 p-8 md:p-10 flex flex-col justify-center gap-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Timeline & Execution</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cycle</p>
                <p className="font-bold text-slate-800 text-sm">{project?.frequency || "N/A"}</p>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Start</p>
                <p className="font-bold text-slate-800 text-sm">{project?.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}</p>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">End</p>
                <p className="font-bold text-slate-800 text-sm">{project?.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}</p>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Renewal</p>
                <p className="font-bold text-indigo-600 text-sm">{project?.renewalDate ? new Date(project.renewalDate).toLocaleDateString(undefined, { dateStyle: "medium" }) : "N/A"}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credentials Sub-Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-slate-100/60 p-8 md:p-10">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            Client's Key Information
          </h3>

          <form onSubmit={handlePatchDetails} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Client's Name</label>
                <input type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="e.g. Acme Corporation" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Client's Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="e.g. New York, NY" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="e.g. 1234567890" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Execution Date</label>
                <input type="date" name="projectStartDate" value={formData.projectStartDate} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Reference & Taste Links</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Taste <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">Medium Description</span></label>
                  <textarea
                    name="taste"
                    value={formData.taste}
                    onChange={handleInputChange}
                    disabled={!isEditingCredentials}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700 min-h-[100px] resize-y disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Medium description of taste/preferences..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">References</label>
                  {isEditingCredentials && (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newReference}
                        onChange={(e) => setNewReference(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700"
                        placeholder="Enter a reference link..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newReference.trim()) {
                            const currentRefs = formData.reference ? formData.reference.split(",").map(s => s.trim()).filter(Boolean) : [];
                            currentRefs.push(newReference.trim());
                            setFormData({ ...formData, reference: currentRefs.join(", ") });
                            setNewReference("");
                          }
                        }}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-sm transition-colors whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {/* Display added links */}
                  {formData.reference && formData.reference.split(",").map(s => s.trim()).filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.reference.split(",").map(s => s.trim()).filter(Boolean).map((ref, idx) => (
                        <div key={idx} className="group relative flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-100 cursor-pointer">
                          <span className="break-all line-clamp-1 max-w-[200px]">{ref}</span>

                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(ref);
                            }}
                            className="text-indigo-400 hover:text-indigo-600 transition-colors"
                            title="Copy Link"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                          </button>

                          {/* Beautiful Instant Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs md:max-w-md p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 break-all">
                            {ref}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900"></div>
                          </div>

                          {isEditingCredentials && (
                            <button
                              type="button"
                              onClick={() => {
                                const currentRefs = formData.reference.split(",").map(s => s.trim()).filter(Boolean);
                                currentRefs.splice(idx, 1);
                                setFormData({ ...formData, reference: currentRefs.join(", ") });
                              }}
                              className="text-indigo-400 hover:text-indigo-600 font-bold ml-1 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Taste <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">Medium Description</span></label>
                  <textarea
                    name="taste"
                    value={formData.taste}
                    onChange={handleInputChange}
                    disabled={!isEditingCredentials}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium text-slate-700 min-h-[100px] resize-y disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Medium description of taste/preferences..."
                  />
                </div> */}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-500"></div> Social Media Credentials</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Facebook Username</label>
                    <input type="text" name="facebookUsername" value={formData.facebookUsername} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="fb_username" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Facebook Email</label>
                    <input type="email" name="fbEmail" value={formData.fbEmail} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="fb@enterprise.com" />
                  </div>
                  {renderPasswordField("Facebook Password", "fbPassword", formData.fbPassword, showFbPassword, setShowFbPassword, "••••••••••••")}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instagram Username</label>
                    <input type="text" name="instaUsername" value={formData.instaUsername} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="insta_username" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instagram Email</label>
                    <input type="text" name="instaEmail" value={formData.instaEmail} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="insta_handle" />
                  </div>
                  {renderPasswordField("Instagram Password", "instaPassword", formData.instaPassword, showInstaPassword, setShowInstaPassword, "••••••••••••")}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">YouTube Email</label>
                    <input type="text" name="youtubeEmail" value={formData.youtubeEmail} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="youtube@channel.com" />
                  </div>
                  {renderPasswordField("YouTube Password", "youtubePassword", formData.youtubePassword, showYoutubePassword, setShowYoutubePassword, "••••••••••••")}

                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">LinkedIn Email</label>
                    <input type="text" name="linkedinEmail" value={formData.linkedinEmail} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="linkedin@company.com" />
                  </div>
                  {renderPasswordField("LinkedIn Password", "linkedinPassword", formData.linkedinPassword, showLinkedinPassword, setShowLinkedinPassword, "••••••••••••")}
                </div>

                <div className="space-y-4 md:col-span-2 lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Twitter / X Email</label>
                      <input type="text" name="twitterEmail" value={formData.twitterEmail} onChange={handleInputChange} disabled={!isEditingCredentials} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="twitter_handle" />
                    </div>
                    {renderPasswordField("Twitter / X Password", "twitterPassword", formData.twitterPassword, showTwitterPassword, setShowTwitterPassword, "••••••••••••")}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100 gap-3">
              {!isEditingCredentials ? (
                <button
                  type="button"
                  onClick={() => setIsEditingCredentials(true)}
                  className="px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                >
                  Edit Credentials
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCredentials(false);
                      fetchProjectDetails(); // Reset modifications
                    }}
                    className="px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className={`px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all ${isUpdating ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md'}`}
                  >
                    {isUpdating ? "Updating Details..." : "Save Credentials"}
                  </button>
                </>
              )}
            </div>
          </form>
        </motion.div>

        {/* ================= MASTER HISTORICAL CALENDARS LIST ================= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            Monthly Content Calendars
          </h3>
          {sheetsLoading ? (
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-slate-100/60 p-12 text-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Re-indexing calendar collection tree...</p>
            </div>
          ) : monthlySheets.length > 0 ? (
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-slate-100/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100/60">
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Month</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Content Planned</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Content Uploaded</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Assigned By</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Logo &amp; Moodboard</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {monthlySheets.map((sheet) => {
                      const isThisCalendarLoading = loadingCalendarId === sheet.id;
                      return (
                        <tr key={sheet.id} className={`group transition-colors hover:bg-slate-50/50 ${selectedCalendar?.id === sheet.id ? "bg-indigo-50/30" : ""}`}>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <p className="text-sm font-bold text-slate-900">{new Date(0, sheet.month - 1).toLocaleString(undefined, { month: "long" })} {sheet.year}</p>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">🎬 {sheet.totalReels} R</span>
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">📝 {sheet.totalPosts} P</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md">🚀 {sheet.totalReelsUploaded} R</span>
                              <span className="flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-1 rounded-md">✨ {sheet.totalPostsUploaded} P</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                {sheet.createdBy?.name?.charAt(0) || "S"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{sheet.createdBy?.name || "System Agent"}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sheet.createdBy?.employeeId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              {sheet.projectLogo || project?.logo ? (
                                <img src={sheet.projectLogo || project.logo} alt="Project logo" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-sm" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">—</div>
                              )}
                              {sheet.moodBoardLink ? (
                                <a href={sheet.moodBoardLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                                  Blueprint <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                </a>
                              ) : (
                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">No moodboard</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <button
                              onClick={() => fetchMonthlySheetDetail(sheet.id)}
                              disabled={isThisCalendarLoading}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${selectedCalendar?.id === sheet.id ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                              {isThisCalendarLoading
                                ? "Loading..."
                                : selectedCalendar?.id === sheet.id
                                  ? "Viewing Layout"
                                  : "Open Calendar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-slate-100/60 p-12 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No monthly strategy planning manifests initialized yet.</p>
            </div>
          )}
        </motion.div>

        {/* ================= DRILLDOWN VIEW: FULL SCREEN SINGLE CALENDAR EDITING (PORTAL) ================= */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {selectedCalendar && (
                <div key="calendar-workspace-portal" className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-2xl flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="bg-white w-full h-full rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80"
                  >
                    {/* Workspace Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-xs">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg md:text-xl font-black text-slate-900">
                              Calendar Workspace — {new Date(0, selectedCalendar.month - 1).toLocaleString(undefined, { month: "long" })} {selectedCalendar.year}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Full Screen Suite
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">Edit scripts, titles, frame descriptions, and reference links in expanded layout</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedCalendar(null)}
                          className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition-colors flex items-center gap-2 shadow-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Close Workspace
                        </button>
                        <button
                          onClick={handleUpdateExistingCalendar}
                          disabled={isPatchingDay}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${isPatchingDay ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {isPatchingDay ? "Saving Layout..." : "Save Changes"}
                        </button>
                      </div>
                    </div>

                    {/* Workspace Main Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-100/50">
                      {/* Metric Controls */}
                      <div className="flex flex-wrap gap-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reels Uploaded Count</label>
                          <input
                            type="number"
                            name="totalReelsUploaded"
                            min="0"
                            value={selectedCalendar.totalReelsUploaded || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedCalendar((prev) => ({ ...prev, totalReelsUploaded: val }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800 shadow-xs"
                            placeholder="e.g. 5"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Posts Uploaded Count</label>
                          <input
                            type="number"
                            name="totalPostsUploaded"
                            min="0"
                            value={selectedCalendar.totalPostsUploaded || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedCalendar((prev) => ({ ...prev, totalPostsUploaded: val }));
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800 shadow-xs"
                            placeholder="e.g. 3"
                          />
                        </div>
                      </div>

                      {/* Spacious Table with Roomy Text Areas */}
                      <div className="overflow-hidden border border-slate-200/90 rounded-2xl bg-white shadow-sm flex-1">
                        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] min-h-[500px]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100/95 sticky top-0 z-20 border-b border-slate-200 shadow-xs backdrop-blur-md">
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap sticky left-0 bg-slate-100/95 backdrop-blur-md z-30 border-r border-slate-200">
                                  Date
                                </th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Reel Type</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Post Type</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Title</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Video Format</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Script Content</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Frame Breakdown / Notes</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Visual References</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Deliverable Links</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Content Upload Links</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Video Upload Links</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Reviewed At</th>
                                <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Feedback</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {selectedCalendar.days?.map((dayItem, index) => (
                                <tr key={dayItem.id || index} className="hover:bg-slate-50/90 transition-colors group align-top">
                                  <td className="px-4 py-3 whitespace-nowrap font-black text-slate-800 text-sm sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 border-r border-slate-100 transition-colors pt-4">
                                    {new Date(dayItem.date).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap pt-4">
                                    <select
                                      value={dayItem.reelType}
                                      onChange={(e) => handleSelectedDayChange(index, "reelType", e.target.value)}
                                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-xs"
                                    >
                                      <option value="NONE">NONE</option>
                                      <option value="SHOOT">SHOOT</option>
                                      <option value="AI">AI</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap pt-4">
                                    <select
                                      value={dayItem.postType}
                                      onChange={(e) => handleSelectedDayChange(index, "postType", e.target.value)}
                                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-xs"
                                    >
                                      <option value="NONE">NONE</option>
                                      <option value="SHOOT">SHOOT</option>
                                      <option value="AI">AI</option>
                                    </select>
                                  </td>

                                  {/* EXPANDED & LARGE TITLE TEXTAREA */}
                                  <td className="px-4 py-3 min-w-[240px]">
                                    <textarea
                                      rows={2}
                                      value={dayItem.title || ""}
                                      onChange={(e) => handleSelectedDayChange(index, "title", e.target.value)}
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                      placeholder="Content Title / Topic..."
                                    />
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap pt-4">
                                    <select
                                      value={dayItem.videoType || "HORIZONTAL"}
                                      onChange={(e) => handleSelectedDayChange(index, "videoType", e.target.value)}
                                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-xs"
                                    >
                                      <option value="HORIZONTAL">HORIZONTAL</option>
                                      <option value="VERTICAL">VERTICAL</option>
                                    </select>
                                  </td>

                                  {/* EXPANDED & LARGE SCRIPT TEXTAREA */}
                                  <td className="px-4 py-3 min-w-[300px]">
                                    <textarea
                                      rows={3}
                                      value={dayItem.script || ""}
                                      onChange={(e) => handleSelectedDayChange(index, "script", e.target.value)}
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[72px] shadow-xs leading-relaxed"
                                      placeholder="Write full video script, spoken dialogue lines, voiceover text..."
                                    />
                                  </td>

                                  {/* EXPANDED & LARGE DESCRIPTION/FRAME TEXTAREA */}
                                  <td className="px-4 py-3 min-w-[300px]">
                                    <textarea
                                      rows={3}
                                      value={dayItem.description || ""}
                                      onChange={(e) => handleSelectedDayChange(index, "description", e.target.value)}
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[72px] shadow-xs leading-relaxed"
                                      placeholder="Write shot sequence, frame descriptions, visual direction..."
                                    />
                                  </td>

                                  {/* EXPANDED & LARGE REFERENCES TEXTAREA */}
                                  <td className="px-4 py-3 min-w-[240px]">
                                    <textarea
                                      rows={2}
                                      value={arrayToString(dayItem.referenceLinks)}
                                      onChange={(e) => handleSelectedDayChange(index, "referenceLinks", stringToArray(e.target.value))}
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                      placeholder="Paste reference URLs (comma separated)..."
                                    />
                                  </td>

                                  <td className="px-4 py-3 min-w-[180px] pt-4">
                                    <div className="flex flex-col gap-2">
                                      {dayItem.submissionLinks?.length > 0 &&
                                        dayItem.submissionLinks.map((link, i) => (
                                          <a key={`shoot-${i}`} href={link} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 break-all">
                                            Shoot Asset {i + 1} 🔗
                                          </a>
                                        ))}
                                      {dayItem.contentCreativeSubmissionLinks?.length > 0 &&
                                        dayItem.contentCreativeSubmissionLinks.map((link, i) => (
                                          <a key={`creative-arr-${i}`} href={link} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 break-all">
                                            Creative Asset {i + 1} 🔗
                                          </a>
                                        ))}
                                      {dayItem.creativeSubmissionLink && (
                                        <a href={dayItem.creativeSubmissionLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-800 break-all">
                                          Design Asset 🔗
                                        </a>
                                      )}
                                      {!dayItem.submissionLinks?.length && !dayItem.contentCreativeSubmissionLinks?.length && !dayItem.creativeSubmissionLink && (
                                        <span className="text-slate-400 text-xs">—</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* CONTENT UPLOAD LINKS */}
                                  <td className="px-4 py-3 min-w-[240px]">
                                    <div className="space-y-2">
                                      <textarea
                                        rows={2}
                                        value={arrayToString(dayItem.contentUploadLinks)}
                                        onChange={(e) => handleSelectedDayChange(index, "contentUploadLinks", stringToArray(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                        placeholder="Paste Content / Post URLs (comma separated)..."
                                      />
                                      {dayItem.contentUploadLinks?.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                          {dayItem.contentUploadLinks.map((link, i) => (
                                            <a key={`content-up-${i}`} href={link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-sky-600 hover:text-sky-800 break-all">
                                              Content Asset {i + 1} 🔗
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* VIDEO UPLOAD LINKS */}
                                  <td className="px-4 py-3 min-w-[240px]">
                                    <div className="space-y-2">
                                      <textarea
                                        rows={2}
                                        value={arrayToString(dayItem.videoUploadLinks)}
                                        onChange={(e) => handleSelectedDayChange(index, "videoUploadLinks", stringToArray(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                        placeholder="Paste Video / Reel URLs (comma separated)..."
                                      />
                                      {dayItem.videoUploadLinks?.length > 0 && (
                                        <div className="flex flex-col gap-1">
                                          {dayItem.videoUploadLinks.map((link, i) => (
                                            <a key={`video-up-${i}`} href={link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 break-all">
                                              Video Asset {i + 1} 🔗
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 whitespace-nowrap pt-4">
                                    {dayItem.submissionStatus ? (
                                      <span
                                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${dayItem.submissionStatus === "APPROVED"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : dayItem.submissionStatus === "REJECTED"
                                              ? "bg-red-100 text-red-800"
                                              : dayItem.submissionStatus === "SUBMITTED"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-amber-100 text-amber-800"
                                          }`}
                                      >
                                        {dayItem.submissionStatus}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 pt-4">{formatDateTime(dayItem.reviewedAt)}</td>
                                  <td className="px-4 py-3 min-w-[150px] text-xs text-red-600 font-medium pt-4">{dayItem.rejectionReason || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

        {/* Co-Assigned Managers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 mb-12">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            Co-Assigned Project Stakeholders
          </h3>
          {project?.assignments?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-black text-lg border border-indigo-200/50">
                    {assignment.manager?.name?.charAt(0) || "M"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{assignment.manager?.name}</div>
                    <div className="text-xs font-medium text-slate-500">{assignment.manager?.position || "Manager"}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">ID: {assignment.manager?.employeeId}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No other management stakeholders assigned.</p>
            </div>
          )}
        </motion.div>

        {/* ================= CREATE NEW STRATEGY WORKSPACE (FULL SCREEN PORTAL) ================= */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isDrawerOpen && (
                <div key="create-calendar-modal-portal" className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-2xl flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="bg-white w-full h-full rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80"
                  >
                    {/* Header Bar */}
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 backdrop-blur-md shadow-xs">
                      <div>
                        <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">WORKSPACE SUITE</span>
                        <h2 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">Create & Deploy Content Calendar Manifest</h2>
                      </div>
                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handlePostMonthlySheet} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-100/50 flex flex-col">
                      {/* Configuration Metadata Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Target Calendar Window</h4>
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Month</label>
                              <select
                                name="month"
                                value={sheetMeta.month}
                                onChange={handleMetaChange}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-700 shadow-xs"
                              >
                                {Array.from({ length: 12 }, (_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString(undefined, { month: "long" })}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year</label>
                              <select
                                name="year"
                                value={sheetMeta.year}
                                onChange={handleMetaChange}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-700 shadow-xs"
                              >
                                {[2025, 2026, 2027, 2028].map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Target Deliverables</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Planned Reels</label>
                              <input
                                type="number"
                                name="totalReels"
                                min="0"
                                value={sheetMeta.totalReels}
                                onChange={handleMetaChange}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-700 shadow-xs"
                                placeholder="e.g. 15"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Planned Posts</label>
                              <input
                                type="number"
                                name="totalPosts"
                                min="0"
                                value={sheetMeta.totalPosts}
                                onChange={handleMetaChange}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-700 shadow-xs"
                                placeholder="e.g. 10"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uploaded Reels</label>
                              <input
                                type="number"
                                name="totalReelsUploaded"
                                min="0"
                                value={sheetMeta.totalReelsUploaded}
                                onChange={handleMetaChange}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-700 shadow-xs"
                                placeholder="e.g. 0"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uploaded Posts</label>
                              <input
                                type="number"
                                name="totalPostsUploaded"
                                min="0"
                                value={sheetMeta.totalPostsUploaded}
                                onChange={handleMetaChange}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-700 shadow-xs"
                                placeholder="e.g. 0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shared Blueprint Moodboard Asset URL Link</label>
                        <input
                          type="url"
                          name="moodBoardLink"
                          value={sheetMeta.moodBoardLink}
                          onChange={handleMetaChange}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-semibold text-slate-700 shadow-xs"
                          placeholder="https://figma.com/... or Pinterest space links"
                        />
                      </div>

                      {/* Spacious Daily Matrix Table */}
                      <div className="flex flex-col flex-1 min-h-[400px]">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Daily Tactical Matrix Breakdown</h4>
                        <div className="overflow-hidden border border-slate-200/90 rounded-2xl bg-white shadow-sm flex-1">
                          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)] min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100/95 sticky top-0 z-20 border-b border-slate-200 shadow-xs backdrop-blur-md">
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap sticky left-0 bg-slate-100/95 backdrop-blur-md z-30 border-r border-slate-200">
                                    Date
                                  </th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Reel Type</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Post Type</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Title</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Video Format</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Script Content</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Frame Breakdown / Notes</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Visual References</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Content Upload Links</th>
                                  <th className="px-4 py-3.5 text-[11px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Video Upload Links</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {sheetDays.map((dayItem, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/90 transition-colors group align-top">
                                    <td className="px-4 py-3 whitespace-nowrap font-black text-slate-800 text-sm sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 border-r border-slate-100 transition-colors pt-4">
                                      {new Date(dayItem.date).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap pt-4">
                                      <select
                                        value={dayItem.reelType}
                                        onChange={(e) => handleDayFieldChange(idx, "reelType", e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-xs"
                                      >
                                        <option value="NONE">NONE</option>
                                        <option value="SHOOT">SHOOT</option>
                                        <option value="AI">AI</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap pt-4">
                                      <select
                                        value={dayItem.postType}
                                        onChange={(e) => handleDayFieldChange(idx, "postType", e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-xs"
                                      >
                                        <option value="NONE">NONE</option>
                                        <option value="SHOOT">SHOOT</option>
                                        <option value="AI">AI</option>
                                      </select>
                                    </td>

                                    {/* EXPANDED & LARGE TITLE TEXTAREA */}
                                    <td className="px-4 py-3 min-w-[240px]">
                                      <textarea
                                        rows={2}
                                        value={dayItem.title || ""}
                                        onChange={(e) => handleDayFieldChange(idx, "title", e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                        placeholder="Content Title / Topic..."
                                      />
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap pt-4">
                                      <select
                                        value={dayItem.videoType || "HORIZONTAL"}
                                        onChange={(e) => handleDayFieldChange(idx, "videoType", e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-xs"
                                      >
                                        <option value="HORIZONTAL">HORIZONTAL</option>
                                        <option value="VERTICAL">VERTICAL</option>
                                        <option value="SQUARE">SQUARE</option>
                                      </select>
                                    </td>

                                    {/* EXPANDED & LARGE SCRIPT TEXTAREA */}
                                    <td className="px-4 py-3 min-w-[300px]">
                                      <textarea
                                        rows={3}
                                        value={dayItem.script || ""}
                                        onChange={(e) => handleDayFieldChange(idx, "script", e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[72px] shadow-xs leading-relaxed"
                                        placeholder="Write full video script, spoken dialogue lines, voiceover text..."
                                      />
                                    </td>

                                    {/* EXPANDED & LARGE DESCRIPTION/FRAME TEXTAREA */}
                                    <td className="px-4 py-3 min-w-[300px]">
                                      <textarea
                                        rows={3}
                                        value={dayItem.description || ""}
                                        onChange={(e) => handleDayFieldChange(idx, "description", e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[72px] shadow-xs leading-relaxed"
                                        placeholder="Write shot sequence, frame descriptions, visual direction..."
                                      />
                                    </td>

                                    {/* EXPANDED & LARGE REFERENCES TEXTAREA */}
                                    <td className="px-4 py-3 min-w-[240px]">
                                      <textarea
                                        rows={2}
                                        value={arrayToString(dayItem.referenceLinks)}
                                        onChange={(e) => handleDayFieldChange(idx, "referenceLinks", stringToArray(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                        placeholder="Paste reference URLs (comma separated)..."
                                      />
                                    </td>

                                    {/* CONTENT UPLOAD LINKS */}
                                    <td className="px-4 py-3 min-w-[240px]">
                                      <textarea
                                        rows={2}
                                        value={arrayToString(dayItem.contentUploadLinks)}
                                        onChange={(e) => handleDayFieldChange(idx, "contentUploadLinks", stringToArray(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                        placeholder="Paste Content / Post URLs (comma separated)..."
                                      />
                                    </td>

                                    {/* VIDEO UPLOAD LINKS */}
                                    <td className="px-4 py-3 min-w-[240px]">
                                      <textarea
                                        rows={2}
                                        value={arrayToString(dayItem.videoUploadLinks)}
                                        onChange={(e) => handleDayFieldChange(idx, "videoUploadLinks", stringToArray(e.target.value))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y min-h-[52px] shadow-xs"
                                        placeholder="Paste Video / Reel URLs (comma separated)..."
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-4 mt-auto">
                        <button
                          type="button"
                          onClick={() => setIsDrawerOpen(false)}
                          className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-200/80 hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingSheet}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${isSubmittingSheet ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                        >
                          {isSubmittingSheet ? "Compiling Matrix..." : "Deploy Strategy Manifest"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
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