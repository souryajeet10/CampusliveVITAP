import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Users,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  Trash2,
  Plus,
  Send,
  X,
  User,
  ExternalLink,
  Crown,
  ChevronDown,
  ChevronUp,
  ShieldAlert as ShieldIcon
} from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile } from '../services/userService';
import { eventCategories, defaultEventCovers } from '../utils/constants';

// Shimmer loader
const AdminSkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4 text-left">
    <div className="h-10 w-48 bg-slate-900 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-24 bg-slate-900 rounded-2xl" />
      <div className="h-24 bg-slate-900 rounded-2xl" />
      <div className="h-24 bg-slate-900 rounded-2xl" />
    </div>
    <div className="h-96 bg-slate-900 rounded-3xl" />
  </div>
);

// Toast Component
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

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isAuthorized = currentUser?.role === 'supreme_admin' || currentUser?.role === 'university_admin';

  // Database States
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState('Users');

  // Search queries
  const [userQuery, setUserQuery] = useState('');
  const [clubQuery, setClubQuery] = useState('');
  const [eventQuery, setEventQuery] = useState('');
  const [announcementQuery, setAnnouncementQuery] = useState('');

  // Toast & Modal State
  const [toast, setToast] = useState(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [isSubmittingClub, setIsSubmittingClub] = useState(false);
  const [showAdvancedCreation, setShowAdvancedCreation] = useState(false);

  // Specific Club Admin Management state
  const [isManagingAdmins, setIsManagingAdmins] = useState(false);
  const [selectedClubForAdmins, setSelectedClubForAdmins] = useState(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Club Registration Form States
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Technical');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [newClubCover, setNewClubCover] = useState('');
  const [newClubLogo, setNewClubLogo] = useState('');
  
  // Advanced Form States
  const [newPresidentName, setNewPresidentName] = useState('');
  const [newPresidentId, setNewPresidentId] = useState('');
  const [newSecretaryName, setNewSecretaryName] = useState('');
  const [newSecretaryId, setNewSecretaryId] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newDiscord, setNewDiscord] = useState('');
  const [newFocus1Title, setNewFocus1Title] = useState('');
  const [newFocus1Desc, setNewFocus1Desc] = useState('');
  const [newFocus2Title, setNewFocus2Title] = useState('');
  const [newFocus2Desc, setNewFocus2Desc] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Listeners
  useEffect(() => {
    if (!isAuthorized) return;

    setIsLoading(true);

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setUsers(list);
    });

    const unsubscribeClubs = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setClubs(list);
    });

    const unsubscribeEvents = onSnapshot(collection(db, 'activities'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setEvents(list);
      setIsLoading(false);
    });

    const unsubscribeAnnouncements = onSnapshot(collection(db, 'club_announcements'), (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAnnouncements(list);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeClubs();
      unsubscribeEvents();
      unsubscribeAnnouncements();
    };
  }, [isAuthorized]);

  // Actions
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserProfile(userId, { role: newRole });
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update role', 'error');
    }
  };

  const handleDeleteClub = async (clubDocId, clubName) => {
    if (!window.confirm(`Are you sure you want to delete the club community "${clubName}"? This is irreversible.`)) return;

    try {
      await deleteDoc(doc(db, 'clubs', clubDocId));
      showToast(`Deleted club "${clubName}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete club', 'error');
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete the event "${eventTitle}"?`)) return;

    try {
      await deleteDoc(doc(db, 'activities', eventId));
      showToast(`Deleted event "${eventTitle}"`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete event', 'error');
    }
  };

  const handleDeleteAnnouncement = async (annId, annTitle) => {
    if (!window.confirm(`Are you sure you want to delete the announcement "${annTitle}"?`)) return;
    try {
      await deleteDoc(doc(db, 'club_announcements', annId));
      showToast('Deleted announcement successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete announcement', 'error');
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const titleMatch = ann.title?.toLowerCase().includes(announcementQuery.toLowerCase());
      const contentMatch = ann.content?.toLowerCase().includes(announcementQuery.toLowerCase());
      const creatorMatch = ann.creatorName?.toLowerCase().includes(announcementQuery.toLowerCase());
      return titleMatch || contentMatch || creatorMatch;
    });
  }, [announcements, announcementQuery]);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubDescription.trim()) {
      showToast('Club Name and Description are required', 'error');
      return;
    }

    setIsSubmittingClub(true);
    const clubId = 'club_' + newClubName.toLowerCase().trim().replace(/ /g, '_');
    
    // Fallbacks
    const logoSeed = encodeURIComponent(newClubName.trim());
    const finalLogo = newClubLogo.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${logoSeed}`;
    const finalCover = newClubCover.trim() || defaultEventCovers[newClubCategory] || defaultEventCovers.Other;

    try {
      const clubAdmins = [currentUser.id];
      if (newPresidentId.trim()) clubAdmins.push(newPresidentId.trim());
      if (newSecretaryId.trim() && !clubAdmins.includes(newSecretaryId.trim())) clubAdmins.push(newSecretaryId.trim());

      const clubMembers = [currentUser.id];
      if (newPresidentId.trim() && !clubMembers.includes(newPresidentId.trim())) clubMembers.push(newPresidentId.trim());
      if (newSecretaryId.trim() && !clubMembers.includes(newSecretaryId.trim())) clubMembers.push(newSecretaryId.trim());

      await setDoc(doc(db, 'clubs', clubId), {
        clubId,
        name: newClubName.trim(),
        category: newClubCategory,
        description: newClubDescription.trim(),
        coverImage: finalCover,
        logo: finalLogo,
        members: clubMembers,
        joinRequests: [],
        adminIds: clubAdmins,
        
        // Advanced Custom Options
        presidentId: newPresidentId.trim(),
        presidentName: newPresidentName.trim(),
        presidentAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newPresidentName.trim() || 'Aarav')}`,
        secretaryId: newSecretaryId.trim(),
        secretaryName: newSecretaryName.trim(),
        secretaryAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newSecretaryName.trim() || 'Rohan')}`,
        instagram: newInstagram.trim(),
        discord: newDiscord.trim(),
        
        focus1Title: newFocus1Title.trim(),
        focus1Desc: newFocus1Desc.trim(),
        focus2Title: newFocus2Title.trim(),
        focus2Desc: newFocus2Desc.trim(),
        
        gallery: [
          'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=60',
          'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=60',
          'https://images.unsplash.com/photo-1562774053-701939374585?w=400&q=60',
          'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=60'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      if (newPresidentId.trim()) {
        await updateUserProfile(newPresidentId.trim(), { role: 'club_admin' });
      }
      if (newSecretaryId.trim()) {
        await updateUserProfile(newSecretaryId.trim(), { role: 'club_admin' });
      }

      showToast(`Club "${newClubName}" registered successfully!`, 'success');
      
      // Reset State
      setNewClubName('');
      setNewClubDescription('');
      setNewClubCover('');
      setNewClubLogo('');
      setNewPresidentName('');
      setNewPresidentId('');
      setNewSecretaryName('');
      setNewSecretaryId('');
      setNewInstagram('');
      setNewDiscord('');
      setNewFocus1Title('');
      setNewFocus1Desc('');
      setNewFocus2Title('');
      setNewFocus2Desc('');
      setShowAdvancedCreation(false);
      setIsCreatingClub(false);
    } catch (err) {
      console.error('Failed to create club:', err);
      showToast('Failed to create club', 'error');
    } finally {
      setIsSubmittingClub(false);
    }
  };

  // Club Admins Management Actions
  const handleAddAdmin = async (userId) => {
    if (!selectedClubForAdmins) return;
    try {
      const clubRef = doc(db, 'clubs', selectedClubForAdmins.clubId);
      await updateDoc(clubRef, {
        adminIds: arrayUnion(userId)
      });
      // Promote user's profile role if they are currently just a regular user
      const userProfile = users.find(u => u.id === userId);
      if (userProfile && userProfile.role === 'user') {
        await updateUserProfile(userId, { role: 'club_admin' });
      }
      setSelectedClubForAdmins(prev => ({
        ...prev,
        adminIds: [...(prev.adminIds || []), userId]
      }));
      showToast('Admin added successfully!', 'success');
      setAdminSearchQuery('');
    } catch (err) {
      console.error(err);
      showToast('Failed to add admin', 'error');
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (!selectedClubForAdmins) return;
    try {
      const clubRef = doc(db, 'clubs', selectedClubForAdmins.clubId);
      await updateDoc(clubRef, {
        adminIds: arrayRemove(adminId)
      });
      setSelectedClubForAdmins(prev => ({
        ...prev,
        adminIds: prev.adminIds.filter(id => id !== adminId)
      }));
      showToast('Admin removed successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove admin', 'error');
    }
  };

  // Derived Computations
  const currentAdmins = useMemo(() => {
    if (!selectedClubForAdmins) return [];
    return users.filter(u => selectedClubForAdmins.adminIds?.includes(u.id));
  }, [selectedClubForAdmins, users]);

  const eligibleUsers = useMemo(() => {
    if (!selectedClubForAdmins) return [];
    const queryStr = adminSearchQuery.toLowerCase();
    return users.filter(u => 
      !selectedClubForAdmins.adminIds?.includes(u.id) &&
      (u.name?.toLowerCase().includes(queryStr) || u.id?.toLowerCase().includes(queryStr))
    ).slice(0, 5);
  }, [selectedClubForAdmins, users, adminSearchQuery]);

  const filteredUsers = useMemo(() => {
    if (!userQuery) return users;
    const query = userQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query) ||
        u.department?.toLowerCase().includes(query)
    );
  }, [users, userQuery]);

  const filteredClubs = useMemo(() => {
    if (!clubQuery) return clubs;
    const query = clubQuery.toLowerCase();
    return clubs.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [clubs, clubQuery]);

  const filteredEvents = useMemo(() => {
    if (!eventQuery) return events;
    const query = eventQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title?.toLowerCase().includes(query) ||
        e.name?.toLowerCase().includes(query) ||
        e.organizerName?.toLowerCase().includes(query)
    );
  }, [events, eventQuery]);

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-455 flex items-center justify-center mx-auto animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-black text-white">Access Denied</h2>
          <p className="text-xs text-slate-550 leading-relaxed max-w-xs mx-auto">
            You do not have administrative permissions to view the Campus hierarchy dashboard.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs cursor-pointer active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans text-slate-350 select-none text-left relative z-10 p-1">
      
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
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Admin Console</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage users, organize official club directories, and moderate campus activities.
            </p>
          </div>
        </div>
        
        {activeTab === 'Clubs' && (
          <button
            onClick={() => setIsCreatingClub(true)}
            className="h-10 px-4.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-650/15 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Club</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Campus Students', value: users.length, icon: Users, color: 'text-indigo-400 border-indigo-550/20' },
          { label: 'Registered Clubs', value: clubs.length, icon: Layers, color: 'text-emerald-400 border-emerald-550/20' },
          { label: 'Active Events', value: events.length, icon: Calendar, color: 'text-purple-400 border-purple-550/20' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`p-5 rounded-2xl bg-[#080b11]/80 border ${stat.color} flex items-center justify-between shadow-lg`}>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-555 font-bold uppercase tracking-wider">{stat.label}</span>
                <p className="text-2xl font-black text-white mt-1 leading-none">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-slate-900 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex border-b border-slate-900 gap-1.5 overflow-x-auto scrollbar-none py-1">
        {['Users', 'Clubs', 'Events', 'Announcements'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer border-b-2
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

      {/* Panels */}
      <div className="p-6 rounded-3xl border border-slate-900 bg-[#080b11]/80 shadow-2xl space-y-6">
        
        {activeTab === 'Users' && (
          <div className="space-y-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search students by name, department or Campus ID..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-550/40 text-xs font-semibold"
              />
            </div>

            <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/20">
              <table className="w-full border-collapse text-xs text-slate-350">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-900 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider text-left">
                    <th className="p-4">Student</th>
                    <th className="p-4">Campus ID</th>
                    <th className="p-4">Department / Year</th>
                    <th className="p-4">Active Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                            alt="avatar"
                            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-855 p-0.5"
                          />
                          <span className="font-bold text-white block truncate max-w-[150px]">{u.name}</span>
                        </td>
                        <td className="p-4 font-mono font-bold tracking-wider text-slate-400">{u.id}</td>
                        <td className="p-4">
                          <span className="block font-medium">{u.department}</span>
                          <span className="block text-[10px] text-slate-550 mt-0.5">{u.year}</span>
                        </td>
                        <td className="p-4">
                          <select
                            disabled={isSelf}
                            value={u.role || 'user'}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="h-8 px-2 rounded-lg bg-[#06090f] border border-slate-900 text-[11px] font-bold text-slate-350 cursor-pointer focus:outline-none"
                          >
                            <option value="user">Student (user)</option>
                            {u.role === 'club_admin' && (
                              <option value="club_admin">Club Admin (Assigned)</option>
                            )}
                            <option value="supreme_admin">University Admin (supreme)</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-[10px] text-slate-555 font-bold uppercase tracking-wider">
                            {isSelf ? '🛡️ You (Owner)' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Clubs' && (
          <div className="space-y-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-550 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search clubs by name..."
                value={clubQuery}
                onChange={(e) => setClubQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredClubs.map((club) => (
                <div key={club.id} className="p-4 rounded-2xl border border-slate-900 bg-slate-950/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={club.logo}
                      alt={club.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0 shadow-inner"
                    />
                    <div className="min-w-0 text-xs text-left">
                      <h4 className="font-extrabold text-white truncate flex items-center gap-1">
                        <span>{club.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/10 shrink-0" />
                      </h4>
                      <p className="text-[10px] text-slate-555 font-bold uppercase tracking-wider mt-0.5">{club.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedClubForAdmins(club);
                        setIsManagingAdmins(true);
                      }}
                      className="h-8 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      title="Manage Admins"
                    >
                      Admins
                    </button>
                    <button
                      onClick={() => navigate(`/clubs/${club.clubId}`)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-455 hover:text-white cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClub(club.id, club.name)}
                      className="p-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-455 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Events' && (
          <div className="space-y-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-555 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search events by title..."
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none text-xs font-semibold"
              />
            </div>

            <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/20">
              <table className="w-full border-collapse text-xs text-slate-350">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-900 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider text-left">
                    <th className="p-4">Event</th>
                    <th className="p-4">Host Organizer</th>
                    <th className="p-4">Schedule</th>
                    <th className="p-4">Joined Count</th>
                    <th className="p-4 text-right">Moderate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {filteredEvents.map((e) => {
                    let badgeStyles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                    if (e.eventType === 'club') {
                      badgeStyles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    } else if (e.eventType === 'university') {
                      badgeStyles = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                    }

                    return (
                      <tr key={e.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-white block truncate max-w-[160px]">{e.title}</span>
                          <span className={`inline-block text-[8px] font-black uppercase tracking-wider mt-1 border px-1.5 py-0.5 rounded ${badgeStyles}`}>
                            {e.eventType}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={e.organizerLogo}
                              alt="logo"
                              className="w-5 h-5 rounded object-cover bg-slate-900 border border-slate-855 p-0.5 shrink-0"
                            />
                            <span className="font-semibold text-slate-300 truncate max-w-[120px]">{e.organizerName}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-400">{e.date} · {e.time || e.startTime}</td>
                        <td className="p-4 font-mono font-bold text-slate-400">{e.interestedCount} joined</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/events/${e.id}`)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-455 hover:text-white cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(e.id, e.title)}
                              className="p-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-455 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Announcements' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-550 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search announcements by title or publisher..."
                  value={announcementQuery}
                  onChange={(e) => setAnnouncementQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-555/40 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/20">
              <table className="w-full border-collapse text-xs text-slate-350">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-900 text-[10px] text-slate-555 font-extrabold uppercase tracking-wider text-left">
                    <th className="p-4">Announcement Details</th>
                    <th className="p-4">Posted By</th>
                    <th className="p-4">Destination Club</th>
                    <th className="p-4">Schedule</th>
                    <th className="p-4 text-right">Moderate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {filteredAnnouncements.map((ann) => {
                    const isUniv = ann.clubId === 'university';
                    const targetClub = clubs.find(c => c.id === ann.clubId);
                    const dateStr = ann.createdAt?.seconds 
                      ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : new Date(ann.createdAt).toLocaleDateString();

                    return (
                      <tr key={ann.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 max-w-[200px]">
                          <span className="font-bold text-white block truncate">{ann.title}</span>
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5 leading-normal">{ann.content}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={isUniv ? 'https://api.dicebear.com/7.x/initials/svg?seed=VITAP' : (ann.creatorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${ann.createdBy}`)}
                              alt="logo"
                              className="w-5 h-5 rounded object-cover bg-slate-900 border border-slate-855 p-0.5 shrink-0"
                            />
                            <span className="font-semibold text-slate-300 truncate max-w-[120px]">{ann.creatorName || 'Club Admin'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {isUniv ? (
                            <span className="inline-block text-[8px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border-purple-500/20">
                              University
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-300">{targetClub?.name || 'Club bulletin'}</span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-400">{dateStr}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                            className="p-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-455 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAnnouncements.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-550 font-semibold">
                        No announcements posted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ─── REGISTER NEW CLUB MODAL OVERLAY ─── */}
      <AnimatePresence>
        {isCreatingClub && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#0b0f19]/95 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Register Official Club</span>
                </h3>
                <button
                  onClick={() => setIsCreatingClub(false)}
                  className="p-1 rounded-full bg-slate-950/40 text-slate-400 hover:text-white border border-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClub} className="p-5 space-y-4 text-xs font-semibold text-slate-400 max-h-[440px] overflow-y-auto scrollbar-thin">
                
                <div className="space-y-1">
                  <label className="block text-slate-550 uppercase tracking-widest text-[9px]">Club Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Photography Club, Coding Club"
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500/80 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-550 uppercase tracking-widest text-[9px]">Scope Category</label>
                  <select
                    value={newClubCategory}
                    onChange={(e) => setNewClubCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-355 focus:outline-none focus:border-indigo-500/80 transition-all cursor-pointer"
                  >
                    {eventCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-550 uppercase tracking-widest text-[9px]">Community Description</label>
                  <textarea
                    placeholder="Provide a detailed mission statement and activities overview..."
                    value={newClubDescription}
                    onChange={(e) => setNewClubDescription(e.target.value)}
                    rows={3.5}
                    className="w-full p-3.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-655 focus:outline-none focus:border-indigo-500/80 transition-all resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-550 uppercase tracking-widest text-[9px]">Logo Image URL (opt)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newClubLogo}
                      onChange={(e) => setNewClubLogo(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-550 uppercase tracking-widest text-[9px]">Cover Banner URL (opt)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newClubCover}
                      onChange={(e) => setNewClubCover(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500/80"
                    />
                  </div>
                </div>

                <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedCreation(!showAdvancedCreation)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-slate-400 hover:bg-slate-900/30 transition-colors"
                  >
                    <span>Custom Profile Details (Optional)</span>
                    {showAdvancedCreation ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {showAdvancedCreation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 border-t border-slate-900/60 space-y-4 bg-[#06090f]/30"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-slate-555 uppercase tracking-wider text-[8px]">Select President</label>
                            <select
                              value={newPresidentId}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setNewPresidentId(selectedId);
                                const userObj = users.find(u => u.id === selectedId);
                                setNewPresidentName(userObj ? userObj.name : '');
                              }}
                              className="w-full h-9 px-2 rounded-lg bg-[#06090f] border border-slate-900 text-slate-105 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Choose President --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-555 uppercase tracking-wider text-[8px]">Select Secretary</label>
                            <select
                              value={newSecretaryId}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setNewSecretaryId(selectedId);
                                const userObj = users.find(u => u.id === selectedId);
                                setNewSecretaryName(userObj ? userObj.name : '');
                              }}
                              className="w-full h-9 px-2 rounded-lg bg-[#06090f] border border-slate-900 text-slate-105 focus:outline-none cursor-pointer"
                            >
                              <option value="">-- Choose Secretary --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-slate-555 uppercase tracking-wider text-[8px]">Instagram Handle</label>
                            <input
                              type="text"
                              placeholder="e.g. @CodingClub_VITAP"
                              value={newInstagram}
                              onChange={(e) => setNewInstagram(e.target.value)}
                              className="w-full h-9 px-2 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-555 uppercase tracking-wider text-[8px]">Discord Link / Server</label>
                            <input
                              type="text"
                              placeholder="e.g. coding-club-invite"
                              value={newDiscord}
                              onChange={(e) => setNewDiscord(e.target.value)}
                              className="w-full h-9 px-2 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-900/60 pt-3">
                          <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wide">Core Focus Area 1</p>
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Focus Title (e.g. Technical Workshops)"
                              value={newFocus1Title}
                              onChange={(e) => setNewFocus1Title(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <textarea
                              placeholder="Short description of this focus area..."
                              value={newFocus1Desc}
                              onChange={(e) => setNewFocus1Desc(e.target.value)}
                              rows={2}
                              className="w-full p-2.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-700 focus:outline-none resize-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-slate-900/60 pt-3">
                          <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wide">Core Focus Area 2</p>
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Focus Title (e.g. Competitive Programming)"
                              value={newFocus2Title}
                              onChange={(e) => setNewFocus2Title(e.target.value)}
                              className="w-full h-9 px-2.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <textarea
                              placeholder="Short description of this focus area..."
                              value={newFocus2Desc}
                              onChange={(e) => setNewFocus2Desc(e.target.value)}
                              rows={2}
                              className="w-full p-2.5 rounded-lg bg-[#06090f] border border-slate-900 text-slate-100 placeholder-slate-700 focus:outline-none resize-none"
                            />
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-900/60">
                  <button
                    type="button"
                    onClick={() => setIsCreatingClub(false)}
                    className="px-4 h-9 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClub}
                    className="px-5 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-655/15 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingClub ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Register Club</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MANAGE ADMINS MODAL OVERLAY ─── */}
      <AnimatePresence>
        {isManagingAdmins && selectedClubForAdmins && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0b0f19]/95 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8 text-xs font-semibold text-slate-450"
            >
              <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldIcon className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <span>Manage Admins: {selectedClubForAdmins.name}</span>
                </h3>
                <button
                  onClick={() => setIsManagingAdmins(false)}
                  className="p-1 rounded-full bg-slate-950/40 text-slate-400 hover:text-white border border-slate-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Current Admins List */}
                <div className="space-y-2">
                  <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Current Administrators</label>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                    {currentAdmins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900/60">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={admin.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${admin.id}`}
                            alt="avatar"
                            className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-slate-850 p-0.5 shrink-0"
                          />
                          <div className="min-w-0 text-left text-xs">
                            <span className="font-bold text-white block truncate">{admin.name}</span>
                            <span className="text-[9px] text-slate-500 block truncate mt-0.5">{admin.id}</span>
                          </div>
                        </div>
                        {admin.id !== currentUser.id && (
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="p-1 text-rose-455 hover:text-rose-400 cursor-pointer transition-colors"
                            title="Remove Admin"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {currentAdmins.length === 0 && (
                      <p className="text-[10px] text-slate-605 font-bold py-2 text-center">No admins assigned.</p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-900/60" />

                {/* Add Admin Selector */}
                <div className="space-y-3">
                  <label className="block text-slate-555 uppercase tracking-widest text-[8px]">Assign New Admin</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-550 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search students by name or ID..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-4 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-555/40 text-xs font-semibold"
                    />
                  </div>

                  {adminSearchQuery && (
                    <div className="space-y-1.5 p-2 rounded-xl border border-slate-900 bg-slate-950/20 max-h-[140px] overflow-y-auto scrollbar-thin">
                      {eligibleUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                              alt="avatar"
                              className="w-6.5 h-6.5 rounded-lg object-cover bg-slate-900 border border-slate-850 p-0.5 shrink-0"
                            />
                            <div className="min-w-0 text-left text-[11px]">
                              <span className="font-bold text-white block truncate">{user.name}</span>
                              <span className="text-[9px] text-slate-500 block truncate">{user.id}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddAdmin(user.id)}
                            className="px-2 h-6 rounded-md bg-indigo-550 hover:bg-indigo-650 text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                      {eligibleUsers.length === 0 && (
                        <p className="text-[9px] text-slate-600 font-bold py-2 text-center">No matching students found.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-900/60 flex justify-end">
                <button
                  onClick={() => setIsManagingAdmins(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
