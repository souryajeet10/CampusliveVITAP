import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, MapPin as MapPinIcon, HelpCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import { accentGradients, eventCategories, categoryColors, defaultEventCovers } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Helper to determine approximate building name based on coordinates
const getBuildingName = (coords) => {
  if (!coords) return 'Unknown Location';
  const [lat, lng] = coords;
  if (lat > 16.5065 && lat < 16.5075 && lng > 80.5230 && lng < 80.5245) {
    return 'SRK Block (Block A)';
  }
  if (lat > 16.5055 && lat < 16.5065 && lng > 80.5220 && lng < 80.5235) {
    return 'Dr. S. Radhakrishnan Block (Block B)';
  }
  if (lat > 16.5075 && lat < 16.5085 && lng > 80.5240 && lng < 80.5255) {
    return 'APJ Abdul Kalam Block (Block C)';
  }
  return 'Campus Commons';
};

const CreateActivityModal = ({ isOpen, onClose, tempCoords, onSubmit, isSubmitting, onChangeLocation }) => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || 'user';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [roomName, setRoomName] = useState('');

  // Event Type states based on User Role
  const [eventType, setEventType] = useState('student');
  const [organizerName, setOrganizerName] = useState('');
  const [clubsList, setClubsList] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState('');

  // Load active clubs on mount to populate selector
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'clubs'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, name: doc.data().name });
        });
        setClubsList(list);

        // Pre-select if role is club_admin and matched
        if (userRole === 'club_admin') {
          const matchedClub = list.find(c => c.id === 'club_coding_club');
          if (matchedClub) {
            setSelectedClubId(matchedClub.id);
            setOrganizerName(matchedClub.name);
          }
        }
      } catch (err) {
        console.error('Error fetching clubs in creation modal:', err);
      }
    };
    if (isOpen) {
      fetchClubs();
    }
  }, [isOpen, userRole]);

  // Synchronize role updates
  useEffect(() => {
    if (userRole === 'supreme_admin' || userRole === 'university_admin') {
      setEventType('university');
      setOrganizerName('VIT-AP Administration');
    } else if (userRole === 'club_admin') {
      setEventType('club');
      // Set to Coding Club or first matching
      const defaultClub = clubsList.find(c => c.id === 'club_coding_club') || clubsList[0];
      if (defaultClub) {
        setOrganizerName(defaultClub.name);
        setSelectedClubId(defaultClub.id);
      } else {
        setOrganizerName('Coding Club');
        setSelectedClubId('club_coding_club');
      }
    } else {
      setEventType('student');
      setOrganizerName(currentUser?.name || '');
    }
  }, [userRole, currentUser, clubsList]);

  const bannerColor = categoryColors[category] || 'indigo';

  // Validation errors
  const [errors, setErrors] = useState({});

  const building = getBuildingName(tempCoords);

  useEffect(() => {
    // Basic real-time validation for end time after start time
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        setErrors((prev) => ({ ...prev, endTime: 'End time must be after start time' }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.endTime;
          return updated;
        });
      }
    }
  }, [startTime, endTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!tempCoords) newErrors.location = 'Please select a location on the map';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!date) newErrors.date = 'Date is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';

    if (eventType === 'club' && !organizerName.trim()) {
      newErrors.organizerName = 'Organizer club is required';
    }

    // Verify time logic
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const clubId = eventType === 'club' ? (selectedClubId || 'club_' + organizerName.toLowerCase().trim().replace(/ /g, '_')) : null;
    const finalOrganizerName = eventType === 'university' ? 'VIT-AP Administration' : (eventType === 'student' ? (currentUser?.name || 'Student') : organizerName);
    const organizerLogo = eventType === 'university'
      ? 'https://api.dicebear.com/7.x/initials/svg?seed=VITAP'
      : eventType === 'club'
        ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(finalOrganizerName)}`
        : currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.id || 'student')}`;

    onSubmit({
      title: title,
      name: title, // legacy compatibility
      category,
      description,
      eventType,
      clubId,
      organizerName: finalOrganizerName,
      organizerLogo,
      coverImage: defaultEventCovers[category] || defaultEventCovers.Other,
      location: `${roomName || 'Campus Commons'}, ${building}`,
      date,
      startTime,
      endTime,
      maxParticipants: parseInt(maxParticipants, 10),
      color: bannerColor,
      room: roomName || 'Campus Commons',
      coordinates: tempCoords,
      building: building,
      interestedCount: 1,
    });
  };

  const miniMapIcon = L.divIcon({
    className: '',
    html: `<div class="w-4 h-4 rounded-full bg-indigo-500 border border-white animate-pulse" />`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-[#0b0f19]/95 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8"
          >
            {/* Top Preview Banner with Mini Map */}
            <div className="relative h-44 w-full bg-slate-950 border-b border-slate-900 overflow-hidden">
              {tempCoords ? (
                <div className="w-full h-full relative z-0">
                  <MapContainer
                    center={tempCoords}
                    zoom={17}
                    zoomControl={false}
                    attributionControl={false}
                    dragging={false}
                    doubleClickZoom={false}
                    scrollWheelZoom={false}
                    className="w-full h-full z-0 mini-map-preview"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={tempCoords} icon={miniMapIcon} />
                  </MapContainer>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-black/20 to-black/10 pointer-events-none z-10" />
                  
                  {/* Location label */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-white z-10">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-md flex items-center justify-center shrink-0">
                      <MapPinIcon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-black tracking-wide uppercase drop-shadow-md truncate">
                      {roomName ? `${roomName}, ${building}` : building}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-6 text-center select-none bg-slate-950/80">
                  <HelpCircle className="w-8 h-8 text-slate-650" />
                  <span className="text-[10px] font-black uppercase tracking-wider">No Location Selected</span>
                  <p className="text-[9px] text-slate-600 font-semibold max-w-[200px] leading-relaxed">
                    Double-click or tap anywhere on the campus map to place your event pin.
                  </p>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-950/80 border border-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer z-30"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Event Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[420px] overflow-y-auto text-xs font-semibold text-slate-400 scrollbar-thin">
              
              {/* Error Header */}
              {Object.keys(errors).length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 flex gap-2 text-[10px] text-rose-400 font-bold leading-normal">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-white font-extrabold uppercase tracking-wide">Validation Error</p>
                    <p>Please address all marked fields below to create this activity.</p>
                  </div>
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI Agents Hackathon, Football friendly..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full h-9 px-3 rounded-lg bg-[#06090f] border text-slate-200 placeholder-gray-600 focus:outline-none transition-all font-semibold
                    ${errors.title ? 'border-rose-500/50 focus:border-rose-500/85' : 'border-slate-900 focus:border-indigo-500/80'}`}
                />
                {errors.title && <p className="text-[10px] font-bold text-rose-400">{errors.title}</p>}
              </div>

              {/* Event Type selection (For Supreme Admins or testing) */}
              {(userRole === 'supreme_admin' || userRole === 'university_admin') && (
                <div className="space-y-1">
                  <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Event Scope / Type</label>
                  <div className="flex gap-2">
                    {[
                      { type: 'student', label: 'Student' },
                      { type: 'club', label: 'Official Club' },
                      { type: 'university', label: 'University' },
                    ].map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          setEventType(opt.type);
                          if (opt.type === 'university') setOrganizerName('VIT-AP Administration');
                          else if (opt.type === 'club') {
                            const defaultClub = clubsList.find(c => c.id === 'club_coding_club') || clubsList[0];
                            if (defaultClub) {
                              setOrganizerName(defaultClub.name);
                              setSelectedClubId(defaultClub.id);
                            }
                          } else setOrganizerName(currentUser?.name || '');
                        }}
                        className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] transition-all cursor-pointer text-center
                          ${eventType === opt.type
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            : 'bg-[#06090f] border-slate-900 text-slate-500 hover:text-slate-350'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Club Organizer dropdown select if event type is club */}
              {eventType === 'club' && (
                <div className="space-y-1">
                  <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Hosting Club Name</label>
                  <select
                    value={organizerName}
                    onChange={(e) => {
                      const selName = e.target.value;
                      setOrganizerName(selName);
                      const matchingClub = clubsList.find(c => c.name === selName);
                      if (matchingClub) {
                        setSelectedClubId(matchingClub.id);
                      } else {
                        setSelectedClubId('');
                      }
                    }}
                    className={`w-full h-9 px-3 rounded-lg bg-[#06090f] border text-slate-200 focus:outline-none transition-all font-semibold text-xs cursor-pointer
                      ${errors.organizerName ? 'border-rose-500/50 focus:border-rose-500/85' : 'border-slate-900 focus:border-indigo-500/80'}`}
                  >
                    <option value="">Select Club...</option>
                    {clubsList.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  {errors.organizerName && <p className="text-[10px] font-bold text-rose-400">{errors.organizerName}</p>}
                </div>
              )}

              {/* Room name & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Room / Sub-location</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204, Block C"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-[#06090f] border border-slate-900 text-slate-350 focus:outline-none focus:border-indigo-500/80 transition-all font-semibold cursor-pointer"
                  >
                    {eventCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Description</label>
                <textarea
                  placeholder="Describe what is happening, rules, and details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2.5}
                  className="w-full p-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all font-semibold resize-none"
                />
              </div>

              {/* Event Date Picker */}
              <div className="space-y-1">
                <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Event Date</label>
                <DatePicker value={date} onChange={setDate} error={errors.date} />
                {errors.date && <p className="text-[10px] font-bold text-rose-400">{errors.date}</p>}
              </div>

              {/* Start & End Time Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Start Time</label>
                  <TimePicker value={startTime} onChange={setStartTime} error={errors.startTime} />
                  {errors.startTime && <p className="text-[10px] font-bold text-rose-400">{errors.startTime}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">End Time</label>
                  <TimePicker value={endTime} onChange={setEndTime} error={errors.endTime} />
                  {errors.endTime && <p className="text-[10px] font-bold text-rose-400">{errors.endTime}</p>}
                </div>
              </div>

              {/* Max Attendees */}
              <div className="space-y-1">
                <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Max Participants</label>
                <input
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all font-semibold"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 h-9 rounded-lg bg-slate-950/40 border border-slate-900 text-gray-500 hover:text-white transition-all font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 via-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-660/15 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateActivityModal;
