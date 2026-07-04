import { useState } from "react";
import TaskCard from "./TaskCard";
import {
  Loader2,
  ClipboardList,
} from "lucide-react";

const TaskGrid = ({
  tasks = [],
  loading = false,
  onTaskClick,
}) => {



  // LOADING STATE
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[420px] flex flex-col items-center justify-center">

        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <Loader2
            size={30}
            className="animate-spin text-slate-500"
          />
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Loading Tasks
        </h3>

        <p className="text-sm text-slate-500">
          Please wait while we fetch tasks...
        </p>
      </div>
    );
  }

  // EMPTY STATE
  if (!tasks?.length) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm min-h-[420px] flex flex-col items-center justify-center px-6 text-center">

        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <ClipboardList
            size={28}
            className="text-slate-400"
          />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          No Tasks Yet
        </h2>

        <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed">
          Start by creating a new task and assign work to employees or managers.
        </p>
      </div>
    );
  }
  const [isLoading, setisLoading] = useState(false)
  // TASK GRID
  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-3xl overflow-hidden">
          {/* TOP */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                All Projects
              </h2>

            
            </div>

            <div className="text-sm text-slate-400">
              {tasks.length} Records
            </div>
          </div>

          {/* LOADING */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2
                size={28}
                className="animate-spin text-slate-400"
              />

              <p className="text-sm text-slate-400 mt-3">
                Loading tasks...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-24 text-center">
              <ClipboardList
                size={34}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-lg font-medium text-slate-800">
                No Tasks Found
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Created projects will appear here
              </p>
            </div>
          ) : (
            <div>
              {/* TABLE HEADER */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-400">
                <div className="col-span-4">Projects</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Start</div>
                <div className="col-span-2">End</div>
                <div className="col-span-2">Created By</div>
              </div>

              {/* ROWS */}
              <div>
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`group px-6 py-5 cursor-pointer transition hover:bg-slate-50 ${
                      index !== tasks.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    {/* DESKTOP */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      {/* TASK */}
                      <div className="col-span-4">
                        <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-black">
                          {task.projectName}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {task.description || "No description"}
                        </p>
                      </div>

                      {/* STATUS */}
                      <div className="col-span-2">
                        <span
                          className={`text-sm font-medium ${
                            statusStyles[task.status]
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      {/* START */}
                      <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays size={15} />
                        {formatDate(task.startDate)}
                      </div>

                      {/* END */}
                      <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDays size={15} />
                        {formatDate(task.endDate)}
                      </div>

                      {/* USER */}
                      <div className="col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User2
                              size={14}
                              className="text-slate-500"
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {task.createdBy?.name || "-"}
                            </p>

                            <p className="text-xs text-slate-400 truncate">
                              {task.createdBy?.employeeId}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          size={18}
                          className="text-slate-300 group-hover:text-slate-500 transition"
                        />
                      </div>
                    </div>

                    {/* MOBILE */}
                    <div className="lg:hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {task.projectName}
                          </h3>

                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>

                        <span
                          className={`text-xs font-medium whitespace-nowrap ${
                            statusStyles[task.status]
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            Start Date
                          </p>

                          <p className="text-sm text-slate-700">
                            {formatDate(task.startDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            End Date
                          </p>

                          <p className="text-sm text-slate-700">
                            {formatDate(task.endDate)}
                          </p>
                        </div>
                      </div>

                      {task.createdBy && (
                        <div className="mt-5 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <User2
                              size={14}
                              className="text-slate-500"
                            />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {task.createdBy.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {task.createdBy.employeeId}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
  );
};

export default TaskGrid;