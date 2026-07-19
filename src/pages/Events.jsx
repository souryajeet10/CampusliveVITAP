import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  Plus,
  Users,
  Compass,
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  Filter,
  User,
  SlidersHorizontal,
  X,
  Flag
} from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { subscribeActivities, deleteActivity } from '../services/activityService';
import { updateUserProfile } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { accentGradients, eventCategories, categoryColors, defaultEventCovers } from '../utils/constants';

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

// Shimmer Skeleton for Event Cards
const ActivityCardSkeleton = () => (
  <div className="p-5 rounded-2xl border border-slate-900/80 bg-[#080b11]/60 backdrop-blur-md space-y-4 animate-pulse select-none">
    <div className="h-40 bg-slate-900/70 rounded-xl" />
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-900/70 rounded w-1/4" />
      <div className="h-4 bg-slate-900/70 rounded w-1/6" />
    </div>
    <div className="h-6 bg-slate-900/70 rounded w-3/4" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-900/70 rounded w-1/2" />
      <div className="h-3 bg-slate-900/70 rounded w-1/3" />
    </div>
    <div className="flex gap-2 pt-2">
      <div className="h-9 bg-slate-900/70 rounded w-1/2" />
      <div className="h-9 bg-slate-900/70 rounded w-1/2" />
    </div>
  </div>
);

