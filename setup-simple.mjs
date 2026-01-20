import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyBeFPtmyMT_Rl2vLJz0M23_V87H_YaX0",
  authDomain: "smart-parking-ca9cb.firebaseapp.com",
  projectId: "smart-parking-ca9cb",
  storageBucket: "smart-parking-ca9cb.firebasestorage.app",
  messagingSenderId: "277580185830",
  appId: "1:277580185830:web:586523a993fd54db39fb27"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupDatabase() {
  try {
    console.log('Setting up Smart Parking database...');

    // Create sample zones
    const zones = [
      {
        name: 'Zone A',
        description: 'Premium covered parking area near main entrance',
        coordinates: { latitude: 36.8065, longitude: 10.1815 },
        totalSpots: 20,
        availableSpots: 15,
        priceMultiplier: 1.5,
        features: ['covered', 'security_camera', 'lighting'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Zone B',
        description: 'Standard outdoor parking area',
        coordinates: { latitude: 36.8070, longitude: 10.1820 },
        totalSpots: 30,
        availableSpots: 25,
        priceMultiplier: 1.0,
        features: ['outdoor', 'security_camera'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Zone C',
        description: 'Economy parking area with electric charging',
        coordinates: { latitude: 36.8075, longitude: 10.1825 },
        totalSpots: 25,
        availableSpots: 20,
        priceMultiplier: 1.2,
        features: ['electric_charging', 'outdoor'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const zone of zones) {
      const zoneRef = await addDoc(collection(db, 'zones'), zone);
      console.log(`Zone ${zone.name} created with ID:`, zoneRef.id);
    }

    // Create sample parking spots
    const spots = [
      // Zone A spots (covered, premium)
      ...Array.from({ length: 20 }, (_, i) => ({
        number: `A-${String(i + 1).padStart(2, '0')}`,
        zone: 'Zone A',
        type: 'covered',
        size: i < 5 ? 'large' : i < 15 ? 'standard' : 'compact',
        accessible: i < 2,
        coordinates: { x: 50 + (i % 5) * 80, y: 50 + Math.floor(i / 5) * 60 },
        status: i < 15 ? 'available' : 'occupied',
        pricePerHour: 3.0,
        features: ['covered', 'security_camera', 'lighting'],
        qrCode: `spot-A-${String(i + 1).padStart(2, '0')}-${Date.now()}`
      })),
      
      // Zone B spots (outdoor, standard)
      ...Array.from({ length: 30 }, (_, i) => ({
        number: `B-${String(i + 1).padStart(2, '0')}`,
        zone: 'Zone B',
        type: 'outdoor',
        size: i < 10 ? 'standard' : i < 25 ? 'compact' : 'large',
        accessible: i < 3,
        coordinates: { x: 50 + (i % 6) * 70, y: 200 + Math.floor(i / 6) * 50 },
        status: i < 25 ? 'available' : 'occupied',
        pricePerHour: 2.0,
        features: ['outdoor', 'security_camera'],
        qrCode: `spot-B-${String(i + 1).padStart(2, '0')}-${Date.now()}`
      })),
      
      // Zone C spots (outdoor with charging)
      ...Array.from({ length: 25 }, (_, i) => ({
        number: `C-${String(i + 1).padStart(2, '0')}`,
        zone: 'Zone C',
        type: 'outdoor',
        size: i < 8 ? 'standard' : i < 20 ? 'compact' : 'large',
        accessible: i < 2,
        coordinates: { x: 50 + (i % 5) * 75, y: 400 + Math.floor(i / 5) * 55 },
        status: i < 20 ? 'available' : i < 23 ? 'occupied' : 'maintenance',
        pricePerHour: 2.5,
        features: ['electric_charging', 'outdoor'],
        qrCode: `spot-C-${String(i + 1).padStart(2, '0')}-${Date.now()}`
      }))
    ];

    for (const spot of spots) {
      await addDoc(collection(db, 'parkingSpots'), spot);
    }

    console.log(`Created ${spots.length} parking spots`);

    console.log('\n=== SETUP COMPLETE ===');
    console.log('Database initialized with:');
    console.log('- 3 parking zones');
    console.log('- 75 parking spots');
    console.log('\nTo create admin user:');
    console.log('1. Register in the app with: admin@smartparking.com');
    console.log('2. Go to Firebase Console → Firestore');
    console.log('3. Find your user document and change role to "admin"');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    process.exit(0);
  }
}

setupDatabase();