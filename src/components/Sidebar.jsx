import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Calendar, 
  MapPin, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Campus Map', path: '/map', icon: MapPin },
  { name: 'Lost & Found', path: '/lost-found', icon: Inbox },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: "What's Next", path: '/whats-next', icon: Sparkles },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const navLinkClass = ({ isActive }) => `
  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
  ${isActive 
    ? 'bg-slate-900/80 text-white border-l-2 border-indigo-500 font-medium shadow-sm' 
    : 'text-gray-400 hover:text-gray-200 hover:bg-slate-900/30 border-l-2 border-transparent'
  }
`;

const SidebarContent = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
    <div className="flex flex-col h-full bg-[#080b11] border-r border-slate-900 text-slate-350 font-sans">
      {/* Brand Header: Notion/Linear Style */}
      <div className="flex items-center justify-between p-5 border-b border-slate-900 h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/10 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {(!isCollapsed || mobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold tracking-wide text-white">
                CampusLive
              </span>
            </motion.div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        {!mobileOpen && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 rounded bg-slate-900/50 hover:bg-slate-900 text-gray-500 hover:text-white border border-slate-880/60 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation Links: Linear-like Lists */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {(!isCollapsed || mobileOpen) && (
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-2">Workspace</p>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink 
              key={item.name} 
              to={item.path} 
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
              
              {(!isCollapsed || mobileOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold flex-1 text-left"
                >
                  {item.name}
                </motion.span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && !mobileOpen && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 origin-left z-50 bg-slate-950 border border-slate-850 text-slate-200 text-xs px-2.5 py-1.5 rounded font-medium shadow-2xl pointer-events-none whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-900">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-900/30 transition-colors cursor-pointer group">
          <div className="relative flex-shrink-0" onClick={handleProfileClick}>
            <img 
              src={currentUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"} 
              alt={currentUser?.name || "User Avatar"} 
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/10 bg-slate-800"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-[#080b11]"></span>
          </div>
          {(!isCollapsed || mobileOpen) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0 text-left"
              onClick={handleProfileClick}
            >
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.name || 'Aarav Sharma'}</p>
              <p className="text-[10px] text-gray-500 truncate">
                {getAbbreviatedDept(currentUser?.department)} &bull; {currentUser?.year?.split(' ')[0] || '1st'} Yr
              </p>
            </motion.div>
          )}
          {(!isCollapsed || mobileOpen) && (
            <button 
              onClick={logout}
              title="Logout Profile"
              className="p-1 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer active:scale-95 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const sidebarVariants = {
    expanded: { width: '240px' },
    collapsed: { width: '70px' }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:block h-screen sticky top-0 flex-shrink-0 z-20"
      >
        <SidebarContent 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
        />
      </motion.aside>

      {/* Mobile Drawer (backdrop & overlay) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-[240px] z-50 md:hidden"
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
