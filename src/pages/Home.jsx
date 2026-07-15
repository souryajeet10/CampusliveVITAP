import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, 
  SlidersHorizontal, 
  Plus, 
  MapPin, 
  ChevronRight, 
  Clock, 
  Star, 
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Users,
  Flame,
  Target,
  BarChart3,
  Eye,
  CalendarPlus,
  MapPinned,
  CheckCircle2
} from 'lucide-react';
import { 
  VIT_AP_CENTER, 
  VIT_AP_BOUNDS, 
  accentGradients, 
  mockEvents 
} from '../utils/constants';
import { subscribeActivities, joinActivity, deleteActivity, updateActivity } from '../services/activityService';
import { subscribeActivePins } from '../services/lostFoundService';
import { getRelativeTime } from '../utils/time';
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

const colorMap = {
  indigo: '#6366f1',
  purple: '#a855f7',
  pink: '#ec4899',
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
};

// Function to generate standard HTML marker icon for homepage map
const createHomepageIcon = (color, isLive) => {
  const hex = colorMap[color] || '#6366f1';
  const pulseHtml = isLive 
    ? `<span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style="background-color: ${hex};"></span>`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 animate-marker-in">
        ${pulseHtml}
        <div class="relative flex items-center justify-center w-6.5 h-6.5 rounded-full border border-[#1e293b] shadow-lg text-white" 
             style="background: linear-gradient(135deg, ${hex}, #06090f);">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Icon Cache Map to prevent recreating Leaflet divIcons on every React render loop for Dashboard
const homepageIconCache = {};
const getCachedHomepageIcon = (color, isLive) => {
  const cacheKey = `${color}-${isLive}`;
  if (!homepageIconCache[cacheKey]) {
    homepageIconCache[cacheKey] = createHomepageIcon(color, isLive);
  }
  return homepageIconCache[cacheKey];
};


const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = displayValue;
    const endVal = Number(value) || 0;
    const duration = 500; // ms

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

  return <span>{displayValue}</span>;
};

const getBuildingName = (coords) => {
  if (!coords) return 'Campus Commons';
  const [lat, lng] = coords;
  if (lat > 16.5065 && lat < 16.5075 && lng > 80.5230 && lng < 80.5245) {
    return 'SRK Block';
  }
  if (lat > 16.5055 && lat < 16.5065 && lng > 80.5220 && lng < 80.5235) {
    return 'Dr. S. Radhakrishnan Block';
  }
  if (lat > 16.5075 && lat < 16.5085 && lng > 80.5240 && lng < 80.5255) {
    return 'APJ Abdul Kalam Block';
  }
  return 'Campus Commons';
};

