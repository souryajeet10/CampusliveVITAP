import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  X,
  Search,
  ShieldCheck,
  Building,
  Users
} from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';

// Toast Notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md
        ${type === 'success' 
          ? 'bg-emerald-950/90 border-emerald-500/25 text-emerald-400' 
          : 'bg-indigo-950/90 border-indigo-500/25 text-indigo-400'
        }`}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
};

export default function Announcements() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for creating University Announcements
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Determine if user can post global university announcements
  const isUniversityAdmin = useMemo(() => {
    return currentUser?.role === 'supreme_admin' || currentUser?.role === 'university_admin';
  }, [currentUser]);

  // Load announcements and clubs in real-time
  useEffect(() => {
    const annQuery = query(collection(db, 'club_announcements'), orderBy('createdAt', 'desc'));
    const unsubAnn = onSnapshot(annQuery, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAnnouncements(list);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching announcements:', error);
      setIsLoading(false);
    });

    const unsubClubs = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClubs(list);
    });

    return () => {
      unsubAnn();
      unsubClubs();
    };
  }, []);

  // Map club details to cache for O(1) lookups
  const clubsCache = useMemo(() => {
    const cache = {};
    clubs.forEach((c) => {
      cache[c.id] = c;
    });
    return cache;
  }, [clubs]);

  // Filtered announcements list
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const titleMatch = ann.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const contentMatch = ann.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const creatorMatch = ann.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const club = clubsCache[ann.clubId];
      const clubMatch = club ? club.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const isUnivMatch = ann.clubId === 'university' && 'university'.includes(searchQuery.toLowerCase());
      
      return titleMatch || contentMatch || creatorMatch || clubMatch || isUnivMatch;
    });
  }, [announcements, searchQuery, clubsCache]);

  const handlePublishAnnouncement = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'club_announcements'), {
        clubId: 'university',
        title: newTitle.trim(),
        content: newContent.trim(),
        createdBy: currentUser.id,
        creatorName: 'University Administration',
        creatorAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=VITAP',
        createdAt: new Date()
      });

      showToast('Official University announcement published!', 'success');
      setNewTitle('');
      setNewContent('');
      setIsPublishModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to publish announcement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans text-slate-350 select-none text-left relative z-10 p-1">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Announcements</h1>
            <p className="text-xs text-slate-550 mt-1 font-medium">
              Real-time combined bulletin feed of official university updates and student club announcements.
            </p>
          </div>
        </div>

        {isUniversityAdmin && (
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="h-10 px-4.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shrink-0 border-none outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Update</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-555 w-3.5 h-3.5" />
        <input
          type="text"
          placeholder="Search announcements by title, content, or host..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-550/40 text-xs font-semibold"
        />
      </div>

      {/* Feed Panel */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loading Feed...</span>
        </div>
      ) : filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isUniv = ann.clubId === 'university';
            const club = clubsCache[ann.clubId];
            
            const dateStr = ann.createdAt?.seconds 
              ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : new Date(ann.createdAt).toLocaleDateString();

            return (
              <div
                key={ann.id}
                className={`p-5 rounded-2xl bg-[#080b11]/80 border shadow-lg space-y-3 text-left relative overflow-hidden
                  ${isUniv 
                    ? 'border-indigo-500/20 shadow-indigo-500/[0.02]' 
                    : 'border-slate-900'
                  }`}
              >
                {/* Visual indicator for official announcements */}
                {isUniv && (
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-indigo-500" />
                )}

                <div className="flex items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <img
                      src={isUniv ? 'https://api.dicebear.com/7.x/initials/svg?seed=VITAP' : (club?.logo || ann.creatorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${ann.createdBy}`)}
                      alt="avatar"
                      className={`w-7 h-7 rounded-lg object-cover bg-slate-900 border shrink-0 p-0.5
                        ${isUniv ? 'border-indigo-500/20' : 'border-slate-800'}`}
                    />
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {isUniv ? 'VIT-AP Administration' : (ann.creatorName || 'Club Admin')}
                        {isUniv ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 fill-indigo-500/10 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10 shrink-0" />
                        )}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5 block">
                        {isUniv ? 'University Official' : (club?.name || 'Club Bulletin')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-550 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{dateStr}</span>
                  </span>
                </div>
                
                <div className="space-y-1 relative z-10 pl-9">
                  <h4 className="text-xs font-extrabold text-white">
                    {ann.title}
                  </h4>
                  <p className="text-[11px] text-slate-355 leading-relaxed font-medium whitespace-pre-line text-left">
                    {ann.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-slate-900 rounded-3xl bg-slate-950/20">
          <Megaphone className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-555 text-xs font-semibold">No announcements found matching your query.</p>
        </div>
      )}

      {/* ─── PUBLISH UNIVERSITY ANNOUNCEMENT MODAL ─── */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPublishModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#080b11] border border-slate-900 p-6 shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Publish University Update</span>
                </div>
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer active:scale-90 transition-all border-none outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4 text-xs font-semibold text-slate-400">
                <div className="space-y-1">
                  <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Announcement Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Hostels curfew extended, Semester schedule update..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none placeholder-slate-700"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Detailed Content</label>
                  <textarea
                    placeholder="Provide official notification context here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4.5}
                    className="w-full p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none resize-none placeholder-slate-700"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50 border-none outline-none"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Announcement</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
