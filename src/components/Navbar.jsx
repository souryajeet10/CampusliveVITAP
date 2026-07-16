import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CampusLiveIcon from './common/CampusLiveIcon';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/map': 'Campus Map',
  '/lost-found': 'Lost & Found',
  '/events': 'Events',
  '/whats-next': "What's Next",
  '/settings': 'Settings',
};

const Navbar = ({ setMobileOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  // Live updating clock state
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000 * 30); // Update time state every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[#080b11] border-b border-slate-900 font-sans">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1 min-w-0 relative">
        {/* Mobile: Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-slate-900/60 md:hidden transition-colors border border-transparent hover:border-slate-800 flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo & Navigation */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 md:hidden cursor-pointer active:scale-95 transition-all flex-shrink-0"
        >
          <CampusLiveIcon className="w-7 h-7" variant="solid" />
          <span className="text-xs font-black text-white tracking-tight">CampusLive</span>
        </div>

        {/* Mobile Centered Page Title */}
        {location.pathname !== '/' && (
          <div className="absolute left-1/2 transform -translate-x-1/2 md:hidden text-xs font-bold tracking-wider text-white uppercase whitespace-nowrap">
            {pageTitle}
          </div>
        )}

        {/* Desktop: Page Title or Brand + Time */}
        <div className="hidden md:flex items-center gap-3.5">
          {location.pathname === '/' ? (
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="text-sm font-bold text-white tracking-tight">CampusLive</span>
              <span className="text-sm font-bold tracking-wide text-indigo-400 hover:text-indigo-300 hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] transition-all duration-300 cursor-default">@VITAP</span>
            </div>
          ) : (
            <h2 className="text-sm font-black text-white tracking-tight leading-none">{pageTitle}</h2>
          )}
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold leading-none mt-0.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{dateStr}</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400 font-bold tabular-nums">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Desktop Profile Quick-View */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
            <div className="text-right leading-none">
              <p className="text-[11px] font-bold text-white">{currentUser.name}</p>
              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{currentUser.year || '🌱 1st Year'}</p>
            </div>
            <img
              src={currentUser.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-slate-900 bg-slate-950 object-cover ring-2 ring-indigo-500/10 cursor-pointer hover:ring-indigo-500/25 transition-all"
              onClick={() => navigate('/settings')}
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
