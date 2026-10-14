import AttendanceView from "../../components/attendece/AttendenceView";
import useAttendance from "../../hooks/useAttendance";

export default function EmployeeAttendance() {
  const {
    records,
    todayAttendance,
    loading,
  } = useAttendance();

  const safeRecords = Array.isArray(records) ? records : [];

  // PRESENT DAYS
  const totalPresent = safeRecords.filter((r) => r && r.status === "PRESENT").length;

  // ABSENT DAYS
  const totalAbsent = safeRecords.filter((r) => r && r.status === "ABSENT").length;

  // TODAY CLOCK IN TIME
  let todayClockIn = "--";
  if (todayAttendance?.startTime) {
    try {
      const d = new Date(todayAttendance.startTime);
      if (!isNaN(d.getTime())) {
        todayClockIn = d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      todayClockIn = "--";
    }
  }

  const stats = [
    {
      label: "Days Present",
      value: totalPresent,
    },
    {
      label: "Days Absent",
      value: totalAbsent,
    },
    {
      label: "Today's Clock In",
      value: todayClockIn,
    },
  ];

  return <AttendanceView stats={stats} records={safeRecords} loading={loading} />;
}

