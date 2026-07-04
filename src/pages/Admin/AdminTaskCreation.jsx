import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import TaskStats from "../../components/taskCreation/TaskStats";
import TaskGrid from "../../components/taskCreation/TaskGrid";
import CreateTaskButton from "../../components/taskCreation/CreateTaskButton";
import CreateTaskModal from "../../components/taskCreation/CreateTaskModal";

import { fetchAllTasks } from "../../components/taskCreation/tasks";

const AdminTaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const data = await fetchAllTasks();

      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const role = (user?.role || user?.data?.role || user?.user?.role || "")
    .trim()
    .toLowerCase();

  const handleTaskClick = (task) => {
    navigate(`/${role}/tasks/${task.id}`);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Admin Tasks
            </h1>

            <p className="text-slate-500 mt-2 text-sm md:text-base">
              Assign and manage workflow tasks for your team.
            </p>
          </div>

          <CreateTaskButton
            title="Create Project"
            onClick={() => setOpenModal(true)}
          />
        </div>

        {/* STATS */}
        <TaskStats tasks={tasks} />

        {/* GRID */}
        <div className="mt-6">
          <TaskGrid
            tasks={tasks}
            loading={isLoading}
            onTaskClick={handleTaskClick}
          />
        </div>

        {/* MODAL */}
        <CreateTaskModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      </div>
    </div>
  );
};

export default AdminTaskPage;
