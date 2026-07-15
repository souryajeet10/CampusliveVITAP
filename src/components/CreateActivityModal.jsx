import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { X as CloseIcon, MapPin as MapPinIcon, HelpCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import { accentGradients } from '../utils/constants';

// Helper to determine approximate building name based on coordinates
const getBuildingName = (coords) => {
  if (!coords) return 'Unknown Location';
  const [lat, lng] = coords;
  // A simple mockup of coordinate-to-building mapping
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
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tech');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [roomName, setRoomName] = useState('');

  const categoryColors = {
    Study: 'blue',
    Sports: 'emerald',
    Food: 'pink',
    Tech: 'indigo',
    Music: 'purple',
    Gaming: 'amber'
  };
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

    onSubmit({
      name: title,
      category,
      description,
      date,
      startTime,
      endTime,
      maxParticipants: parseInt(maxParticipants, 10),
      color: bannerColor,
      room: roomName || 'Campus Commons',
      coordinates: tempCoords,
      building: building,
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
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-black/35 z-10 pointer-events-none" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-550 z-0">
                  <MapPinIcon className="w-8 h-8 mb-2 text-gray-655" />
                  <p className="text-xs">No location selected</p>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/45 backdrop-blur-md text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              {/* Selection Details Overlay */}
              <div className="absolute bottom-3 left-4 right-4 z-20 flex justify-between items-end">
                <div className="text-left">
                  <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    Selected Location
                  </span>
                  <h4 className="text-sm font-black text-white mt-1 leading-tight">{building}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {tempCoords ? `${tempCoords[0].toFixed(5)}, ${tempCoords[1].toFixed(5)}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onChangeLocation}
                  className="px-2.5 py-1 rounded bg-[#0b0f19]/80 border border-slate-800 text-[10px] font-bold text-indigo-400 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Change Location
                </button>
              </div>
            </div>

            {/* Gradient Line */}
            <div className={`h-1 w-full bg-gradient-to-r ${accentGradients[bannerColor]}`} />

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left text-xs">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-gray-450 font-bold uppercase tracking-wider text-[9px]">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI Prompt Battle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full h-9 px-3 rounded-lg bg-[#06090f] border text-slate-200 placeholder-gray-600 focus:outline-none transition-all font-semibold
                    ${errors.title ? 'border-rose-500/50 focus:border-rose-500/85' : 'border-slate-900 focus:border-indigo-500/80'}`}
                />
                {errors.title && <p className="text-[10px] font-bold text-rose-400">{errors.title}</p>}
              </div>

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
                    <option value="Study">Study</option>
                    <option value="Sports">Sports</option>
                    <option value="Food">Food</option>
                    <option value="Tech">Tech</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
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
                  className="px-5 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 via-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Create Activity'
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
