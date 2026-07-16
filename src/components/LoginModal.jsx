import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  KeyRound, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

const LoginModal = ({ onLogin, onBack, onError }) => {
  const [campusId, setCampusId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically formats entry for VITAP-XXXXXX or CL-XXXX-XXXX
  const handleInputChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    
    if (val.startsWith('VITAP')) {
      // Auto insert dash helper for VITAP-XXXXXX
      if (val.length === 5 && !val.includes('-')) {
        val = val + '-';
      }
      if (val.length <= 12) {
        setCampusId(val);
      }
    } else {
      // Auto insert dash helper for CL-XXXX-XXXX
      if (val.length === 2 && !val.includes('-')) {
        val = val + '-';
      } else if (val.length === 7 && (val.match(/-/g) || []).length === 1) {
        val = val + '-';
      }
      if (val.length <= 12) {
        setCampusId(val);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedId = campusId.trim();
    if (!formattedId) {
      onError('Please enter your Campus ID.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onLogin(formattedId);
    } catch (err) {
      console.error('Login error:', err);
      onError(err.message || 'Campus ID not found. Please review or register a new profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full max-w-md mx-auto p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl backdrop-blur-md relative"
    >
      {/* Header back navigation */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-xl bg-slate-900 border border-slate-850 text-gray-500 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      <div className="text-center mb-6 pt-6">
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Access Profile</h2>
        <p className="text-[11px] text-gray-500 mt-1">Enter your unique credentials code</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Campus ID entry input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Campus ID</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              required
              placeholder="VITAP-7K4P9X"
              value={campusId}
              onChange={handleInputChange}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#06090f] border border-slate-900 text-slate-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/80 transition-all text-xs font-semibold tracking-widest"
            />
          </div>
          <p className="text-[9px] text-gray-650 leading-relaxed pl-1 pt-1 font-medium">
            Format: VITAP-XXXXXX
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-98 mt-6"
        >
          <span>{isSubmitting ? 'Verifying access...' : 'Continue to Dashboard'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
};

export default LoginModal;
