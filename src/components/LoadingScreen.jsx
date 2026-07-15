import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoadingScreen } from '../hooks/useLoadingScreen';
import LoadingBackground from './loading/LoadingBackground';
import CampusLiveLogo from './loading/CampusLiveLogo';
import CampusMapAnimation from './loading/CampusMapAnimation';
import LoadingProgressBar from './loading/LoadingProgressBar';

const EXIT_TRANSITION = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1],
};

const LoadingScreen = memo(function LoadingScreen({ isDataLoading = true, onReady }) {
  const {
    phase,
    progress,
    currentMessage,
    showEasterEgg,
    isVisible,
  } = useLoadingScreen(isDataLoading);

  useEffect(() => {
    if (phase === 'complete') onReady?.();
  }, [phase, onReady]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="loading-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between overflow-hidden select-none"
          role="status"
          aria-live="polite"
          aria-busy={phase === 'loading'}
          aria-label="CampusLive is loading"
          initial={{ opacity: 1 }}
          animate={
            phase === 'exiting'
              ? { opacity: 0, scale: 0.96, filter: 'blur(8px)' }
              : { opacity: 1, scale: 1, filter: 'blur(0px)' }
          }
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          transition={EXIT_TRANSITION}
        >
          <LoadingBackground />

          <div className="relative z-10 flex flex-col items-center flex-1 w-full max-w-lg px-6 pt-12 sm:pt-16 pb-8 justify-center gap-6 sm:gap-8">
            <CampusLiveLogo />

            <div className="w-full flex flex-col items-center gap-5 sm:gap-6">
              <CampusMapAnimation />

              <div className="w-full flex flex-col items-center gap-3 min-h-[3rem]">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessage}
                    className="text-sm sm:text-base text-slate-300/90 font-medium text-center"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {currentMessage}
                  </motion.p>
                </AnimatePresence>

                <AnimatePresence>
                  {showEasterEgg && phase === 'loading' && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-slate-500/90 text-center"
                    >
                      Still loading... good things take time ☕
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <LoadingProgressBar progress={progress} />
            </div>
          </div>

          <motion.footer
            className="relative z-10 pb-6 sm:pb-8 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-[10px] sm:text-xs text-slate-600 text-center tracking-wide">
              Made for the VIT-AP Freshers Hackathon 2026
            </p>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default LoadingScreen;
