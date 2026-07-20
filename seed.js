import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

// 1. Manually parse .env variables
const envPath = path.resolve('.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      envConfig[key] = val;
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

console.log('Connecting to Firebase project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper date logic
const getLocalDateString = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const today = new Date();
const todayStr = getLocalDateString(today);
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const tomorrowStr = getLocalDateString(tomorrow);
const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
const dayAfterTomorrowStr = getLocalDateString(dayAfterTomorrow);

// Calculate times for event starting 1 hour from now
const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000);
const oneHourLaterStr = `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;
const twoHoursLater = new Date(today.getTime() + 2.5 * 60 * 60 * 1000);
const twoHoursLaterStr = `${String(twoHoursLater.getHours()).padStart(2, '0')}:${String(twoHoursLater.getMinutes()).padStart(2, '0')}`;

// Calculate starting soon times
const fifteenMinsLater = new Date(today.getTime() + 15 * 60 * 1000);
const fifteenMinsLaterStr = `${String(fifteenMinsLater.getHours()).padStart(2, '0')}:${String(fifteenMinsLater.getMinutes()).padStart(2, '0')}`;
const fifteenMinsLaterEnd = new Date(today.getTime() + 75 * 60 * 1000);
const fifteenMinsLaterEndStr = `${String(fifteenMinsLaterEnd.getHours()).padStart(2, '0')}:${String(fifteenMinsLaterEnd.getMinutes()).padStart(2, '0')}`;

const thirtyMinsLater = new Date(today.getTime() + 30 * 60 * 1000);
const thirtyMinsLaterStr = `${String(thirtyMinsLater.getHours()).padStart(2, '0')}:${String(thirtyMinsLater.getMinutes()).padStart(2, '0')}`;
const thirtyMinsLaterEnd = new Date(today.getTime() + 90 * 60 * 1000);
const thirtyMinsLaterEndStr = `${String(thirtyMinsLaterEnd.getHours()).padStart(2, '0')}:${String(thirtyMinsLaterEnd.getMinutes()).padStart(2, '0')}`;

const lotteryFortyFiveMins = new Date(today.getTime() + 45 * 60 * 1000);
const fortyFiveMinsLaterStr = `${String(lotteryFortyFiveMins.getHours()).padStart(2, '0')}:${String(lotteryFortyFiveMins.getMinutes()).padStart(2, '0')}`;
const fortyFiveMinsLaterEnd = new Date(today.getTime() + 105 * 60 * 1000);
const fortyFiveMinsLaterEndStr = `${String(fortyFiveMinsLaterEnd.getHours()).padStart(2, '0')}:${String(fortyFiveMinsLaterEnd.getMinutes()).padStart(2, '0')}`;

async function cleanCollection(colName) {
  console.log(`Cleaning collection: ${colName}...`);
  const colRef = collection(db, colName);
  const snapshot = await getDocs(colRef);
  let count = 0;
  for (const document of snapshot.docs) {
    await deleteDoc(doc(db, colName, document.id));
    count++;
  }
  console.log(`Deleted ${count} documents from ${colName}`);
}

async function seed() {
  try {
    // 2. Clean existing collections
    await cleanCollection('users');
    await cleanCollection('activities');
    await cleanCollection('lost_found_pins');
    await cleanCollection('clubs');
    await cleanCollection('club_announcements');

    // 3. Seed Users
    console.log('Seeding user profiles...');
    const seededUserIds = ['CL-PFWV-TFYY', 'CL-AAAA-1111', 'CL-BBBB-2222'];

    // Default main users
    await setDoc(doc(db, 'users', 'CL-PFWV-TFYY'), {
      name: 'Souryajeet Singh',
      department: 'Computer Science (CSE)',
      year: '🌱 Fresher 1st year',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=souryajeet',
      role: 'supreme_admin',
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, 'users', 'CL-AAAA-1111'), {
      name: 'Aarav Sharma',
      department: 'Electronics (ECE)',
      year: '📘 Second Year',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
      role: 'club_admin',
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, 'users', 'CL-BBBB-2222'), {
      name: 'Rohan Mehta',
      department: 'Mechanical (ME)',
      year: '🚀 3rd year',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
      role: 'user',
      createdAt: serverTimestamp()
    });

    // 50 more mock users
    const firstNames = ['Amit', 'Priyan', 'Sneha', 'Neha', 'Kabir', 'Divya', 'Ananya', 'Rohan', 'Aditya', 'Vikram', 'Meera', 'Riya', 'Karan', 'Pooja', 'Rahul', 'Simran', 'Arjun', 'Aanya', 'Yash', 'Ishita', 'Sameer', 'Priya', 'Tanvi', 'Abhishek', 'Kriti'];
    const lastNames = ['Sharma', 'Verma', 'Singh', 'Patel', 'Mehta', 'Sen', 'Das', 'Joshi', 'Reddy', 'Gupta', 'Iyer', 'Nair', 'Kapoor', 'Malhotra', 'Bose', 'Choudhury', 'Roy', 'Rao', 'Trivedi', 'Pandey', 'Saxena', 'Deshmukh', 'Kulkarni', 'Bhat', 'Shetty'];
    const departments = ['Computer Science (CSE)', 'Electronics (ECE)', 'Mechanical (ME)', 'Biotechnology (BT)', 'Business (BBA)', 'Liberal Arts'];
    const years = ['🌱 Fresher 1st year', '📘 Second Year', '🚀 3rd year', '🎓 Senior (Final Year)'];

    for (let i = 1; i <= 200; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${fName} ${lName}`;
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const yr = years[Math.floor(Math.random() * years.length)];
      
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let suffix = '';
      for (let j = 0; j < 6; j++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
      }
      const campusId = `VITAP-${suffix}`;
      seededUserIds.push(campusId);

      await setDoc(doc(db, 'users', campusId), {
        name,
        department: dept,
        year: yr,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name + i)}`,
        role: 'user',
        createdAt: serverTimestamp()
      });
    }

    console.log(`Successfully seeded ${seededUserIds.length} users.`);

    // Helper to generate a random subset of participants
    const getRandomParticipants = (creatorId, min = 3, max = 15) => {
      const list = new Set([creatorId]);
      const targetSize = Math.floor(Math.random() * (max - min + 1)) + min;
      while (list.size < targetSize) {
        const randomId = seededUserIds[Math.floor(Math.random() * seededUserIds.length)];
        list.add(randomId);
      }
      return Array.from(list);
    };

    // 4. Seed Activities (Total 22 events)
    console.log('Seeding 22 activities...');
    const activities = [
      {
        name: 'AI Agents Hackathon 2026',
        category: 'Tech',
        room: 'Auditorium 2, Block A',
        building: 'SRK Block',
        latitude: 16.4965,
        longitude: 80.5008,
        description: 'Join our first campus AI agent build-off! Groups of students design and deploy autonomous AI pairs. Pizzas provided.',
        isLive: true,
        date: todayStr,
        startTime: '10:00',
        endTime: '22:00',
        color: 'indigo',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 10, 25),
        featured: true,
        createdAt: new Date()
      },
      {
        name: 'Basketball Tournament Live',
        category: 'Sports',
        room: 'Turf Court A',
        building: 'Sports Complex',
        latitude: 16.4952,
        longitude: 80.5015,
        description: 'Hostel Spartans vs Central Club Gladiators. Come and cheer for your department players!',
        isLive: true,
        date: todayStr,
        startTime: '16:00',
        endTime: '19:00',
        color: 'emerald',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 8, 18),
        featured: false,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        name: 'IoT Crash Course Live',
        category: 'Tech',
        room: 'Lab 2, APJ Block',
        building: 'Block B',
        latitude: 16.4971,
        longitude: 80.4995,
        description: 'Understand MQTT protocols, Arduino firmware layouts, and dynamic sensor integrations.',
        isLive: false,
        date: todayStr,
        startTime: fifteenMinsLaterStr,
        endTime: fifteenMinsLaterEndStr,
        color: 'indigo',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        participants: getRandomParticipants('CL-PFWV-TFYY', 4, 16),
        featured: false,
        createdAt: new Date()
      },
      {
        name: 'Cricket Practice Session',
        category: 'Sports',
        room: 'Turf Court B',
        building: 'Sports Complex',
        latitude: 16.4952,
        longitude: 80.5015,
        description: 'Net practice and fielding drills for the inter-department college selections next week.',
        isLive: false,
        date: todayStr,
        startTime: thirtyMinsLaterStr,
        endTime: thirtyMinsLaterEndStr,
        color: 'emerald',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 6, 20),
        featured: false,
        createdAt: new Date()
      },
      {
        name: 'Pop Music Jam Session',
        category: 'Music',
        room: 'SAC Room 102',
        building: 'SAC Building',
        latitude: 16.4985,
        longitude: 80.4988,
        description: 'Grab an instrument or take the mic! An open mic acoustic jam for contemporary pop enthusiasts.',
        isLive: false,
        date: todayStr,
        startTime: fortyFiveMinsLaterStr,
        endTime: fortyFiveMinsLaterEndStr,
        color: 'purple',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 8, 22),
        featured: false,
        createdAt: new Date()
      },
      {
        name: 'React Native Mobile Workshop',
        category: 'Tech',
        room: 'Lab 3, APJ Block',
        building: 'Block B',
        latitude: 16.4971,
        longitude: 80.4995,
        description: 'Hands-on coding session covering React Native essentials. Build a simple cross-platform mobile screen from scratch.',
        isLive: false,
        date: todayStr,
        startTime: oneHourLaterStr,
        endTime: twoHoursLaterStr,
        color: 'indigo',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 5, 15),
        featured: false,
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        name: 'Pizza & Networking Meetup',
        category: 'Food',
        room: 'Food Court Plaza',
        building: 'Central Lawn',
        latitude: 16.4960,
        longitude: 80.4990,
        description: 'Grab a slice of pizza and network with senior peer mentors, alumni, and club leads.',
        isLive: false,
        date: todayStr,
        startTime: '18:30',
        endTime: '20:30',
        color: 'pink',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        creatorRole: 'supreme_admin',
        participants: getRandomParticipants('CL-PFWV-TFYY', 6, 20),
        featured: false,
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        name: 'Vocal Music Auditions',
        category: 'Music',
        room: 'Auditorium Room 2',
        building: 'SAC Building',
        latitude: 16.4985,
        longitude: 80.4988,
        description: 'Auditions open for the flagship Campus Music band. Prepare a 2-minute acoustic segment.',
        isLive: false,
        date: tomorrowStr,
        startTime: '14:00',
        endTime: '17:00',
        color: 'purple',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 4, 12),
        featured: false,
        createdAt: new Date(Date.now() - 14400000)
      },
      {
        name: 'Cultural Dance Rehearsals',
        category: 'Cultural',
        room: 'Open Air Theatre',
        building: 'SAC Building',
        latitude: 16.4985,
        longitude: 80.4988,
        description: 'Preparation rehearsals for the upcoming annual university cultural fest. All dance crew members must attend.',
        isLive: false,
        date: tomorrowStr,
        startTime: '17:00',
        endTime: '19:30',
        color: 'pink',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 12, 30),
        featured: false,
        createdAt: new Date(Date.now() - 16200000)
      },
      {
        name: 'Product Design Showcase',
        category: 'Workshops',
        room: 'Seminar Hall 1',
        building: 'SRK Block',
        latitude: 16.4965,
        longitude: 80.5008,
        description: 'Interactive exhibition showcasing student UI/UX designs, physical prototypes, and design-thinking projects.',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '11:00',
        endTime: '14:00',
        color: 'blue',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        creatorRole: 'supreme_admin',
        participants: getRandomParticipants('CL-PFWV-TFYY', 5, 18),
        featured: false,
        createdAt: new Date(Date.now() - 20000000)
      },
      {
        name: 'Web Development Bootcamp',
        category: 'Tech',
        room: 'Lab 1, Block A',
        building: 'SRK Block',
        latitude: 16.4962,
        longitude: 80.5005,
        description: 'Learn modern React hooks, state patterns, and production-ready architectures.',
        isLive: false,
        date: todayStr,
        startTime: '09:00',
        endTime: '12:00',
        color: 'indigo',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 10, 22),
        featured: false,
        createdAt: new Date(Date.now() - 22000000)
      },
      {
        name: 'Vedic Math Workshop',
        category: 'Workshops',
        room: 'Seminar Hall 2',
        building: 'Block B',
        latitude: 16.4975,
        longitude: 80.4998,
        description: 'Speed math shortcuts and tricks for competitive exams and everyday computations.',
        isLive: false,
        date: todayStr,
        startTime: '14:30',
        endTime: '16:00',
        color: 'blue',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        participants: getRandomParticipants('CL-PFWV-TFYY', 3, 10),
        featured: false,
        createdAt: new Date(Date.now() - 24000000)
      },
      {
        name: 'FIFA Gaming Finals',
        category: 'Gaming',
        room: 'Recreation Room',
        building: 'Hostel MH-2',
        latitude: 16.4945,
        longitude: 80.4985,
        description: 'Final match session between the top hostel gamers. Free pop-corn for supporters!',
        isLive: true,
        date: todayStr,
        startTime: '19:30',
        endTime: '21:30',
        color: 'amber',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 8, 20),
        featured: false,
        createdAt: new Date(Date.now() - 1000000)
      },
      {
        name: 'Acoustic Band Auditions',
        category: 'Music',
        room: 'Music Lounge',
        building: 'SAC Building',
        latitude: 16.4985,
        longitude: 80.4988,
        description: 'Auditions for drummers, guitarists, and backing vocalists to join the official university acoustic squad.',
        isLive: true,
        date: todayStr,
        startTime: '15:00',
        endTime: '18:00',
        color: 'purple',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 4, 15),
        featured: false,
        createdAt: new Date(Date.now() - 5000000)
      },
      {
        name: 'Robotics Club Expo',
        category: 'Tech',
        room: 'CAD Design Lab',
        building: 'SRK Block',
        latitude: 16.4965,
        longitude: 80.5008,
        description: 'Exhibition of autonomous line-followers, quadcopters, and micro-controller rigs built by first-year clubs.',
        isLive: false,
        date: tomorrowStr,
        startTime: '10:00',
        endTime: '13:00',
        color: 'indigo',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 5, 14),
        featured: false,
        createdAt: new Date(Date.now() - 30000000)
      },
      {
        name: 'Chess Championship',
        category: 'Sports',
        room: 'Common Room',
        building: 'Hostel LH-1',
        latitude: 16.4982,
        longitude: 80.4985,
        description: 'Annual inter-hostel Swiss Chess Cup. Time control is 10 min + 5 sec increment.',
        isLive: false,
        date: tomorrowStr,
        startTime: '15:00',
        endTime: '18:30',
        color: 'emerald',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 6, 12),
        featured: false,
        createdAt: new Date(Date.now() - 32000000)
      },
      {
        name: 'Food Photography Class',
        category: 'Food',
        room: 'Central Gazebo',
        building: 'Central Lawn',
        latitude: 16.4960,
        longitude: 80.4990,
        description: 'Learn flat-lays, dynamic lighting, and Lightroom styling tricks using just your mobile camera.',
        isLive: false,
        date: tomorrowStr,
        startTime: '11:00',
        endTime: '12:30',
        color: 'pink',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        participants: getRandomParticipants('CL-PFWV-TFYY', 3, 10),
        featured: false,
        createdAt: new Date(Date.now() - 34000000)
      },
      {
        name: 'Guitar Basics for Beginners',
        category: 'Music',
        room: 'SAC Room 204',
        building: 'SAC Building',
        latitude: 16.4985,
        longitude: 80.4988,
        description: 'Introduction to standard tuning, basic open chords, and strumming patterns.',
        isLive: false,
        date: tomorrowStr,
        startTime: '16:00',
        endTime: '17:30',
        color: 'purple',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 4, 12),
        featured: false,
        createdAt: new Date(Date.now() - 36000000)
      },
      {
        name: 'Valorant Esports Cup',
        category: 'Gaming',
        room: 'Hostel LAN Zone',
        building: 'Hostel MH-1',
        latitude: 16.4940,
        longitude: 80.4980,
        description: 'Single-elimination 5v5 custom lobby tournament. Register your teams before midnight.',
        isLive: false,
        date: tomorrowStr,
        startTime: '18:00',
        endTime: '22:00',
        color: 'amber',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 10, 20),
        featured: false,
        createdAt: new Date(Date.now() - 38000000)
      },
      {
        name: 'Graphic Design Intro',
        category: 'Workshops',
        room: 'Lab 4, APJ Block',
        building: 'Block B',
        latitude: 16.4975,
        longitude: 80.4998,
        description: 'Typography, grid layouts, and visual hierarchy principles for student designers.',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '10:00',
        endTime: '12:00',
        color: 'blue',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        participants: getRandomParticipants('CL-PFWV-TFYY', 4, 15),
        featured: false,
        createdAt: new Date(Date.now() - 40000000)
      },
      {
        name: 'Table Tennis Tournament',
        category: 'Sports',
        room: 'Indoor Sports Arena',
        building: 'Sports Complex',
        latitude: 16.4952,
        longitude: 80.5015,
        description: 'Singles and doubles matches. Bring your own paddles if possible. Balls will be provided.',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '14:30',
        endTime: '17:30',
        color: 'emerald',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 6, 12),
        featured: false,
        createdAt: new Date(Date.now() - 42000000)
      },
      {
        name: 'UI/UX Figma Bootcamp',
        category: 'Tech',
        room: 'Design Studio 1',
        building: 'SRK Block',
        latitude: 16.4965,
        longitude: 80.5008,
        description: 'Advanced components, auto-layouts, variables, and high-fidelity prototype flows in Figma.',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '15:00',
        endTime: '18:00',
        color: 'indigo',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 8, 24),
        featured: false,
        createdAt: new Date(Date.now() - 44000000)
      },
      {
        name: 'Spicy Ramen Challenge',
        category: 'Food',
        room: 'Food Court Ground Area',
        building: 'Food Court',
        latitude: 16.4958,
        longitude: 80.4985,
        description: 'Finish a bowl of double-spicy Korean fire noodles in under 3 minutes. Cash prize for the winner!',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '16:00',
        endTime: '18:00',
        color: 'pink',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        participants: getRandomParticipants('CL-BBBB-2222', 6, 15),
        featured: false,
        createdAt: new Date(Date.now() - 46000000)
      },
      {
        name: 'Standup Comedy Show',
        category: 'Cultural',
        room: 'Central amphitheatre',
        building: 'Open Air Theatre',
        latitude: 16.4985,
        longitude: 80.4988,
        description: 'An evening of laughs hosted by the university comedy group featuring local standup comics.',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '18:30',
        endTime: '20:30',
        color: 'pink',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        participants: getRandomParticipants('CL-AAAA-1111', 10, 30),
        featured: false,
        createdAt: new Date(Date.now() - 48000000)
      },
      {
        name: 'Photography Walk',
        category: 'Workshops',
        room: 'Assembly Lawn',
        building: 'Central Lawn',
        latitude: 16.4960,
        longitude: 80.4990,
        description: 'Explore landscape composition and campus architecture lighting angles. Bring DSLRs or phones.',
        isLive: false,
        date: dayAfterTomorrowStr,
        startTime: '08:00',
        endTime: '10:00',
        color: 'blue',
        createdBy: 'CL-PFWV-TFYY',
        creatorName: 'Souryajeet Singh',
        participants: getRandomParticipants('CL-PFWV-TFYY', 3, 10),
        featured: false,
        createdAt: new Date(Date.now() - 50000000)
      }
    ];

    const categoryMap = {
      'Tech': 'Technical',
      'Sports': 'Sports',
      'Music': 'Entertainment',
      'Food': 'Social',
      'Cultural': 'Cultural',
      'Workshops': 'Workshop',
      'Gaming': 'Entertainment'
    };

    const defaultCovers = {
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

    const clubNames = [
      'Coding Club',
      'Photography Club',
      'Robotics Club',
      'Music Society',
      'Sports Club',
      'Cultural Club',
      'Gaming Alliance'
    ];

    for (const act of activities) {
      const newCategory = categoryMap[act.category] || 'Other';
      
      // Determine Event Type
      let eventType = 'student';
      let organizerName = act.creatorName;
      let clubId = null;
      
      const lowerName = act.name.toLowerCase();
      if (lowerName.includes('seminar') || lowerName.includes('orientation') || lowerName.includes('expo') || lowerName.includes('showcase') || act.createdBy === 'CL-PFWV-TFYY') {
        eventType = 'university';
        organizerName = 'VIT-AP Administration';
      } else if (lowerName.includes('club') || lowerName.includes('tournament') || lowerName.includes('hackathon') || lowerName.includes('bootcamp') || act.createdBy === 'CL-AAAA-1111') {
        eventType = 'club';
        organizerName = clubNames[Math.floor(Math.random() * clubNames.length)];
        clubId = 'club_' + organizerName.toLowerCase().replace(/ /g, '_');
      }
      
      // Setup organizer logo
      let organizerLogo = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(act.createdBy)}`;
      if (eventType === 'university') {
        organizerLogo = 'https://api.dicebear.com/7.x/initials/svg?seed=VITAP';
      } else if (eventType === 'club') {
        organizerLogo = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(organizerName)}`;
      }
      
      // Select cover image
      const coverImage = defaultCovers[newCategory] || defaultCovers.Other;
      
      const enrichedEvent = {
        ...act,
        title: act.name,
        category: newCategory,
        eventType,
        clubId,
        organizerName,
        organizerLogo,
        coverImage,
        location: `${act.room}, ${act.building}`,
        interestedCount: act.participants.length,
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'activities'), enrichedEvent);
    }
    console.log(`Successfully seeded ${activities.length} activities.`);

    const getClubMembers = (adminIds) => {
      const list = new Set(adminIds);
      const targetSize = Math.min(seededUserIds.length, Math.floor(Math.random() * 50) + 30); // 30-80 members
      while (list.size < targetSize) {
        const randomId = seededUserIds[Math.floor(Math.random() * seededUserIds.length)];
        list.add(randomId);
      }
      return Array.from(list);
    };

    const clubs = [
      {
        clubId: 'club_coding_club',
        name: 'Coding Club',
        category: 'Technical',
        description: 'The premier software development and competitive programming hub on campus. We build apps, host hackathons, and learn together.',
        coverImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=CodingClub',
        members: getClubMembers(['CL-AAAA-1111', 'CL-BBBB-2222', 'CL-PFWV-TFYY']),
        joinRequests: [],
        adminIds: ['CL-AAAA-1111'],
        presidentId: 'CL-AAAA-1111',
        presidentName: 'Aarav Sharma',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
        secretaryId: 'CL-BBBB-2222',
        secretaryName: 'Rohan Mehta',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        instagram: '@CodingClub_VITAP',
        discord: 'coding-club-server',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: 'club_photography_club',
        name: 'Photography Club',
        category: 'Cultural',
        description: "Capturing life's moments. We organize photo walks, capture events, host workshops on editing, and run annual exhibitions.",
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PhotographyClub',
        members: getClubMembers(['CL-BBBB-2222']),
        joinRequests: [],
        adminIds: ['CL-BBBB-2222'],
        presidentId: 'CL-BBBB-2222',
        presidentName: 'Rohan Mehta',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        secretaryId: 'CL-AAAA-1111',
        secretaryName: 'Aarav Sharma',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
        instagram: '@Photography_VITAP',
        discord: 'photo-club-server',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: 'club_robotics_club',
        name: 'Robotics Club',
        category: 'Technical',
        description: 'Design, build, and program autonomous robots. From microcontrollers to quadcopters, we explore hardware and software integrations.',
        coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RoboticsClub',
        members: getClubMembers(['CL-AAAA-1111']),
        joinRequests: [],
        adminIds: ['CL-AAAA-1111'],
        presidentId: 'CL-AAAA-1111',
        presidentName: 'Aarav Sharma',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
        secretaryId: 'CL-BBBB-2222',
        secretaryName: 'Rohan Mehta',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        instagram: '@Robotics_VITAP',
        discord: 'robotics-server',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: 'club_music_society',
        name: 'Music Society',
        category: 'Entertainment',
        description: 'For the love of melodies. We host open mics, acoustic sessions, vocal coaching workshops, and perform at campus cultural fests.',
        coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=MusicSociety',
        members: getClubMembers(['CL-BBBB-2222']),
        joinRequests: [],
        adminIds: ['CL-BBBB-2222'],
        presidentId: 'CL-BBBB-2222',
        presidentName: 'Rohan Mehta',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        secretaryId: 'CL-AAAA-1111',
        secretaryName: 'Aarav Sharma',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
        instagram: '@MusicSociety_VITAP',
        discord: 'music-society-server',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: 'club_sports_club',
        name: 'Sports Club',
        category: 'Sports',
        description: 'Promoting physical fitness, sportsmanship, and teamwork. We coordinate inter-hostel tournaments and practice drill sessions.',
        coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SportsClub',
        members: getClubMembers(['CL-AAAA-1111', 'CL-BBBB-2222']),
        joinRequests: [],
        adminIds: ['CL-AAAA-1111'],
        presidentId: 'CL-AAAA-1111',
        presidentName: 'Aarav Sharma',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
        secretaryId: 'CL-BBBB-2222',
        secretaryName: 'Rohan Mehta',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        instagram: '@SportsClub_VITAP',
        discord: 'sports-club-server',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: 'club_cultural_club',
        name: 'Cultural Club',
        category: 'Cultural',
        description: 'Celebrating heritage and fine arts. We host dramas, traditional fests, dance workshops, and design campus decorations.',
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=CulturalClub',
        members: getClubMembers(['CL-PFWV-TFYY']),
        joinRequests: [],
        adminIds: ['CL-PFWV-TFYY'],
        presidentId: 'CL-PFWV-TFYY',
        presidentName: 'Souryajeet Singh',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Souryajeet',
        secretaryId: 'CL-BBBB-2222',
        secretaryName: 'Rohan Mehta',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        instagram: '@CulturalClub_VITAP',
        discord: 'cultural-club-server',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        clubId: 'club_gaming_alliance',
        name: 'Gaming Alliance',
        category: 'Entertainment',
        description: 'Connecting gamers across campus. We host LAN tournaments, competitive esports lobbies, and casual board game nights.',
        coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingAlliance',
        members: getClubMembers(['CL-BBBB-2222']),
        joinRequests: [],
        adminIds: ['CL-BBBB-2222'],
        presidentId: 'CL-BBBB-2222',
        presidentName: 'Rohan Mehta',
        presidentAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
        secretaryId: 'CL-AAAA-1111',
        secretaryName: 'Aarav Sharma',
        secretaryAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav',
        instagram: '@GamingAlliance_VITAP',
        discord: 'gaming-alliance-server',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const club of clubs) {
      await setDoc(doc(db, 'clubs', club.clubId), club);
    }
    console.log(`Successfully seeded ${clubs.length} official clubs.`);

    // 4.6. Seed Announcements
    console.log('Seeding club announcements...');
    const announcements = [
      {
        clubId: 'club_coding_club',
        title: 'AI Hackathon 2026 Registration Live!',
        content: 'Registration is now officially open for the flagship AI Agents Hackathon! Sign up your teams of 2-4 in the tech lab before Friday. Free pizzas and energy drinks will be provided.',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
      },
      {
        clubId: 'club_coding_club',
        title: 'Vite & React Bootcamp Materials',
        content: 'Thanks to everyone who joined the Web Development bootcamp. You can find the slides and source code repository linked in the resources tab of our club page.',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        createdAt: new Date(Date.now() - 3600000 * 24) // 1 day ago
      },
      {
        clubId: 'club_sports_club',
        title: 'Inter-Department Football Trials',
        content: 'Selections for the core university football squad begin tomorrow at 5 PM at Turf A. Please bring your personal kit, studs, and shin guards.',
        createdBy: 'CL-AAAA-1111',
        creatorName: 'Aarav Sharma',
        createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
      },
      {
        clubId: 'club_music_society',
        title: 'Acoustic Jam Night Auditions',
        content: 'Auditions for contemporary pop guitarists and vocalists to perform at the Open Air Theatre showcase will take place in SAC Room 102 from 3 to 6 PM on Thursday.',
        createdBy: 'CL-BBBB-2222',
        creatorName: 'Rohan Mehta',
        createdAt: new Date(Date.now() - 3600000 * 12) // 12 hours ago
      }
    ];

    for (const ann of announcements) {
      await addDoc(collection(db, 'club_announcements'), ann);
    }
    console.log(`Successfully seeded ${announcements.length} announcements.`);

    // 5. Seed Lost & Found (Total 15 items)
    console.log('Seeding 15 lost & found reports...');
    const nowTimestamp = Date.now();
    const expireTime = nowTimestamp + 48 * 60 * 60 * 1000;

    const lostItems = [
      {
        type: 'lost',
        title: 'Lost AirPods Pro Case',
        description: 'Charging case lost near the Central Library study desks yesterday evening. It has a blue silicon cover.',
        latitude: 16.4971,
        longitude: 80.4995,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp),
        expiresAt: Timestamp.fromMillis(expireTime),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Red Flask Water Bottle',
        description: 'Left on the benches outside SAC Music wing. Kept with the security desk in SAC room 103.',
        latitude: 16.4985,
        longitude: 80.4988,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 1800000),
        expiresAt: Timestamp.fromMillis(expireTime - 1800000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Casio Lab Calculator',
        description: 'Model fx-991EX with name sticker on back. Resolving: found by library staff!',
        latitude: 16.4965,
        longitude: 80.5008,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 3600000),
        expiresAt: Timestamp.fromMillis(expireTime - 3600000),
        resolved: true
      },
      {
        type: 'lost',
        title: 'Lost Black Leather Wallet',
        description: 'Contains a student ID card and Metro travel pass. Might have slipped out at the SRK Block canteen benches.',
        latitude: 16.4965,
        longitude: 80.5008,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 7200000),
        expiresAt: Timestamp.fromMillis(expireTime - 7200000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Keys with Red Lanyard',
        description: 'A ring of 3 keys with a red Honda lanyard found on the lawns outside the food court entrance.',
        latitude: 16.4960,
        longitude: 80.4990,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 10800000),
        expiresAt: Timestamp.fromMillis(expireTime - 10800000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Blue Water Bottle',
        description: 'Decathlon steel flask, cobalt blue color, has some sports stickers. Lost in the indoor badminton court area.',
        latitude: 16.4952,
        longitude: 80.5015,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 14400000),
        expiresAt: Timestamp.fromMillis(expireTime - 14400000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Watch (Titan Edge)',
        description: 'Gold strap analog watch found on the washbasin counter inside Block B ground floor restroom.',
        latitude: 16.4975,
        longitude: 80.4998,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 18000000),
        expiresAt: Timestamp.fromMillis(expireTime - 18000000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Umbrella',
        description: 'Black folding umbrella with a wooden handle. Left behind in Room 204, Block B during afternoon lecture.',
        latitude: 16.4975,
        longitude: 80.4998,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 21600000),
        expiresAt: Timestamp.fromMillis(expireTime - 21600000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found USB Drive 64GB',
        description: 'Sandisk metallic USB drive found plugged into computer 14 in Central Library lab.',
        latitude: 16.4971,
        longitude: 80.4995,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 25200000),
        expiresAt: Timestamp.fromMillis(expireTime - 25200000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Lab Coat',
        description: 'White laboratory coat with initials AS written on the inner collar label. Left in Chemistry Lab A.',
        latitude: 16.4962,
        longitude: 80.5005,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 28800000),
        expiresAt: Timestamp.fromMillis(expireTime - 28800000),
        resolved: true
      },
      {
        type: 'found',
        title: 'Found Specs with Black Frame',
        description: 'Prescription spectacles with a matte black rectangular frame, found in the Food Court seating rows.',
        latitude: 16.4958,
        longitude: 80.4985,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 32400000),
        expiresAt: Timestamp.fromMillis(expireTime - 32400000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Black Backpack',
        description: 'Puma bag containing a notebook and headphones. Slipped off shoulder near the SAC Open Air Theatre.',
        latitude: 16.4985,
        longitude: 80.4988,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 36000000),
        expiresAt: Timestamp.fromMillis(expireTime - 36000000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found ID Card holder',
        description: 'Blue card holder with a lanyard, found in Hostel MH-2 corridor. Reclaiming: returned to warden.',
        latitude: 16.4945,
        longitude: 80.4985,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 39600000),
        expiresAt: Timestamp.fromMillis(expireTime - 39600000),
        resolved: true
      },
      {
        type: 'lost',
        title: 'Lost Bike Key',
        description: 'Suzuki scooter key with a circular silver keychain. Slipped out near the two-wheeler parking lot.',
        latitude: 16.4940,
        longitude: 80.4980,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 43200000),
        expiresAt: Timestamp.fromMillis(expireTime - 43200000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Blue Cap',
        description: 'Nike blue baseball cap found near the seating benches surrounding the main sports turf field.',
        latitude: 16.4952,
        longitude: 80.5015,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 46800000),
        expiresAt: Timestamp.fromMillis(expireTime - 46800000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Blue Adidas Jacket',
        description: 'Left my blue Adidas windbreaker jacket on the spectator stand at Turf Court A yesterday evening.',
        latitude: 16.4952,
        longitude: 80.5015,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 50000000),
        expiresAt: Timestamp.fromMillis(expireTime - 50000000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Silver Ring',
        description: 'Found a thin silver band ring near the staircase landing of the SRK Block 2nd floor.',
        latitude: 16.4965,
        longitude: 80.5008,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 54000000),
        expiresAt: Timestamp.fromMillis(expireTime - 54000000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost HP Pen Stylus',
        description: 'Lost my black HP active stylus pen during the product design showcase in Seminar Hall 1, SRK Block.',
        latitude: 16.4965,
        longitude: 80.5008,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 58000000),
        expiresAt: Timestamp.fromMillis(expireTime - 58000000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Student ID Card',
        description: 'Found an ID card belonging to a CSE student near the Food Court plaza entrance. Handed over to the security desk.',
        latitude: 16.4960,
        longitude: 80.4990,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 62000000),
        expiresAt: Timestamp.fromMillis(expireTime - 62000000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Black Glasses Case',
        description: 'Left a matte black hard case for spectacles in the Central Library quiet study area, floor 1.',
        latitude: 16.4971,
        longitude: 80.4995,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 66000000),
        expiresAt: Timestamp.fromMillis(expireTime - 66000000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Boat Earbud (Left)',
        description: 'Found a single grey/black Boat Airdopes earbud (left ear) on the stage floor of the SAC Open Air Theatre.',
        latitude: 16.4985,
        longitude: 80.4988,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 70000000),
        expiresAt: Timestamp.fromMillis(expireTime - 70000000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost Physics Textbook',
        description: 'Lost a copy of University Physics by Sears and Zemansky. Probably left it in Block B Room 302.',
        latitude: 16.4975,
        longitude: 80.4998,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 74000000),
        expiresAt: Timestamp.fromMillis(expireTime - 74000000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Pink Pencil Pouch',
        description: 'Found a pink zippered pencil pouch containing pens and a ruler in the Block A ground floor lounge.',
        latitude: 16.4962,
        longitude: 80.5005,
        createdBy: 'CL-AAAA-1111',
        createdAt: Timestamp.fromMillis(nowTimestamp - 78000000),
        expiresAt: Timestamp.fromMillis(expireTime - 78000000),
        resolved: false
      },
      {
        type: 'lost',
        title: 'Lost SanDisk Cruzer 32GB',
        description: 'Red and black SanDisk 32GB USB flash drive lost near the CAD Lab in SRK Block. Has my project files on it.',
        latitude: 16.4965,
        longitude: 80.5008,
        createdBy: 'CL-PFWV-TFYY',
        createdAt: Timestamp.fromMillis(nowTimestamp - 82000000),
        expiresAt: Timestamp.fromMillis(expireTime - 82000000),
        resolved: false
      },
      {
        type: 'found',
        title: 'Found Black Leather Jacket',
        description: 'Found a black faux leather jacket draped over a chair at the Central Lawn Gazebo. Left with the lawn supervisor.',
        latitude: 16.4960,
        longitude: 80.4990,
        createdBy: 'CL-BBBB-2222',
        createdAt: Timestamp.fromMillis(nowTimestamp - 86000000),
        expiresAt: Timestamp.fromMillis(expireTime - 86000000),
        resolved: false
      }
    ];

    for (const item of lostItems) {
      await addDoc(collection(db, 'lost_found_pins'), item);
    }
    console.log(`Successfully seeded ${lostItems.length} lost & found reports.`);
    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed with error:', err);
    process.exit(1);
  }
}

seed();
