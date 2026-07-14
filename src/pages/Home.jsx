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
import { subscribeActivities } from '../services/activityService';
import { subscribeActivePins } from '../services/lostFoundService';
import { getRelativeTime } from '../utils/time';

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


const Home = () => {
  const categoryFilters = ['All', 'Study', 'Sports', 'Food', 'Tech', 'Music', 'Gaming'];
  const [events, setEvents] = useState([]);
  const [lfPins, setLfPins] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

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
        participants: act.participants || [],
        participantCount: (act.participants || []).length
      }));

      setEvents(mapped);
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

  // Derived stats for Campus Pulse
  const liveCount = events.filter(e => e.isLive).length;
  const totalParticipants = events.reduce((sum, e) => sum + e.participantCount, 0);
  const avgAttendance = events.length > 0 ? Math.round(totalParticipants / events.length) : 0;

  // Trending: top 5 events by participant count
  const trendingEvents = [...events]
    .sort((a, b) => b.participantCount - a.participantCount)
    .slice(0, 5);


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
                >
                  <Popup closeButton={false}>
                    <div className="p-3 bg-[#0b0f19] border border-slate-900/20 text-slate-350 min-w-[210px] font-sans">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
                          ${event.isLive 
                            ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}
                        >
                          {event.isLive ? '● Live Now' : 'Upcoming'}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">{event.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-0.5">{event.name}</h4>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                        {event.room}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900/60 text-[9px] text-gray-500 font-semibold">
                        <span>{event.time}</span>
                        <span>{event.participantCount} joined</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
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

          {/* Feature Cards Row 1: Trending + Nearby */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Card 1 — 🔥 Trending Now */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/15">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Trending Now</h4>
              </div>
              <div className="space-y-2">
                {trendingEvents.length > 0 ? trendingEvents.map((event, i) => (
                  <div key={event.id} className="flex items-center gap-2.5 py-1.5 group">
                    <span className="text-[10px] font-bold text-gray-600 w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-300 truncate group-hover:text-white transition-colors">{event.name}</p>
                      <p className="text-[9px] text-gray-600">{event.room}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500 shrink-0">
                      <Users className="w-2.5 h-2.5" />
                      <span className="font-bold">{event.participantCount}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-gray-600 py-4 text-center">No live activities yet. Create one!</p>
                )}
              </div>
            </div>

            {/* Card 2 — 🎯 Nearby Activities */}
            <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/15">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nearby Activities</h4>
                <span className="ml-auto text-[8px] text-gray-600 font-bold uppercase tracking-wider">within 500m</span>
              </div>
              <div className="space-y-2">
                {events.slice(0, 4).length > 0 ? events.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center gap-2.5 py-1.5 group">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-300 truncate group-hover:text-white transition-colors">{event.name}</p>
                      <p className="text-[9px] text-gray-600">{event.category} • {event.time}</p>
                    </div>
                    <span className="text-[9px] text-indigo-400/80 font-bold shrink-0">~{Math.floor(Math.random() * 400 + 50)}m</span>
                  </div>
                )) : (
                  <p className="text-[10px] text-gray-600 py-4 text-center">No nearby activities found.</p>
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
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                <p className="text-xl font-bold text-white">{liveCount}</p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Active Events</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                <p className="text-xl font-bold text-white">{totalParticipants}</p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Students Online</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                <p className="text-xl font-bold text-white">{events.length}</p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Events Today</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-center">
                <p className="text-xl font-bold text-white">{avgAttendance}</p>
                <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Avg Attendance</p>
              </div>
            </div>
          </div>

          {/* Quick Featured Event Card */}
          <div className="rounded-2xl border border-slate-900 bg-[#080b11] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                Featured Event
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>4.8</span>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <h3 className="text-sm font-bold text-white">AI Agents Workshop</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                  Build autonomous AI coding agents in groups. Share APIs, test prompt chains, and compete for cloud vouchers.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-900/50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Location</span>
                  </div>
                  <span className="font-semibold text-slate-300">Room 102, Block C</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900/50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Time</span>
                  </div>
                  <span className="font-semibold text-slate-300">Today, 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>Attendees</span>
                  </div>
                  <span className="font-semibold text-slate-350">42 checked-in</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900">
              <NavLink
                to="/map"
                className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>Join Activity</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Home;
