import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  User,
  Calendar,
  Timer
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getRelativeTime, getRemainingTime } from '../utils/time';
import { DiscussionModal } from './DiscussionModal';
import { subscribeDiscussionCount } from '../services/discussionService';

/**
 * Detail modal that opens when a Lost/Found item is tapped in the list.
 * Shows full item details + reporter's name fetched from Firestore.
 */
const LostFoundDetailModal = ({ isOpen, onClose, pin, currentUserId, currentUser, onResolve }) => {
  const [reporterName, setReporterName] = useState(null);
  const [reporterAvatar, setReporterAvatar] = useState(null);
  const [loadingReporter, setLoadingReporter] = useState(false);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  // Fetch reporter profile when the modal opens
  useEffect(() => {
    if (!isOpen || !pin?.createdBy) {
      setReporterName(null);
      setReporterAvatar(null);
      return;
    }

    // If the pin already carries the reporter name (future-proofing), use it directly
    if (pin.createdByName) {
      setReporterName(pin.createdByName);
      setReporterAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pin.createdBy)}`);
      return;
    }

    const fetchReporter = async () => {
      setLoadingReporter(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', pin.createdBy));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setReporterName(data.name || 'CampusLive User');
          setReporterAvatar(data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pin.createdBy)}`);
        } else {
          setReporterName('CampusLive User');
          setReporterAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pin.createdBy)}`);
        }
      } catch (err) {
        console.error('Failed to fetch reporter profile:', err);
        setReporterName('CampusLive User');
        setReporterAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pin.createdBy)}`);
      } finally {
        setLoadingReporter(false);
      }
    };

    fetchReporter();
  }, [isOpen, pin?.createdBy, pin?.createdByName]);

  // Subscribe to message count in real-time
  useEffect(() => {
    if (!isOpen || !pin?.id) {
      setMsgCount(0);
      return;
    }
    const unsub = subscribeDiscussionCount(pin.id, (count) => {
      setMsgCount(count);
    });
    return () => unsub();
  }, [isOpen, pin?.id]);

  if (!isOpen || !pin) return null;

  const isLost = pin.type === 'lost';
  const isCreator = currentUserId && (pin.createdBy === currentUserId || currentUser?.role === 'supreme_admin');
  const createdAtMs = pin.createdAt?.seconds ? pin.createdAt.seconds * 1000 : Date.now();

  const miniMapIcon = L.divIcon({
    className: '',
    html: `<div class="w-4 h-4 rounded-full ${isLost ? 'bg-amber-500' : 'bg-emerald-500'} border-2 border-white animate-pulse" />`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-[#0b0f19]/95 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden my-8"
          >
            {/* Mini Map Preview Header */}
            <div className="relative h-40 w-full bg-slate-950 border-b border-slate-800/60 overflow-hidden">
              <div className="w-full h-full relative z-0">
                <MapContainer
                  center={[pin.latitude, pin.longitude]}
                  zoom={17}
                  zoomControl={false}
                  attributionControl={false}
                  dragging={false}
                  doubleClickZoom={false}
                  scrollWheelZoom={false}
                  className="w-full h-full z-0 mini-map-preview dark-map"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[pin.latitude, pin.longitude]} icon={miniMapIcon} />
                </MapContainer>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-black/30 z-10 pointer-events-none" />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/50 backdrop-blur-md text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Type Badge on map */}
              <div className="absolute bottom-3 left-4 z-20">
                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border backdrop-blur-md
                  ${isLost 
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' 
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                  }`}
                >
                  {isLost ? '🟡 Lost Item' : '🟢 Found Item'}
                </span>
              </div>

              {/* Coordinates */}
              <div className="absolute bottom-3 right-4 z-20">
                <span className="text-[9px] font-semibold text-gray-400 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded">
                  {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white leading-tight">{pin.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{pin.description}</p>
              </div>

              {/* Reporter Card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {reporterAvatar ? (
                    <img 
                      src={reporterAvatar} 
                      alt="Reporter"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Reported by</span>
                  <p className="text-xs font-bold text-white truncate mt-0.5">
                    {loadingReporter ? (
                      <span className="inline-block w-20 h-3 bg-slate-800 rounded animate-pulse" />
                    ) : (
                      <>
                        {isCreator ? 'You' : (reporterName || 'CampusLive User')}
                        {isCreator && (
                          <span className="ml-1.5 text-[8px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                            Author
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Time Info Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/50">
                  <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block">Posted</span>
                    <span className="text-[10px] font-bold text-white">{getRelativeTime(createdAtMs)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/50">
                  <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                    <Timer className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider block">Expires</span>
                    <span className="text-[10px] font-bold text-indigo-400">{getRemainingTime(pin.expiresAtMs)}</span>
                  </div>
                </div>
              </div>

              {/* Auto-expiry info */}
              <div className="flex gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-400/90">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                <p className="leading-relaxed">
                  This report will auto-expire after <strong>48 hours</strong> if not resolved by the reporter.
                </p>
              </div>

              {/* Discussion Thread Trigger */}
              <button
                type="button"
                onClick={() => setIsDiscussionOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 text-gray-300 hover:text-white transition-all cursor-pointer select-none font-bold text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Public Discussion Thread</span>
                </div>
                <div className="flex items-center gap-2">
                  {msgCount > 0 && (
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      {msgCount} {msgCount === 1 ? 'message' : 'messages'}
                    </span>
                  )}
                  <span className="text-gray-500 font-bold">&rarr;</span>
                </div>
              </button>

              {/* Dedicated Discussion Modal popup */}
              <DiscussionModal
                isOpen={isDiscussionOpen}
                onClose={() => setIsDiscussionOpen(false)}
                pin={pin}
                currentUser={currentUser}
              />

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800/50 flex items-center gap-2.5">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl bg-slate-950/60 border border-slate-800 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
                {isCreator && (
                  <button
                    onClick={() => {
                      onResolve(pin.id);
                      onClose();
                    }}
                    className="flex-1 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LostFoundDetailModal;
