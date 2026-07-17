import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, MapPin, AlertTriangle, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

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

/**
 * Modal to enter details for creating a new Lost or Found item.
 */
export const LostFoundModal = ({
  isOpen,
  onClose,
  type,
  setType,
  title,
  setTitle,
  description,
  setDescription,
  onSubmit,
  coordinates,
  isSaving,
  onChangeLocation
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !coordinates) return;
    onSubmit();
  };

  const building = getBuildingName(coordinates);

  const miniMapIcon = L.divIcon({
    className: '',
    html: `<div class="w-4 h-4 rounded-full bg-indigo-500 border border-white animate-pulse" />`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-[#0b0f19]/95 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Top Preview Banner with Mini Map */}
          <div className="relative h-44 w-full bg-slate-950 border-b border-slate-900 overflow-hidden">
            {coordinates ? (
              <div className="w-full h-full relative z-0">
                <MapContainer
                  center={coordinates}
                  zoom={17}
                  zoomControl={false}
                  attributionControl={false}
                  dragging={false}
                  doubleClickZoom={false}
                  scrollWheelZoom={false}
                  className="w-full h-full z-0 mini-map-preview"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={coordinates} icon={miniMapIcon} />
                </MapContainer>
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-black/35 z-10 pointer-events-none" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 z-0">
                <MapPin className="w-8 h-8 mb-2 text-gray-600" />
                <p className="text-xs">No location selected</p>
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/45 backdrop-blur-md text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Selection Details Overlay */}
            <div className="absolute bottom-3 left-4 right-4 z-20 flex justify-between items-end">
              <div className="text-left">
                <span className="text-[8.5px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Selected Location
                </span>
                <h4 className="text-sm font-black text-white mt-1 leading-tight">{building}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {coordinates ? `${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}` : ''}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-left text-xs">
            {/* Type Selector */}
            <div className="space-y-1">
              <label className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                Pin Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('lost')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer
                    ${type === 'lost'
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-sm'
                      : 'bg-slate-950/40 border-slate-900 text-gray-500 hover:text-gray-300 hover:bg-slate-900/50'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  🟡 Lost Item
                </button>
                <button
                  type="button"
                  onClick={() => setType('found')}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer
                    ${type === 'found'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm'
                      : 'bg-slate-950/40 border-slate-900 text-gray-500 hover:text-gray-300 hover:bg-slate-900/50'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  🟢 Found Item
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label htmlFor="lfTitle" className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                Item Name / Title
              </label>
              <input
                id="lfTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Black leather wallet, iPhone 14"
                required
                className="w-full h-10 px-3.5 rounded-xl bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="lfDesc" className="block text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                  Description
                </label>
                <span className={`text-[9px] font-bold ${description.length > 130 ? 'text-rose-500' : 'text-gray-600'}`}>
                  {description.length} / 150
                </span>
              </div>
              <textarea
                id="lfDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 150))}
                placeholder="Where did you lose/find it? Color, brand, or any distinct marking..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold resize-none"
              />
            </div>

            {/* Warning info */}
            <div className="flex gap-2 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <p className="leading-relaxed">
                Pins expire automatically after <strong>48 hours</strong> if not resolved.
              </p>
            </div>

            {/* Footer Submit */}
            <div className="pt-3 border-t border-slate-900 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl bg-slate-950/40 border border-slate-900 text-gray-500 hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !description.trim() || !coordinates || isSaving}
                className="h-10 px-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Post Pin'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