// Custom Toast Component for UI Feedback
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md
        ${type === 'success' 
          ? 'bg-emerald-950/90 border-emerald-500/25 text-emerald-400' 
          : 'bg-indigo-950/90 border-indigo-500/25 text-indigo-400'
        }`}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Local States
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All'); // All, Official Club, Student, University
  
  // Secondary Filters
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Newest');
  
  // Interactive Local States for immediate user feedback
  const [toast, setToast] = useState(null);
  const [isProcessingId, setIsProcessingId] = useState(null);

  // Subscribe to real-time events feed & clubs
  useEffect(() => {
    const unsubscribeClubs = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClubs(list);
    });

    const unsubscribeEvents = subscribeActivities(
      (firestoreActivities) => {
        // Map Firestore data with safe fallbacks conforming to backend requirements
        const mapped = firestoreActivities.map((act) => {
          const eventCategory = act.category || 'Other';
          const defaultCover = defaultEventCovers[eventCategory] || defaultEventCovers.Other;
          
          return {
            id: act.id,
            eventId: act.id,
            title: act.title || act.name || 'Untitled Event',
            name: act.title || act.name || 'Untitled Event', // legacy fallback
            description: act.description || 'No description provided.',
            coverImage: act.coverImage || defaultCover,
            eventType: act.eventType || 'student', // default student event
            clubId: act.clubId || null,
            createdBy: act.createdBy || '',
            organizerName: act.organizerName || act.creatorName || 'CampusLive User',
            organizerLogo: act.organizerLogo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(act.createdBy || act.id)}`,
            category: eventCategory,
            date: act.date || '',
            time: act.time || act.startTime || '',
            startTime: act.startTime || act.time || '',
            endTime: act.endTime || '',
            location: act.location || `${act.room || 'Campus Land'}, ${act.building || 'Campus'}`,
            latitude: act.latitude || 16.494144,
            longitude: act.longitude || 80.498191,
            interestedCount: act.interestedCount ?? (act.participants?.length || 0),
            participants: act.participants || [],
            createdAt: act.createdAt ? new Date(act.createdAt.seconds * 1000) : new Date(),
            updatedAt: act.updatedAt || null
          };
        });

        setEvents(mapped);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching activities:', error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeClubs();
      unsubscribeEvents();
    };
  }, []);

  // Helper Toast trigger
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveChip('All');
    setCategoryFilter('All Categories');
    setTimeFilter('All Time');
    setSortBy('Newest');
    showToast('Filters reset successfully', 'info');
  };

  // Toggle Interested action (updates Firestore collection)
  const handleToggleInterest = async (event, e) => {
    e.stopPropagation();
    if (!currentUser?.id || isProcessingId) return;

    setIsProcessingId(event.id);
    const hasJoined = event.participants.includes(currentUser.id);
    const docRef = doc(db, 'activities', event.id);

    try {
      if (hasJoined) {
        await updateDoc(docRef, {
          participants: arrayRemove(currentUser.id),
          interestedCount: increment(-1)
        });
        showToast('Left the event successfully', 'info');
      } else {
        await updateDoc(docRef, {
          participants: arrayUnion(currentUser.id),
          interestedCount: increment(1)
        });
        showToast('Joined event successfully!', 'success');
      }
    } catch (err) {
      console.error('Error updating interest:', err);
      showToast('Failed to save interest status', 'error');
    } finally {
      setIsProcessingId(null);
    }
  };

  // Date Check Helpers
  const dateCheckHelpers = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

    const todayDate = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(todayDate.getDate() + 7);

    return {
      todayStr,
      tomorrowStr,
      endOfWeek
    };
  }, []);

  // Filtering & Sorting Logic
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        // 1. Search Query Filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchTitle = event.title.toLowerCase().includes(query);
          const matchDesc = event.description.toLowerCase().includes(query);
          const matchOrganizer = event.organizerName.toLowerCase().includes(query);
          const matchCat = event.category.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc && !matchOrganizer && !matchCat) return false;
        }

        // 2. Chip Filter (Event Type Source)
        if (activeChip !== 'All') {
          if (activeChip === 'Official Club Events' && event.eventType !== 'club') return false;
          if (activeChip === 'Student Events' && event.eventType !== 'student') return false;
          if (activeChip === 'University Events' && event.eventType !== 'university') return false;
        }

        // 3. Category Filter
        if (categoryFilter !== 'All Categories' && event.category !== categoryFilter) return false;

        // 4. Time Filter
        if (timeFilter !== 'All Time') {
          const { todayStr, tomorrowStr, endOfWeek } = dateCheckHelpers;
          const eventDateStr = event.date;

          if (timeFilter === 'Today' && eventDateStr !== todayStr) return false;
          if (timeFilter === 'Tomorrow' && eventDateStr !== tomorrowStr) return false;
          
          if (timeFilter === 'This Week') {
            const evDate = new Date(eventDateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (evDate < today || evDate > endOfWeek) return false;
          }

          if (timeFilter === 'This Month') {
            const evDate = new Date(eventDateStr);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            if (evDate.getMonth() !== currentMonth || evDate.getFullYear() !== currentYear) return false;
          }

          if (timeFilter === 'Upcoming') {
            const evDate = new Date(eventDateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (evDate < today) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // 5. Sorting
        if (sortBy === 'Newest') {
          return b.createdAt - a.createdAt;
        }
        if (sortBy === 'Most Popular') {
          return b.interestedCount - a.interestedCount;
        }
        if (sortBy === 'Closest Date') {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        }
        return 0;
      });
  }, [events, searchQuery, activeChip, categoryFilter, timeFilter, sortBy, dateCheckHelpers]);

  return (
    <div className="space-y-6 font-sans text-slate-300 pb-16 select-none max-w-7xl mx-auto text-left relative z-10">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4">
        {/* Title + Stats Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Campus Events
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              Discover everything happening across campus in one place.
            </p>
          </div>

          {/* Live and Scheduled Event Counters */}
          <div className="flex gap-5 self-start bg-[#080b11]/70 px-5 py-3 rounded-2xl border border-slate-850 shadow-xl shadow-black/20 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="absolute inline-flex h-4 w-4 rounded-full bg-rose-500/30 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <div className="text-left leading-none">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live</p>
                <p className="text-2xl font-black text-rose-505 mt-1 leading-none">
                  {filteredEvents.filter(e => e.isLive).length}
                </p>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-900 self-center" />
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center shrink-0">
                <span className="relative w-2.5 h-2.5 rounded-full bg-indigo-500" />
              </div>
              <div className="text-left leading-none">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scheduled</p>
                <p className="text-2xl font-black text-indigo-405 mt-1 leading-none">
                  {filteredEvents.filter(e => !e.isLive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Event Button - full width on mobile */}
        <button
          onClick={() => navigate('/map?select=true')}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer hover:scale-102 active:scale-95"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Create Event</span>
        </button>
      </div>

      {/* ─── Search & Primary Chips ─── */}
      <div className="p-5 rounded-2xl bg-[#080b11]/60 border border-slate-900/80 shadow-2xl backdrop-blur-xl space-y-5">
        
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search events, clubs or organizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/40 border border-slate-900/85 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-550/20 transition-all text-xs font-semibold"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-900/60" />

        {/* Filter Chips Horizontal scroll wrapper */}
        <div className="overflow-x-auto scrollbar-none py-0.5">
          <div className="flex gap-2 min-w-max">
            {[
              { id: 'All', label: 'All' },
              { id: 'Official Club Events', label: 'Official Club Events' },
              { id: 'Student Events', label: 'Student Events' },
              { id: 'University Events', label: 'University Events' }
            ].map((chip) => {
              const isSelected = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveChip(chip.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer
                    ${isSelected
                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-transparent text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                    }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Secondary Filters Row ─── */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex flex-nowrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#080b11]/30 border border-slate-900/40 min-w-max sm:min-w-0">
          <div className="flex flex-nowrap items-center gap-3">
          
          {/* Category Dropdown */}
          <div className="relative group">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 h-9 rounded-lg bg-slate-950/60 border border-slate-900 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer focus:outline-none focus:border-indigo-500/40"
            >
              <option value="All Categories">All Categories</option>
              {eventCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-550 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Time Dropdown */}
          <div className="relative group">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 h-9 rounded-lg bg-slate-950/60 border border-slate-900 text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer focus:outline-none focus:border-indigo-500/40"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Upcoming">Upcoming</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-550 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters Shortcut */}
          {(searchQuery || activeChip !== 'All' || categoryFilter !== 'All Categories' || timeFilter !== 'All Time') && (
            <button
              onClick={handleResetFilters}
              className="h-9 px-3 rounded-lg border border-rose-500/10 hover:border-rose-500/20 text-rose-450 hover:bg-rose-500/5 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-550 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
              Sort:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 h-9 rounded-lg bg-slate-950/60 border border-slate-900 text-[11px] font-bold text-slate-350 focus:outline-none cursor-pointer focus:border-indigo-500/40"
              >
                <option value="Newest">Newest</option>
                <option value="Most Popular">Most Popular</option>
                <option value="Closest Date">Closest Date</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-550 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* ─── Events Feed Grid ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence>
            {filteredEvents.map((event) => {
              const hasInterested = event.participants.includes(currentUser?.id);
              const isWorking = isProcessingId === event.id;

              // Type Badges styling
              let badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
              let badgeLabel = 'Student Event';
              if (event.eventType === 'club') {
                badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                badgeLabel = 'Official Club';
              } else if (event.eventType === 'university') {
                badgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                badgeLabel = 'University Event';
              }

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group relative rounded-2xl border border-slate-900 bg-[#080b11]/70 hover:border-slate-800 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/5"
                >
                  
                  {/* Event Cover Image */}
                  <div className="relative h-44 w-full overflow-hidden shrink-0 bg-slate-950">
                    <img
                      src={event.coverImage}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Glassy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-black/10 to-transparent pointer-events-none" />

                    {/* Category Label Overlay */}
                    <span className="absolute bottom-3 left-3 text-[9px] bg-slate-950/80 border border-slate-900/60 text-slate-200 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg backdrop-blur-sm shadow-sm">
                      {event.category}
                    </span>

                    {/* Scope / Type badge */}
                    <span className={`absolute top-3 left-3 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border backdrop-blur-sm shadow-sm flex items-center gap-1 ${badgeColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{badgeLabel}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed font-medium">
                        {event.description}
                      </p>
                    </div>

                    {/* Organizer Profile Details */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/30 border border-slate-900/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={event.organizerLogo}
                          alt={event.organizerName}
                          className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <p className="text-[10px] text-gray-550 font-bold uppercase tracking-wider leading-none">Organizer</p>
                          <span className="text-xs font-bold text-slate-200 mt-1 truncate block flex items-center gap-1">
                            {event.organizerName}
                            {event.eventType === 'club' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-emerald-500/10" title="Verified Organizer" />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Items */}
                    <div className="space-y-2.5 text-[10px] font-bold text-slate-500 border-t border-slate-900/60 pt-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{event.date} · {formatTime12h(event.startTime)}</span>
                      </div>
                    </div>

                  </div>

                  {/* Actions Row */}
                  <div className="px-5 pb-5 pt-1.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex-1 h-9 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-900 text-white font-extrabold text-[10px] tracking-widest uppercase flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Details</span>
                    </button>
                    
                    <button
                      disabled={isWorking}
                      onClick={(e) => handleToggleInterest(event, e)}
                      className={`w-full h-9 rounded-xl text-white font-extrabold text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 border
                        ${hasInterested
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 hover:bg-rose-500/25 shadow-rose-500/5'
                          : `bg-gradient-to-tr ${accentGradients[categoryColors[event.category]] || 'from-indigo-500 to-purple-600'} border-transparent hover:opacity-90`
                        }`}
                    >
                      {isWorking ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : hasInterested ? (
                        <span>Joined</span>
                      ) : (
                        <span>Join Event</span>
                      )}
                    </button>
                  </div>

                  {/* Interested count footer banner */}
                  <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-900/60 text-[9px] font-bold text-slate-500 flex items-center gap-1.5 justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span>{event.interestedCount} Joined</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-widest text-[8px] text-slate-600">
                        ID: {event.id.slice(0, 8)}
                      </span>
                      {/* Report — student events only */}
                      {event.eventType === 'student' && (
                        <button
                          title="Report this event"
                          className="flex items-center gap-1 text-[9px] font-bold text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 px-1.5 py-0.5 rounded-md transition-all cursor-pointer active:scale-95 border border-transparent hover:border-rose-500/20"
                        >
                          <Flag className="w-2.5 h-2.5" />
                          <span>Report</span>
                        </button>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center border border-dashed border-slate-900/80 rounded-3xl bg-[#080b11]/30 backdrop-blur-md flex flex-col items-center justify-center gap-5 max-w-lg mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">No events found</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              We couldn't find any events matching your selected filter parameters or search queries.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="h-10 px-5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all cursor-pointer active:scale-95"
          >
            <span>Reset Filters</span>
          </button>
        </motion.div>
      )}

    </div>
  );
};

export default Events;
