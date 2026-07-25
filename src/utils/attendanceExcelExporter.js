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

  const excelRows = [];

  (allUsers || []).forEach((user) => {
    const userId = user.id || user._id;
    const empId = user.employeeId;

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalHalfDay = 0;
    let totalWorkingHours = 0;

    const row = {
      "Employee Name": user.name || "N/A",
      "Employee ID": user.employeeId || "N/A",
      "Department": user.department?.name || user.department || "N/A",
      "Role": user.role || "EMPLOYEE",
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const rec = recordMap.get(`${userId}_${day}`) || recordMap.get(`${empId}_${day}`);
      const colHeader = `${monthName.slice(0, 3)} ${day}`;

      if (rec) {
        const status = rec.status;
        totalWorkingHours += rec.totalHours || 0;

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
