import { useState, useEffect, useCallback, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MapPin, 
  Search, 
  Clock, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  Info,
  Calendar,
  Sparkles,
  Inbox
} from 'lucide-react';
import { VIT_AP_CENTER, VIT_AP_BOUNDS, CAMPUS_POLYGON } from '../utils/constants';
import { useLostFoundPins } from '../hooks/useLostFoundPins';
import { addLostFoundPin, resolvePin, subscribeResolvedCount } from '../services/lostFoundService';
import { getRelativeTime, getRemainingTime } from '../utils/time';
import { LostFoundModal } from '../components/LostFoundModal';


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

// Map click listener sub-component
const MapClickSelector = ({ onMapClick, isListening }) => {
  useMapEvents({
    click(e) {
      if (isListening) {
        onMapClick(e.latlng);
      }
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

// Custom Leaflet Icons for Lost, Found, and Clusters
const createPinIcon = (type) => {
  const isLost = type === 'lost';
  const color = isLost ? '#f59e0b' : '#10b981'; // Amber/Yellow vs Emerald/Green
  const glow = isLost ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  
  const innerSvg = isLost 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 animate-marker-in">
        <span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-30" style="background-color: ${color};"></span>
        <div class="relative flex items-center justify-center w-6.5 h-6.5 rounded-full border border-[#1e293b] shadow-lg text-white" 
             style="background: linear-gradient(135deg, ${color}, #06090f); box-shadow: 0 0 10px ${glow}">
          ${innerSvg}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createClusterIcon = (cluster) => {
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 animate-marker-in">
        <div class="absolute inline-flex h-full w-full rounded-full bg-indigo-500/20 animate-pulse"></div>
        <div class="relative flex flex-col items-center justify-center w-8 h-8 rounded-full border border-slate-800 text-white font-extrabold text-[10px] shadow-2xl" 
             style="background: linear-gradient(135deg, #4f46e5, #0f172a); box-shadow: 0 0 12px rgba(79, 70, 229, 0.4)">
          <span>${cluster.count}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Cached lookup maps for icons
const pinIconCache = {
  lost: createPinIcon('lost'),
  found: createPinIcon('found')
};

// Sub-component for individual item card to prevent full list re-renders
const ItemListItem = memo(({ pin, onSelect }) => {
  const isLost = pin.type === 'lost';
  return (
    <div 
      onClick={() => onSelect(pin)}
      className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/20 hover:border-slate-800 hover:bg-slate-900/10 transition-all duration-200 group cursor-pointer flex flex-col justify-between space-y-2 select-none"
    >
      <div className="flex items-center justify-between">
        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border
          ${isLost 
            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {isLost ? '🟡 Lost' : '🟢 Found'}
        </span>
        <span className="text-[9px] text-gray-500 font-semibold">{getRelativeTime(pin.createdAt?.seconds * 1000 || Date.now())}</span>
      </div>
      <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
        {pin.title}
      </h4>
      <p className="text-[10.5px] text-gray-550 line-clamp-2 leading-relaxed">
        {pin.description}
      </p>
      <div className="flex items-center gap-1 text-[9px] text-gray-500 pt-1 border-t border-slate-900/60">
        <Clock className="w-3 h-3 text-indigo-400/80 shrink-0" />
        <span className="font-semibold text-indigo-400/80">{getRemainingTime(pin.expiresAtMs)}</span>
      </div>
    </div>
  );
});

ItemListItem.displayName = 'ItemListItem';

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

const LostFound = () => {
  const location = useLocation();
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Map and placement state
  const [mapCenter, setMapCenter] = useState(VIT_AP_CENTER);
  const [mapZoom, setMapZoom] = useState(19);
  const [mapBounds, setMapBounds] = useState(CAMPUS_POLYGON);
  const [selectedPin, setSelectedPin] = useState(null);
  const [mobileView, setMobileView] = useState('map'); // 'map' | 'list'

  // Creation form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);

  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tempCoords, setTempCoords] = useState(null);

  // Status indicators
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [resolvedCount, setResolvedCount] = useState(0);

  // Subscribe to resolved pins count
  useEffect(() => {
    const unsub = subscribeResolvedCount((count) => {
      setResolvedCount(count);
    });
    return () => unsub();
  }, []);



  // Real-time custom hook subscription
  const { pins, clusteredPins, loading, error } = useLostFoundPins(
    filterType,
    debouncedSearchQuery,
    mapZoom
  );

  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id || '';

  useEffect(() => {
    if (location.search.includes('create=true')) {
      setIsFormOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const showToast = (message, toastType = 'success') => {
    setToast({ message, type: toastType });
    setTimeout(() => setToast(null), 3000);
  };

  // Resolve Pin Callback
  const handleResolvePin = async (id) => {
    try {
      await resolvePin(id);
      showToast('Item marked as resolved!', 'success');
      setSelectedPin(null);
    } catch (err) {
      showToast('Failed to resolve item.', 'error');
    }
  };

  // Placement Action
  const startPlacementFlow = () => {
    setIsFormOpen(false);
    setPlacementMode(true);
    showToast('Click anywhere on the map to place your pin', 'info');
  };

  const handleMapClick = useCallback((latlng) => {
    setTempCoords([latlng.lat, latlng.lng]);
    setMapBounds(null);
    setMapCenter([latlng.lat, latlng.lng]);
    setMapZoom(19);
    setPlacementMode(false);
    setIsFormOpen(true);
  }, []);

  const handleConfirmPlacement = async () => {
    if (!tempCoords) return;
    setIsSaving(true);
    try {
      await addLostFoundPin({
        type,
        title,
        description,
        latitude: tempCoords[0],
        longitude: tempCoords[1],
        createdBy: currentUserId
      });
      showToast('Pin posted successfully!', 'success');
      
      // Reset State
      setTitle('');
      setDescription('');
      setTempCoords(null);
      setPlacementMode(false);
      setIsFormOpen(false);
    } catch (err) {
      showToast('Failed to post pin.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPin = (pin) => {
    setSelectedPin(pin);
    setMapBounds(null);
    setMapCenter([pin.latitude, pin.longitude]);
    setMapZoom(19);
    setMobileView('map');
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-175px)] md:h-[calc(100vh-130px)] min-h-[480px] w-full text-slate-350 overflow-hidden relative">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border text-xs font-bold shadow-xl flex items-center gap-2
              ${toast.type === 'error' ? 'bg-rose-950/80 border-rose-900/50 text-rose-200' : 
                toast.type === 'info' ? 'bg-blue-950/80 border-blue-900/50 text-blue-200' :
                'bg-emerald-950/80 border-emerald-900/50 text-emerald-200'}`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mode Indicator Banner */}
      <AnimatePresence>
        {placementMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[45] bg-[#0b0f19]/90 border border-slate-800 px-4 py-2 rounded-full text-xs font-bold text-slate-200 flex items-center gap-2 shadow-2xl backdrop-blur-md whitespace-nowrap"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>📍 Tap on the map to set report location</span>
            <button 
              onClick={() => setPlacementMode(false)}
              className="p-1 rounded-full hover:bg-slate-900 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4 w-full sm:max-w-md flex-shrink-0 select-none">
        {[
          { label: 'Active Reports', value: pins.length, icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
          { label: 'Resolved Items', value: resolvedCount, icon: CheckCircle2, color: 'text-emerald-450 bg-emerald-500/5 border-emerald-500/10' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`p-3.5 rounded-2xl border ${item.color} flex items-center justify-between`}>
              <div className="text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.label}</span>
                <p className="text-xl font-black text-white mt-1.5 leading-none">
                  <AnimatedCounter value={item.value} />
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Tab Selector */}
      <div className="flex md:hidden bg-slate-950/60 p-1 rounded-xl border border-slate-900/60 w-full flex-shrink-0 select-none">
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5
            ${mobileView === 'map' 
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
              : 'text-gray-500 border border-transparent'
            }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Interactive Map</span>
        </button>
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5
            ${mobileView === 'list' 
              ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
              : 'text-gray-500 border border-transparent'
            }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Item List ({pins.length})</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-0 w-full overflow-hidden">
        
        {/* 1. Left Sidebar: Filters, Search, Directory List */}
        <div className={`w-full md:w-[380px] lg:w-[420px] flex-col bg-[#080b11] border border-slate-900 rounded-2xl p-4 md:p-5 shadow-xl h-full overflow-hidden
          ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
          
          <div className="space-y-4 mb-4 flex-shrink-0">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lost & Found</h3>
              </div>
              {resolvedCount > 0 && (
                <div className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-450 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none" title="Total resolved items by the community">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-450" />
                  <span>{resolvedCount} Resolved</span>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {['All', 'Lost', 'Found'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer flex-shrink-0
                    ${filterType === filter 
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' 
                      : 'bg-slate-950/40 border-slate-900 text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Listings */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-0">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-900/60 bg-slate-950/20 space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="w-12 h-3.5 bg-slate-800 rounded animate-pulse" />
                    <div className="w-10 h-3 bg-slate-850 rounded" />
                  </div>
                  <div className="w-3/4 h-3.5 bg-slate-800 rounded" />
                  <div className="w-full h-3 bg-slate-850 rounded" />
                </div>
              ))
            ) : error ? (
              <div className="py-8 text-center text-rose-500 flex flex-col items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <span className="text-xs font-semibold">Error loading items from database</span>
              </div>
            ) : pins.length === 0 ? (
              // Beautiful Empty States
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-gray-650">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {filterType === 'Lost' ? 'No lost items found.' : 
                     filterType === 'Found' ? 'No found items available.' :
                     'No lost or found items posted.'}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal max-w-[200px] mx-auto">
                    {placementMode ? 'Placement mode is currently active. Tap on the map to post.' : 'Be the first to report an item to help your peers.'}
                  </p>
                </div>
              </div>
            ) : (
              pins.map((pin) => (
                <ItemListItem 
                  key={pin.id} 
                  pin={pin} 
                  onSelect={handleSelectPin}
                />
              ))
            )}
          </div>
        </div>

        {/* 2. Right Workspace: Leaflet Interactive Map */}
        <div className={`flex-1 rounded-2xl border border-slate-900 bg-[#080b11] overflow-hidden shadow-2xl relative h-full min-h-0
          ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
          
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            minZoom={17}
            maxZoom={19}
            maxBounds={CAMPUS_POLYGON}
            maxBoundsViscosity={1.0}
            zoomControl={false}
            className="w-full h-full z-10 dark-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <ZoomControl position="bottomright" />
            <MapController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

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
            
            {/* Click listener for placement mode */}
            <MapClickSelector 
              onMapClick={handleMapClick} 
              isListening={placementMode} 
            />

            {/* Render markers */}
            {clusteredPins.map((item) => {
              if (item.isCluster) {
                return (
                  <Marker
                    key={item.id}
                    position={[item.latitude, item.longitude]}
                    icon={createClusterIcon(item)}
                  >
                    <Popup closeButton={false}>
                      <div className="p-3 bg-[#0b0f19] border border-slate-900/20 text-slate-350 min-w-[200px] font-sans text-left space-y-2">
                        <div className="pb-1 border-b border-slate-900 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Grouped Items</span>
                          <span className="text-[9px] text-gray-500 font-bold">{item.count} items</span>
                        </div>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {item.pins.map((pin) => (
                            <div 
                              key={pin.id} 
                              onClick={() => {
                                setSelectedPin(pin);
                              }}
                              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer truncate py-0.5"
                            >
                              {pin.type === 'lost' ? '🟡' : '🟢'} {pin.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              // Normal individual Pin marker
              const isLost = item.type === 'lost';
              return (
                <Marker
                  key={item.id}
                  position={[item.latitude, item.longitude]}
                  icon={isLost ? pinIconCache.lost : pinIconCache.found}
                >
                  <Popup closeButton={false}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-[#0b0f19] border border-slate-900/20 text-slate-350 min-w-[240px] font-sans text-left space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
                          ${isLost 
                            ? 'bg-yellow-500/10 text-yellow-450 border-yellow-500/20' 
                            : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                          }`}
                        >
                          {isLost ? '🟡 Lost' : '🟢 Found'}
                        </span>
                        <PopupCloseButton />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-white leading-tight">{item.title}</h4>
                        <p className="text-[10px] text-gray-500 leading-normal">{item.description}</p>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-gray-600 pt-2.5 border-t border-slate-900/60 font-semibold">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{getRelativeTime(item.createdAt?.seconds * 1000 || Date.now())}</span>
                        </div>
                        <span className="text-indigo-400/80">{getRemainingTime(item.expiresAtMs)}</span>
                      </div>

                      {/* Mark Resolved Option - visible to creator */}
                      {item.createdBy === currentUserId && (
                        <button
                          onClick={() => handleResolvePin(item.id)}
                          className="w-full h-7 mt-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </motion.div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Action Button (FAB) inside Map Workspace */}
          <button
            onClick={startPlacementFlow}
            className="absolute bottom-16 left-5 h-10 px-4 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center gap-2 shadow-2xl shadow-indigo-600/20 border border-indigo-400/20 active:scale-95 transition-all z-20 cursor-pointer text-xs font-bold"
            title="Report Lost or Found Item"
          >
            <span>Report Lost or Found Item</span>
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>

      {/* Forms and confirm modals */}
      <LostFoundModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setTempCoords(null);
        }}
        type={type}
        setType={setType}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        onSubmit={handleConfirmPlacement}
        coordinates={tempCoords}
        isSaving={isSaving}
      />

    </div>
  );
};

export default LostFound;
