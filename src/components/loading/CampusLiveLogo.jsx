import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CampusLiveIcon from '../common/CampusLiveIcon';

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
          className="absolute inset-0 rounded-2xl blur-3xl"
          style={{ background: 'rgba(99, 102, 241, 0.25)' }}
          animate={
            reduceMotion
              ? { opacity: 0.5 }
              : { opacity: [0.35, 0.65, 0.35], scale: [0.95, 1.08, 0.95] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <CampusLiveIcon className="w-full h-full" />
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
        Campus Social Platform
      </motion.p>
    </motion.div>
  );
});

export default CampusLiveLogo;
