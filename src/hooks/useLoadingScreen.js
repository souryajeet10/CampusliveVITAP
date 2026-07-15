import { useState, useEffect, useRef, useMemo } from 'react';

export const MIN_DISPLAY_MS = 2000;
export const EASTER_EGG_MS = 5000;
export const MESSAGE_INTERVAL_MS = 2000;

export const LOADING_MESSAGES = [
  '📍 Loading Campus Map...',
  '🎉 Finding Activities...',
  '👥 Connecting Students...',
  '🗺 Preparing Campus...',
  '⚡ Syncing Live Updates...',
  '🔍 Loading Lost & Found...',
];

/**
 * Manages loading screen lifecycle: minimum display time, message rotation,
 * simulated progress, and easter-egg visibility.
 */
export function useLoadingScreen(isDataLoading) {
  const mountTime = useRef(Date.now());
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [phase, setPhase] = useState('loading'); // loading | exiting | complete

  const isReady = !isDataLoading && minTimeElapsed;

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowEasterEgg(true), EASTER_EGG_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase !== 'loading') return undefined;

    const tick = () => {
      const elapsed = Date.now() - mountTime.current;
      const target = isReady ? 100 : Math.min(92, 18 + elapsed / 45);
      setProgress((prev) => {
        const delta = target - prev;
        return prev + delta * 0.08;
      });
    };

    const interval = setInterval(tick, 32);
    return () => clearInterval(interval);
  }, [isReady, phase]);

  useEffect(() => {
    if (isReady && phase === 'loading') {
      setProgress(100);
      setPhase('exiting');
    }
  }, [isReady, phase]);

  useEffect(() => {
    if (phase !== 'exiting') return undefined;

    const timer = setTimeout(() => setPhase('complete'), 680);
    return () => clearTimeout(timer);
  }, [phase]);

  const currentMessage = useMemo(
    () => LOADING_MESSAGES[messageIndex],
    [messageIndex],
  );

  return {
    phase,
    progress,
    currentMessage,
    showEasterEgg,
    isVisible: phase !== 'complete',
  };
}
