import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Bookmark,
  X
} from 'lucide-react';
import { collection, onSnapshot, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import { accentGradients, eventCategories, categoryColors } from '../utils/constants';

// Shimmer Skeleton for Club Cards
const ClubCardSkeleton = () => (
  <div className="p-5 rounded-2xl border border-slate-900 bg-[#080b11]/60 backdrop-blur-md space-y-4 animate-pulse select-none">
    <div className="h-32 bg-slate-900 rounded-xl" />
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-900 rounded w-1/3" />
      <div className="h-4 bg-slate-900 rounded w-1/6" />
    </div>
    <div className="h-12 bg-slate-900 rounded w-full" />
    <div className="flex justify-between items-center pt-2">
      <div className="h-4 bg-slate-900 rounded w-1/4" />
      <div className="h-6 bg-slate-900 rounded-lg w-1/4" />
    </div>
  </div>
);

const Clubs = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // State variables
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  // Load clubs and events in parallel from Firestore
  useEffect(() => {
    let active = true;

    // Load Clubs
    const unsubscribeClubs = onSnapshot(
      collection(db, 'clubs'),
      (snapshot) => {
        const clubList = [];
        snapshot.forEach((doc) => {
          clubList.push({ id: doc.id, ...doc.data() });
        });
        if (active) setClubs(clubList);
      },
      (err) => {
        console.error('Error fetching clubs:', err);
      }
    );

    // Load Events (to count upcoming events dynamically per club)
    const unsubscribeEvents = onSnapshot(
      collection(db, 'activities'),
      (snapshot) => {
        const eventList = [];
        snapshot.forEach((doc) => {
          eventList.push({ id: doc.id, ...doc.data() });
        });
        if (active) {
          setEvents(eventList);
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching events:', err);
        if (active) setIsLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribeClubs();
      unsubscribeEvents();
    };
  }, []);

  // Compute stats: upcoming event count per club
  const clubEventStats = useMemo(() => {
    const stats = {};
    const todayStr = new Date().toISOString().split('T')[0];

    events.forEach((event) => {
      if (event.clubId && (!event.date || event.date >= todayStr)) {
        stats[event.clubId] = (stats[event.clubId] || 0) + 1;
      }
    });

    return stats;
  }, [events]);

  // Filter Logic
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // 1. Search Query Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = club.name.toLowerCase().includes(query);
        const matchDesc = club.description.toLowerCase().includes(query);
        const matchCat = club.category.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All Categories' && club.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [clubs, searchQuery, categoryFilter]);

  return (
    <div className="space-y-8 font-sans text-slate-350 pb-16 select-none max-w-7xl mx-auto text-left relative z-10">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Club Communities
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Connect with student-led groups, find your community, and view their events.
          </p>
        </div>
      </div>

      {/* ─── Search & Categories filters ─── */}
      <div className="p-5 rounded-2xl bg-[#080b11]/60 border border-slate-900/80 shadow-2xl backdrop-blur-xl space-y-4">
        
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clubs by name, description or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/40 border border-slate-900/85 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-550/20 transition-all text-xs font-semibold"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-900/60" />

        {/* Category horizontal pills scroll wrapper */}
        <div className="overflow-x-auto scrollbar-none py-0.5">
          <div className="flex gap-2 min-w-max">
            {['All Categories', ...eventCategories].map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer
                    ${isSelected
                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 border-transparent text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-350 hover:bg-slate-900/30'
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ─── Clubs Feed Grid ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ClubCardSkeleton />
          <ClubCardSkeleton />
          <ClubCardSkeleton />
          <ClubCardSkeleton />
          <ClubCardSkeleton />
          <ClubCardSkeleton />
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredClubs.map((club) => {
              const upcomingEventsCount = clubEventStats[club.clubId] || 0;
              const isMember = club.members?.includes(currentUser?.id);

              return (
                <motion.div
                  key={club.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  onClick={() => navigate(`/clubs/${club.clubId}`)}
                  className="group relative rounded-3xl border border-slate-900/80 bg-[#080b11]/70 hover:border-slate-800/80 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/5"
                >
                  {/* Banner Image */}
                  <div className="relative h-32 w-full overflow-hidden shrink-0 bg-slate-950 border-b border-slate-900/50">
                    <img
                      src={club.coverImage}
                      alt={club.name}
                      className="w-full h-full object-cover transition-transform duration-555 group-hover:scale-103"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080b11]/90 via-[#080b11]/30 to-black/25 pointer-events-none" />

                    {/* Category Overlay Tag */}
                    <span className="absolute top-3 left-3 text-[9px] bg-slate-950/80 border border-slate-900/50 text-slate-300 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                      {club.category}
                    </span>

                    {/* Verified Club badge */}
                    <span className="absolute top-3 right-3 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 fill-emerald-500/10" />
                      <span>Verified</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    {/* Club Meta Info (Logo overlapping banner, title, desc) */}
                    <div className="space-y-3.5 relative">
                      
                      {/* Logo Frame */}
                      <div className="w-12 h-12 rounded-2xl bg-[#080b11] border border-slate-900 p-0.5 shadow-xl -mt-11 relative z-10 overflow-hidden shrink-0">
                        <img
                          src={club.logo}
                          alt={club.name}
                          className="w-full h-full object-cover rounded-xl bg-slate-950 border border-slate-850"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base font-extrabold text-white group-hover:text-indigo-400 transition-colors leading-tight">
                          {club.name}
                        </h3>
                        <p className="text-[11px] text-slate-450 leading-relaxed font-semibold line-clamp-2">
                          {club.description}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-900/60" />

                    {/* Quick Stats: Members count & Events count */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      
                      {/* Members */}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-350">
                          {club.members?.length || 0} Members
                        </span>
                      </div>

                      {/* Events */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-350">
                          {upcomingEventsCount} Upcoming Event{upcomingEventsCount !== 1 && 's'}
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* Card Action footer bar */}
                  <div className="px-5 py-3.5 bg-slate-950/75 border-t border-slate-900/60 flex items-center justify-between transition-colors group-hover:bg-slate-950/90 shrink-0">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                      {isMember ? '✓ Member of Club' : 'Open Club Page'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center border border-dashed border-slate-900/80 rounded-3xl bg-[#080b11]/30 backdrop-blur-md flex flex-col items-center justify-center gap-5 max-w-lg mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">No clubs found</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              We couldn't find any communities matching your selected filters or search terms.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All Categories');
            }}
            className="h-10 px-5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/15 transition-all cursor-pointer active:scale-95"
          >
            <span>Reset Filters</span>
          </button>
        </motion.div>
      )}

    </div>
  );
};

export default Clubs;
