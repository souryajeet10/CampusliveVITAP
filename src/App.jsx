import { lazy, Suspense, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from './components/MainLayout';
import LoadingScreen from './components/LoadingScreen';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

const Home = lazy(() => import('./pages/Home'));
const CampusMap = lazy(() => import('./pages/CampusMap'));
const LostFound = lazy(() => import('./pages/LostFound'));
const WhatsNext = lazy(() => import('./pages/WhatsNext'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Settings = lazy(() => import('./pages/Settings'));
const Events = lazy(() => import('./pages/Events'));

const APP_ENTER = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
};

const RouteFallback = () => (
  <div className="w-full min-h-[40vh] flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
  </div>
);

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showApp, setShowApp] = useState(false);

  const handleLoadingReady = useCallback(() => {
    setShowApp(true);
  }, []);

  return (
    <>
      {!showApp && (
        <LoadingScreen isDataLoading={isLoading} onReady={handleLoadingReady} />
      )}

      {showApp && (
        <motion.div
          className="min-h-screen"
          initial={APP_ENTER.initial}
          animate={APP_ENTER.animate}
          transition={APP_ENTER.transition}
        >
          {!isAuthenticated ? (
            <Suspense fallback={<RouteFallback />}>
              <Onboarding />
            </Suspense>
          ) : (
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route
                      path="live"
                      element={
                        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-850">
                          <h2 className="text-2xl font-bold text-slate-100 mb-2">Live Streams</h2>
                          <p className="text-gray-400">Placeholder for real-time video streaming components.</p>
                        </div>
                      }
                    />
                    <Route path="map" element={<CampusMap />} />
                    <Route path="lost-found" element={<LostFound />} />
                    <Route path="events" element={<Events />} />
                    <Route path="whats-next" element={<WhatsNext />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          )}
        </motion.div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