const Home = () => {
  const { currentUser } = useAuth();
  const categoryFilters = ['All', 'Study', 'Sports', 'Food', 'Tech', 'Music', 'Gaming'];
  const [events, setEvents] = useState([]);
  const [lfPins, setLfPins] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const featuredEvent = events.find(e => e.featured);

  const handleFeatureEvent = async (eventId) => {
    try {
      const currentFeatured = events.find(e => e.featured);
      if (currentFeatured) {
        await updateActivity(currentFeatured.id, { featured: false });
      }
      await updateActivity(eventId, { featured: true });
    } catch (err) {
      console.error('Failed to feature event:', err);
    }
  };

  const handleUnfeatureEvent = async (eventId) => {
    try {
      await updateActivity(eventId, { featured: false });
    } catch (err) {
      console.error('Failed to unfeature event:', err);
    }
  };

  // Tick timer for countdown calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribe = subscribeActivities((firestoreActivities) => {
      const categoryColors = {
        Study: 'blue',
        Sports: 'emerald',
        Food: 'pink',
        Tech: 'indigo',
        Music: 'purple',
        Gaming: 'amber'
      };

      const mapped = firestoreActivities.map((act) => ({
        id: act.id,
        name: act.name,
        room: act.room || 'Campus Commons',
        category: act.category,
        coordinates: [act.latitude, act.longitude],
        description: act.description,
        isLive: act.isLive ?? true,
        color: categoryColors[act.category] || 'indigo',
        time: (act.startTime && act.endTime)
          ? `${formatTime12h(act.startTime)} - ${formatTime12h(act.endTime)}`
          : (act.duration || 'Ends Soon'),
        startTime: act.startTime || '',
        endTime: act.endTime || '',
        date: act.date || '',
        createdBy: act.createdBy || '',
        creatorName: act.creatorName || '',
        createdAt: act.createdAt || null,
        participants: act.participants || [],
        participantCount: (act.participants || []).length,
        featured: act.featured || false
      }));

      setEvents(mapped);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Lost & Found pins subscription for dashboard card
  useEffect(() => {
    const unsubscribe = subscribeActivePins((activePins) => {
      setLfPins(activePins.slice(0, 4));
    });
    return () => unsubscribe();
  }, []);

  const handleJoinActivity = async (e, activityId) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await joinActivity(activityId, currentUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter events based on active category & debounced search query
  const filteredEvents = events.filter(event => {
    const matchesFilter = activeFilter === 'All' || event.category === activeFilter;
    const cleanSearch = debouncedSearchQuery.toLowerCase();
    const matchesSearch = 
      event.name.toLowerCase().includes(cleanSearch) || 
      event.category.toLowerCase().includes(cleanSearch) ||
      event.description.toLowerCase().includes(cleanSearch) ||
      event.room.toLowerCase().includes(cleanSearch);
    return matchesFilter && matchesSearch;
  });

  // Helper to format local date YYYY-MM-DD
  const getLocalDateString = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Derived stats for Campus Pulse
  const todayStr = getLocalDateString(now);
  const liveCount = events.filter(e => e.isLive).length;
  const eventsTodayCount = events.filter(e => e.date === todayStr).length;
  const totalParticipantsToday = events
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.participantCount, 0);
  const trendingEvent = events.length > 0
    ? [...events].sort((a, b) => b.participantCount - a.participantCount)[0]
    : null;

  // Starting Soon: next 60 minutes
  const startingSoonEvents = events
    .map(event => {
      if (!event.date || !event.startTime) return null;
      const [year, month, day] = event.date.split('-').map(Number);
      const [hour, minute] = event.startTime.split(':').map(Number);
      const startDateTime = new Date(year, month - 1, day, hour, minute);
      
      const diffMs = startDateTime - now;
      const diffMins = Math.round(diffMs / 60000);
      
      return {
        ...event,
        startDateTime,
        diffMins
      };
    })
    .filter(event => event !== null && event.diffMins >= 0 && event.diffMins <= 60)
    .sort((a, b) => a.diffMins - b.diffMins);

  // Recently Added: newest created first
  const recentlyAddedEvents = [...events]
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });


  return (
    <div className="space-y-6 font-sans text-gray-300 pb-10">
      
      {/* 1. Category Filter Chips & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-900 shadow-sm backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search activities, rooms, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <div className="flex gap-1.5">
            {categoryFilters.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer
                  ${activeFilter === category 
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 shadow-sm shadow-blue-500/5' 
                    : 'bg-slate-950/40 border-slate-900 text-gray-500 hover:text-gray-300 hover:bg-slate-900/50'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
          <button className="p-2 rounded-lg bg-slate-950/40 border border-slate-900 text-gray-500 hover:text-white transition-all flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ─── Left 2 Columns: Map + Feature Cards ─── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Map */}
          <div className="relative rounded-2xl border border-slate-900 bg-[#080b11] overflow-hidden shadow-2xl h-[400px] md:h-[440px] dark-map">
            <MapContainer 
              center={VIT_AP_CENTER} 
              zoom={15} 
              minZoom={14}
              maxZoom={19}
              maxBounds={VIT_AP_BOUNDS}
              maxBoundsViscosity={1.0}
              zoomControl={false}
              className="w-full h-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              {filteredEvents.map((event) => (
                <Marker
                  key={event.id}
                  position={event.coordinates}
                  icon={getCachedHomepageIcon(event.color, event.isLive)}
                  eventHandlers={{
                    click: () => setSelectedEventId(event.id)
                  }}
                />
              ))}
            </MapContainer>

            {/* Floating Go to Interactive Map Link */}
            <NavLink 
              to="/map" 
              className="absolute bottom-5 right-5 h-10 px-4 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/15 border border-indigo-400/20 active:scale-95 transition-all z-20"
            >
              <Plus className="w-4 h-4" />
              <span>Go to Interactive Map</span>
            </NavLink>
          </div>

          {/* Feature Cards Row 1: Starting Soon + Recently Added */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card 1 — 🕒 Starting Soon */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/15">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Starting Soon</h4>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-900 bg-slate-950/20 space-y-2 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="w-24 h-3.5 bg-slate-800 rounded" />
                        <div className="w-12 h-3 bg-slate-850 rounded" />
                      </div>
                      <div className="w-3/4 h-3 bg-slate-850 rounded" />
                      <div className="w-1/2 h-3 bg-slate-850 rounded" />
                    </div>
                  ))
                ) : startingSoonEvents.length > 0 ? (
                  startingSoonEvents.map((event) => {
                    const hasJoined = event.participants?.includes(currentUser?.id);
                    const building = getBuildingName(event.coordinates);
                    const countdownStr = event.diffMins === 0 
                      ? 'Starting now' 
                      : event.diffMins === 1 
                        ? 'Starts in 1 minute' 
                        : `Starts in ${event.diffMins} minutes`;

                    return (
                      <div 
                        key={event.id} 
                        className="p-3 rounded-lg border border-slate-905 bg-slate-950/10 hover:border-slate-800 transition-all cursor-pointer group flex justify-between items-center gap-3 text-left"
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-205 truncate group-hover:text-white transition-colors">{event.name}</span>
                            <span className="text-[8px] font-extrabold uppercase tracking-wider px-1 bg-slate-900 border border-slate-800 text-indigo-400 rounded">
                              {event.category}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 truncate">{building} • {event.room}</p>
                          <div className="flex items-center gap-2 text-[9px] font-bold">
                            <span className="text-amber-400/90">{countdownStr}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400">{event.participantCount} joined</span>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => handleJoinActivity(e, event.id)}
                          disabled={hasJoined}
                          className={`h-6.5 px-3.5 rounded-lg text-[9px] font-extrabold transition-all border shrink-0
                            ${hasJoined 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default' 
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/25 active:scale-95 cursor-pointer'
                            }`}
                        >
                          {hasJoined ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-gray-600 py-6 text-center">No activities starting soon.</p>
                )}
              </div>
            </div>

            {/* Card 2 — 🆕 Recently Added */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recently Added</h4>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-900 bg-slate-950/20 space-y-2 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="w-24 h-3.5 bg-slate-800 rounded" />
                        <div className="w-12 h-3 bg-slate-855 rounded" />
                      </div>
                      <div className="w-3/4 h-3 bg-slate-850 rounded" />
                    </div>
                  ))
                ) : recentlyAddedEvents.length > 0 ? (
                  recentlyAddedEvents.slice(0, 4).map((event) => {
                    const building = getBuildingName(event.coordinates);
                    const creatorName = event.creatorName || (event.createdBy === currentUser?.id ? (currentUser?.name || 'You') : 'Aarav Sharma');
                    const relativeTime = event.createdAt 
                      ? getRelativeTime(event.createdAt.seconds * 1000) 
                      : 'Just now';

                    return (
                      <div 
                        key={event.id} 
                        className="p-3 rounded-lg border border-slate-905 bg-slate-950/10 hover:border-slate-800 transition-all cursor-pointer group flex flex-col gap-1 text-left"
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[11px] font-bold text-slate-205 truncate group-hover:text-white transition-colors">{event.name}</p>
                          <span className="text-[9px] text-gray-500 shrink-0">{relativeTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-gray-400 font-medium">
                          <span className="text-indigo-400 font-bold">{creatorName}</span>
                          <span className="text-gray-650">•</span>
                          <span>{building}</span>
                          <span className="text-gray-650">•</span>
                          <span className="text-[8px] font-bold text-gray-450 uppercase tracking-wider">{event.category}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-gray-600 py-6 text-center">No recent activities.</p>
                )}
              </div>
            </div>

          </div>

          {/* Feature Cards Row 2: Lost & Found */}
          <div className="grid grid-cols-1 gap-5">
            {/* Card 4 — 🟡 Lost & Found */}
            <NavLink 
              to="/lost-found"
              className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-indigo-500/20 hover:bg-slate-900/40 transition-all duration-300 block group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/15">
                    <Eye className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-indigo-400 transition-colors">Lost & Found</h4>
                </div>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-0.5">
                  View All <ChevronRight className="w-2.5 h-2.5 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div className="space-y-1.5">
                {lfPins.length > 0 ? lfPins.map((item) => {
                  const isLost = item.type === 'lost';
                  return (
                    <div key={item.id} className="flex items-center gap-2.5 py-1.5 border-b border-slate-900/40 last:border-b-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLost ? 'bg-yellow-500' : 'bg-emerald-500 animate-pulse'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-300 truncate">{item.title}</p>
                        <p className="text-[9px] text-gray-600 truncate">{item.description}</p>
                      </div>
                      <span className="text-[9px] text-gray-600 font-medium shrink-0">
                        {getRelativeTime(item.createdAt?.seconds * 1000 || Date.now())}
                      </span>
                    </div>
                  );
                }) : (
                  <div className="py-6 text-center text-[10px] text-gray-600">
                    No active lost or found reports.
                  </div>
                )}
              </div>
            </NavLink>
          </div>
        </div>

        {/* ─── Right Column: Campus Pulse ─── */}
        <div className="space-y-6">

          {/* Card 5 — 📈 Campus Pulse */}
          <div className="rounded-2xl border border-slate-900 bg-[#080b11] p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Campus Pulse</h4>
              <span className="ml-auto flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-emerald-400/80 font-bold uppercase tracking-wider">Live</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Live Events */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                <p className="text-xl font-bold text-emerald-450">
                  <AnimatedCounter value={liveCount} />
                </p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">🟢 Live Events</p>
              </div>

              {/* Events Today */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                <p className="text-xl font-bold text-white">
                  <AnimatedCounter value={eventsTodayCount} />
                </p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">📅 Events Today</p>
              </div>

              {/* Total Participants Today */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center col-span-2">
                <p className="text-xl font-bold text-indigo-400">
                  <AnimatedCounter value={totalParticipantsToday} />
                </p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">👥 Total Participants Today</p>
              </div>

              {/* Trending Activity */}
              {trendingEvent ? (
                <div 
                  onClick={() => setSelectedEventId(trendingEvent.id)}
                  className="p-3.5 rounded-xl bg-[#090d16]/60 border border-slate-900 hover:border-indigo-500/20 hover:bg-slate-900/20 transition-all cursor-pointer text-left col-span-2 group"
                >
                  <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>🔥 Trending Activity</span>
                  </p>
                  <h5 className="text-xs font-bold text-slate-200 mt-1.5 truncate group-hover:text-indigo-400 transition-colors">
                    {trendingEvent.name}
                  </h5>
                  <div className="flex justify-between items-center mt-1 text-[9px] text-gray-500">
                    <span>{getBuildingName(trendingEvent.coordinates)}</span>
                    <span className="font-bold text-gray-450">{trendingEvent.participantCount} joined</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 text-center col-span-2 text-gray-600 text-[10px]">
                  No trending activity today.
                </div>
              )}
            </div>
          </div>

          {/* Quick Featured Event Card */}
          {(featuredEvent || currentUser?.role === 'supreme_admin') && (
            <div className="rounded-2xl border border-slate-900 bg-[#080b11] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                  Featured Event
                </span>
                {featuredEvent && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>Featured</span>
                  </div>
                )}
              </div>

              {featuredEvent ? (
                <div className="space-y-3 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white">{featuredEvent.name}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1 line-clamp-3">
                      {featuredEvent.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-900/50">
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Location</span>
                      </div>
                      <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                        {getBuildingName(featuredEvent.coordinates)} • {featuredEvent.room}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-900/50">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Time</span>
                      </div>
                      <span className="font-semibold text-slate-300">{featuredEvent.time}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span>Attendees</span>
                      </div>
                      <span className="font-semibold text-slate-350">{featuredEvent.participantCount} joined</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-900">
                    <button
                      onClick={() => setSelectedEventId(featuredEvent.id)}
                      className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    {currentUser?.role === 'supreme_admin' && (
                      <button
                        onClick={() => handleUnfeatureEvent(featuredEvent.id)}
                        className="px-3 h-9 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 text-[10px] font-bold transition-all active:scale-98 cursor-pointer"
                        title="Remove from Featured"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Supreme Admin selector (when no event is featured) */
                <div className="space-y-3 text-left">
                  <p className="text-[11px] text-gray-500 leading-normal">
                    No active featured event. Select an event to display it prominently on the dashboard.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-650 uppercase tracking-wider">Feature an Event</label>
                    <select
                      onChange={(e) => {
                        const eventId = e.target.value;
                        if (eventId) handleFeatureEvent(eventId);
                      }}
                      defaultValue=""
                      className="w-full h-9 px-2.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/80 transition-all font-semibold cursor-pointer"
                    >
                      <option value="" disabled>-- Choose an Event --</option>
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

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

export default Home;
