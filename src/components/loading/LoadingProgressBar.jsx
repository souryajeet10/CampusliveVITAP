import { memo } from 'react';
import { motion } from 'framer-motion';

const LoadingProgressBar = memo(function LoadingProgressBar({ progress = 0 }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto">
      <div
        className="relative h-1.5 rounded-full overflow-hidden bg-slate-800/80 border border-slate-700/40"
        role="progressbar"
        aria-valuenow={Math.round(clampedProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loading progress"
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${clampedProgress}%`,
            background:
              'linear-gradient(90deg, #2563eb 0%, #6366f1 45%, #8b5cf6 100%)',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.65), 0 0 4px rgba(59, 130, 246, 0.8)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        />

        <motion.div
          className="absolute inset-y-0 w-16 rounded-full opacity-40"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          }}
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
});

export default LoadingProgressBar;
