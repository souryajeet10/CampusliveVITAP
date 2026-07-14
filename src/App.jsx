import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

const Home = lazy(() => import('./pages/Home'));
const CampusMap = lazy(() => import('./pages/CampusMap'));
const LostFound = lazy(() => import('./pages/LostFound'));
const WhatsNext = lazy(() => import('./pages/WhatsNext'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Settings = lazy(() => import('./pages/Settings'));

// Shimmering suspense transition loading spinner
const PageLoader = () => (
  <div className="w-full h-screen bg-[#06090f] flex flex-col items-center justify-center p-12 select-none space-y-3">
    <div className="relative flex items-center justify-center w-10 h-10">
      <div className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/20 animate-ping" />
      <div className="w-6.5 h-6.5 border border-indigo-500/25 border-t-indigo-400 rounded-full animate-spin" />
    </div>
  </div>
);

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
            <Route 
              path="map" 
              element={<CampusMap />} 
            />
            <Route 
              path="lost-found" 
              element={<LostFound />} 
            />
            <Route 
              path="events" 
              element={
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-850">
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">Events</h2>
                  <p className="text-gray-400">Placeholder for upcoming event feeds and scheduler.</p>
                </div>
              } 
            />
            <Route 
              path="whats-next" 
              element={<WhatsNext />} 
            />
            <Route 
              path="settings" 
              element={<Settings />} 
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
