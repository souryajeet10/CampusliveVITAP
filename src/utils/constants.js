import { Sparkles, Flame, Trophy, Calendar } from 'lucide-react';

export const VIT_AP_CENTER = [16.494144, 80.498191];

export const VIT_AP_BOUNDS = [
  [16.4880, 80.4850], // Southwest boundary corner
  [16.5060, 80.5130]  // Northeast boundary corner
];

export const CAMPUS_POLYGON = [
  [16.497134, 80.494562],
  [16.497216, 80.501756],
  [16.491131, 80.501820],
  [16.491072, 80.494664]
];

export const accentGradients = {
  indigo: 'from-indigo-500 to-purple-600',
  purple: 'from-purple-500 to-pink-500',
  pink: 'from-pink-500 to-rose-500',
  emerald: 'from-emerald-500 to-teal-600',
  blue: 'from-blue-500 to-indigo-600',
  amber: 'from-amber-500 to-orange-600',
  cyan: 'from-cyan-500 to-blue-600',
  violet: 'from-violet-500 to-purple-700',
  fuchsia: 'from-fuchsia-500 to-pink-600',
  slate: 'from-slate-500 to-slate-700',
};

export const eventCategories = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition',
  'Social',
  'Entertainment',
  'Other'
];

export const categoryColors = {
  Technical: 'indigo',
  Cultural: 'pink',
  Sports: 'emerald',
  Workshop: 'blue',
  Seminar: 'cyan',
  Competition: 'amber',
  Social: 'violet',
  Entertainment: 'fuchsia',
  Other: 'slate',
};

export const defaultEventCovers = {
  Technical: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=60',
  Cultural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
  Workshop: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=60',
  Seminar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
  Competition: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60',
  Social: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60',
  Entertainment: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60',
  Other: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=60',
};


export const iconMapping = {
  Sparkles,
  Flame,
  Trophy,
  Calendar,
};

export const mockEvents = [
  {
    id: 1,
    name: 'Tech Hackathon 2026',
    room: 'SRK Block, Room 102',
    category: 'Tech',
    coordinates: [16.4965, 80.5008],
    description: 'AI Hackathon in progress. 24 groups building autonomous web agents. Join for live voting or coding.',
    isLive: true,
    color: 'indigo',
    time: 'Ends 4:00 PM',
    createdTime: '10 mins ago',
    iconName: 'Sparkles'
  },
  {
    id: 2,
    name: 'AI & Web Agents Seminar',
    room: 'APJ Block, Seminar Hall 3',
    category: 'Academic',
    coordinates: [16.4971, 80.4995],
    description: 'Guest lecture on Large Language Models, agentic workflows, and future engineering careers.',
    isLive: false,
    color: 'purple',
    time: 'Starts at 3:00 PM',
    createdTime: '45 mins ago',
    iconName: 'Flame'
  },
  {
    id: 3,
    name: 'Acoustic Music Night',
    room: 'Central Food Court Plaza',
    category: 'Leisure',
    coordinates: [16.4960, 80.4990],
    description: 'Unplugged sessions and open mic hosted by the Campus Music Club. Grab a coffee and chill.',
    isLive: true,
    color: 'pink',
    time: 'Active Now',
    createdTime: '2 mins ago',
    iconName: 'Sparkles'
  },
  {
    id: 4,
    name: 'Football Tournament Finals',
    room: 'Main Sports Turf',
    category: 'Sports',
    coordinates: [16.4952, 80.5015],
    description: 'The final showdown between CSE Spartans and ECE Gladiators. Live cheering encouraged!',
    isLive: true,
    color: 'emerald',
    time: 'Second Half Live',
    createdTime: '1.5 hours ago',
    iconName: 'Trophy'
  },
  {
    id: 5,
    name: 'Inter-hostel FIFA Finals',
    room: 'MH-2 Recreation Room',
    category: 'Sports',
    coordinates: [16.4945, 80.4985],
    description: 'Boys Hostel MH-2 is hosting the annual FIFA championship finals on the big screen.',
    isLive: false,
    color: 'blue',
    time: 'Tonight, 8:00 PM',
    createdTime: '3 hours ago',
    iconName: 'Calendar'
  },
  {
    id: 6,
    name: 'Handicrafts Exhibition',
    room: 'LH-1 Courtyard',
    category: 'Art',
    coordinates: [16.4985, 80.4988],
    description: 'Explore hand-painted artwork, local Andhra pottery, and handloom fabrics from our student artists.',
    isLive: false,
    color: 'amber',
    time: 'Starts Tomorrow',
    createdTime: '5 hours ago',
    iconName: 'Trophy'
  }
];
