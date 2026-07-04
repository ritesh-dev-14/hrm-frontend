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