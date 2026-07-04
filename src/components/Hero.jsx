// import { useState, useEffect } from "react";
// import { Play, Pause, Square } from "lucide-react";
// import { motion } from "framer-motion";

// export default function AttendanceHero() {
//   const [time, setTime] = useState(new Date());
//   const [status, setStatus] = useState("idle");
//   const [seconds, setSeconds] = useState(0);
//   const [lastAction, setLastAction] = useState(null);

//   useEffect(() => {
//     const id = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(id);
//   }, []);

//   useEffect(() => {
//     let id;
//     if (status === "running") {
//       id = setInterval((s) => setSeconds((s) => s + 1), 1000);
//     }
//     return () => clearInterval(id);
//   }, [status]);

//   const format = (s) => {
//     const h = String(Math.floor(s / 3600)).padStart(2, "0");
//     const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
//     const sec = String(s % 60).padStart(2, "0");
//     return `${h}:${m}:${sec}`;
//   };

//   const handleStart = () => {
//     setStatus("running");
//     setLastAction(`Started at ${new Date().toLocaleTimeString()}`);
//   };

//   const handlePause = () => {
//     setStatus("paused");
//     setLastAction(`Paused at ${new Date().toLocaleTimeString()}`);
//   };

//   const handleResume = () => {
//     setStatus("running");
//     setLastAction(`Resumed at ${new Date().toLocaleTimeString()}`);
//   };

//   const handleStop = () => {
//     setStatus("idle");
//     setSeconds(0);
//     setLastAction(`Stopped at ${new Date().toLocaleTimeString()}`);
//   };

//   return (
//     <section className="relative overflow-hidden max-w-[1400px] mx-auto px-5 py-1 0 grid lg:grid-cols-2 gap-20 items-center">

//       {/* BACKGROUND DECOR */}
//       <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-indigo-100 rounded-full blur-3xl opacity-30" />
//       <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-purple-100 rounded-full blur-3xl opacity-30" />

//       {/* LEFT */}
//       <div className="relative z-10">
//         <motion.h1
//           initial={{ opacity: 0, y: 15 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-5xl font-semibold tracking-tight text-zinc-900 leading-tight"
//         >
//           Own your time, <br />
//           <span className="text-zinc-400 font-normal">
//             not just your tasks
//           </span>
//         </motion.h1>

//         <p className="mt-6 text-zinc-500 max-w-md">
//           Smart attendance tracking designed for focused teams. Start, pause, and monitor your work with precision.
//         </p>

//         {/* STATS */}
//         <div className="mt-12 flex gap-12">
//           <div>
//             <p className="text-xs text-zinc-400 uppercase">Today</p>
//             <p className="text-2xl font-semibold">{format(seconds)}</p>
//           </div>

//           <div>
//             <p className="text-xs text-zinc-400 uppercase">Status</p>
//             <p
//               className={`text-2xl font-semibold capitalize ${
//                 status === "running"
//                   ? "text-indigo-600"
//                   : status === "paused"
//                   ? "text-yellow-500"
//                   : "text-zinc-500"
//               }`}
//             >
//               {status}
//             </p>
//           </div>
//         </div>

//         {lastAction && (
//           <p className="mt-6 text-sm text-zinc-400">{lastAction}</p>
//         )}
//       </div>

//       {/* RIGHT CARD */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="relative z-10 p-10 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
//       >
//         {/* TIME */}
//         <div className="flex justify-between mb-10">
//           <div>
//             <p className="text-sm text-zinc-400">
//               {time.toLocaleDateString()}
//             </p>
//             <p className="text-lg font-medium">
//               {time.toLocaleTimeString()}
//             </p>
//           </div>
//         </div>

//         {/* TIMER */}
//         <div className="text-center mb-10">
//           <motion.div
//             animate={
//               status === "running"
//                 ? { scale: [1, 1.03, 1] }
//                 : { scale: 1 }
//             }
//             transition={{
//               repeat: status === "running" ? Infinity : 0,
//               duration: 1.5,
//             }}
//             className="text-6xl font-semibold tracking-tight"
//           >
//             {format(seconds)}
//           </motion.div>

//           <p className="text-sm text-zinc-500 mt-2">
//             {status === "idle" && "Start your shift"}
//             {status === "running" && "You're working"}
//             {status === "paused" && "On a break"}
//           </p>
//         </div>

//         {/* ACTIONS */}
//         <div className="flex justify-center gap-4">

//           {status === "idle" && (
//             <motion.button
//               whileHover={{ scale: 1.03 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={handleStart}
//               className="px-6 py-3 rounded-xl bg-black text-white text-sm font-medium flex items-center gap-2"
//             >
//               <Play size={16} /> Start
//             </motion.button>
//           )}

//           {status !== "idle" && (
//             <>
//               <motion.button
//                 whileHover={{ scale: 1.03 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={status === "running" ? handlePause : handleResume}
//                 className="px-6 py-3 rounded-xl border text-sm font-medium flex items-center gap-2"
//               >
//                 {status === "running" ? <Pause size={16} /> : <Play size={16} />}
//                 {status === "running" ? "Break" : "Resume"}
//               </motion.button>

//               <motion.button
//                 whileHover={{ scale: 1.03 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={handleStop}
//                 className="px-6 py-3 rounded-xl bg-zinc-100 text-sm font-medium flex items-center gap-2"
//               >
//                 <Square size={14} /> Stop
//               </motion.button>
//             </>
//           )}
//         </div>
//       </motion.div>
//     </section>
//   );
// }
