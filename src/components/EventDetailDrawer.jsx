import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Users,
  Navigation,
  Trash2,
  AlertTriangle,
  Info,
  ChevronRight,
  Flag
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { joinActivity, leaveActivity } from '../services/activityService';
import { accentGradients } from '../utils/constants';

const LOGO_EASE = [0.22, 1, 0.36, 1];

const EventDetailDrawer = ({ isOpen, onClose, event, currentUserId, currentUser, onDelete }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoiningLeaving, setIsJoiningLeaving] = useState(false);
  const [participantProfiles, setParticipantProfiles] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

  const isCreator = currentUserId && (event?.createdBy === currentUserId || currentUser?.role === 'supreme_admin');
  const hasJoined = event?.participants?.includes(currentUserId);
  const participantCount = event?.participants?.length || 0;

  // Handle Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent scrolling on body when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Real-time listener for participant profiles
  useEffect(() => {
    if (!isOpen || !event?.participants || event.participants.length === 0) {
      setParticipantProfiles([]);
      setIsLoadingParticipants(false);
      return;
    }

    setIsLoadingParticipants(true);
    // Slice to max 30 to comply with Firestore 'in' limit
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
  }, [event?.participants, isOpen]);

  if (!event) return null;

  console.log('Event in drawer:', event.title, 'organizerName:', event.organizerName, 'creatorName:', event.creatorName);

  const building = event.building || 'Campus Landmark';
  const distance = event.distance || 'Near you';
  const organizerAvatar = event.organizerLogo || `https://api.dicebear.com/7.x/bottts/svg?seed=${event.createdBy || event.id}`;
  const organizerName = event.organizerName || event.creatorName || 'CampusLive User';
  const organizerProfile = participantProfiles.find(p => p.id === event.createdBy);
  const isOrganizerAdmin = event.creatorRole === 'supreme_admin' || organizerProfile?.role === 'supreme_admin';
  const tags = event.tags || [`#${event.category}`, '#CampusLive'];

  const displayProfiles = event.participants ? event.participants.map(id => {
    const found = participantProfiles.find(p => p.id === id);
    if (found) return found;
    return {
      id,
      name: 'CampusLive Member', // Fallback to generic name instead of raw ID
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
      department: 'CSE',
      year: '1st Year'
    };
  }) : [];

  const handleJoinLeaveToggle = async () => {
    if (!currentUserId || !event?.id) return;
    setIsJoiningLeaving(true);
    try {
      if (hasJoined) {
        await leaveActivity(event.id, currentUserId);
      } else {
        await joinActivity(event.id, currentUserId);
      }
    } catch (err) {
      console.error('Failed to toggle join/leave status:', err);
    } finally {
      setIsJoiningLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !event?.id) return;
    setIsDeleting(true);
    try {
      await onDelete(event.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const drawerVariants = {
    hidden: isMobile ? { y: '100%' } : { x: '100%' },
    visible: isMobile ? { y: 0 } : { x: 0 },
    exit: isMobile ? { y: '100%' } : { x: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`fixed z-50 bg-[#0b0f19] shadow-2xl flex flex-col font-sans text-slate-350
              ${isMobile
                ? 'bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl border-t border-slate-900'
                : 'top-0 right-0 h-screen w-full max-w-md border-l border-slate-900'
              }`}
          >
            {/* Mobile Drag Handle */}
            {isMobile && (
              <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
                <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
              </div>
            )}

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-24">

              {/* Header / Banner */}
              <div className="relative h-48 w-full bg-slate-900 shrink-0">
                <div className={`absolute inset-0 bg-gradient-to-br ${accentGradients[event.color] || 'from-indigo-500 to-purple-600'} opacity-20`} />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Creator Delete Button */}
                {isCreator && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="absolute top-4 right-14 p-2 rounded-full bg-black/40 backdrop-blur-md text-rose-450 hover:text-rose-300 hover:bg-black/60 hover:scale-105 active:scale-95 transition-all z-10"
                    title="Delete Activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Report Button */}
                <button
                  title="Report this event"
                  onClick={() => alert('Thank you for reporting. Our moderators will review this event.')}
                  className="absolute top-4 left-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-slate-400 hover:text-rose-400 hover:bg-black/60 hover:scale-105 active:scale-95 transition-all z-10 flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Report</span>
                </button>

                {/* Status Badges */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-md border shadow-sm
                      ${event.isLive
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      {event.isLive ? '● Live' : 'Upcoming'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-md border shadow-sm
                      ${event.eventType === 'club'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : event.eventType === 'university'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {event.eventType === 'club'
                        ? 'Official Club'
                        : event.eventType === 'university'
                          ? 'University'
                          : 'Student'
                      }
                    </span>
                    <span className="text-[10px] bg-black/40 backdrop-blur-md text-slate-200 border border-white/10 font-semibold uppercase tracking-wider px-2 py-1 rounded">
                      {event.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-8 text-left">

                {/* Title & Organizer */}
                <div className="space-y-3">
                  <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                    {event.name}
                  </h1>
                  <div className="flex items-center gap-2.5">
                    <img
                      src={organizerAvatar}
                      alt={organizerName}
                      className="w-8 h-8 rounded-full bg-slate-800 border border-slate-800"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span>{organizerName}</span>
                        {isOrganizerAdmin && (
                          <span title="Supreme Admin" className="text-amber-400 text-[10px]">👑</span>
                        )}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium tracking-wide flex items-center gap-1.5">
                        <span>Event Organizer</span>
                        {isOrganizerAdmin && (
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 font-black uppercase tracking-wider scale-90 origin-left">
                            Admin
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 truncate">{building}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">{event.room}</p>
                      <p className="text-[9px] text-indigo-400/80 font-bold mt-1.5">{distance}</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Time</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Today</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{event.startTime} - {event.endTime}</p>
                      {event.isLive && <p className="text-[9px] text-rose-450 font-bold mt-1.5">Happening Now</p>}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">About Activity</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {event.description || 'No description provided for this activity.'}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950/40 border border-slate-900 text-[10px] font-bold text-indigo-400/90">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Live Participants Summary Card */}
                <div className="space-y-3">
                  <div 
                    onClick={() => setShowParticipantsModal(true)}
                    className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex items-center justify-between group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">Joined Participants</p>
                        <p className="text-[9px] text-slate-505 font-medium mt-0.5">Click to view all profiles</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-950 border border-slate-850 text-indigo-400 rounded-full">
                        {participantCount}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover/btn:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                <div className="h-4" />
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0b0f19]/90 backdrop-blur-md border-t border-slate-900 z-20 space-y-2">
              <button
                onClick={handleJoinLeaveToggle}
                disabled={isJoiningLeaving || !currentUserId}
                className={`w-full h-11 rounded-xl text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50
                  ${hasJoined
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/20 shadow-rose-500/5'
                    : `bg-gradient-to-r ${accentGradients[event.color] || 'from-indigo-500 to-purple-600'} hover:opacity-90 shadow-indigo-500/20`
                  }`}
              >
                {isJoiningLeaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : hasJoined ? (
                  <>
                    <X className="w-4 h-4" />
                    <span>Leave Activity</span>
                  </>
                ) : (
                  <>
                    <span>Join Activity</span>
                    <Navigation className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Report Button */}
              <button
                title="Report this event"
                onClick={() => alert('Thank you for reporting. Our moderators will review this event.')}
                className="w-full h-8 rounded-xl border border-slate-900/60 text-slate-600 hover:text-rose-400 hover:border-rose-500/25 hover:bg-rose-500/5 font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Event</span>
              </button>
            </div>
          </motion.div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ duration: 0.25, ease: LOGO_EASE }}
                  className="relative z-10 w-full max-w-sm rounded-2xl bg-[#0b0f19] border border-slate-900 p-6 shadow-2xl text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">Delete Activity</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-white">{event.name}</span>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 h-10 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-400 text-xs font-bold hover:bg-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-extrabold hover:bg-rose-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Participants List Modal */}
          <AnimatePresence>
            {showParticipantsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4"
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowParticipantsModal(false)} />
                <motion.div
                  initial={{ scale: 0.95, y: 15, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 15, opacity: 0 }}
                  transition={{ duration: 0.25, ease: LOGO_EASE }}
                  className="relative z-10 w-full max-w-md rounded-2xl bg-[#0b0f19] border border-slate-900 flex flex-col max-h-[70vh] shadow-2xl overflow-hidden text-left"
                >
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Joined Participants</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Students attending this activity</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowParticipantsModal(false)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 overflow-y-auto scrollbar-none flex-1 space-y-2 min-h-[220px]">
                    {isLoadingParticipants ? (
                      <div className="space-y-2 py-2">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="flex items-center gap-3 animate-pulse p-2">
                            <div className="w-8 h-8 bg-slate-900 rounded-full" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-slate-900 rounded w-1/3" />
                              <div className="h-2 bg-slate-900 rounded w-1/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : displayProfiles.length > 0 ? (
                      displayProfiles.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/20 border border-slate-900 hover:border-slate-850 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                              alt={user.name}
                              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-850 object-cover"
                            />
                            <div className="min-w-0 text-left leading-tight">
                              <p className="text-xs font-bold text-slate-205 truncate flex items-center gap-1">
                                <span>{user.name}</span>
                                {user.role === 'supreme_admin' && (
                                  <span title="Supreme Admin" className="text-amber-400 text-[10px]">👑</span>
                                )}
                              </p>
                              <p className="text-[9.5px] text-slate-500 font-semibold mt-0.5 truncate">
                                {[
                                  user.username ? `@${user.username}` : null,
                                  user.department,
                                  user.year
                                ].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center border border-dashed border-slate-900/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <Info className="w-5 h-5 text-slate-650" />
                        <p className="text-[11px] text-slate-500 font-medium">No participants yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 bg-slate-950/30 border-t border-slate-900 flex justify-end">
                    <button
                      onClick={() => setShowParticipantsModal(false)}
                      className="px-4 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default EventDetailDrawer;
