import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Sparkles,
  Flame,
  Trophy,
  Calendar,
  Search,
  ArrowUpRight,
  Navigation,
  Compass,
  AlertCircle,
  Clock,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Users
} from 'lucide-react';
import {
  VIT_AP_CENTER,
  VIT_AP_BOUNDS,
  CAMPUS_POLYGON,
  accentGradients,
  iconMapping,
  mockEvents,
  categoryColors
} from '../utils/constants';
import { db } from '../firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { addActivity, subscribeActivities, joinActivity, deleteActivity } from '../services/activityService';
import EventDetailDrawer from '../components/EventDetailDrawer';
import CreateActivityModal from '../components/CreateActivityModal';


// Helper to convert 24h format "14:00" to 12h format "2:00 PM"
const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};


// Reusable Close Popup component inside React Leaflet Popups
const PopupCloseButton = () => {
  const map = useMap();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        map.closePopup();
      }}
      className="p-1 rounded-md hover:bg-slate-900/60 text-gray-500 hover:text-white transition-all duration-150 cursor-pointer"
      title="Close Details"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
};

// Shimmering skeleton component for loading activities list
const ActivitySkeleton = () => (
  <div className="p-3.5 rounded-xl border border-slate-900/60 bg-slate-950/20 space-y-2.5 animate-pulse select-none">
    <div className="flex items-center justify-between">
      <div className="w-14 h-4 bg-slate-800/60 rounded animate-pulse" />
      <div className="w-12 h-3.5 bg-slate-850 rounded" />
    </div>
    <div className="w-4/5 h-4 bg-slate-800/80 rounded" />
    <div className="flex items-center gap-2">
      <div className="w-3.5 h-3.5 rounded-full bg-slate-850" />
      <div className="w-24 h-3 bg-slate-850 rounded" />
    </div>
  </div>
);

// Reusable animated popup card component for Map Markers
const ActivityPopup = ({ event, currentUserId, joiningId, onJoin }) => {
  const hasJoined = event.participants?.includes(currentUserId);
  const isJoining = joiningId === event.id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative w-[265px] bg-[#0b0f19] border border-slate-900/60 rounded-2xl overflow-hidden shadow-2xl font-sans text-slate-350"
    >
      {/* Decorative Colored Accent Bar at the top */}
      <div className={`h-1 w-full bg-gradient-to-r ${accentGradients[event.color]}`} />

      <div className="p-4 space-y-3">
        {/* Header: Category / Live Badge & Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
              ${event.isLive
                ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
            >
              {event.isLive ? '● Live' : 'Upcoming'}
            </span>
            <span className="text-[9px] text-gray-505 font-semibold uppercase tracking-wider">{event.category}</span>
          </div>
          <PopupCloseButton />
        </div>

        {/* Body: Activity Name, Location, Duration, Description */}
        <div className="space-y-1.5 text-left">
          <h4 className="text-xs font-extrabold text-white leading-tight">
            {event.name}
          </h4>
          <div className="flex items-center gap-2.5 text-[10px] text-gray-400">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[100px]">{event.room}</span>
            </div>
            <div className="flex items-center gap-1 border-l border-slate-900/60 pl-2.5 min-w-0">
              <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[90px]">{event.time}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 leading-normal pt-1">
            {event.description}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 select-none pt-1">
            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{event.participantCount} attending</span>
          </div>
        </div>

        {/* Footer: Created Time & Join Button */}
        <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-655" />
            <span>Created {event.createdTime}</span>
          </div>
          <button
            disabled={hasJoined || isJoining}
            onClick={() => onJoin(event.id)}
            className={`h-6.5 px-3 rounded-lg text-white font-bold text-[9px] transition-all flex items-center gap-1 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed
              ${hasJoined
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-450'
                : `bg-gradient-to-tr ${accentGradients[event.color]} hover:opacity-90 active:scale-95 cursor-pointer`
              }`}
          >
            {isJoining ? (
              <>
                <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Joining...</span>
              </>
            ) : hasJoined ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                <span>Joined</span>
              </>
            ) : (
              <>
                <span>Join</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Map click listener sub-component
const MapClickSelector = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

// Map controller sub-component to handle programmatic panning (flyTo/fitBounds)
const MapController = ({ center, zoom, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [30, 30],
        animate: true,
        duration: 1.2
      });
    } else if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.2
      });
    }
  }, [center, zoom, bounds, map]);
  return null;
};

