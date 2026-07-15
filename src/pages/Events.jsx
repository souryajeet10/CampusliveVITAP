import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  Plus, 
  Flame, 
  CheckCircle2, 
  X, 
  Compass,
  User,
  Activity,
  Award
} from 'lucide-react';
import { subscribeActivities, joinActivity, leaveActivity, deleteActivity } from '../services/activityService';
import { accentGradients } from '../utils/constants';
import EventDetailDrawer from '../components/EventDetailDrawer';
import { useAuth } from '../hooks/useAuth';

// Helper to convert 24h format "14:00" to 12h format "2:00 PM"
const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = displayValue;
    const endVal = Number(value) || 0;
    const duration = 500;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentVal = Math.floor(progress * (endVal - startVal) + startVal);
      setDisplayValue(currentVal);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
};

// Activity Loading Shimmer
const ActivityCardSkeleton = () => (
  <div className="p-5 rounded-2xl border border-slate-900 bg-[#080b11]/45 space-y-4 animate-pulse select-none">
    <div className="h-28 bg-slate-900 rounded-xl" />
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-900 rounded w-1/4" />
      <div className="h-4 bg-slate-900 rounded w-1/6" />
    </div>
    <div className="h-6 bg-slate-900 rounded w-3/4" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-900 rounded w-1/2" />
      <div className="h-3 bg-slate-900 rounded w-1/3" />
    </div>
    <div className="flex gap-2 pt-2">
      <div className="h-9 bg-slate-900 rounded w-1/2" />
      <div className="h-9 bg-slate-900 rounded w-1/2" />
    </div>
  </div>
);

