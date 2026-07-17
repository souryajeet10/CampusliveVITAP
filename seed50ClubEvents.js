import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 1. Parse .env variables
const envPath = path.resolve('.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
}

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID,
  measurementId: envConfig.VITE_FIREBASE_MEASUREMENT_ID
};

console.log('Connecting to Firebase for seeding with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clubs = [
  { clubId: 'club_coding_club', name: 'Coding Club', creatorName: 'Aarav Sharma', creatorId: 'CL-AAAA-1111' },
  { clubId: 'club_sports_club', name: 'Sports Club', creatorName: 'Rohan Mehta', creatorId: 'CL-BBBB-2222' },
  { clubId: 'club_music_society', name: 'Music Society', creatorName: 'Rohan Mehta', creatorId: 'CL-BBBB-2222' },
  { clubId: 'club_cultural_club', name: 'Cultural Club', creatorName: 'Souryajeet Singh', creatorId: 'CL-PFWV-TFYY' },
  { clubId: 'club_photography_club', name: 'Photography Club', creatorName: 'Aarav Sharma', creatorId: 'CL-AAAA-1111' },
  { clubId: 'club_robotics_club', name: 'Robotics Club', creatorName: 'Aarav Sharma', creatorId: 'CL-AAAA-1111' },
  { clubId: 'club_gaming_alliance', name: 'Gaming Alliance', creatorName: 'Rohan Mehta', creatorId: 'CL-BBBB-2222' }
];

const categoryColors = {
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

const defaultEventCovers = {
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

const eventTemplates = [
  { prefix: 'Intro to', category: 'Technical' },
  { prefix: 'Advanced', category: 'Technical' },
  { prefix: 'Hackathon Practice', category: 'Technical' },
  { prefix: 'Open Mic Night', category: 'Cultural' },
  { prefix: 'Drama Club Play', category: 'Cultural' },
  { prefix: 'Art & Sketching Expo', category: 'Cultural' },
  { prefix: 'Friendly Match', category: 'Sports' },
  { prefix: 'Tournament Semi-Finals', category: 'Sports' },
  { prefix: 'Fitness & Core Drills', category: 'Sports' },
  { prefix: 'Live Q&A Session', category: 'Seminar' },
  { prefix: 'Expert Tech Talk', category: 'Seminar' },
  { prefix: 'Career Building Seminar', category: 'Seminar' },
  { prefix: 'Bootcamp Part', category: 'Workshop' },
  { prefix: 'Skill Mastery Session', category: 'Workshop' },
  { prefix: 'Annual LAN Tournament', category: 'Entertainment' },
  { prefix: 'Gaming Alliance Clash', category: 'Entertainment' },
  { prefix: 'Acoustic Jam Night', category: 'Entertainment' },
  { prefix: 'Campus Clean Drive', category: 'Social' },
  { prefix: 'Weekly Chill Meetup', category: 'Social' }
];

const topics = [
  'JavaScript Frameworks', 'Rust Systems', 'Generative AI', 'Cloud Architectures',
  'UI/UX Prototyping', 'Photography Lighting', 'Drone Firmware Programming',
  'Street Dance Choreography', 'Classical Instrumental Musings', 'Competitive Valorant Play',
  'Table Tennis Spin Techniques', 'Badminton Placement Drills', 'Chess Opening Gambits',
  'Dynamic Flutter Layouts', 'Next.js App Router', 'Web3 & Smart Contracts',
  'Interactive Graphic Design', 'Video Editing and Composition', 'Database Scaling Tricks'
];

const locations = [
  { room: 'Lab 2, APJ Block', building: 'Block B', lat: 16.4971, lng: 80.4995 },
  { room: 'Auditorium 2, Block A', building: 'SRK Block', lat: 16.4965, lng: 80.5008 },
  { room: 'Turf Court A', building: 'Sports Complex', lat: 16.4952, lng: 80.5015 },
  { room: 'Turf Court B', building: 'Sports Complex', lat: 16.4952, lng: 80.5012 },
  { room: 'SAC Room 102', building: 'Student Activity Center', lat: 16.4985, lng: 80.4988 },
  { room: 'SAC Room 105', building: 'Student Activity Center', lat: 16.4985, lng: 80.4985 },
  { room: 'Central Library Hall A', building: 'Central Library', lat: 16.4971, lng: 80.4995 },
  { room: 'Canteen Lawn', building: 'SRK Block', lat: 16.4965, lng: 80.5008 },
  { room: 'Hostel Block MH-2 Lawn', building: 'Men\'s Hostel 2', lat: 16.4945, lng: 80.4985 }
];

const users = [
  'CL-AAAA-1111', 'CL-BBBB-2222', 'CL-PFWV-TFYY',
  'VITAP-111222', 'VITAP-333444', 'VITAP-555666', 'VITAP-777888', 'VITAP-999000',
  'VITAP-123456', 'VITAP-234567', 'VITAP-345678', 'VITAP-456789', 'VITAP-567890'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed50Events() {
  console.log('Generating 50 new club events...');
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  for (let i = 1; i <= 50; i++) {
    const template = getRandomElement(eventTemplates);
    const topic = getRandomElement(topics);
    const title = `${template.prefix} ${topic} (Event #${i})`;
    const club = getRandomElement(clubs);
    const loc = getRandomElement(locations);
    
    // Add minor coordinate jitter so markers do not overlay exactly
    const jitterLat = (Math.random() - 0.5) * 0.0004;
    const jitterLng = (Math.random() - 0.5) * 0.0004;
    const finalLat = parseFloat((loc.lat + jitterLat).toFixed(6));
    const finalLng = parseFloat((loc.lng + jitterLng).toFixed(6));
    
    const category = template.category;
    const color = categoryColors[category] || 'indigo';
    const coverImage = defaultEventCovers[category] || defaultEventCovers.Other;
    
    const startHour = Math.floor(Math.random() * 12) + 9; // 9 AM to 8 PM
    const duration = Math.floor(Math.random() * 3) + 1; // 1 to 3 hours
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const endTime = `${String(startHour + duration).padStart(2, '0')}:00`;
    
    const isLive = Math.random() > 0.5;

    const participants = new Set([club.creatorId]);
    const pCount = Math.floor(Math.random() * 8) + 3;
    const maxPossible = Math.min(pCount, users.length);
    while (participants.size < maxPossible) {
      participants.add(getRandomElement(users));
    }

    const event = {
      title,
      name: title,
      category,
      description: `Join us for this exciting ${club.name} session on ${topic}! Perfect for beginners and experts alike. Interactive discussions, networking, and expert tips included.`,
      eventType: 'club',
      clubId: club.clubId,
      organizerName: club.name,
      organizerLogo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(club.name)}`,
      coverImage,
      location: `${loc.room}, ${loc.building}`,
      date: todayStr,
      startTime,
      endTime,
      room: loc.room,
      building: loc.building,
      latitude: finalLat,
      longitude: finalLng,
      isLive,
      color,
      featured: Math.random() > 0.8,
      createdBy: club.creatorId,
      creatorName: club.creatorName,
      creatorRole: 'club_admin',
      participants: Array.from(participants),
      interestedCount: participants.size,
      createdAt: new Date(Date.now() - (Math.random() * 3600000 * 12)) // created within the last 12h
    };

    console.log(`Writing event ${i} to Firestore...`);
    await addDoc(collection(db, 'activities'), event);
    if (i % 10 === 0) {
      console.log(`Seeded ${i}/50 club events...`);
    }
  }

  console.log('Successfully completed seeding 50 new club events!');
}

seed50Events().catch(console.error);
