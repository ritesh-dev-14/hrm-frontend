import {
  Calendar,
  ArrowUpRight,
  Users,
} from "lucide-react";

const statusStyles = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200",

  in_progress:
    "bg-blue-50 text-blue-700 border-blue-200",

  completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200",

  blocked:
    "bg-red-50 text-red-700 border-red-200",

  review:
    "bg-violet-50 text-violet-700 border-violet-200",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-700",

  medium:
    "bg-orange-100 text-orange-700",

  high:
    "bg-red-100 text-red-700",
};

const TaskCard = ({ task, onClick }) => {
  return (
    <button
      onClick={() => onClick?.(task)}
      className="group w-full text-left rounded-[28px] border border-slate-200 bg-white p-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      {/* TOP */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                statusStyles[task.status]
              }`}
            >
              {task.status.replace("_", " ")}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                priorityStyles[task.priority]
              }`}
            >
              {task.priority}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            {task.title}
          </h3>

          <p className="text-sm text-slate-500 mt-2 line-clamp-2">
            {task.description}
          </p>
        </div>

        <ArrowUpRight className="text-slate-300 group-hover:text-slate-900 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-300" />
      </div>

      {/* PROGRESS */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 font-medium">
            Progress
          </span>

          <span className="text-xs font-semibold text-slate-700">
            {task.progress}%
          </span>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${task.progress}%` }}
            className="h-full rounded-full bg-slate-900"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={task.assignedManager?.avatar ||
"https://i.pravatar.cc/150?img=12"}
            alt="manager"
            className="w-10 h-10 rounded-full object-cover"
          />

          <div>
            <p className="text-xs text-slate-400">
              Assigned Manager
            </p>

            <p className="text-sm font-semibold text-slate-700">
              {task.assignedManager?.name || "Unknown"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-slate-500 mb-1">
            <Calendar size={12} />

            <span>{task.dueDate}</span>
          </div>

          <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
            <Users size={12} />

            <span>
              {task.totalEmployees} Members
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default TaskCard;