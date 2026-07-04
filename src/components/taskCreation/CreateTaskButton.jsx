import { Plus } from "lucide-react";

const CreateTaskButton = ({
  title,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-black px-6 py-3 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition" />

      <div className="relative flex items-center gap-2">
        <Plus size={18} />

        <span>{title}</span>
      </div>
    </button>
  );
};

export default CreateTaskButton;