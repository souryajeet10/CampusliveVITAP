import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Calendar, 
  Bell, 
  MessageSquare, 
  Users,
  Rocket,
  Map,
  X,
  ArrowLeft,
  Check,
  Lightbulb,
  CheckCircle,
  Cpu
} from 'lucide-react';

const roadmapItems = [
  {
    id: 'map',
    title: '🗺️ Improved Campus Map',
    description: 'Transform the campus map into a smarter navigation and discovery experience. Upcoming features include: building labels, live crowd heatmaps, and indoor navigation.',
    status: 'In Progress',
    color: 'emerald',
    icon: Map,
    overview: 'Improved Campus Map shifts our Leaflet interface into a layered spatial engine showing building floor plans, active room lines, and live check-in heatmaps.',
    problem: 'Standard campus maps are static 2D images, lacking building labels, live details, accessibility indices, and floor plans, leading to lost freshmen.',
    solution: 'A 3D Leaflet-based interactive campus layout containing search tags, room layouts, and live crowd activity indices.',
    whyBuilding: 'To improve campus navigation and layout accessibility for both new students and visitors.',
    benefits: [
      'Interactive floor selectors displaying classrooms and labs.',
      'Crowd density mapping showing active zones.',
      'Location markers for water fountains, restrooms, and accessible routes.'
    ],
    technicalDetails: 'React Leaflet utilizing custom geoJSON polygon coordinates for rooms, combined with crowd density scoring from active checked-in participants.',
    milestones: [
      { name: 'Vector layout coordinates mapping', done: true },
      { name: 'Geofenced room outlines', done: true },
      { name: 'Live crowd check-in heatmap', done: false },
      { name: 'Indoor level outlines UI', done: false }
    ],
    releaseStage: 'Beta release projected for Q3 2026.',
    futureEnhancements: 'AR navigation overlays showing direct path routes on smartphone cameras.'
  },
  {
    id: 'clubs',
    title: '🏛 Club Communities',
    description: 'Official pages for student clubs with announcements, member directories, and event calendars.',
    status: 'Planned',
    color: 'indigo',
    icon: Users,
    overview: 'Club Communities provides official spaces for university clubs to share announcements, post events directly to the campus feed, and coordinate member activities.',
    problem: 'Currently, campus clubs are fragmented across WhatsApp groups and Instagram stories, making it hard for new students to discover them or stay updated on meetings.',
    solution: 'CampusLive aggregates all active clubs into a unified directory where students can search by interest, request to join, and instantly sync club events with their personal calendar.',
    whyBuilding: 'To eliminate fragmented notices and give student organizations a centralized platform to build engagement and grow their communities.',
    benefits: [
      'Centralized directory for all active university clubs.',
      'Instant notifications for announcements and meeting changes.',
      'Simple coordinate mapping for active rooms and meeting spots.'
    ],
    technicalDetails: 'Built using Firebase Firestore for real-time announcements updates, with security rules validating roles (e.g. Club President, Moderator) and React lazy-loaded pages.',
    milestones: [
      { name: 'Club registration portal', done: false },
      { name: 'Real-time announcements feed', done: false },
      { name: 'Role & Moderator hierarchy', done: false },
      { name: 'Verified club badge sync', done: false }
    ],
    releaseStage: 'Beta release expected in Q3 2026.',
    futureEnhancements: 'Adding auto-role assignment, custom club branding themes, and integration with academic registration lists.'
  },
  {
    id: 'calendar',
    title: '📅 Smart Calendar',
    description: 'Sync and view all joined activities, classes, and club community meets in one calendar.',
    status: 'Planned',
    color: 'indigo',
    icon: Calendar,
    overview: 'Smart Calendar pulls all joined activities, class schedules, and club meetups into a single unified workspace to avoid scheduling conflicts.',
    problem: 'Keeping track of university events, class schedules, and club meetups leads to scheduling conflicts. Students use separate apps for schedules, notice boards, and reminders, leading to missed events.',
    solution: 'A consolidated, color-coded dashboard calendar that dynamically imports events from Joined Activities, Club Calendars, and academic timetables.',
    whyBuilding: 'To ensure students have a single source of truth for their daily agenda and can coordinate event attendances effortlessly.',
    benefits: [
      'Automatic conflict indicators when joined activities overlap.',
      'One-click synchronization with Google Calendar and Apple Calendar.',
      'Time-blocking suggestions based on academic schedules.'
    ],
    technicalDetails: 'iCal parser running in Firebase Cloud Functions, indexing event timetables client-side with React local storage caching to maintain fast performance.',
    milestones: [
      { name: 'Calendar interface UI', done: false },
      { name: 'iCal sync integration', done: false },
      { name: 'Direct Google Cal exporter', done: false }
    ],
    releaseStage: 'Core calendar planning scheduled for Q4 2026.',
    futureEnhancements: 'Integration with campus class schedules for automatic lecture time-blocking.'
  },
  {
    id: 'mobile',
    title: '📱 Mobile App',
    description: 'Native Android and iOS applications with widgets and fast location sync.',
    status: 'Planned',
    color: 'indigo',
    icon: Rocket,
    overview: 'Mobile App delivers native Android and iOS client implementations containing geofenced notification controllers and lock screen shortcuts.',
    problem: 'Accessing the platform through a mobile browser when running between campus halls is slow, lacks background GPS tracking, and prevents instant real-time alerts.',
    solution: 'A native React Native application optimized for mobile viewports, featuring geofenced alerts and home screen widgets showing ongoing campus events.',
    whyBuilding: 'To offer high-fidelity geographical features like push alerts and campus navigation on-the-go.',
    benefits: [
      'Lock screen widgets showing current active events.',
      'Background GPS tracking for nearby safety alerts.',
      'Offline maps cache support for fast loading in low connectivity zones.'
    ],
    technicalDetails: 'Built on React Native and Expo, utilizing native MapKit (iOS) and Google Maps SDK (Android) modules via shared Firestore APIs.',
    milestones: [
      { name: 'Wireframing & UI design', done: false },
      { name: 'GPS geofencing test run', done: false },
      { name: 'Beta app store release', done: false }
    ],
    releaseStage: 'Alpha release projected for Q1 2027.',
    futureEnhancements: 'Support for WearOS and Apple Watch updates for instant check-in ticket scans.'
  },
  {
    id: 'push',
    title: '🔔 Push Notifications',
    description: 'Real-time push alerts and geographical alerts for nearby active events on campus.',
    status: 'Planned',
    color: 'indigo',
    icon: Bell,
    overview: 'Push Notifications provides real-time notifications based on geographical boundaries (geofences) and user category preferences.',
    problem: 'Students frequently miss spontaneous events (like food trucks or gaming circles) because they don\'t check notice boards until hours after they start.',
    solution: 'Push notifications triggered by geofencing. If an active event starts within 100 meters of a student, they receive a lock-screen alert.',
    whyBuilding: 'To maximize student participation in live spontaneous activities and increase engagement.',
    benefits: [
      'Real-time alerts for instant campus happenings.',
      'Category filter switches so you only get pinged for what you like.',
      'Automatic snooze mode during lecture timings.'
    ],
    technicalDetails: 'Firebase Cloud Messaging (FCM) coordinates alerts, and GeoFirestore indexes latitude/longitude points to determine geofence triggers.',
    milestones: [
      { name: 'FCM setup & registration', done: false },
      { name: 'Geofencing radius calculator', done: false },
      { name: 'Custom notification UI settings', done: false }
    ],
    releaseStage: 'Planned for integration in Q2 2027.',
    futureEnhancements: 'Adding quiet hours sync linked to student class timetables.'
  },
  {
    id: 'discussions',
    title: '💬 Event Discussions',
    description: 'Dedicated discussion threads, Q&A boards, and live chats for every campus activity.',
    status: 'Planned',
    color: 'indigo',
    icon: MessageSquare,
    overview: 'Event Discussions adds community discussion boards and live QA comments below every mapped event panel.',
    problem: 'Asking coordinators simple clarifying questions (like dress codes, parking, or equipment requirements) is difficult without joining large, messy messaging groups.',
    solution: 'Dedicated discussion threads built directly into every event detail panel, supporting comments, threads, and host pinned messages.',
    whyBuilding: 'To keep event communication structured, transparent, and direct without leaving the event detail views.',
    benefits: [
      'Threaded discussions for QA and coordinate arrangements.',
      'Pinned updates by coordinators visible at the top.',
      'Interactive chat bubbles for quick coordinate lookups.'
    ],
    technicalDetails: 'Firestore sub-collections with real-time list listeners, optimistic state updates in React, and profanity filtering hooks.',
    milestones: [
      { name: 'Discussion panels UI', done: false },
      { name: 'Real-time comment sync', done: false },
      { name: 'Mod filters & user blocks', done: false }
    ],
    releaseStage: 'Design stages set for Q4 2026.',
    futureEnhancements: 'Event coordinator announcements pushed directly to user discussion threads.'
  }
];

