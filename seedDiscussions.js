/**
 * Seed script: adds dummy discussion messages to existing Lost & Found pins.
 * Run with:  node seedDiscussions.js
 */
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';

// ── Parse .env ──
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

console.log('🔗 Connecting to Firebase project:', firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Dummy users who will "post" messages ──
const dummyUsers = [
  { id: 'VITAP-K9X3M7', name: 'Aarav Sharma' },
  { id: 'VITAP-P4R8N2', name: 'Priya Reddy' },
  { id: 'VITAP-T6W2J5', name: 'Rohan Mehta' },
  { id: 'VITAP-L3Q7Y8', name: 'Ananya Gupta' },
  { id: 'VITAP-H8V4D6', name: 'Karthik Nair' },
  { id: 'VITAP-M5F9B1', name: 'Sneha Patel' },
  { id: 'VITAP-S2D9E4', name: 'Vikram Singh' },
  { id: 'VITAP-B7C3A8', name: 'Neha Verma' },
];

// ── Discussion templates keyed by pin type ──
const lostDiscussions = [
  [
    { user: 0, text: "Hey, I think I saw something like this near the library entrance about an hour ago!" },
    { user: 3, text: "Was it a dark-colored one? I noticed something on the bench outside AB-1." },
    { user: 0, text: "Yeah, dark color. You should check with the security desk at the main gate, they collect found items." },
    { user: 5, text: "I lost something similar last semester. Try checking the campus lost & found box near the admin block too." },
  ],
  [
    { user: 1, text: "I was in that area earlier today. Didn't notice anything but I'll keep an eye out." },
    { user: 4, text: "Have you checked with the cleaning staff? They usually hand things over to the hostel warden." },
    { user: 2, text: "Posting this in our WhatsApp group as well. Hope you find it soon! 🤞" },
  ],
  [
    { user: 2, text: "Oh no! I'll check if it's still there when I go for my next class." },
    { user: 5, text: "Someone in my section found something matching this description. DM me your campus ID and I'll connect you." },
    { user: 3, text: "This is why we need more security cameras on campus 😅" },
    { user: 1, text: "Agreed. But glad we have this app now at least!" },
    { user: 4, text: "Any update? Did you find it?" },
  ],
  [
    { user: 6, text: "I think I saw a lost item matching this description near the basketball court spectator stands yesterday afternoon." },
    { user: 7, text: "Oh wait, I think someone picked it up and kept it in the sports room. You should ask coach Prasad." },
    { user: 1, text: "Yes, they usually lock up found sports items there by 7 PM." },
    { user: 6, text: "Hope you get it back!" },
  ],
  [
    { user: 4, text: "Oh, this is matching the description of what the security guard was holding at the MH-2 entry desk!" },
    { user: 2, text: "Wait, really? Let me run and check there right away. Thanks a lot!" },
    { user: 4, text: "No problem. Let us know if you find it." },
    { user: 7, text: "Yeah, update here so others know it's resolved. Good luck!" },
  ],
];

const foundDiscussions = [
  [
    { user: 3, text: "This might be mine! Where exactly did you find it?" },
    { user: 1, text: "I found it on the second floor corridor of SJT. It's with me right now." },
    { user: 3, text: "That's exactly where I lost it! Can we meet near the canteen in 30 mins?" },
    { user: 1, text: "Sure, I'll be at the food court. Look for someone in a blue hoodie 👋" },
    { user: 5, text: "Love seeing the community help each other out! ❤️" },
  ],
  [
    { user: 0, text: "Thanks for posting this! Not mine but I'll share with my friends." },
    { user: 4, text: "You could also drop it at the security office if no one claims it in a day." },
    { user: 2, text: "Great initiative posting here. Hope the owner finds this quickly." },
  ],
  [
    { user: 5, text: "I think this belongs to someone from CSE B section. Let me ask around." },
    { user: 0, text: "Any identifying marks? That could help narrow it down." },
    { user: 4, text: "I've seen a similar one with Ravi from 3rd year. Should I check with him?" },
    { user: 5, text: "Yes please! That would be really helpful." },
  ],
  [
    { user: 7, text: "I lost mine last week but it had a different sticker. Hope the owner gets this one back soon!" },
    { user: 6, text: "Hey, this one actually has 'Rahul' written on the back cover with a black marker. Anyone know a Rahul from ECE?" },
    { user: 3, text: "Ah, Rahul Sen from ECE section A lost his item yesterday! Let me share this post with him." },
    { user: 6, text: "Awesome, thanks! Tell him to DM me or comment here." },
  ],
  [
    { user: 2, text: "Nice, where did you hand this over? I can go collect it if it's mine." },
    { user: 5, text: "I submitted it to the SRK Block main reception desk. The receptionist noted down my details too." },
    { user: 2, text: "Perfect, heading there now. Appreciate you posting this here!" },
    { user: 5, text: "You're welcome! Glad to help." },
  ],
];

// ── Helper: create a Timestamp offset by minutes from now ──
const minutesAgo = (mins) => {
  const d = new Date(Date.now() - mins * 60 * 1000);
  return Timestamp.fromDate(d);
};

// ── Main seed function ──
const seedDiscussions = async () => {
  const pinsSnap = await getDocs(collection(db, 'lost_found_pins'));

  if (pinsSnap.empty) {
    console.log('⚠️  No pins found in lost_found_pins. Create some pins first.');
    process.exit(0);
  }

  console.log(`📌 Found ${pinsSnap.size} pins. Seeding discussions...\n`);

  let pinIndex = 0;

  for (const pinDoc of pinsSnap.docs) {
    const pinData = pinDoc.data();
    const pinId = pinDoc.id;
    const isLost = pinData.type === 'lost';

    // Pick a conversation template (cycle through them)
    const templates = isLost ? lostDiscussions : foundDiscussions;
    const conversation = templates[pinIndex % templates.length];

        // Check if messages already exist, and delete them if we want to overwrite/re-seed
    const existingMsgs = await getDocs(collection(db, 'lost_found_pins', pinId, 'messages'));
    if (!existingMsgs.empty) {
      console.log(`  🗑️  [${pinId}] "${pinData.title}" — clearing ${existingMsgs.size} existing messages...`);
      for (const msgDoc of existingMsgs.docs) {
        await deleteDoc(doc(db, 'lost_found_pins', pinId, 'messages', msgDoc.id));
      }
    }

    console.log(`  💬 [${pinId}] "${pinData.title}" (${pinData.type}) — adding ${conversation.length} messages`);

    // Add messages with staggered timestamps (oldest first)
    const baseOffset = 120 - (pinIndex * 15); // different starting offset per pin
    for (let i = 0; i < conversation.length; i++) {
      const msg = conversation[i];
      const user = dummyUsers[msg.user];
      const offsetMins = Math.max(5, baseOffset - (i * 12)); // each message ~12 mins apart

      await addDoc(collection(db, 'lost_found_pins', pinId, 'messages'), {
        senderId: user.id,
        senderName: user.name,
        text: msg.text,
        createdAt: minutesAgo(offsetMins)
      });
    }

    pinIndex++;
  }

  console.log(`\n✅ Done! Seeded discussions for ${pinIndex} pins.`);
  process.exit(0);
};

seedDiscussions().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
