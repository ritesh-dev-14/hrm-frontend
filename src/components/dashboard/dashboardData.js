import {
  Calendar,
  FileText,
  DollarSign,
} from "lucide-react";

export const employeeStats = [
  {
    label: "This Week Hours",
    value: "42h",
    icon: Calendar,
    accent: "from-violet-500/10 to-violet-500/0",
    iconColor: "text-violet-600",
    progress: "bg-violet-500",
  },
  {
    label: "Tasks Completed",
    value: "18",
    icon: FileText,
    accent: "from-sky-500/10 to-sky-500/0",
    iconColor: "text-sky-600",
    progress: "bg-sky-500",
  },
  {
    label: "Performance Score",
    value: "92%",
    icon: DollarSign,
    accent: "from-emerald-500/10 to-emerald-500/0",
    iconColor: "text-emerald-600",
    progress: "bg-emerald-500",
  },
];

export const employeeActions = [
  {
    label: "Attendance History",
    sub: "View detailed logs",
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Apply Leave",
    sub: "Request time off",
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    label: "My Payslips",
    sub: "Payroll documents",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];