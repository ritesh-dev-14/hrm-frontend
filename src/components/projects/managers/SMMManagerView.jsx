import React, { useState, useEffect } from "react";
import API from "../../../services/api";

const SMMManagerView = ({ projectId }) => {
  // Core Component State
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingSheet, setIsSubmittingSheet] = useState(false);

  // Historical Monthly Calendars State
  const [monthlySheets, setMonthlySheets] = useState([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [isPatchingDay, setIsPatchingDay] = useState(false);

  const [showFbPassword, setShowFbPassword] = useState(false);
const [showInstaPassword, setShowInstaPassword] = useState(false);

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
    projectStartDate: "",
  });

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

    // Map existing records to avoid nested scanning loops
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
        completeDays.push(existingDaysMap[dateKey]);
      } else {
        completeDays.push({
          date: calculatedISODate,
          reelType: "NONE",
          postType: "NONE",
          script: "",
          description: "",
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
        reelType: "NONE",
        postType: "NONE",
        script: "",
        description: "",
      });
    }
    setSheetDays(temporaryDaysArray);
  }, [sheetMeta.month, sheetMeta.year]);

  // Fetch Historical Calendars
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
      console.error("Error pulling history sheets:", err);
    } finally {
      setSheetsLoading(false);
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
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error communicating with infrastructure.",
      );
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
    updatedDays[index][fieldName] = value;
    setSheetDays(updatedDays);
  };

  // Inline Handler for modifying structural parameters inside a loaded target view
  const handleSelectedDayChange = (dayIndex, fieldName, value) => {
    if (!selectedCalendar) return;
    const updatedDays = [...selectedCalendar.days];
    updatedDays[dayIndex][fieldName] = value;
    setSelectedCalendar((prev) => ({ ...prev, days: updatedDays }));
  };

  // API Call: PATCH Project Base Operational Data
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
        projectStartDate: formData.projectStartDate
          ? new Date(formData.projectStartDate).toISOString()
          : null,
      };

      const response = await API.patch(`/api/projects/${projectId}`, payload);
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
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

  // API Call: POST Dynamic Monthly Planning Sheet Data
  const handlePostMonthlySheet = async (e) => {
    e.preventDefault();

    // Filter down matrix content: Only include lines where work notes or types are explicitly configured
    const activeDaysPayload = sheetDays.filter(
      (day) =>
        day.reelType !== "NONE" ||
        day.postType !== "NONE" ||
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
        days: activeDaysPayload,
      };

      const response = await API.post(
        `/api/projects/${projectId}/monthly-sheets`,
        payload,
      );
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        alert(
          `Monthly strategy sheet compiled successfully for period ${sheetMeta.month}/${sheetMeta.year}!`,
        );
        setIsDrawerOpen(false);
        fetchMonthlySheets(); // Refresh structural tables layout views
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

      // 1. Only include days that have actual content configured
      const activeDays = selectedCalendar.days.filter(
        (day) =>
          (day.reelType && day.reelType !== "NONE") ||
          (day.postType && day.postType !== "NONE") ||
          (day.script && day.script.trim() !== "") ||
          (day.description && day.description.trim() !== ""),
      );

      // 2. Clean up individual fields so 'NONE' keys are completely omitted
      const cleanedDays = activeDays.map(
        ({ date, reelType, postType, script, description }) => {
          const dayObj = { date };

          if (reelType && reelType !== "NONE") dayObj.reelType = reelType;
          if (postType && postType !== "NONE") dayObj.postType = postType;
          if (script && script.trim() !== "") dayObj.script = script;
          if (description && description.trim() !== "")
            dayObj.description = description;

          return dayObj;
        },
      );

      const payload = { days: cleanedDays };
      const response = await API.patch(
        `/api/projects/${projectId}/monthly-sheets/${selectedCalendar.id}`,
        payload,
      );
      const resData = response.data ? response.data : response;

      if (resData && resData.success) {
        alert("Tactical timeline entries synchronized successfully!");
        fetchMonthlySheets();
        if (resData.data) setSelectedCalendar(padCalendarDays(resData.data));
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
        <p
          style={{
            color: "#64748b",
            marginTop: "16px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Syncing workspace environment metrics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorCard}>
          <strong
            style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}
          >
            Module Configuration Sync Failed
          </strong>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Workspace Header Block */}
      <div style={styles.metaRow}>
        <span style={styles.idBadge}>
          PROJECT ID: {project?.id?.toUpperCase().slice(0, 8)}
        </span>
        <span style={styles.deptBadge}>
          {project?.department?.name || "Social Media"}
        </span>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>
          {project?.projectName || "Social Media Project Profile"}
        </h1>

        {/* Workspace toggle button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          style={styles.openDrawerBtn}
        >
          <svg
            style={{ width: "18px", height: "18px" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          Create Content Calendar
        </button>
      </div>

      {/* Strategy Summary */}
      <div style={styles.descriptionBox}>
        <h4 style={styles.sectionSub}>Project Description</h4>
        <p
          style={{
            margin: 0,
            color: "#334155",
            lineHeight: "1.6",
            fontSize: "14.5px",
          }}
        >
          {project?.description || "No strategic summary available."}
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={styles.detailsGrid}>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Execution Cycle</span>
          <span style={styles.tileValue}>{project?.frequency || "N/A"}</span>
        </div>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Project Start Date</span>
          <span style={styles.tileValue}>
            {project?.startDate
              ? new Date(project.startDate).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "N/A"}
          </span>
        </div>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Project End Date</span>
          <span style={styles.tileValue}>
            {project?.endDate
              ? new Date(project.endDate).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "N/A"}
          </span>
        </div>
        <div style={styles.infoTile}>
          <span style={styles.tileLabel}>Renewal Review</span>
          <span style={styles.tileValue}>
            {project?.renewalDate
              ? new Date(project.renewalDate).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Credentials Sub-Form */}
      <div style={styles.formCardContainer}>
        <h3 style={styles.formSectionHeading}>
          <svg
            style={{
              width: "20px",
              height: "20px",
              color: "#4f46e5",
              flexShrink: 0,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            ></path>
          </svg>
          Client's Key Imformation
        </h3>

        <form onSubmit={handlePatchDetails} style={styles.form}>
  <div style={styles.formGrid}>
    <div style={styles.formGroup}>
      <label style={styles.label}> Client's Name</label>
      <input
        type="text"
        name="clientName"
        value={formData.clientName}
        onChange={handleInputChange}
        style={styles.input}
        placeholder="e.g. Acme Corporation"
      />
    </div>
    <div style={styles.formGroup}>
      <label style={styles.label}>Client's Location</label>
      <input
        type="text"
        name="location"
        value={formData.location}
        onChange={handleInputChange}
        style={styles.input}
        placeholder="e.g. New York, NY"
      />
    </div>
    <div style={styles.formGroup}>
      <label style={styles.label}> Contact Number</label>
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleInputChange}
        style={styles.input}
        placeholder="e.g. 1234567890"
      />
    </div>
    <div style={styles.formGroup}>
      <label style={styles.label}>Project Execution Date</label>
      <input
        type="date"
        name="projectStartDate"
        value={formData.projectStartDate}
        onChange={handleInputChange}
        style={styles.input}
      />
    </div>
  </div>

  <h4 style={{ ...styles.groupHeading, marginTop: "20px" }}>
    Social Media Credentials
  </h4>
  <div style={styles.formGrid}>
    <div style={styles.formGroup}>
      <label style={styles.label}>Facebook Email</label>
      <input
        type="email"
        name="fbEmail"
        value={formData.fbEmail}
        onChange={handleInputChange}
        style={styles.input}
        placeholder="fb@enterprise-client.com"
      />
    </div>
    
    {/* Facebook Password with Visibility Toggle */}
    <div style={styles.formGroup}>
      <label style={styles.label}>Facebook Password</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={showFbPassword ? "text" : "password"}
          name="fbPassword"
          value={formData.fbPassword}
          onChange={handleInputChange}
          style={{ ...styles.input, paddingRight: "45px", width: "100%" }}
          placeholder="••••••••••••"
        />
        <button
          type="button"
          onClick={() => setShowFbPassword(!showFbPassword)}
          style={{
            position: "absolute",
            right: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            fontSize: "12px",
            fontWeight: "600",
            padding: "4px"
          }}
        >
          {showFbPassword ? "Hide" : "View"}
        </button>
      </div>
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>Instagram Email</label>
      <input
        type="text"
        name="instaEmail"
        value={formData.instaEmail}
        onChange={handleInputChange}
        style={styles.input}
        placeholder="insta@enterprise-client.com"
      />
    </div>
    
    {/* Instagram Password with Visibility Toggle */}
    <div style={styles.formGroup}>
      <label style={styles.label}>Instagram Password</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={showInstaPassword ? "text" : "password"}
          name="instaPassword"
          value={formData.instaPassword}
          onChange={handleInputChange}
          style={{ ...styles.input, paddingRight: "45px", width: "100%" }}
          placeholder="••••••••••••"
        />
        <button
          type="button"
          onClick={() => setShowInstaPassword(!showInstaPassword)}
          style={{
            position: "absolute",
            right: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            fontSize: "12px",
            fontWeight: "600",
            padding: "4px"
          }}
        >
          {showInstaPassword ? "Hide" : "View"}
        </button>
      </div>
    </div>
  </div>

  <div style={{ display: "flex", justifycontent: "flex-end", marginTop: "12px" }}>
    <button
      type="submit"
      disabled={isUpdating}
      style={isUpdating ? styles.saveBtnDisabled : styles.saveBtn}
    >
      {isUpdating ? "Updating Details..." : "Update Details"}
    </button>
  </div>
</form>
      </div>

      {/* ================= NEW COMPONENT WORKSPACE: MASTER HISTORICAL CALENDARS LIST ================= */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={styles.sectionHeading}>
           Monthly Content Calendars
        </h3>
        {sheetsLoading ? (
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Re-indexing calendar collection tree...
          </p>
        ) : monthlySheets.length > 0 ? (
          <div style={styles.drawerTableWrapper}>
            <table style={styles.tableElement}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.thCell}>Month</th>
                  <th style={styles.thCell}>Content Planned</th>
                  <th style={styles.thCell}>Content Uploaded</th>
                  <th style={styles.thCell}>Assigned By</th>
                  <th style={styles.thCell}>Moodboard </th>
                  <th style={{ ...styles.thCell, textAlignment: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlySheets.map((sheet) => (
                  <tr
                    key={sheet.id}
                    style={{
                      ...styles.tableRow,
                      backgroundColor:
                        selectedCalendar?.id === sheet.id
                          ? "#f0fdf4"
                          : "transparent",
                    }}
                  >
                    <td style={{ ...styles.tdCell, fontWeight: "700" }}>
                      {new Date(0, sheet.month - 1).toLocaleString(undefined, {
                        month: "long",
                      })}{" "}
                      {sheet.year}
                    </td>
                    <td style={styles.tdCell}>
                      🎬 {sheet.totalReels} R / 📝 {sheet.totalPosts} P
                    </td>
                    <td style={styles.tdCell}>
                      🚀 {sheet.totalReelsUploaded} R / ✨{" "}
                      {sheet.totalPostsUploaded} P
                    </td>
                    <td style={styles.tdCell}>
                      <span style={{ fontSize: "12px", fontWeight: "500" }}>
                        {sheet.createdBy?.name || "System Agent"}
                      </span>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                        {sheet.createdBy?.employeeId}
                      </div>
                    </td>
                    <td style={styles.tdCell}>
                      {sheet.moodBoardLink ? (
                        <a
                          href={sheet.moodBoardLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#4f46e5",
                            textDecoration: "none",
                            fontWeight: "500",
                          }}
                        >
                          View Blueprint🔗
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ ...styles.tdCell, textAlign: "right" }}>
                      <button
                        onClick={() =>
                          setSelectedCalendar(padCalendarDays(sheet))
                        }
                        style={
                          selectedCalendar?.id === sheet.id
                            ? styles.viewBtnActive
                            : styles.viewBtn
                        }
                      >
                        {selectedCalendar?.id === sheet.id
                          ? "Viewing Calendar"
                          : "Open Calendar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            No monthly strategy planning manifests initialized yet for this
            campaign node.
          </div>
        )}
      </div>

      {/* ================= INTERACTIVE DRILLDOWN VIEW: HISTORICAL SINGLE DAY WORKSPACE EDITING ================= */}
      {selectedCalendar && (
        <div
          style={{
            ...styles.formCardContainer,
            marginTop: "24px",
            borderColor: "#10b981",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#10b981",
                  textTransform: "uppercase",
                }}
              >

              </span>
              <h3
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "18px",
                  color: "#0f172a",
                }}
              >
                Calendar Timeline :{" "}
                {new Date(0, selectedCalendar.month - 1).toLocaleString(
                  undefined,
                  { month: "long" },
                )}{" "}
                {selectedCalendar.year}
              </h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleUpdateExistingCalendar}
                disabled={isPatchingDay}
                style={isPatchingDay ? styles.saveBtnDisabled : styles.saveBtn}
              >
                {isPatchingDay ? "Saving Updates..." : "Save Changes"}
              </button>
              <button
                onClick={() => setSelectedCalendar(null)}
                style={styles.cancelBtn}
              >
                Close Calendar
              </button>
            </div>
          </div>

          <div style={{ ...styles.drawerTableWrapper, maxHeight: "350px" }}>
            <table style={styles.tableElement}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={{ ...styles.thCell, width: "110px" }}>
                    Calendar Day
                  </th>
                  <th style={{ ...styles.thCell, width: "130px" }}>
                    Reel Type
                  </th>
                  <th style={{ ...styles.thCell, width: "130px" }}>
                    Post Type
                  </th>
                  <th style={styles.thCell}>Script</th>
                  <th style={styles.thCell}>References</th>
                </tr>
              </thead>
              <tbody>
                {selectedCalendar.days?.map((dayItem, index) => {
                  const calendarLabel = new Date(
                    dayItem.date,
                  ).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  });
                  return (
                    <tr key={dayItem.id || index} style={styles.tableRow}>
                      <td
                        style={{
                          ...styles.tdCell,
                          fontWeight: "700",
                          color: "#0f172a",
                        }}
                      >
                        {calendarLabel}
                      </td>
                      <td style={styles.tdCell}>
                        <select
                          value={dayItem.reelType}
                          onChange={(e) =>
                            handleSelectedDayChange(
                              index,
                              "reelType",
                              e.target.value,
                            )
                          }
                          style={styles.tableSelect}
                        >
                          <option value="NONE">NONE</option>
                          <option value="SHOOT">SHOOT</option>
                          <option value="AI">AI</option>
                        </select>
                      </td>
                      <td style={styles.tdCell}>
                        <select
                          value={dayItem.postType}
                          onChange={(e) =>
                            handleSelectedDayChange(
                              index,
                              "postType",
                              e.target.value,
                            )
                          }
                          style={styles.tableSelect}
                        >
                          <option value="NONE">NONE</option>
                          <option value="SHOOT">SHOOT</option>
                          <option value="AI">AI</option>
                        </select>
                      </td>
                      <td style={styles.tdCell}>
                        <input
                          type="text"
                          value={dayItem.script || ""}
                          onChange={(e) =>
                            handleSelectedDayChange(
                              index,
                              "script",
                              e.target.value,
                            )
                          }
                          style={styles.tableInput}
                          placeholder="Write story hook notes..."
                        />
                      </td>
                      <td style={styles.tdCell}>
                        <input
                          type="text"
                          value={dayItem.description || ""}
                          onChange={(e) =>
                            handleSelectedDayChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          style={styles.tableInput}
                          placeholder="Frame instructions..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stakeholder Profiles */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={styles.sectionHeading}>Co-Assigned Managers</h3>
        {project?.assignments?.length > 0 ? (
          <div style={styles.managerGrid}>
            {project.assignments.map((assignment) => (
              <div key={assignment.id} style={styles.managerCard}>
                <div style={styles.avatar}>
                  {assignment.manager?.name?.charAt(0) || "M"}
                </div>
                <div>
                  <div style={styles.mgrName}>{assignment.manager?.name}</div>
                  <div style={styles.mgrRole}>
                    {assignment.manager?.position || "Manager"}
                  </div>
                  <div style={styles.mgrId}>
                    ID: {assignment.manager?.employeeId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            No other management stakeholders assigned to this project tracker.
          </div>
        )}
      </div>

      {/* ================= CREATE NEW STRATEGY WORKSPACE (DRAWER SIDE-MODAL) ================= */}
      {isDrawerOpen && (
        <div style={styles.drawerOverlay}>
          <div style={styles.drawerSheetContainer}>
            <div style={styles.drawerHeader}>
              <div>
                <span style={styles.drawerSubtitle}>
                  WORKSPACE SHEET COMPILER
                </span>
                <h2 style={styles.drawerTitle}>
                  Deploy New Strategy Content Sheet
                </h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={styles.closeDrawerBtn}
              >
                <svg
                  style={{ width: "20px", height: "20px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <form
              onSubmit={handlePostMonthlySheet}
              style={styles.drawerFormBody}
            >
              <div style={styles.drawerConfigGrid}>
                <div
                  style={{
                    ...styles.formCardContainer,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <h4 style={styles.groupHeading}>Target Strategy Period</h4>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Month</label>
                      <select
                        name="month"
                        value={sheetMeta.month}
                        onChange={handleMetaChange}
                        style={styles.input}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString(undefined, {
                              month: "long",
                            })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>Year</label>
                      <select
                        name="year"
                        value={sheetMeta.year}
                        onChange={handleMetaChange}
                        style={styles.input}
                      >
                        {[2025, 2026, 2027, 2028].map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.formCardContainer,
                    backgroundColor: "#ffffff",
                    gridColumn: "span 2",
                  }}
                >
                  <h4 style={styles.groupHeading}>
                    Target Key Metrics & Deliverables
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                    }}
                  >
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Planned Reels</label>
                      <input
                        type="number"
                        name="totalReels"
                        min="0"
                        value={sheetMeta.totalReels}
                        onChange={handleMetaChange}
                        style={styles.input}
                        placeholder="20"
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Planned Posts</label>
                      <input
                        type="number"
                        name="totalPosts"
                        min="0"
                        value={sheetMeta.totalPosts}
                        onChange={handleMetaChange}
                        style={styles.input}
                        placeholder="15"
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Live Reels</label>
                      <input
                        type="number"
                        name="totalReelsUploaded"
                        min="0"
                        value={sheetMeta.totalReelsUploaded}
                        onChange={handleMetaChange}
                        style={styles.input}
                        placeholder="0"
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Live Posts</label>
                      <input
                        type="number"
                        name="totalPostsUploaded"
                        min="0"
                        value={sheetMeta.totalPostsUploaded}
                        onChange={handleMetaChange}
                        style={styles.input}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.formGroup, marginTop: "4px" }}>
                <label style={styles.label}>
                  Shared Blueprint Moodboard Asset URL Link
                </label>
                <input
                  type="url"
                  name="moodBoardLink"
                  value={sheetMeta.moodBoardLink}
                  onChange={handleMetaChange}
                  style={styles.input}
                  placeholder="https://figma.com/file/... or Pinterest space links"
                />
              </div>

              <div
                style={{
                  marginTop: "12px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h4 style={styles.groupHeading}>
                  Daily Tactical Matrix Breakdown (*Only 1 row required to save)
                </h4>

                <div style={styles.drawerTableWrapper}>
                  <table style={styles.tableElement}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={{ ...styles.thCell, width: "100px" }}>
                          Calendar Day
                        </th>
                        <th style={{ ...styles.thCell, width: "130px" }}>
                          Reel Type
                        </th>
                        <th style={{ ...styles.thCell, width: "130px" }}>
                          Static Post Type
                        </th>
                        <th style={styles.thCell}>
                          Narrative / Script Writing
                        </th>
                        <th style={styles.thCell}>Visual References / Brief</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetDays.map((dayItem, idx) => {
                        const calendarLabel = new Date(
                          dayItem.date,
                        ).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          timeZone: "UTC",
                        });
                        return (
                          <tr key={idx} style={styles.tableRow}>
                            <td
                              style={{
                                ...styles.tdCell,
                                fontWeight: "700",
                                color: "#0f172a",
                              }}
                            >
                              {calendarLabel}
                            </td>
                            <td style={styles.tdCell}>
                              <select
                                value={dayItem.reelType}
                                onChange={(e) =>
                                  handleDayFieldChange(
                                    idx,
                                    "reelType",
                                    e.target.value,
                                  )
                                }
                                style={styles.tableSelect}
                              >
                                <option value="NONE">NONE</option>
                                <option value="SHOOT">SHOOT</option>
                                <option value="AI">AI</option>
                              </select>
                            </td>
                            <td style={styles.tdCell}>
                              <select
                                value={dayItem.postType}
                                onChange={(e) =>
                                  handleDayFieldChange(
                                    idx,
                                    "postType",
                                    e.target.value,
                                  )
                                }
                                style={styles.tableSelect}
                              >
                                <option value="NONE">NONE</option>
                                <option value="SHOOT">SHOOT</option>
                                <option value="AI">AI</option>
                              </select>
                            </td>
                            <td style={styles.tdCell}>
                              <input
                                type="text"
                                value={dayItem.script}
                                onChange={(e) =>
                                  handleDayFieldChange(
                                    idx,
                                    "script",
                                    e.target.value,
                                  )
                                }
                                style={styles.tableInput}
                                placeholder="Add script details..."
                              />
                            </td>
                            <td style={styles.tdCell}>
                              <input
                                type="text"
                                value={dayItem.description}
                                onChange={(e) =>
                                  handleDayFieldChange(
                                    idx,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                style={styles.tableInput}
                                placeholder="Frame instructions..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={styles.drawerFooter}>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSheet}
                  style={
                    isSubmittingSheet
                      ? styles.sheetBtnDisabled
                      : styles.sheetBtn
                  }
                >
                  {isSubmittingSheet
                    ? "Compiling..."
                    : "Save Strategy Manifest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Style Object Modifications */
const styles = {
  container: {
    maxWidth: "950px",
    margin: "40px auto",
    padding: "32px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
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
    gap: "10px",
    marginBottom: "16px",
    alignItems: "center",
  },
  idBadge: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.5px",
  },
  deptBadge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
  },
  title: { fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 },
  descriptionBox: {
    backgroundColor: "#f8fafc",
    borderLeft: "4px solid #4f46e5",
    padding: "18px",
    borderRadius: "0 12px 12px 0",
    marginBottom: "28px",
  },
  sectionSub: {
    margin: "0 0 8px 0",
    color: "#4f46e5",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "36px",
  },
  infoTile: {
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  tileLabel: {
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  tileValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    marginTop: "6px",
  },
  formCardContainer: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    backgroundColor: "#f8fafc",
  },
  formSectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "0 0 24px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  groupHeading: {
    margin: "0 0 14px 0",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.75px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "6px",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#334155" },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  saveBtn: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    border: "none",
    padding: "12px 26px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  saveBtnDisabled: {
    backgroundColor: "#94a3b8",
    color: "#ffffff",
    border: "none",
    padding: "12px 26px",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontSize: "14px",
    fontWeight: "600",
  },
  openDrawerBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  viewBtn: {
    padding: "6px 14px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  viewBtnActive: {
    padding: "6px 14px",
    borderRadius: "6px",
    border: "1px solid #10b981",
    backgroundColor: "#10b981",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  drawerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 9999,
  },
  drawerSheetContainer: {
    width: "100%",
    maxWidth: "1000px",
    backgroundColor: "#ffffff",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  drawerTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
  },
  drawerSubtitle: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: "1px",
  },
  closeDrawerBtn: {
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "#64748b",
  },
  drawerFormBody: {
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    flex: 1,
    overflowY: "auto",
  },
  drawerConfigGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "20px",
  },
  drawerTableWrapper: {
    flex: 1,
    overflowY: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginTop: "8px",
    minHeight: "200px",
  },
  tableElement: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "13px",
  },
  thRow: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  thCell: {
    padding: "14px",
    color: "#475569",
    fontWeight: "700",
    fontSize: "11px",
    textTransform: "uppercase",
  },
  tableRow: { borderBottom: "1px solid #f1f5f9" },
  tdCell: { padding: "10px 14px", verticalAlign: "middle" },
  tableSelect: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    backgroundColor: "#ffffff",
  },
  tableInput: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  drawerFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    padding: "20px 0",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  sheetBtn: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    padding: "12px 28px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  sheetBtnDisabled: {
    backgroundColor: "#94a3b8",
    color: "#ffffff",
    border: "none",
    padding: "12px 28px",
    borderRadius: "8px",
    cursor: "not-allowed",
    fontSize: "14px",
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "10px",
  },
  managerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  managerCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },
  mgrName: { fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  mgrRole: { fontSize: "12px", color: "#64748b" },
  mgrId: { fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" },
  emptyState: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    backgroundColor: "#f8fafc",
  },
  errorCard: {
    padding: "18px 24px",
    backgroundColor: "#fef2f2",
    borderLeft: "4px solid #ef4444",
    borderRadius: "8px",
    color: "#991b1b",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3.5px solid #e2e8f0",
    borderTop: "3.5px solid #4f46e5",
    borderRadius: "50%",
  },
};

export default SMMManagerView;
