  import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function UrgentAlertModal({ isOpen, onClose, title, message, type = "error" }) {
  if (!isOpen) return null;

  const isError = type === "error";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-center"
        >
          <div className={`p-8 ${isError ? 'bg-red-50' : 'bg-orange-50'}`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-sm
              ${isError ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}
            >
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="p-6 bg-white border-t border-slate-100">
            <button
              onClick={onClose}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md
                ${isError ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'}`}
            >
              <CheckCircle size={20} />
              I Understand
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