// Function to generate a premium custom HTML marker icon
const createCustomIcon = (color, isLive) => {
  const colorMap = {
    indigo: { primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' },
    purple: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
    pink: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },
    emerald: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
    blue: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
    amber: { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  };

  const selected = colorMap[color] || colorMap.indigo;

  // Pulsing background ring for Live pins
  const pulseHtml = isLive
    ? `<span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style="background-color: ${selected.primary};"></span>`
    : '';

  return L.divIcon({
    className: '', // Clear standard leaflet square border/background
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 animate-marker-in">
        ${pulseHtml}
        <div class="relative flex items-center justify-center w-6.5 h-6.5 rounded-full border border-[#1e293b] shadow-lg text-white" 
             style="background: linear-gradient(135deg, ${selected.primary}, #06090f); box-shadow: 0 0 12px ${selected.glow}">
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

// Icon Cache Map to prevent recreating Leaflet divIcons on every React render loop
const customIconCache = {};
const getCachedCustomIcon = (color, isLive) => {
  const cacheKey = `${color}-${isLive}`;
  if (!customIconCache[cacheKey]) {
    customIconCache[cacheKey] = createCustomIcon(color, isLive);
  }
  return customIconCache[cacheKey];
};

// Temporary marker icon for selection mode
const tempMarkerIcon = L.divIcon({
  className: '',
  html: `
    <div class="relative flex items-center justify-center w-10 h-10 animate-bounce">
      <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400/30 animate-ping opacity-75"></span>
      <div class="relative flex items-center justify-center w-7.5 h-7.5 rounded-full border border-indigo-400 bg-gradient-to-tr from-indigo-500 to-indigo-800 text-white shadow-xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const CampusMap = () => {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapSelectionMode, setIsMapSelectionMode] = useState(false);

  // Subscribe to clubs
  useEffect(() => {
    const unsubscribeClubs = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClubs(list);
    });
    return () => unsubscribeClubs();
  }, []);

  useEffect(() => {
    if (location.search.includes('select=true')) {
      setIsMapSelectionMode(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);
  const [mobileView, setMobileView] = useState('map');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [tempCoords, setTempCoords] = useState(null); // Selected placement coordinates

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mapCenter, setMapCenter] = useState(VIT_AP_CENTER);
  const [mapZoom, setMapZoom] = useState(19);
  const [mapBounds, setMapBounds] = useState(CAMPUS_POLYGON);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSourceFilter, setActiveSourceFilter] = useState('All');

  // Submit and Toast feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Join loader and user variables
  const [joiningId, setJoiningId] = useState(null);
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || '';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleJoinActivity = async (activityId) => {
    setJoiningId(activityId);
    try {
      await joinActivity(activityId, currentUserId);
      showToast('Successfully joined the activity!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to join activity.', 'error');
    } finally {
      setJoiningId(null);
    }
  };


  // Real-time Firestore subscription hook
  useEffect(() => {
    const unsubscribe = subscribeActivities(
      (firestoreActivities) => {
        const iconNames = {
          Technical: 'Sparkles',
          Cultural: 'Flame',
          Sports: 'Trophy',
          Workshop: 'Calendar',
          Seminar: 'Calendar',
          Competition: 'Trophy',
          Social: 'Flame',
          Entertainment: 'Flame',
          Other: 'Sparkles'
        };

        const mapped = firestoreActivities.map((act) => ({
          id: act.id,
          name: act.title || act.name,
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
          createdTime: act.createdAt
            ? new Date(act.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          iconName: iconNames[act.category] || 'Sparkles',
          participants: act.participants || [],
          participantCount: (act.participants || []).length,
          createdBy: act.createdBy || '',
          creatorName: act.creatorName || 'CampusLive User',
          building: act.building || 'Campus Landmark',
          eventType: act.eventType || 'student',
          clubId: act.clubId || null,
          organizerName: act.organizerName || act.creatorName || 'CampusLive User',
          organizerLogo: act.organizerLogo || `https://api.dicebear.com/7.x/bottts/svg?seed=${act.createdBy || act.id}`
        }));

        setEvents(mapped);
        setIsLoading(false);
        setIsError(false);
      },
      (error) => {
        console.error(error);
        setIsError(true);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Close modal on Escape key press for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);


  const handleStartMapSelection = () => {
    setIsMapSelectionMode(true);
    setSelectedEventId(null);
  };

  const handleMapClick = (latlng) => {
    if (isMapSelectionMode) {
      const coords = [latlng.lat, latlng.lng];
      setTempCoords(coords);
      setMapBounds(null);
      setMapCenter(coords);
      setMapZoom(19);
      setIsMapSelectionMode(false);
      setIsModalOpen(true);
    }
  };

  const handleChangeLocation = () => {
    setIsModalOpen(false);
    setIsMapSelectionMode(true);
  };

  const handleCreateActivity = async (activityData) => {
    setIsSubmitting(true);
    try {
      const finalData = {
        ...activityData,
        latitude: activityData.coordinates[0],
        longitude: activityData.coordinates[1],
        isLive: true,
        createdBy: currentUserId,
        creatorName: currentUser?.name || 'Aarav Sharma',
        creatorRole: currentUser?.role || '',
        participants: [currentUserId]
      };

      await addActivity(finalData);
      showToast('Activity created successfully!', 'success');

      setTempCoords(null);
      setIsModalOpen(false);

      // Focus and close map view to marker
      setMapBounds(null);
      setMapCenter(activityData.coordinates);
      setMapZoom(19);
    } catch (err) {
      console.error(err);
      showToast('Failed to save activity to Firestore.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSelectEvent = (event) => {
    setSelectedEventId(event.id);
    setMapBounds(null);
    setMapCenter(event.coordinates);
    setMapZoom(19); // Zoom in closer on selection
  };

  const handleRecenter = () => {
    setSelectedEventId(null);
    setMapBounds(CAMPUS_POLYGON);
  };

  // Filter events based on active category, debounced search query, and member access
  const filteredEvents = events.filter(event => {
    const matchesFilter = activeFilter === 'All' || event.category === activeFilter;
    const matchesSource = activeSourceFilter === 'All' ||
      (activeSourceFilter === 'Student' && event.eventType === 'student') ||
      (activeSourceFilter === 'Club' && event.eventType === 'club');
    const cleanSearch = debouncedSearchQuery.toLowerCase();
    const matchesSearch =
      event.name.toLowerCase().includes(cleanSearch) ||
      event.category.toLowerCase().includes(cleanSearch) ||
      event.description.toLowerCase().includes(cleanSearch) ||
      event.room.toLowerCase().includes(cleanSearch);
    return matchesFilter && matchesSource && matchesSearch;
  });

  const categories = ['All', 'Study', 'Sports', 'Food', 'Tech', 'Music', 'Gaming'];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-175px)] md:h-[calc(100vh-130px)] min-h-[480px] w-full text-slate-350 overflow-hidden">

      {/* Mobile View Selector Tabs */}
      <div className="flex md:hidden bg-slate-950/60 p-1 rounded-xl border border-slate-900/60 w-full flex-shrink-0 select-none">
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5
            ${mobileView === 'map'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
              : 'text-gray-500 border border-transparent'
            }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Campus Map</span>
        </button>
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5
            ${mobileView === 'list'
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
              : 'text-gray-500 border border-transparent'
            }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Event List</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-0 w-full overflow-hidden">
        {/* 1. Sidebar Control Panel */}
        <div className={`w-full md:w-[280px] lg:w-[320px] flex-col bg-[#080b11] border border-slate-900 rounded-2xl p-4 md:p-5 shadow-xl h-full overflow-hidden
          ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>

          {/* Sidebar Header & Search */}
          <div className="space-y-4 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Campus Directory</h3>
              </div>
              <button
                onClick={handleRecenter}
                title="Recenter Campus Map"
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850 hover:border-slate-800 text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 rotate-45" />
                <span className="hidden sm:inline text-[10px] font-semibold">Center</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search event, block, hall..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-650 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-medium"
              />
            </div>

            {/* Scheduled & Live Events Counter */}
            <div className="grid grid-cols-2 gap-2 text-center select-none bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
              <div className="flex flex-col items-center justify-center p-1.5 bg-[#06090f]/60 rounded-lg border border-slate-900/60">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live Events
                </span>
                <span className="text-sm font-black text-rose-500 mt-1">
                  {filteredEvents.filter(e => e.isLive).length}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 bg-[#06090f]/60 rounded-lg border border-slate-900/60">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Scheduled
                </span>
                <span className="text-sm font-black text-indigo-400 mt-1">
                  {filteredEvents.filter(e => !e.isLive).length}
                </span>
              </div>
            </div>

            {/* Event Source Filter Chips */}
            <div className="flex gap-1 bg-[#06090f] p-1 rounded-xl border border-slate-900/60 select-none">
              {['All', 'Student', 'Club'].map((src) => (
                <button
                  key={src}
                  onClick={() => setActiveSourceFilter(src)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border shrink-0 cursor-pointer
                  ${activeSourceFilter === src
                      ? 'bg-indigo-600/15 border-indigo-500/25 text-indigo-405 shadow-sm'
                      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {src}
                </button>
              ))}
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border shrink-0 cursor-pointer
                  ${activeFilter === cat
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400'
                      : 'bg-slate-950/40 border-slate-900 text-gray-500 hover:text-gray-300 hover:bg-slate-900/50'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>        {/* Directory Event List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
            {isError ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-md">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-450 uppercase tracking-wider">Sync Error</p>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                    Failed to connect to the campus feed. Check your connection or security rules.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
              </div>
            ) : filteredEvents.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event) => {
                  const IconComp = iconMapping[event.iconName] || Sparkles;
                  const isSelected = selectedEventId === event.id;

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectEvent(event)}
                      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between text-left group select-none hover:translate-x-0.5
                      ${isSelected
                          ? 'bg-indigo-500/5 border-indigo-500/40 shadow-sm shadow-indigo-500/5'
                          : 'bg-slate-950/20 border-slate-900 hover:border-slate-800 hover:bg-slate-900/10'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {event.name}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0
                        ${event.isLive
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse'
                            : 'bg-slate-900 text-gray-400 border-slate-850'
                          }`}
                        >
                          {event.isLive ? '● Live' : 'Upcoming'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-gray-450 mb-2">
                        <MapPin className="w-3 h-3 text-indigo-400/80" />
                        <span className="truncate">{event.room}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 text-[9px] text-gray-500">
                        <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-gray-555">
                          <div className="flex items-center gap-1">
                            <IconComp className="w-2.5 h-2.5" />
                            <span>{event.category}</span>
                          </div>
                          <span className={`px-1 py-0.2 rounded text-[7px] font-extrabold uppercase tracking-wide border
                            ${event.eventType === 'club'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : event.eventType === 'university'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {event.eventType === 'club' ? 'Club' : event.eventType === 'university' ? 'Admin' : 'Student'}
                          </span>
                        </div>
                        <span>{event.time}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center mb-3.5 text-gray-500 shadow-md">
                  <Compass className="w-6 h-6 animate-pulse" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-xs font-bold text-slate-350 uppercase tracking-wider">No Activities Found</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                  We couldn't find any activities matching your filters. Try adjusting search or create a new event.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Interactive Leaflet Map Panel */}
        <div className={`flex-1 bg-[#080b11] border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative h-full dark-map
        ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>

          {/* Map Loading Spinner Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#06090f]/75 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center gap-3 select-none">
              <div className="relative flex items-center justify-center w-12 h-12">
                <div className="absolute inline-flex h-full w-full rounded-full bg-indigo-500/20 animate-ping" />
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
              </div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest animate-pulse">
                Syncing Campus Map...
              </span>
            </div>
          )}

          {/* Floating Add Event Button overlaying map pane */}
          {!isMapSelectionMode && (
            <button
              onClick={handleStartMapSelection}
              title="Create New Activity"
              className="absolute bottom-16 left-3.5 z-20 h-10 px-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/20 flex items-center gap-2 border border-indigo-400/25 transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
            >
              <span>Create Event</span>
              <Plus className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Map Selection Mode Overlay Instructions */}
          {isMapSelectionMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0b0f19]/90 border border-indigo-500/25 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-2xl animate-in slide-in-from-top-4 duration-200">
              <span className="text-[11px] font-black text-slate-200">
                📍 Tap anywhere on the map to choose your activity location.
              </span>
              <button
                onClick={() => setIsMapSelectionMode(false)}
                className="px-2 py-1 rounded bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}


          <MapContainer
            center={VIT_AP_CENTER}
            zoom={19}
            minZoom={17}
            maxZoom={19}
            maxBounds={VIT_AP_BOUNDS}
            maxBoundsViscosity={1.0}
            zoomControl={false} // Disable standard top-left zoom controls for bottom-right style
            className="w-full h-full z-10"
          >
            {/* Map Panning Controller */}
            <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

            {/* Click Listener to Select Exact Coordinates */}
            <MapClickSelector onMapClick={handleMapClick} />

            {/* Campus Polygon Boundary Outline */}
            <Polygon 
              positions={CAMPUS_POLYGON}
              pathOptions={{
                color: '#6366f1',
                dashArray: '6, 6',
                fillColor: '#6366f1',
                fillOpacity: 0.04,
                weight: 2.5
              }}
            />

            {/* OpenStreetMap TileLayer with Dark theme applied via CSS filters */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Zoom Control at the Bottom Right */}
            <ZoomControl position="bottomright" />

            {/* Temporary animated placement marker */}
            {tempCoords && (
              <Marker
                position={tempCoords}
                icon={tempMarkerIcon}
              />
            )}

            {/* Event Markers */}
            {filteredEvents.map((event) => (
              <Marker
                key={event.id}
                position={event.coordinates}
                icon={getCachedCustomIcon(event.color, event.isLive)}
                eventHandlers={{
                  click: () => {
                    setSelectedEventId(event.id);
                    setMapCenter(event.coordinates);
                  },
                }}
              />
            ))}
          </MapContainer>

          {/* Floating Instruction Overlay (Minimalist Linear style) */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 bg-[#06090f]/90 border border-slate-850/80 px-3 py-2 rounded-xl backdrop-blur-md shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Live Campus Network Feed Active
            </span>
          </div>
        </div>
      </div>

      {/* Modern Activity Creation Modal */}
      <CreateActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tempCoords={tempCoords}
        onSubmit={handleCreateActivity}
        isSubmitting={isSubmitting}
        onChangeLocation={handleChangeLocation}
      />

      {/* Toast Notification Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 bg-[#0b0f19] border px-4 py-3 rounded-xl shadow-2xl text-xs font-bold font-sans
              ${toast.type === 'success' ? 'border-emerald-500/30 text-emerald-450' : 'border-rose-500/30 text-rose-450'}`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <EventDetailDrawer
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
        event={events.find(e => e.id === selectedEventId)}
        currentUserId={currentUserId}
        currentUser={currentUser}
        onDelete={deleteActivity}
      />
    </div>
  );
};

export default CampusMap;
