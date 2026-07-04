import AttendanceView from "../../components/attendece/AttendenceView";

import useAttendance from "../../hooks/useAttendance";

export default function HrAttendance() {
  const {
    records,
    todayAttendance,
    loading,
  } = useAttendance();

  // PRESENT DAYS
  const totalPresent = records.filter(
    (r) => r.status === "PRESENT",
  ).length;

  // ABSENT DAYS
  const totalAbsent = records.filter(
    (r) => r.status === "ABSENT",
  ).length;

  // TODAY CLOCK IN
  const todayClockIn = todayAttendance?.startTime
    ? new Date(
        todayAttendance.startTime,
      ).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--";

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

  return (
    <AttendanceView
      stats={stats}
      records={records}
      loading={loading}
    />
  );
}