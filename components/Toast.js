import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, type = 'error', onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg font-mono text-sm z-50 flex items-center gap-2 ${
        type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-500' :
        type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-500' :
        'bg-blue-500/10 border border-blue-500/30 text-blue-500'
      }`}
    >
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </motion.div>
  );
} 