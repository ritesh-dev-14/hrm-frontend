import { motion } from "framer-motion";
import MainLogo from "../assets/logo.jpeg";

export default function ProfessionalLoader({ text = "Loading data..." }) {
  return (
    <div className="h-full w-full min-h-[450px] flex flex-col items-center justify-center p-8 bg-transparent">
      {/* Subtle architectural container frame */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl border border-zinc-200/80 bg-white/50 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        
        {/* Brand Logo with Rotating Ring */}
        <div className="relative flex items-center justify-center w-14 h-14 mb-5">
          {/* Outer spinning precision arc */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-zinc-900 border-r-zinc-400"
          />

          {/* Embedded Logo */}
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-zinc-200 bg-white shadow-sm flex items-center justify-center p-1">
            <img src={MainLogo} alt="We-Promote Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Dynamic Text */}
        {text && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <span className="text-[13px] font-semibold tracking-tight text-zinc-900">
              {text}
            </span>
            <span className="text-[11px] font-medium tracking-wide text-zinc-400 mt-1 uppercase">
              Please wait a moment
            </span>
          </motion.div>
        )}

        {/* Micro-loading progress bar simulation at bottom of card */}
        <div className="w-32 h-1 bg-zinc-100 rounded-full overflow-hidden mt-6">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="w-full h-full bg-zinc-900 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
