import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';

/**
 * Confirmation dialog before saving the pin location to Firestore.
 */
export const LostFoundConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  coordinates,
  isSaving
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-[#0b0f19] p-6 shadow-2xl z-10"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-3 rounded-full bg-slate-900 border
              ${type === 'lost' ? 'border-yellow-500/30 text-yellow-500' : 'border-emerald-500/30 text-emerald-500'}`}>
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirm Pin Placement</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to drop this pin here on the map?
              </p>
            </div>

            {/* Pin Summary */}
            <div className="w-full p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 text-left space-y-1">
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
                <span className="text-gray-500">Pin Type</span>
                <span className={type === 'lost' ? 'text-yellow-500' : 'text-emerald-500'}>
                  {type === 'lost' ? '🟡 Lost Item' : '🟢 Found Item'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold pt-1 border-t border-slate-900">
                <span className="text-gray-500">Item Name</span>
                <span className="text-slate-350 truncate max-w-[150px]">{title}</span>
              </div>
              {coordinates && (
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold pt-1 border-t border-slate-900">
                  <span className="text-gray-500">Coordinates</span>
                  <span className="text-slate-450 font-mono">
                    {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 h-10 rounded-xl bg-slate-950/40 border border-slate-900 hover:bg-slate-900 text-gray-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSaving}
                className={`flex-1 h-10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50
                  ${type === 'lost'
                    ? 'bg-gradient-to-tr from-yellow-600 to-amber-600 shadow-yellow-500/10'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/10'
                  }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
