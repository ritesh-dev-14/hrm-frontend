// import { useState } from "react";
// import {
//   Thermometer,
//   Umbrella,
//   TreePalm,
//   Plus,
//   X,
//   FileText,
//   Calendar as CalendarIcon,
//   Send,
// } from "lucide-react";

// import { motion, AnimatePresence } from "framer-motion";

// export default function LeaveManagement() {
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const leaveStats = [
//     {
//       label: "Sick Leave",
//       count: 0,
//       icon: Thermometer,
//       color: "border-blue-500",
//     },
//     {
//       label: "Casual Leave",
//       count: 0,
//       icon: Umbrella,
//       color: "border-slate-400",
//     },
//     {
//       label: "Annual Leave",
//       count: 0,
//       icon: TreePalm,
//       color: "border-slate-400",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-white p-8 font-sans text-[#1F2937]">
//       {/* HEADER */}
//       <div className="flex justify-between items-start mb-10">
//         <div>
//           <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
//             Leave Management
//           </h1>
//           <p className="text-[#64748B] text-sm mt-1">
//             Your leave history and requests
//           </p>
//         </div>
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md active:scale-95"
//         >
//           <Plus size={18} strokeWidth={3} />
//           Apply for Leave
//         </button>
//       </div>

//       {/* STATS CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         {leaveStats.map((stat, i) => (
//           <div
//             key={i}
//             className={`relative flex items-center p-6 bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden`}
//           >
//             <div
//               className={`absolute left-0 top-0 bottom-0 w-1 ${stat.color} border-l-[3px]`}
//             />
//             <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] flex items-center justify-center mr-4">
//               <stat.icon size={22} className="text-[#64748B]" />
//             </div>
//             <div>
//               <p className="text-[14px] font-medium text-[#64748B]">
//                 {stat.label}
//               </p>
//               <div className="flex items-baseline gap-1 mt-0.5">
//                 <span className="text-2xl font-bold text-[#0F172A]">
//                   {stat.count}
//                 </span>
//                 <span className="text-[13px] text-slate-400 font-medium">
//                   taken
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* TABLE */}
//       <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
//         <table className="w-full text-left border-collapse">
//           <thead>
//             <tr className="bg-[#F8FAFC] uppercase text-[11px] tracking-[0.15em] font-bold text-[#64748B]">
//               <th className="px-6 py-4">Type</th>
//               <th className="px-6 py-4 text-center">Dates</th>
//               <th className="px-6 py-4 text-center">Reason</th>
//               <th className="px-6 py-4 text-right">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td
//                 colSpan="4"
//                 className="px-6 py-16 text-center text-[#94A3B8] text-sm font-medium"
//               >
//                 No leave applications found
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* MODAL COMPONENT */}
//       <AnimatePresence>
//         {isModalOpen && <LeaveModal onClose={() => setIsModalOpen(false)} />}
//       </AnimatePresence>
//     </div>
//   );
// }

// function LeaveModal({ onClose }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Backdrop */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
//       />

//       {/* Modal Content */}
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.95, y: 20 }}
//         className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
//       >
//         <div className="p-8">
//           <div className="flex justify-between items-start mb-6">
//             <div>
//               <h2 className="text-xl font-bold text-[#0F172A]">
//                 Apply for Leave
//               </h2>
//               <p className="text-sm text-[#64748B] mt-1">
//                 Submit your leave request for approval
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
//             >
//               <X size={20} />
//             </button>
//           </div>

//           <form className="space-y-6">
//             {/* Leave Type */}
//             <div>
//               <label className="flex items-center gap-2 text-[13px] font-bold text-[#475569] mb-2 uppercase tracking-wide">
//                 <FileText size={14} className="text-slate-400" />
//                 Leave Type
//               </label>
//               <select className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] outline-none transition-all appearance-none cursor-pointer">
//                 <option>Sick Leave</option>
//                 <option>Casual Leave</option>
//                 <option>Annual Leave</option>
//               </select>
//             </div>

//             {/* Duration */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="col-span-2 flex items-center gap-2 text-[13px] font-bold text-[#475569] uppercase tracking-wide">
//                 <CalendarIcon size={14} className="text-slate-400" />
//                 Duration
//               </div>
//               <div>
//                 <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1 ml-1">
//                   From
//                 </label>
//                 <input
//                   type="date"
//                   className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#6366F1] outline-none"
//                 />
//               </div>
//               <div>
//                 <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1 ml-1">
//                   To
//                 </label>
//                 <input
//                   type="date"
//                   className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:border-[#6366F1] outline-none"
//                 />
//               </div>
//             </div>

//             {/* Reason */}
//             <div>
//               <label className="block text-[13px] font-bold text-[#475569] mb-2 uppercase tracking-wide">
//                 Reason
//               </label>
//               <textarea
//                 placeholder="Briefly describe why you need this leave..."
//                 className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm h-28 focus:border-[#6366F1] outline-none resize-none placeholder:text-[#94A3B8]"
//               />
//             </div>

//             {/* Footer Buttons */}
//             <div className="flex gap-3 pt-2">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="flex-1 px-4 py-3 border border-[#E2E8F0] text-[#475569] font-bold rounded-xl hover:bg-slate-50 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] text-white font-bold rounded-xl hover:bg-[#4F46E5] transition-all shadow-lg shadow-indigo-100"
//               >
//                 <Send size={16} />
//                 Submit
//               </button>
//             </div>
//           </form>
//         </div>
//       </motion.div>
//     </div>
//   );
// }



import LeavePage from "../../components/leaves/LeavePage";

export default function EmployeeLeaves() {
  return <LeavePage />;
}