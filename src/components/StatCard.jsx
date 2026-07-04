export const StatCard = ({ label, value, Icon }) => (
  <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex justify-between items-center w-full min-w-70">
    <div className="flex flex-col gap-1">
      <p className="text-zinc-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-zinc-900 tabular-nums">{value}</p>
    </div>
    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
      <Icon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
    </div>
  </div>
);

// components/Button.jsx
export const Button = ({ children, variant = 'primary', onClick, icon: Icon }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200',
    secondary: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 shadow-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200 active:scale-95`}
    >
      <span>{children}</span>
      {Icon && <Icon size={18} />}
    </button>
  );
};