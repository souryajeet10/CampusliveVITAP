import { useLocation } from 'react-router-dom';
import { Menu, Search, ShieldAlert, Sparkles, Clock } from 'lucide-react';

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
  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[#080b11]/90 backdrop-blur-md border-b border-slate-900 font-sans">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile: Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-slate-900/60 md:hidden transition-colors border border-transparent hover:border-slate-800 flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand */}
        <div className="flex items-center gap-2 md:hidden min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-500/10 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-sm font-bold tracking-wide text-white truncate">CampusLive</span>
            <span className="text-[9px] font-semibold tracking-wider text-indigo-400/85 flex-shrink-0">@VITAP</span>
          </div>
        </div>

        {/* Desktop: Branding + time */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-white tracking-tight">CampusLive</span>
            <span className="text-sm font-bold tracking-wide text-indigo-400 hover:text-indigo-300 hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] transition-all duration-300 cursor-default">@VITAP</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
            <Clock className="w-3 h-3" />
            <span>{dateStr}</span>
            <span className="text-gray-700">·</span>
            <span className="text-slate-400 font-semibold tabular-nums">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2.5">



        {/* Mobile Search */}
        <button className="md:hidden p-2 rounded-lg bg-slate-950/40 border border-slate-900 text-gray-500 hover:text-white hover:bg-slate-900/60 transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