const principles = [
  { title: 'Student-first', desc: 'Every feature is built around the direct needs of student groups and campus communities.' },
  { title: 'Real-time by default', desc: 'Instantaneous updates so you always know what is happening on campus right now.' },
  { title: 'Community driven', desc: 'Empowering student leaders and clubs to organize activities and connect directly.' },
  { title: 'Privacy conscious', desc: 'No intrusive tracking. Students share only the information they choose to share.' },
  { title: 'Accessible', desc: 'Accessible to all students, with optimized rendering, key controls, and responsive styling.' },
  { title: 'Simple before powerful', desc: 'Notice boards are simple; we aim to stay cleaner and easier while scaling features.' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } }
};

const WhatsNext = () => {
  const [selectedItem, setSelectedItem] = useState(null);

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  return (
    <div className="relative w-full h-full min-h-0">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12 font-sans text-gray-300 pb-16 max-w-5xl mx-auto px-4 md:px-0 select-none text-left"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Roadmap</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            What&apos;s Next for CampusLive
          </h1>
        </motion.div>

        {/* 🌟 Section 1: Vision & Manifesto */}
        <motion.section variants={itemVariants} className="p-6 md:p-8 rounded-2xl bg-gradient-to-tr from-indigo-950/20 to-slate-900/30 border border-slate-900 shadow-xl backdrop-blur-md space-y-4">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">CampusLive Vision &amp; Manifesto</span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">Building the Social Layer of Every Campus</h2>
          </div>
          
          <div className="space-y-3 text-xs md:text-sm text-slate-350 leading-relaxed font-medium">
            <p className="text-slate-200 text-sm md:text-base leading-relaxed font-semibold">
              &ldquo;CampusLive @VITAP aims to make campus life more connected by helping students discover events, join communities, and stay informed about what&apos;s happening across the VIT-AP campus in real time.&rdquo;
            </p>
            
            <div className="h-px bg-slate-900/80 my-3" />
            
            <p>
              CampusLive believes campus life shouldn&apos;t be fragmented across WhatsApp groups, Instagram stories, and notice boards.
            </p>
            <p>
              Our mission is to bring every activity, opportunity, and community into one beautiful platform where students can instantly discover what&apos;s happening around them.
            </p>
            <p className="text-indigo-400 font-bold pt-1">
              We believe every student deserves to feel connected.
            </p>
          </div>
        </motion.section>

        {/* 🚀 Section 2: Coming Soon Roadmap Cards */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Rocket className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Roadmap Timeline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roadmapItems.map((item) => {
              const Icon = item.icon;
              const isProgress = item.status === 'In Progress';

              return (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  onClick={() => handleOpenDetail(item)}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className="p-5 rounded-2xl bg-[#080b11] border border-slate-900 hover:border-indigo-500/35 hover:bg-slate-950/40 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 group flex flex-col justify-between space-y-4 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                          <Icon className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-100 group-hover:text-white transition-colors">{item.title}</h4>
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border
                        ${isProgress 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed pl-1 pt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>



        {/* 🎯 Section 4: Product Principles */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
            <Lightbulb className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Product Principles</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {principles.map((pr) => (
              <div 
                key={pr.title}
                className="p-4 rounded-xl bg-[#080b11] border border-slate-900 hover:border-slate-800 transition-all text-left space-y-1.5"
              >
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-indigo-400" />
                  <span>{pr.title}</span>
                </h4>
                <p className="text-[10.5px] text-gray-500 leading-relaxed">
                  {pr.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>

      {/* 🌟 Detail Modal (Apple / Notion / Linear style) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetail}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-850 bg-[#080b11] shadow-2xl flex flex-col z-10 custom-scrollbar scroll-smooth"
            >
              {/* Feature Banner Section */}
              <div className="relative h-40 md:h-52 w-full bg-gradient-to-tr from-indigo-950/40 to-slate-900/60 flex-shrink-0 flex items-end p-6 border-b border-slate-900/60 overflow-hidden">
                {/* Visual Glassmorphism overlay */}
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
                <div className="absolute right-6 top-6 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
                
                {/* Back Button */}
                <button
                  onClick={handleCloseDetail}
                  className="absolute top-6 left-6 h-9 px-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-900 text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer z-10 active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Roadmap</span>
                </button>

                {/* Top Close icon */}
                <button
                  onClick={handleCloseDetail}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-900 text-gray-500 hover:text-white transition-all cursor-pointer z-10 active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative flex items-center gap-4 z-10">
                  <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/25 text-indigo-400">
                    {/* Render matching icon */}
                    {(() => {
                      const Icon = selectedItem.icon;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-black text-white">{selectedItem.title}</h2>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border
                        ${selectedItem.status === 'In Progress' 
                          ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-450 border-blue-500/20'
                        }`}
                      >
                        {selectedItem.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{selectedItem.releaseStage}</p>
                  </div>
                </div>
              </div>

              {/* Modal Content Scroll Details */}
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto text-left">
                
                {/* Column 1 & 2: Overview & Technical Details */}
                <div className="lg:col-span-2 space-y-8 pr-0 lg:pr-4">
                  {/* ✨ Overview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Overview</span>
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium pl-1">
                      {selectedItem.overview}
                    </p>
                  </div>

                  {/* 🎯 Problem & Solution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/20 border border-slate-900">
                      <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>The Problem</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                        {selectedItem.problem}
                      </p>
                    </div>

                    <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/20 border border-slate-900">
                      <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>The Solution</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                        {selectedItem.solution}
                      </p>
                    </div>
                  </div>

                  {/* ⚙️ Technical Details */}
                  <div className="space-y-3 p-5 rounded-2xl bg-[#0b0f19]/30 border border-slate-900 relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-gray-800">
                      <Cpu className="w-12 h-12 stroke-[0.5]" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 z-10 relative">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span>Technical Architecture</span>
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium pl-1 z-10 relative">
                      {selectedItem.technicalDetails}
                    </p>
                  </div>
                </div>

                {/* Column 3: Benefits, Timeline & Progress */}
                <div className="space-y-8 lg:border-l lg:border-slate-900/60 lg:pl-8">
                  {/* Why We're Building / Benefits */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-550 uppercase tracking-widest">
                      User Benefits
                    </h3>
                    <div className="space-y-2.5">
                      {selectedItem.benefits.map((benefit, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span className="text-slate-350 leading-normal font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Planned Milestones / Progress Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-550 uppercase tracking-widest">
                      Development Progress
                    </h3>
                    <div className="space-y-3">
                      {selectedItem.milestones.map((milestone, i) => (
                        <div 
                          key={i} 
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-900"
                        >
                          {milestone.done ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-650" />
                            </div>
                          )}
                          <span className={`text-[11px] font-semibold flex-1 ${milestone.done ? 'text-gray-500 line-through' : 'text-slate-300'}`}>
                            {milestone.name}
                          </span>
                          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider shrink-0">
                            {milestone.done ? 'Done' : 'Planned'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WhatsNext;
