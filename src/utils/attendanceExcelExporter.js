import * as XLSX from "xlsx";

/**
 * Exports monthly attendance report to Excel (.xlsx) file.
 * 
 * @param {Object} options
 * @param {Array} options.allUsers - List of all employees/users.
 * @param {Array} options.allRecords - List of attendance records.
 * @param {number} options.year - Year (e.g., 2026).
 * @param {number} options.month - Month (1-12, e.g. 7 for July).
 */
export const exportMonthlyAttendanceExcel = ({
  allUsers = [],
  allRecords = [],
  departmentsMap = new Map(),
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
}) => {
  // Number of days in the selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[month - 1];

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === Number(year) && (today.getMonth() + 1) === Number(month);
  const currentDayNumber = today.getDate();

  // Index records by key: `${userId || employeeId}_${dayNumber}`
  const recordMap = new Map();
  (allRecords || []).forEach((r) => {
    if (!r.date) return;
    const rDateObj = new Date(r.date);
    const rYear = rDateObj.getFullYear();
    const rMonth = rDateObj.getMonth() + 1;
    const rDay = rDateObj.getDate();

    if (rYear === Number(year) && rMonth === Number(month)) {
      const userId = r.userId || r.user?.id || r.user?._id;
      const empId = r.user?.employeeId;
      if (userId) recordMap.set(`${userId}_${rDay}`, r);
      if (empId) recordMap.set(`${empId}_${rDay}`, r);
    }
  });

  // Helper function to resolve department name reliably
  const resolveDepartmentName = (u) => {
    // 1. Direct department object name
    if (u?.department?.name) return u.department.name;
    
    // 2. Direct string department (if not a UUID format)
    if (typeof u?.department === "string" && u.department.trim().length > 0) {
      const isUuid = u.department.match(/^[0-9a-fA-F-]{24,36}$/);
      if (!isUuid) return u.department.trim();
    }

    // 3. Lookup departmentId / department_id / department in departmentsMap
    const deptId = u?.departmentId || u?.department_id || (typeof u?.department === "string" ? u.department : null);
    if (deptId && departmentsMap.has(String(deptId))) {
      return departmentsMap.get(String(deptId));
    }

    // 4. Check departments array if user has multiple assigned departments
    if (Array.isArray(u?.departments) && u.departments.length > 0) {
      const names = u.departments
        .map((d) => (typeof d === "object" ? d.name : departmentsMap.get(String(d)) || d))
        .filter((n) => n && typeof n === "string" && !n.match(/^[0-9a-fA-F-]{24,36}$/));
      if (names.length > 0) return names.join(", ");
    }

    // 5. Inspect attendance records for this user to check if record.user.department exists
    const uId = u?.id || u?._id;
    const eId = u?.employeeId;
    for (let day = 1; day <= daysInMonth; day++) {
      const rec = recordMap.get(`${uId}_${day}`) || recordMap.get(`${eId}_${day}`);
      if (rec?.user?.department?.name) return rec.user.department.name;
      if (typeof rec?.user?.department === "string" && rec.user.department && !rec.user.department.match(/^[0-9a-fA-F-]{24,36}$/)) {
        return rec.user.department;
      }
      if (rec?.user?.departmentId && departmentsMap.has(String(rec.user.departmentId))) {
        return departmentsMap.get(String(rec.user.departmentId));
      }
    }

    // 6. Position or clean fallback
    if (u?.position) return u.position;
    return "General Staff";
  };

  const excelRows = [];

  (allUsers || []).forEach((user) => {
    const userId = user.id || user._id;
    const empId = user.employeeId;

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalHalfDay = 0;

    const row = {
      "Employee Name": user.name || "N/A",
      "Employee ID": user.employeeId || "N/A",
      "Department": resolveDepartmentName(user),
      "Role": user.role || "EMPLOYEE",
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const rec = recordMap.get(`${userId}_${day}`) || recordMap.get(`${empId}_${day}`);
      const colHeader = `${monthName.slice(0, 3)} ${day}`;

      if (rec) {
        const status = rec.status;

        if (status === "PRESENT") {
          row[colHeader] = "Present";
          totalPresent++;
        } else if (status === "HALF_DAY") {
          row[colHeader] = "Half Day";
          totalPresent += 0.5;
          totalHalfDay++;
        } else if (status === "LEAVE" || status === "ON_LEAVE") {
          row[colHeader] = "Leave";
          totalLeave++;
        } else if (status === "HOLIDAY") {
          row[colHeader] = "Holiday";
        } else if (status === "ABSENT") {
          row[colHeader] = "Absent";
          totalAbsent++;
        } else {
          row[colHeader] = status;
        }
      } else {
        // If date is in the future for current month
        if (isCurrentMonth && day > currentDayNumber) {
          row[colHeader] = "-";
        } else {
          row[colHeader] = "Absent";
          totalAbsent++;
        }
      }
    }

    row["Total Present"] = totalPresent;
    row["Total Absent"] = totalAbsent;
    row["Total Leave"] = totalLeave;

    excelRows.push(row);
  });

  if (excelRows.length === 0) {
    excelRows.push({
      "Notice": "No attendance data available for the selected period."
    });
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Set column widths
  const colWidths = [
    { wch: 22 }, // Name
    { wch: 14 }, // ID
    { wch: 18 }, // Dept
    { wch: 14 }, // Role
  ];

  for (let i = 1; i <= daysInMonth; i++) {
    colWidths.push({ wch: 10 }); // Day columns
  }

  colWidths.push({ wch: 14 }); // Total Present
  colWidths.push({ wch: 14 }); // Total Absent
  colWidths.push({ wch: 14 }); // Total Leave

  worksheet["!cols"] = colWidths;

  // Create workbook & save
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance ${monthName} ${year}`);

  const fileName = `Attendance_Report_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
