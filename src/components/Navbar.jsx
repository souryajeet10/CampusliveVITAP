import { Menu, Search, ShieldAlert } from 'lucide-react';

const Navbar = ({ setMobileOpen }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-[#080b11]/90 backdrop-blur-md border-b border-slate-900 font-sans">
      {/* Left section: Hamburger (mobile) & Search (desktop) */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-slate-900/60 md:hidden transition-colors border border-transparent hover:border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>


      </div>

      {/* Right section: System Alerts, Actions & Notifications */}
      <div className="flex items-center gap-3">
        {/* Urgent Alerts System Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/20 px-2.5 py-1 rounded-lg text-rose-450 text-[10px] font-bold tracking-wide uppercase">
          <ShieldAlert className="w-3 h-3 text-rose-500 animate-pulse" />
          <span>Campus Alert: Active Drill</span>
        </div>

        {/* Mobile Search Icon Button */}
        <button className="md:hidden p-2 rounded-lg bg-slate-950/40 border border-slate-900 text-gray-500 hover:text-white hover:bg-slate-900/60 transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
