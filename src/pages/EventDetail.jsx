import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  CalendarDays,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Info,
  CalendarPlus,
  Image as ImageIcon,
  X,
  Flag
} from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/userService';
import { accentGradients, categoryColors, defaultEventCovers } from '../utils/constants';

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

// Shimmer Loader for Details Page
const EventDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4">
    <div className="h-10 w-24 bg-slate-900 rounded-lg" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-80 bg-slate-900 rounded-3xl" />
        <div className="h-10 bg-slate-900 rounded-xl w-3/4" />
        <div className="h-24 bg-slate-900 rounded-xl" />
      </div>
      <div className="space-y-6">
        <div className="h-48 bg-slate-900 rounded-3xl" />
        <div className="h-32 bg-slate-900 rounded-3xl" />
      </div>
    </div>
  </div>
);

// Toast Component
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

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Component States
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedClubName, setBlockedClubName] = useState('');
  
  // Modal State for Interested Members list
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [participantProfiles, setParticipantProfiles] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  // Fetch single event details in real-time or via single getDoc
  useEffect(() => {
    let active = true;

    const fetchEvent = async () => {
      if (!eventId) return;
      try {
        const docRef = doc(db, 'activities', eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && active) {
          const act = docSnap.data();
          const eventCategory = act.category || 'Other';
          const defaultCover = defaultEventCovers[eventCategory] || defaultEventCovers.Other;

          let isBlockedEvent = false;
          let clubName = '';

          if (act.eventType === 'club' && act.clubId) {
            const clubRef = doc(db, 'clubs', act.clubId);
            const clubSnap = await getDoc(clubRef);
            if (clubSnap.exists()) {
              const clubData = clubSnap.data();
              clubName = clubData.name;
              if (currentUser?.role !== 'supreme_admin' && 
                  currentUser?.role !== 'university_admin' &&
                  (!clubData.members?.includes(currentUser?.id) && 
                   !clubData.adminIds?.includes(currentUser?.id))) {
                isBlockedEvent = true;
              }
            } else {
              if (currentUser?.role !== 'supreme_admin' && currentUser?.role !== 'university_admin') {
                isBlockedEvent = true;
              }
            }
          }

          setIsBlocked(isBlockedEvent);
          setBlockedClubName(clubName);

          setEvent({
            id: docSnap.id,
            eventId: docSnap.id,
            title: act.title || act.name || 'Untitled Event',
            description: act.description || 'No description provided.',
            coverImage: act.coverImage || defaultCover,
            eventType: act.eventType || 'student',
            clubId: act.clubId || null,
            createdBy: act.createdBy || '',
            organizerName: act.organizerName || act.creatorName || 'CampusLive User',
            organizerLogo: act.organizerLogo || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(act.createdBy || docSnap.id)}`,
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
          });
        } else if (active) {
          showToast('Event not found', 'error');
          navigate('/events');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        if (active) showToast('Failed to load event details', 'error');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchEvent();

    return () => {
      active = false;
    };
  }, [eventId, navigate]);

  // Real-time listener for interested participant profiles
  useEffect(() => {
    if (!showInterestedModal || !event?.participants || event.participants.length === 0) {
      setParticipantProfiles([]);
      setIsLoadingParticipants(false);
      return;
    }

    setIsLoadingParticipants(true);
    const ids = event.participants.slice(0, 30);
    const q = query(collection(db, 'users'), where('__name__', 'in', ids));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profiles = [];
      snapshot.forEach((doc) => {
        profiles.push({ id: doc.id, ...doc.data() });
      });
      setParticipantProfiles(profiles);
      setIsLoadingParticipants(false);
    }, (error) => {
      console.error('Error fetching participant profiles:', error);
      setIsLoadingParticipants(false);
    });

    return () => unsubscribe();
  }, [event?.participants, showInterestedModal]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (isBlocked) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-455 flex items-center justify-center mx-auto animate-pulse">
          <Info className="w-8 h-8 text-rose-400" />
        </div>
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-black text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            This event is private to members of <strong>{blockedClubName || 'the hosting club'}</strong>. Please join the club first to view its events.
          </p>
        </div>
        <button
          onClick={() => navigate('/events')}
          className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
        >
          Return to Events
        </button>
      </div>
    );
  }

  if (!event) return null;

  const hasInterested = event.participants.includes(currentUser?.id);

  // Type Badges styling
  let badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/25';
  let badgeLabel = 'Student Event';
  if (event.eventType === 'club') {
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    badgeLabel = 'Official Club Event';
  } else if (event.eventType === 'university') {
    badgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/25';
    badgeLabel = 'University Event';
  }

  // Toggle Interest Handler
  const handleToggleInterest = async () => {
    if (!currentUser?.id || isProcessing) return;

    setIsProcessing(true);
    const docRef = doc(db, 'activities', event.id);

    try {
      if (hasInterested) {
        // Leave / Un-interest
        await updateDoc(docRef, {
          participants: arrayRemove(currentUser.id),
          interestedCount: increment(-1)
        });
        setEvent(prev => ({
          ...prev,
          participants: prev.participants.filter(id => id !== currentUser.id),
          interestedCount: prev.interestedCount - 1
        }));
        showToast('Left the event successfully', 'info');
      } else {
        // Join / Interest
        await updateDoc(docRef, {
          participants: arrayUnion(currentUser.id),
          interestedCount: increment(1)
        });
        setEvent(prev => ({
          ...prev,
          participants: [...prev.participants, currentUser.id],
          interestedCount: prev.interestedCount + 1
        }));
        showToast('Joined event successfully!', 'success');
      }
    } catch (err) {
      console.error('Error updating interest:', err);
      showToast('Failed to update interest status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calendar Placement Alert
  const handleAddToCalendar = () => {
    showToast('Add to Calendar coming soon!', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans text-slate-350 select-none text-left relative z-10 p-1">
      
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

      {/* Back button */}
      <button
        onClick={() => navigate('/events')}
        className="group h-10 px-4 rounded-xl bg-slate-950/40 border border-slate-900/80 text-slate-400 hover:text-white flex items-center gap-2 transition-all cursor-pointer hover:border-slate-800 shadow-md w-fit active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-xs font-bold uppercase tracking-wider">Back to Events</span>
      </button>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Event Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Cover Section */}
          <div className="relative rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl overflow-hidden min-h-[300px] md:min-h-[400px] flex items-end">
            <img
              src={event.coverImage}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark glassmorphic gradient cover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-black/20 to-transparent pointer-events-none" />

            {/* Banner Category Tag */}
            <span className="absolute top-4 left-4 text-[10px] bg-slate-950/90 border border-slate-900/60 text-slate-200 font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md">
              {event.category}
            </span>



            {/* Text Overlay Details */}
            <div className="relative z-10 p-6 md:p-8 space-y-3 w-full text-left">
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-sm shadow-md ${badgeColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{badgeLabel}</span>
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {event.title}
              </h2>
            </div>
          </div>

          {/* Description Section */}
          <div className="p-6 md:p-8 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4 text-left">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Event Description</span>
            </h3>
            <p className="text-sm text-slate-350 leading-relaxed font-medium whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Premium Gallery Mockup */}
          <div className="p-6 md:p-8 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-5 text-left">
            <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Campus Showcase Gallery</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 1, img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=60' },
                { id: 2, img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=60' },
                { id: 3, img: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=60' },
                { id: 4, img: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=60' }
              ].map((slot) => (
                <div key={slot.id} className="relative aspect-video rounded-xl bg-slate-950 border border-slate-900 overflow-hidden group">
                  <img
                    src={slot.img}
                    alt="Campus Live Detail"
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <span className="text-[10px] font-black text-white tracking-widest uppercase">View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Action Details Sticky Sidebar */}
        <div className="space-y-6 lg:self-start lg:sticky lg:top-6">
          
          {/* Quick Schedule Detail Box */}
          <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-5 text-left">
            
            {/* Organizer Section */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-900/60">
              <img
                src={event.organizerLogo}
                alt={event.organizerName}
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-0.5 object-cover"
              />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-555 uppercase tracking-widest font-black leading-none block">Organized By</span>
                <span className="text-sm font-black text-white mt-1 truncate block flex items-center gap-1">
                  {event.organizerName}
                  {event.eventType === 'club' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 fill-emerald-500/10" title="Verified Organizer" />
                  )}
                </span>
              </div>
            </div>

            {/* Schedule details */}
            <div className="space-y-4 text-xs font-semibold text-slate-400">
              
              {/* Date Card */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="text-[10px] text-slate-550 uppercase tracking-widest font-black">Date</p>
                  <p className="text-slate-200 font-bold">{event.date}</p>
                </div>
              </div>

              {/* Time Card */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left">
                  <p className="text-[10px] text-slate-550 uppercase tracking-widest font-black">Time</p>
                  <p className="text-slate-200 font-bold">
                    {formatTime12h(event.startTime)}
                    {event.endTime ? ` - ${formatTime12h(event.endTime)}` : ''}
                  </p>
                </div>
              </div>

              {/* Venue Card */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/5 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-left min-w-0">
                  <p className="text-[10px] text-slate-555 uppercase tracking-widest font-black">Venue</p>
                  <p className="text-slate-200 font-bold truncate">{event.location}</p>
                </div>
              </div>

            </div>

            {/* Interest Counter representation (Clickable to show members modal) */}
            <div 
              onClick={() => setShowInterestedModal(true)}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 text-xs font-bold text-slate-400 flex items-center justify-between cursor-pointer hover:bg-slate-900/30 hover:border-slate-800 transition-all active:scale-98"
              title="Click to view all joined members"
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-slate-200">{event.interestedCount} Members Joined</span>
              </span>
              {event.participants.length > 0 && (
                <div className="flex -space-x-2.5 overflow-hidden">
                  {event.participants.slice(0, 3).map((id, index) => (
                    <img
                      key={index}
                      className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-slate-950 bg-slate-900 p-0.5 border border-slate-800"
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${id}`}
                      alt="User avatar"
                    />
                  ))}
                  {event.participants.length > 3 && (
                    <div className="flex items-center justify-center h-6.5 w-6.5 rounded-full ring-2 ring-slate-950 bg-slate-900 border border-slate-800 text-[8px] font-black text-indigo-400">
                      +{event.participants.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Sticky Actions Container */}
          <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
            
            {/* Main Toggle Interest button */}
            <button
              disabled={isProcessing}
              onClick={handleToggleInterest}
              className={`w-full h-11 rounded-xl text-white font-extrabold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer border active:scale-97
                ${hasInterested
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 hover:bg-rose-500/25 shadow-rose-500/5'
                  : `bg-gradient-to-tr ${accentGradients[categoryColors[event.category]] || 'from-indigo-500 to-purple-600'} border-transparent hover:opacity-90`
                }`}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : hasInterested ? (
                <span>Leave Event</span>
              ) : (
                <span>Join Event</span>
              )}
            </button>

            {/* Add to Calendar Button - hidden on mobile */}
            <button
              onClick={handleAddToCalendar}
              className="hidden lg:flex w-full h-10 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-300 font-bold text-xs items-center justify-center gap-2 transition-all cursor-pointer active:scale-97"
            >
              <CalendarPlus className="w-4 h-4 text-indigo-400" />
              <span>Add to Calendar</span>
            </button>

            {/* Google Maps link button based on Coordinates */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-900 text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-97"
            >
              <span>Open Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Report Event Button */}
            <button
              onClick={() => showToast('Event reported successfully. Our team will review it shortly.', 'info')}
              className="w-full h-10 rounded-xl bg-slate-950 hover:bg-slate-900 border border-rose-500/20 hover:border-rose-500/30 text-rose-455 hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-97"
            >
              <Flag className="w-4 h-4 text-rose-500" />
              <span>Report Event</span>
            </button>

          </div>

        </div>

      </div>

      {/* ─── INTERESTED MEMBERS MODAL OVERLAY ─── */}
      <AnimatePresence>
        {showInterestedModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0b0f19]/95 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Joined Members ({event.interestedCount})</span>
                </h3>
                <button
                  onClick={() => setShowInterestedModal(false)}
                  className="p-1 rounded-full bg-slate-950/40 text-slate-400 hover:text-white border border-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 max-h-[350px] overflow-y-auto space-y-3">
                {isLoadingParticipants ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                  </div>
                ) : event.participants.length === 0 ? (
                  <p className="text-xs text-slate-550 text-center py-4">No joined members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {event.participants.map((userId) => {
                      const profile = participantProfiles.find(p => p.id === userId) || {
                        name: 'CampusLive Student',
                        department: 'Computer Science',
                        year: 'Active Student',
                        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
                        role: 'user'
                      };

                      let roleLabel = 'Student';
                      let roleBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      if (profile.role === 'club_admin') {
                        roleLabel = 'Club Admin';
                        roleBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      } else if (profile.role === 'supreme_admin') {
                        roleLabel = 'Admin';
                        roleBadge = 'bg-purple-500/10 text-purple-400 border-purple-500/25';
                      }

                      return (
                        <div
                          key={userId}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900/60"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800 p-0.5 shrink-0"
                            />
                            <div className="min-w-0 text-left">
                              <span className="font-bold text-white block truncate text-xs">{profile.name}</span>
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                                {profile.department} · {profile.year}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${roleBadge} shrink-0`}>
                            {roleLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-900/60 flex justify-end">
                <button
                  onClick={() => setShowInterestedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EventDetail;