const Events = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All Events'); // 'All Events' | 'Joined' | 'Hosted'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isJoiningLeaving, setIsJoiningLeaving] = useState({});

  const filters = ['All', 'Live', 'Upcoming', 'Today', 'This Week', 'Tech', 'Cultural', 'Sports', 'Workshops'];

  // Subscribe to real-time events feed
  useEffect(() => {
    const unsubscribe = subscribeActivities(
      (firestoreActivities) => {
        const categoryColors = {
          Study: 'blue',
          Sports: 'emerald',
          Food: 'pink',
          Tech: 'indigo',
          Music: 'purple',
          Gaming: 'amber',
          Cultural: 'pink',
          Workshops: 'blue'
        };

        const mapped = firestoreActivities.map((act) => ({
          id: act.id,
          name: act.name,
          room: act.room || 'Campus Commons',
          building: act.building || 'Main Campus',
          category: act.category,
          coordinates: [act.latitude, act.longitude],
          description: act.description,
          isLive: act.isLive ?? true,
          color: categoryColors[act.category] || 'indigo',
          date: act.date || '',
          startTime: act.startTime || '',
          endTime: act.endTime || '',
          creatorName: act.creatorName || 'CampusLive User',
          createdBy: act.createdBy || '',
          participants: act.participants || []
        }));

        setEvents(mapped);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching activities:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper date logic
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr === todayStr;
  };

  const isThisWeek = (dateStr) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(eventDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Quick Stats Calculations
  const stats = useMemo(() => {
    const live = events.filter(e => e.isLive).length;
    const upcoming = events.filter(e => !e.isLive && e.date >= new Date().toISOString().split('T')[0]).length;
    const joined = events.filter(e => e.participants.includes(currentUser?.id)).length;
    const hosted = events.filter(e => e.createdBy === currentUser?.id).length;
    return { live, upcoming, joined, hosted };
  }, [events, currentUser?.id]);

  // Handle Join / Leave
  const handleJoinLeave = async (e, eventId, hasJoined) => {
    e.stopPropagation();
    if (!currentUser?.id || isJoiningLeaving[eventId]) return;

    setIsJoiningLeaving(prev => ({ ...prev, [eventId]: true }));
    try {
      if (hasJoined) {
        await leaveActivity(eventId, currentUser.id);
      } else {
        await joinActivity(eventId, currentUser.id);
      }
    } catch (err) {
      console.error('Failed to toggle join/leave:', err);
    } finally {
      setIsJoiningLeaving(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 1. Tab Filter
      if (activeTab === 'Joined' && !event.participants.includes(currentUser?.id)) return false;
      if (activeTab === 'Hosted' && event.createdBy !== currentUser?.id) return false;

      // 2. Chip Filter
      if (activeFilter === 'Live' && !event.isLive) return false;
      if (activeFilter === 'Upcoming' && event.isLive) return false;
      if (activeFilter === 'Today' && !isToday(event.date)) return false;
      if (activeFilter === 'This Week' && !isThisWeek(event.date)) return false;
      if (
        activeFilter !== 'All' && 
        activeFilter !== 'Live' && 
        activeFilter !== 'Upcoming' && 
        activeFilter !== 'Today' && 
        activeFilter !== 'This Week' && 
        event.category.toLowerCase() !== activeFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Search Query Filter
      if (searchQuery) {
        const cleanQuery = searchQuery.toLowerCase();
        return (
          event.name.toLowerCase().includes(cleanQuery) ||
          event.category.toLowerCase().includes(cleanQuery) ||
          event.description.toLowerCase().includes(cleanQuery) ||
          event.building.toLowerCase().includes(cleanQuery) ||
          event.room.toLowerCase().includes(cleanQuery)
        );
      }

      return true;
    });
  }, [events, activeFilter, activeTab, searchQuery, currentUser?.id]);

  return (
    <div className="space-y-8 font-sans text-gray-300 pb-16 select-none max-w-7xl mx-auto">
      
      {/* ─── 1. Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Events</h1>
          <p className="text-xs text-gray-500 mt-1">Discover, join, and organize campus events.</p>
        </div>
        <button
          onClick={() => navigate('/map?select=true')}
          className="h-10 px-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all cursor-pointer active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* ─── 2. Quick Stats Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Live Now', value: stats.live, icon: Activity, color: 'text-rose-400 bg-rose-500/5 border-rose-500/10' },
          { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10' },
          { label: 'Joined', value: stats.joined, icon: Users, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
          { label: 'Hosted', value: stats.hosted, icon: Award, color: 'text-amber-450 bg-amber-500/5 border-amber-500/10' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl border ${item.color} flex items-center justify-between`}>
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.label}</span>
                <p className="text-2xl font-black text-white mt-1.5 leading-none">
                  <AnimatedCounter value={item.value} />
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 3. Search & Tabs & Filter Chips ─── */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-900/80 shadow-md backdrop-blur-md space-y-4">
        {/* Search & Tabs Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-900 w-fit shrink-0">
            {['All Events', 'Joined', 'Hosted'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer
                  ${activeTab === tab 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-350'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-900" />

        {/* Filter Chips Scroll container */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex gap-1.5">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer whitespace-nowrap
                  ${activeFilter === filter 
                    ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 shadow-sm shadow-indigo-500/5' 
                    : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 4. Events Feed Grid ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const hasJoined = event.participants?.includes(currentUser?.id);
            const isWorking = isJoiningLeaving[event.id];

            return (
              <div 
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className="group p-5 rounded-2xl border border-slate-900 bg-[#080b11]/45 hover:border-slate-800 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5 shadow-sm text-left"
              >
                {/* Visual Header / Banner representation */}
                <div className="relative h-28 w-full rounded-xl bg-slate-900/80 border border-slate-850 overflow-hidden flex-shrink-0">
                  <div className={`absolute inset-0 bg-gradient-to-br ${accentGradients[event.color]} opacity-20 group-hover:opacity-25 transition-opacity`} />
                  <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                  
                  {/* Category & Status badges inside card banner */}
                  <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
                      ${event.isLive 
                        ? 'bg-rose-500/10 text-rose-455 border-rose-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {event.isLive ? '● Live' : 'Upcoming'}
                    </span>
                    <span className="text-[8px] bg-slate-950/80 border border-slate-850 text-slate-300 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                      {event.category}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{event.participants?.length || 0} Joined</span>
                  </div>
                </div>

                {/* Event info */}
                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {event.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                    {event.description || 'No description provided.'}
                  </p>
                </div>

                {/* Metadata Row */}
                <div className="pt-2 border-t border-slate-900/60 space-y-2 text-[10px] font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{event.building} · {event.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{event.date} · {formatTime12h(event.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">Organized by {event.creatorName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedEventId(event.id)}
                    className="flex-1 h-9 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={(e) => handleJoinLeave(e, event.id, hasJoined)}
                    disabled={isWorking}
                    className={`flex-1 h-9 rounded-xl text-white font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95
                      ${hasJoined 
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 shadow-rose-500/5' 
                        : `bg-gradient-to-tr ${accentGradients[event.color] || 'from-indigo-500 to-purple-600'} hover:opacity-90`
                      }`}
                  >
                    {isWorking ? (
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    ) : hasJoined ? (
                      <>
                        <X className="w-3 h-3" />
                        <span>Leave</span>
                      </>
                    ) : (
                      <>
                        <span>Join</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center border border-dashed border-slate-900/60 rounded-3xl bg-[#080b11]/20 backdrop-blur-md flex flex-col items-center justify-center gap-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No events found</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Try changing your filters or create a new event.
            </p>
          </div>
          <button
            onClick={() => navigate('/map?select=true')}
            className="h-10 px-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      )}

      {/* ─── 5. Event Details Overlay ─── */}
      <EventDetailDrawer
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
        event={events.find(e => e.id === selectedEventId)}
        currentUserId={currentUser?.id}
        onDelete={deleteActivity}
      />
    </div>
  );
};

export default Events;
