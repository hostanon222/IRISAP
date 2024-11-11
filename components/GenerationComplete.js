import { motion } from 'framer-motion';

export default function GenerationComplete({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col items-center gap-6 p-8 bg-black/90 border border-green-500 rounded-lg"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{ duration: 1 }}
          className="text-6xl"
        >
          ✨
        </motion.div>
        <h2 className="text-2xl font-mono text-green-500">Artwork Complete!</h2>
        <button
          onClick={onClose}
          className="px-6 py-2 border border-green-500 rounded-full
            hover:bg-green-500 hover:text-black transition-all"
        >
          View Result
        </button>
      </motion.div>
    </motion.div>
  );
} 