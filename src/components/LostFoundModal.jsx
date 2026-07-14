import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, MapPin, AlertTriangle } from 'lucide-react';

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
  onChooseLocation
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onChooseLocation();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f19] p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Report Lost/Found Item</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
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
            <div className="flex gap-2 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="leading-relaxed">
                Pins expire automatically after <strong>48 hours</strong> if not resolved. Choose a highly accurate spot on the map next.
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
                disabled={!title.trim() || !description.trim()}
                className="h-10 px-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Choose Location</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
