import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  ChevronRight,
  Info,
  CalendarPlus,
  Image as ImageIcon,
  ArrowLeft,
  Megaphone,
  Plus,
  Send,
  X,
  UserCheck,
  ShieldCheck,
  Trash2,
  Trash
} from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import { accentGradients, categoryColors, eventCategories } from '../utils/constants';

// Shimmer Loader for Club Detail Page
const ClubDetailSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4 text-left">
    <div className="h-10 w-24 bg-slate-900 rounded-lg" />
    <div className="h-48 bg-[#080b11]/80 rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-32 bg-slate-900 rounded-xl" />
        <div className="h-48 bg-slate-900 rounded-xl" />
      </div>
      <div className="h-64 bg-slate-900 rounded-xl" />
    </div>
  </div>
);

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
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold shadow-2xl backdrop-blur-md
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

// Helper to convert 24h format "14:00" to 12h format "2:00 PM"
const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const ClubDetail = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Component States
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About'); // About, Members, Events, Announcements, Gallery, Admin Console
  
  // Real-time queries collections
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dynamic member / requests loading states
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [requestProfiles, setRequestProfiles] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Modal forms inside Admin Console
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [toast, setToast] = useState(null);

  // Edit Club Details Form States
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [editFocus1Title, setEditFocus1Title] = useState('');
  const [editFocus1Desc, setEditFocus1Desc] = useState('');
  const [editFocus2Title, setEditFocus2Title] = useState('');
  const [editFocus2Desc, setEditFocus2Desc] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editLogo, setEditLogo] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load club details in real-time
  useEffect(() => {
    if (!clubId) return;
    const docRef = doc(db, 'clubs', clubId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setClub({ id: docSnap.id, ...docSnap.data() });
      } else {
        showToast('Club community not found', 'error');
        navigate('/clubs');
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error listening to club details:', err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [clubId, navigate]);

  // Sync edits when club document changes
  useEffect(() => {
    if (club) {
      setEditName(club.name || '');
      setEditCategory(club.category || 'Other');
      setEditDescription(club.description || '');
      setEditInstagram(club.instagram || '');
      setEditDiscord(club.discord || '');
      setEditFocus1Title(club.focus1Title || '');
      setEditFocus1Desc(club.focus1Desc || '');
      setEditFocus2Title(club.focus2Title || '');
      setEditFocus2Desc(club.focus2Desc || '');
      setEditCoverImage(club.coverImage || '');
      setEditLogo(club.logo || '');
    }
  }, [club]);

  // Load club member profiles when Members tab is open
  useEffect(() => {
    const membersList = club?.members || [];
    if (activeTab !== 'Members' && activeTab !== 'Admin Console') {
      setMemberProfiles([]);
      return;
    }
    if (membersList.length === 0) {
      setMemberProfiles([]);
      setIsLoadingMembers(false);
      return;
    }

    setIsLoadingMembers(true);
    const ids = membersList.slice(0, 30);
    const q = query(collection(db, 'users'), where('__name__', 'in', ids));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profiles = [];
      snapshot.forEach((doc) => {
        profiles.push({ id: doc.id, ...doc.data() });
      });
      setMemberProfiles(profiles);
      setIsLoadingMembers(false);
    }, (error) => {
      console.error('Error fetching member profiles:', error);
      setIsLoadingMembers(false);
    });

    return () => unsubscribe();
  }, [club?.members, activeTab]);

  // Load pending join requests profiles when Admin Console is active
  useEffect(() => {
    const requestsList = club?.joinRequests || [];
    if (activeTab !== 'Admin Console') {
      setRequestProfiles([]);
      return;
    }
    if (requestsList.length === 0) {
      setRequestProfiles([]);
      setIsLoadingRequests(false);
      return;
    }

    setIsLoadingRequests(true);
    const ids = requestsList.slice(0, 30);
    const q = query(collection(db, 'users'), where('__name__', 'in', ids));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const profiles = [];
      snapshot.forEach((doc) => {
        profiles.push({ id: doc.id, ...doc.data() });
      });
      setRequestProfiles(profiles);
      setIsLoadingRequests(false);
    }, (error) => {
      console.error('Error fetching join requests profiles:', error);
      setIsLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [club?.joinRequests, activeTab]);

  // Load club announcements
  useEffect(() => {
    if (!clubId) return;
    const q = query(
      collection(db, 'club_announcements'),
      where('clubId', '==', clubId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort client-side
      const sorted = list.sort((a, b) => {
        const aDate = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const bDate = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return bDate - aDate;
      });
      setAnnouncements(sorted);
    });

    return () => unsubscribe();
  }, [clubId]);

  // Load club events
  useEffect(() => {
    if (!clubId) return;
    const q = query(
      collection(db, 'activities'),
      where('clubId', '==', clubId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      
      const todayStr = new Date().toISOString().split('T')[0];
      const upcoming = list
        .filter(event => !event.date || event.date >= todayStr)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setEvents(upcoming);
    });

    return () => unsubscribe();
  }, [clubId]);

  // Derived Admin authorization checks
  const isAdmin = useMemo(() => {
    if (!currentUser?.id || !club) return false;
    if (currentUser.role === 'supreme_admin' || currentUser.role === 'university_admin') return true;
    return club.adminIds?.includes(currentUser.id) || (currentUser.role === 'club_admin' && club.name === 'Coding Club' && clubId === 'club_coding_club');
  }, [currentUser, club, clubId]);

  // Gallery array resolution
  const galleryImages = useMemo(() => {
    return club?.gallery || [
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=60',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=60',
      'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=60',
      'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=60'
    ];
  }, [club?.gallery]);

  // Tab List construction
  const tabsList = useMemo(() => {
    const list = ['About', 'Members', 'Events', 'Announcements', 'Gallery'];
    if (isAdmin) {
      list.push('Admin Console');
    }
    return list;
  }, [isAdmin]);

  if (isLoading) {
    return <ClubDetailSkeleton />;
  }

  if (!club) return null;

  const isMember = club.members?.includes(currentUser?.id);
  const isRequested = club.joinRequests?.includes(currentUser?.id);

  // Toggle Join Membership Handler
  const handleToggleJoin = async () => {
    if (!currentUser?.id || isProcessing) return;
    setIsProcessing(true);
    const docRef = doc(db, 'clubs', club.id);

    try {
      if (isMember) {
        if (window.confirm('Are you sure you want to leave this club community?')) {
          await updateDoc(docRef, {
            members: arrayRemove(currentUser.id)
          });
          showToast('You left the club community', 'info');
        }
      } else if (isRequested) {
        await updateDoc(docRef, {
          joinRequests: arrayRemove(currentUser.id)
        });
        showToast('Membership request cancelled', 'info');
      } else {
        await updateDoc(docRef, {
          joinRequests: arrayUnion(currentUser.id)
        });
        showToast('Membership request sent to club lead!', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle club request:', err);
      showToast('Action failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Admin Request Handlers
  const handleAcceptRequest = async (studentId, studentName) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const docRef = doc(db, 'clubs', club.id);

    try {
      await updateDoc(docRef, {
        members: arrayUnion(studentId),
        joinRequests: arrayRemove(studentId)
      });
      showToast(`Accepted ${studentName} into the club!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to accept request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (studentId, studentName) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const docRef = doc(db, 'clubs', club.id);

    try {
      await updateDoc(docRef, {
        joinRequests: arrayRemove(studentId)
      });
      showToast(`Rejected request from ${studentName}`, 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to decline request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKickMember = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to kick ${studentName} from this club?`)) return;
    setIsProcessing(true);
    const docRef = doc(db, 'clubs', club.id);
    try {
      await updateDoc(docRef, {
        members: arrayRemove(studentId),
        adminIds: arrayRemove(studentId)
      });
      showToast(`Successfully kicked ${studentName} from the club.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to kick member', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit announcement handler inside Admin Console tab
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('Please fill in both title and announcement body', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'club_announcements'), {
        clubId: club.id,
        title: annTitle,
        content: annContent,
        createdBy: currentUser.id,
        creatorName: currentUser.name || 'Club Admin',
        creatorAvatar: currentUser.avatar || '',
        createdAt: new Date()
      });

      setAnnTitle('');
      setAnnContent('');
      showToast('Announcement posted successfully!', 'success');
      setActiveTab('Announcements');
    } catch (err) {
      console.error('Failed to post announcement:', err);
      showToast('Failed to post announcement', 'error');
    }
  };

  // Add Image to Gallery
  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!galleryUrlInput.trim()) return;

    const docRef = doc(db, 'clubs', club.id);
    try {
      await updateDoc(docRef, {
        gallery: arrayUnion(galleryUrlInput.trim())
      });
      setGalleryUrlInput('');
      showToast('Image added to club gallery!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    }
  };

  // Delete Image from Gallery
  const handleDeleteImage = async (imgUrl) => {
    if (!window.confirm('Delete this image from gallery?')) return;
    const docRef = doc(db, 'clubs', club.id);
    try {
      await updateDoc(docRef, {
        gallery: arrayRemove(imgUrl)
      });
      showToast('Image removed from gallery', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete image', 'error');
    }
  };

  // Edit Club Details Form Submit Handler
  const handleUpdateClubDetails = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim()) {
      showToast('Club Name and Description are required', 'error');
      return;
    }

    setIsProcessing(true);
    const docRef = doc(db, 'clubs', club.id);
    try {
      await updateDoc(docRef, {
        name: editName.trim(),
        category: editCategory,
        description: editDescription.trim(),
        instagram: editInstagram.trim(),
        discord: editDiscord.trim(),
        focus1Title: editFocus1Title.trim(),
        focus1Desc: editFocus1Desc.trim(),
        focus2Title: editFocus2Title.trim(),
        focus2Desc: editFocus2Desc.trim(),
        coverImage: editCoverImage.trim(),
        logo: editLogo.trim()
      });
      showToast('Club profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update club profile details', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans text-slate-350 select-none text-left relative z-10 p-1">
      
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

      {/* Back button */}
      <button
        onClick={() => navigate('/clubs')}
        className="group h-10 px-4 rounded-xl bg-slate-950/40 border border-slate-900/80 text-slate-400 hover:text-white flex items-center gap-2 transition-all cursor-pointer hover:border-slate-800 shadow-md w-fit active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-xs font-bold uppercase tracking-wider">Back to Communities</span>
      </button>

      {/* ─── Club Header Banner ─── */}
      <div className="relative rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl overflow-hidden min-h-[220px] md:min-h-[280px] flex items-end">
        <img
          src={club.coverImage}
          alt={club.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-black/30 to-black/25 pointer-events-none" />

        <span className="absolute top-4 left-4 text-[10px] bg-slate-950/90 border border-slate-900/60 text-slate-200 font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md">
          {club.category}
        </span>

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleToggleJoin}
            disabled={isProcessing}
            className={`h-9 px-4.5 rounded-xl backdrop-blur-md transition-all border shadow-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-92 disabled:opacity-80
              ${isMember
                ? 'bg-emerald-500/20 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/35'
                : isRequested
                  ? 'bg-amber-500/20 border-amber-500/25 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-indigo-500 to-purple-600 border-transparent text-white hover:opacity-90'
              }`}
          >
            {isMember ? (
              <UserCheck className="w-4 h-4" />
            ) : isRequested ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>
              {isMember ? 'Joined Member' : (isRequested ? 'Cancel Join Request' : 'Join Club')}
            </span>
          </button>
        </div>

        <div className="relative z-10 p-6 md:p-8 space-y-4 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#080b11] border border-slate-900 p-0.5 shadow-2xl overflow-hidden shrink-0">
              <img
                src={club.logo}
                alt={club.name}
                className="w-full h-full object-cover rounded-xl bg-slate-950"
              />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 drop-shadow-md">
                <span>{club.name}</span>
                <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400 fill-emerald-500/10 shrink-0" title="Verified Community" />
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-450">
                <button 
                  onClick={() => setActiveTab('Members')}
                  className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors cursor-pointer active:scale-95 bg-transparent border-none p-0 outline-none"
                  title="Click to view members register"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="underline decoration-dashed decoration-indigo-500/40 underline-offset-2">{club.members?.length || 0} Members</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABS Navigation ─── */}
      <div className="flex border-b border-slate-900 gap-1.5 overflow-x-auto scrollbar-none py-1">
        {tabsList.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap border-b-2
                ${isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-900/10'
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT PANELS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Dynamic Tab Details */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* ABOUT TAB */}
            {activeTab === 'About' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6 text-left"
              >
                <div className="p-6 md:p-8 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Who We Are</span>
                  </h3>
                  <p className="text-sm text-slate-350 leading-relaxed font-medium">
                    {club.description}
                  </p>
                </div>

                <div className="p-6 md:p-8 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-5">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3">
                    Our Core Focus
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                        {club.focus1Title || '🚀 Focus Area 1'}
                      </h4>
                      {club.focus1Desc && (
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                          {club.focus1Desc}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-1">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400">
                        {club.focus2Title || '🏆 Focus Area 2'}
                      </h4>
                      {club.focus2Desc && (
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                          {club.focus2Desc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === 'Members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 text-left"
              >
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Joined Club Register ({club.members?.length || 0})</span>
                  </h3>
                  
                  {isLoadingMembers ? (
                    <div className="py-8 flex justify-center">
                      <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                  ) : memberProfiles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {memberProfiles.map((profile) => {
                        let roleLabel = 'Student';
                        let roleBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                        if (profile.role === 'club_admin') {
                          roleLabel = 'Club Admin';
                          roleBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        } else if (profile.role === 'supreme_admin') {
                          roleLabel = 'Admin';
                          roleBadge = 'bg-purple-500/10 text-purple-400 border-purple-500/25';
                        }

                        return (
                          <div
                            key={profile.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.id}`}
                                alt={profile.name}
                                className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-855 p-0.5 shrink-0"
                              />
                              <div className="min-w-0 text-left">
                                <span className="font-bold text-white block truncate text-xs">{profile.name}</span>
                                <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                                  {profile.department} · {profile.year}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${roleBadge}`}>
                                {roleLabel}
                              </span>
                              {isAdmin && profile.id !== currentUser?.id && profile.role !== 'supreme_admin' && profile.role !== 'university_admin' && (
                                <button
                                  onClick={() => handleKickMember(profile.id, profile.name)}
                                  disabled={isProcessing}
                                  className="h-6 px-2 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-450 font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                >
                                  Kick
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-550 text-xs font-semibold">
                      No members joined this community yet.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* EVENTS TAB */}
            {activeTab === 'Events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 text-left"
              >
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>Upcoming Club Events ({events.length})</span>
                  </h3>
                  
                  {events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:-translate-y-0.5"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] text-slate-555 font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{event.date} · {formatTime12h(event.startTime)}</span>
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-700" />
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{event.location}</span>
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => navigate(`/events/${event.id}`)}
                            className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all shrink-0 active:scale-95"
                          >
                            <span>Open Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-550 text-xs font-semibold">
                      No upcoming events scheduled. Check back later!
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'Announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 text-left"
              >
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-5">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-400" />
                    <span>Official Bulletin</span>
                  </h3>

                  {announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((ann) => {
                        const dateStr = ann.createdAt?.seconds 
                          ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : new Date(ann.createdAt).toLocaleDateString();

                        return (
                          <div
                            key={ann.id}
                            className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <img
                                  src={ann.creatorAvatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(ann.createdBy || ann.creatorName)}
                                  alt="avatar"
                                  className="w-6 h-6 rounded-lg object-cover bg-slate-900 border border-slate-800"
                                />
                                <div>
                                  <span className="text-xs font-bold text-white flex items-center gap-1">
                                    {ann.creatorName || 'Club Admin'}
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10 shrink-0" />
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-550">
                                {dateStr}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
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
                    <div className="py-8 text-center text-slate-550 text-xs font-semibold">
                      No announcements posted. Official announcements will appear here.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* GALLERY TAB */}
            {activeTab === 'Gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4 text-left"
              >
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>Memory Highlights</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((imgUrl, i) => (
                      <div key={i} className="relative aspect-video rounded-xl bg-slate-950 border border-slate-900 overflow-hidden group">
                        <img
                          src={imgUrl}
                          alt="Club Memory"
                          className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-all duration-300 pointer-events-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CLUB ADMIN CONSOLE TAB */}
            {activeTab === 'Admin Console' && isAdmin && (
              <motion.div
                key="admin-console"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6 text-left"
              >
                {/* 1. Membership Request approvals */}
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Pending Membership Approvals ({club.joinRequests?.length || 0})</span>
                  </h3>

                  {isLoadingRequests ? (
                    <div className="py-6 flex justify-center">
                      <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                  ) : requestProfiles.length > 0 ? (
                    <div className="space-y-2">
                      {requestProfiles.map((req) => (
                        <div
                          key={req.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={req.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.id}`}
                              alt={req.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800 p-0.5 shrink-0"
                            />
                            <div className="min-w-0 text-left text-xs">
                              <span className="font-bold text-white block truncate">{req.name}</span>
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                                {req.department} · {req.year}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleAcceptRequest(req.id, req.name)}
                              className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id, req.name)}
                              className="h-8 px-3 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-455 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-550 py-4 font-semibold text-center">No pending membership requests.</p>
                  )}
                </div>

                {/* 2. Post Bulletin Form */}
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-400" />
                    <span>Publish Club Bulletin Announcement</span>
                  </h3>

                  <form onSubmit={handlePostAnnouncement} className="space-y-3.5 text-xs font-semibold text-slate-400">
                    <div className="space-y-1">
                      <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Schedule shift, venue altered..."
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Announcement Content</label>
                      <textarea
                        placeholder="Enter bulletin text..."
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        rows={3.5}
                        className="w-full p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none resize-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4.5 h-8.5 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Bulletin</span>
                    </button>
                  </form>
                </div>

                {/* 3. Gallery Manager */}
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>Gallery Manager</span>
                  </h3>

                  <form onSubmit={handleAddImage} className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Enter Image URL (e.g. https://images.unsplash.com/...)"
                      value={galleryUrlInput}
                      onChange={(e) => setGalleryUrlInput(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-xs text-slate-200 focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 h-9 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Image</span>
                    </button>
                  </form>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {galleryImages.map((imgUrl, i) => (
                      <div key={i} className="relative aspect-video rounded-xl bg-slate-950 border border-slate-900 overflow-hidden group">
                        <img
                          src={imgUrl}
                          alt="Gallery editor item"
                          className="w-full h-full object-cover opacity-60 pointer-events-none"
                        />
                        <button
                          onClick={() => handleDeleteImage(imgUrl)}
                          type="button"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/90 text-white cursor-pointer hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                          title="Remove Image"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Edit Club Details Form */}
                <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900/60 pb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                    <span>Edit Club Profile Details</span>
                  </h3>

                  <form onSubmit={handleUpdateClubDetails} className="space-y-4 text-xs font-semibold text-slate-400">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Club Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Scope Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-350 focus:outline-none cursor-pointer"
                        >
                          {eventCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Club Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none resize-none leading-relaxed"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Logo URL</label>
                        <input
                          type="url"
                          value={editLogo}
                          onChange={(e) => setEditLogo(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Cover Banner URL</label>
                        <input
                          type="url"
                          value={editCoverImage}
                          onChange={(e) => setEditCoverImage(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Instagram Handle</label>
                        <input
                          type="text"
                          value={editInstagram}
                          onChange={(e) => setEditInstagram(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Discord Invite Link</label>
                        <input
                          type="text"
                          value={editDiscord}
                          onChange={(e) => setEditDiscord(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="border border-slate-900 rounded-xl p-4 space-y-4 bg-slate-950/20">
                      <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wide border-b border-slate-900/60 pb-1.5">Core Focus Areas</p>
                      
                      <div className="space-y-2">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Focus 1 Title</label>
                        <input
                          type="text"
                          value={editFocus1Title}
                          onChange={(e) => setEditFocus1Title(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        />
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Focus 1 Description</label>
                        <textarea
                          value={editFocus1Desc}
                          onChange={(e) => setEditFocus1Desc(e.target.value)}
                          rows={2}
                          className="w-full p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2 border-t border-slate-900/60 pt-3">
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Focus 2 Title</label>
                        <input
                          type="text"
                          value={editFocus2Title}
                          onChange={(e) => setEditFocus2Title(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none"
                        />
                        <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Focus 2 Description</label>
                        <textarea
                          value={editFocus2Desc}
                          onChange={(e) => setEditFocus2Desc(e.target.value)}
                          rows={2}
                          className="w-full p-3 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-200 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-5 h-9 rounded-lg bg-indigo-500 hover:bg-indigo-650 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Side: Sticky Team Sidebar */}
        <div className="space-y-6 lg:self-start lg:sticky lg:top-6 text-left">
          
          <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900/60 pb-2">
              Club Administration
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={club.presidentAvatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Aarav"}
                  alt="President"
                  className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0 shadow-inner"
                />
                <div className="min-w-0 text-xs">
                  <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider leading-none">Club Lead / President</p>
                  <p className="text-white font-bold mt-1 truncate">{club.presidentName || "Club President"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={club.secretaryAvatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Rohan"}
                  alt="Secretary"
                  className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0 shadow-inner"
                />
                <div className="min-w-0 text-xs">
                  <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider leading-none">Vice President / Secretary</p>
                  <p className="text-white font-bold mt-1 truncate">{club.secretaryName || "Club Secretary"}</p>
                </div>
              </div>
            </div>
          </div>

          {(club.instagram || club.discord) && (
            <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-900/60 pb-2">
                External Channels
              </h3>
              
              <div className="text-[10px] font-bold text-slate-555 space-y-2">
                {club.instagram && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span>Instagram Community</span>
                    <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer">{club.instagram}</span>
                  </div>
                )}
                {club.discord && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-900">
                    <span>Discord Server</span>
                    <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer">{club.discord}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ClubDetail;
