import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Home, MapPin, Calendar, User } from 'lucide-react';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMobileTabClick = (path) => {
    navigate(path);
  };

  const isActiveTab = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main View Wrapper */}
      <div className="flex-1 flex flex-col h-full min-w-0 pb-16 md:pb-0 overflow-hidden">
        {/* Header Navbar */}
        <Navbar setMobileOpen={setMobileOpen} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-(screen-2xl) w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#080b11]/90 backdrop-blur-md border-t border-slate-900 md:hidden flex items-center justify-around px-6 z-30">
        <button 
          onClick={() => handleMobileTabClick('/')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActiveTab('/') ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>

        <button 
          onClick={() => handleMobileTabClick('/map')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActiveTab('/map') ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
        >
          <MapPin className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Map</span>
        </button>

        <button 
          onClick={() => handleMobileTabClick('/events')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActiveTab('/events') ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
        >
          <Calendar className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Events</span>
        </button>

        <button 
          onClick={() => handleMobileTabClick('/settings')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActiveTab('/settings') ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}
        >
          <User className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default MainLayout;
