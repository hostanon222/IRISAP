import { motion } from 'framer-motion';

export default function GenerationProgress({ phase, progress }) {
  const phases = {
    ideation: {
      icon: '🤔',
      text: 'Generating concept...',
      color: 'green'
    },
    creation: {
      icon: '🎨',
      text: 'Drawing artwork...',
      color: 'blue'
    },
    reflection: {
      icon: '💭',
      text: 'Contemplating creation...',
      color: 'purple'
    }
  };

  const currentPhase = phases[phase] || phases.ideation;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-6 p-8 bg-black/90 border border-green-500 rounded-lg">
        {/* Phase Icon */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl"
        >
          {currentPhase.icon}
        </motion.div>

        {/* Progress Ring */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-green-900 stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            <motion.circle
              className="text-green-500 stroke-current"
              strokeWidth="8"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
              strokeDasharray="264"
              strokeDashoffset={264 - (progress * 264) / 100}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (progress * 264) / 100 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-mono text-green-500">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Status Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-500 font-mono text-lg text-center"
        >
          {currentPhase.text}
        </motion.div>
      </div>
    </div>
  );
} 