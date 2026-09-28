export const getDeadlineStatus = (dueDate, status) => {
  if (!dueDate) return { label: "No Deadline", color: "bg-slate-100 text-slate-600 border-transparent" };
  
  if (['COMPLETED', 'VERIFIED'].includes(status)) {
    return { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue (${Math.abs(diffDays)}d)`, color: "bg-rose-100 text-rose-700 border-rose-200" };
  }
  
  if (diffDays === 0) {
    return { label: "Due Today", color: "bg-amber-100 text-amber-700 border-amber-200" };
  }
  
  if (diffDays === 1) {
    return { label: "Due Tomorrow", color: "bg-orange-100 text-orange-700 border-orange-200" };
  }
  
  if (diffDays <= 3) {
    return { label: "At Risk", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  }

  return { label: `Due in ${diffDays}d`, color: "bg-indigo-50 text-indigo-700 border-indigo-100" };
};
