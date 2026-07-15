import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const LOGO_EASE = [0.22, 1, 0.36, 1];

const CampusLiveLogo = memo(function CampusLiveLogo() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: LOGO_EASE }}
    >
      <motion.div
        className="relative mb-5 sm:mb-6"
        animate={
          reduceMotion
            ? {}
            : { y: [0, -6, 0] }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-2xl blur-2xl"
          style={{ background: 'rgba(59, 130, 246, 0.45)' }}
          animate={
            reduceMotion
              ? { opacity: 0.5 }
              : { opacity: [0.35, 0.65, 0.35], scale: [0.95, 1.08, 0.95] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/25">
          <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-sm" strokeWidth={1.75} />
        </div>
      </motion.div>

      <motion.div
        className="flex items-baseline justify-center gap-2 whitespace-nowrap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: LOGO_EASE }}
      >
        <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-black text-white tracking-tight">
          CampusLive
        </h1>
        <span className="text-2xl sm:text-3xl md:text-[2.25rem] font-black tracking-tight text-indigo-400 hover:text-indigo-300 hover:drop-shadow-[0_0_12px_rgba(129,140,248,0.6)] transition-all duration-300 cursor-default">
          @VITAP
        </span>
      </motion.div>

      <motion.p
        className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-400/90 font-medium tracking-wide text-center max-w-[280px] sm:max-w-xs px-4 leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: LOGO_EASE }}
      >
        Building the Social Layer of Every Campus
      </motion.p>
    </motion.div>
  );
});

export default CampusLiveLogo;
