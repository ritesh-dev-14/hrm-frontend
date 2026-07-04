import {
  BriefcaseBusiness,
  Clock3,
  CheckCircle2,
  Activity,
} from "lucide-react";

const TaskStats = ({ tasks = [] }) => {
  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: BriefcaseBusiness,
    },
    {
      title: "Pending",
      value: tasks.filter(
        (task) => task.status === "PENDING"
      ).length,
      icon: Clock3,
    },
    {
      title: "Completed",
      value: tasks.filter(
        (task) => task.status === "COMPLETED"
      ).length,
      icon: CheckCircle2,
    },
    {
      title: "Active",
      value: tasks.filter(
        (task) =>
          task.status === "ASSIGNED" ||
          task.status === "IN_PROGRESS"
      ).length,
      icon: Activity,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl px-6 py-5 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200">
        {stats.map((item, index) => (
          <div
            key={index}
            className="px-4 py-2 first:pl-0 last:pr-0"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <item.icon size={16} strokeWidth={2} />

              <span className="text-xs uppercase tracking-wider font-medium">
                {item.title}
              </span>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              {item.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskStats;