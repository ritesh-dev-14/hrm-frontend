import { Thermometer, Umbrella } from "lucide-react";

export default function LeaveStats({ stats }) {
  const leaveStats = [
    {
      label: "Sick Leave",
      icon: Thermometer,
      accentColor: "border-slate-700",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      data: stats?.sick,
    },
    {
      label: "Casual Leave",
      icon: Umbrella,
      accentColor: "border-slate-600",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      data: stats?.casual,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 font-sans">
      {leaveStats.map((stat, i) => {
        const data = stat.data || { total: 0, used: 0, left: 0 };
        const progressPercent =
          data.total > 0 ? (data.used / data.total) * 100 : 0;

        return (
          <div
            key={i}
            className="relative bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-5 hover:shadow-md transition-shadow duration-300"
          >
            {/* Vertical Accent Border */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1 ${stat.accentColor}`}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {stat.label}
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  <span className="font-bold text-slate-900">{data.left}</span>{" "}
                  days remaining
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <stat.icon size={18} className={stat.iconColor} />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-slate-700 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>
                  {data.used} of {data.total} used
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
