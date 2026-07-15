import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Copy, 
  Check, 
  Download, 
  QrCode, 
  LogOut, 
  User, 
  Trophy, 
  BookOpen, 
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import QRModal from '../components/QRModal';

const SettingsPage = () => {
  const { currentUser, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  if (!currentUser) return null;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  const handleDownloadTxt = () => {
    const textContent = `-------------------------------------------
CAMPUSLIVE PROFILE CREDENTIALS
-------------------------------------------
Campus ID  : ${currentUser.id}
Full Name  : ${currentUser.name}
Department : ${currentUser.department}
Year Group : ${currentUser.year}

IMPORTANT:
Save this credentials card. You will need your unique Campus ID to access your profile from any device. Do not share your Campus ID with anyone.
-------------------------------------------`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CampusLive_Credentials_${currentUser.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Mock standard achievements since Level/XP is tracked in user doc
  const starterBadges = [
    { icon: '🛡️', title: 'Early Adopter', desc: 'Joined during the initial launch phase.' },
    { icon: '🗺️', title: 'Campus Explorer', desc: 'Explored the campus interactive layout map.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-16 font-sans text-gray-300 text-left select-none"
    >
      {/* Header title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Profile &amp; Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Manage your Campus ID, profile credentials, and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Profile Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-[#080b11] border border-slate-900 shadow-xl flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img 
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.id)}`} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 p-1 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-4 ring-[#080b11]"></span>
            </div>
            
            <h2 className="text-base font-bold text-white truncate w-full">{currentUser.name}</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{currentUser.department}</p>
            <p className="text-[9px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">{currentUser.year}</p>
            
            <div className="w-full border-t border-slate-900/60 my-4 pt-4 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-900">
                <span className="text-xs font-black text-white">Lvl {currentUser.level || 1}</span>
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">Level</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-900">
                <span className="text-xs font-black text-white">{currentUser.xp || 0} XP</span>
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">Exp Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Campus ID Details & Badges */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Campus ID Security Credentials Box */}
          <div className="p-6 rounded-2xl bg-[#080b11] border border-slate-900 shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-900/60">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campus ID Credentials</span>
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-900">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-gray-550 uppercase tracking-widest font-semibold">Your Unique ID Code</p>
                  <span className="text-sm font-black text-white tracking-widest">{currentUser.id}</span>
                </div>
                <button
                  onClick={handleCopyId}
                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadTxt}
                  className="h-10 rounded-xl bg-slate-950/30 hover:bg-slate-900 border border-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Credentials Card</span>
                </button>
                <button
                  onClick={() => setQrOpen(true)}
                  className="h-10 rounded-xl bg-slate-950/30 hover:bg-slate-900 border border-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Regenerate QR Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Badges / Accomplishments */}
          <div className="p-6 rounded-2xl bg-[#080b11] border border-slate-900 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-900/60">
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Earned Badges</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {starterBadges.map((badge, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-900"
                >
                  <span className="text-2xl shrink-0">{badge.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200">{badge.title}</p>
                    <p className="text-[10px] text-gray-500 leading-normal mt-0.5 truncate">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone / Logout */}
          <div className="p-6 rounded-2xl bg-rose-950/5 border border-rose-500/10 shadow-xl space-y-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h4>
              <p className="text-[10px] text-gray-500 leading-normal max-w-sm">
                Logging out removes your Campus ID from this device. You will need your code to log back in.
              </p>
            </div>
            <button
              onClick={logout}
              className="h-10 px-5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Profile</span>
            </button>
          </div>

          {/* About Section */}
          <div className="p-6 rounded-2xl bg-[#080b11] border border-slate-900 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-900/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>About CampusLive</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs font-medium">
              <div className="space-y-1">
                <p className="text-[9px] text-gray-550 uppercase tracking-wider">App Name</p>
                <p className="text-slate-200 font-bold">CampusLive</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-gray-550 uppercase tracking-wider">Version</p>
                <p className="text-slate-200 font-bold">v0.9.0 "Public Preview"</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-gray-550 uppercase tracking-wider">Environment</p>
                <p className="text-slate-200 font-bold capitalize">{import.meta.env.MODE || 'production'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-gray-550 uppercase tracking-wider">Build Date</p>
                <p className="text-slate-200 font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* QR Modal Overlay */}
      <AnimatePresence>
        {qrOpen && (
          <QRModal
            isOpen={qrOpen}
            onClose={() => setQrOpen(false)}
            campusId={currentUser.id}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SettingsPage;
