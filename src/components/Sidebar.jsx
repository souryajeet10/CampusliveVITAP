import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  MapPin, 
  Settings, 
  ChevronRight, 
  LogOut,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CampusLiveIcon from './common/CampusLiveIcon';

const sections = [
  {
    label: 'Discover',
    items: [
      { name: 'Dashboard', path: '/', icon: Home },
      { name: 'Campus Map', path: '/map', icon: MapPin },
      { name: 'Events', path: '/events', icon: Calendar },
    ],
  },
  {
    label: 'Community',
    items: [
      { name: 'Lost & Found', path: '/lost-found', icon: Inbox },
      { name: "What's Next", path: '/whats-next', icon: Sparkles },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const SidebarContent = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const expanded = !isCollapsed || mobileOpen;

  const handleProfileClick = () => {
    navigate('/settings');
    setMobileOpen(false);
  };

  const getAbbreviatedDept = (dept) => {
    if (!dept) return 'CSE';
    if (dept.includes('Computer Science')) return 'CSE';
    if (dept.includes('Electronics')) return 'ECE';
    if (dept.includes('Mechanical')) return 'ME';
    if (dept.includes('Biotechnology')) return 'BT';
    if (dept.includes('Business')) return 'BBA';
    if (dept.includes('Liberal Arts')) return 'Arts';
    return dept.substring(0, 3).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1220] border-r border-[#1E293B] text-slate-300 font-sans relative">
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* Collapse toggle — floating absolute button */}
      {!mobileOpen && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-full border border-slate-700/60 bg-[#0B1220] hover:bg-[#151c2c] text-slate-400 hover:text-white transition-all duration-200 absolute -right-3 top-7.5 z-30 shadow-lg cursor-pointer hover:border-indigo-500/50 hover:ring-4 hover:ring-indigo-500/10 active:scale-90"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      )}

      {/* ─── Brand Header ─── */}
      <div className={`relative z-10 flex items-center pt-6 pb-5 ${expanded ? 'justify-between px-5' : 'justify-center px-0'}`}>
        <div className="flex items-center gap-3">
          <CampusLiveIcon className={`${expanded ? 'w-9 h-9' : 'w-10 h-10'} flex-shrink-0`} />
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold tracking-tight text-white">
                  CampusLive
                </span>
                <span className="text-[15px] font-bold tracking-tight text-indigo-400">
                  @VITAP
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">
                Campus Social Platform
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="relative z-10 flex-1 px-3 pt-2 pb-4 overflow-y-auto space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            {expanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.12em] px-3 mb-2.5"
              >
                {section.label}
              </motion.p>
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink 
                    key={item.name} 
                    to={item.path} 
                    className={({ isActive }) => `
                      flex items-center transition-all duration-250 group relative overflow-hidden
                      ${expanded 
                        ? 'w-full gap-3 px-3 py-2.5 rounded-[14px]' 
                        : 'w-11 h-11 justify-center rounded-xl mx-auto'
                      }
                      ${isActive 
                        ? 'bg-white/[0.06] backdrop-blur-sm text-white font-semibold shadow-[0_0_24px_rgba(99,102,241,0.08)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03] hover:-translate-y-px'
                      }
                    `}
                    onClick={() => setMobileOpen(false)}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active gradient accent bar */}
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active-accent"
                            className="absolute left-0 top-[20%] bottom-[20%] w-[3.5px] rounded-r-full"
                            style={{ background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)' }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}

                        {/* Icon container */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-250 ${
                          isActive 
                            ? 'bg-indigo-500/15 text-white shadow-sm shadow-indigo-500/10' 
                            : 'bg-slate-800/40 text-slate-400 group-hover:text-white group-hover:bg-slate-800/60 group-hover:shadow-[0_0_12px_rgba(148,163,184,0.06)]'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`text-[13px] flex-1 text-left ${isActive ? 'font-semibold' : 'font-medium text-white/85'}`}
                          >
                            {item.name}
                          </motion.span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && !mobileOpen && (
                          <div className="absolute left-[68px] scale-0 group-hover:scale-100 transition-all duration-150 origin-left z-50 bg-[#0F172A] border border-slate-700/60 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium shadow-2xl pointer-events-none whitespace-nowrap">
                            {item.name}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile Card ─── */}
      <div className={`relative z-10 border-t border-[#1E293B] ${expanded ? 'p-3' : 'py-4 px-0 flex justify-center'}`}>
        <div className={`flex items-center transition-all duration-250 group ${
          expanded 
            ? 'p-2.5 rounded-xl hover:bg-white/[0.04] gap-3' 
            : 'w-11 h-11 justify-center rounded-xl hover:bg-white/[0.04]'
        }`}>
          <div className="relative flex-shrink-0 cursor-pointer" onClick={handleProfileClick}>
            <img 
              src={currentUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"} 
              alt={currentUser?.name || "User Avatar"} 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/15 bg-slate-800"
            />
          </div>

          {expanded && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0 text-left cursor-pointer"
                onClick={handleProfileClick}
              >
                <p className="text-[13px] font-semibold text-white truncate flex items-center gap-1">
                  <span>{currentUser?.name || 'Aarav Sharma'}</span>
                  {currentUser?.role === 'supreme_admin' && (
                    <span title="Supreme Admin" className="text-amber-400 shrink-0 text-xs">👑</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-medium">
                  {getAbbreviatedDept(currentUser?.department)} · {currentUser?.year || '🌱 1st Year'}
                </p>
              </motion.div>

              <button 
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all duration-250 cursor-pointer active:scale-95 flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
              </button>
            </>
          )}
        </div>
        
        {/* Subtle Version Indicator */}
        {expanded && (
          <div className="mt-3 pt-1 select-none flex flex-col transition-all duration-200 text-left items-start pl-[58px]">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] leading-none">CAMPUSLIVE</span>
            <span className="text-[11px] font-semibold text-slate-400 mt-1.5 leading-none whitespace-nowrap">v0.9.5 • Preview Release</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const sidebarVariants = {
    expanded: { width: '280px' },
    collapsed: { width: '70px' }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:block h-screen sticky top-0 flex-shrink-0 z-20"
        style={{ boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)' }}
      >
        <SidebarContent 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
        />
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-50 md:hidden"
              style={{ boxShadow: '4px 0 32px rgba(0, 0, 0, 0.3)' }}
            >
              <SidebarContent 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed} 
                mobileOpen={mobileOpen} 
                setMobileOpen={setMobileOpen} 
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
