import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  Download, 
  Shield,
  ArrowRight
} from 'lucide-react';

const CampusIdCard = ({ campusId, name, department, year, onContinue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(campusId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownloadTxt = () => {
    const textContent = `-------------------------------------------
CAMPUSLIVE PROFILE CREDENTIALS
-------------------------------------------
Campus ID  : ${campusId}
Full Name  : ${name}
Department : ${department}
Year Group : ${year}

IMPORTANT:
Save this credentials card. You will need your unique Campus ID to access your profile from any device. Do not share your Campus ID with anyone.
-------------------------------------------`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CampusLive_Credentials_${campusId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Visual Credentials Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-[#0c0e17] to-[#05070a] p-6 shadow-2xl"
      >
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />
        
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900/60 mb-5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Campus ID Card</span>
          </div>
          <Shield className="w-4 h-4 text-indigo-500/80" />
        </div>

        {/* Card Content */}
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Campus ID</p>
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-900">
              <span className="text-sm font-black text-white tracking-widest">{campusId}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Full Name</p>
              <p className="text-xs font-bold text-slate-200 mt-1 truncate">{name}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Department</p>
              <p className="text-xs font-bold text-slate-200 mt-1 truncate">{department}</p>
            </div>
          </div>

          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Academic Year</p>
            <p className="text-xs font-bold text-slate-200 mt-1">{year}</p>
          </div>
        </div>
      </motion.div>

      {/* Action list */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <button
          onClick={handleDownloadTxt}
          className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Download TXT Credentials</span>
        </button>

        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer active:scale-98"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </motion.div>


    </div>
  );
};

export default CampusIdCard;
