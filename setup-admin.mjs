import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Read service account key
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch (error) {
  console.error('Error: serviceAccountKey.json not found. Please download it from Firebase Console.');
  console.error('Go to Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'smart-parking-ca9cb'
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdminUser() {
  try {
    // Create admin user in Firebase Auth
    const userRecord = await auth.createUser({
      email: 'admin@smartparking.com',
      password: 'admin123456',
      displayName: 'Admin User'
    });

    console.log('Admin user created:', userRecord.uid);

    // Create admin user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name: 'Admin User',
      email: 'admin@smartparking.com',
      phone: '+216 12 345 678',
      role: 'admin',
      loyaltyPoints: 0,
      tier: 'platinum',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    });

    console.log('Admin user document created in Firestore');

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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Zone B',
        description: 'Standard outdoor parking area',
        coordinates: { latitude: 36.8070, longitude: 10.1820 },
        totalSpots: 30,
        availableSpots: 25,
        priceMultiplier: 1.0,
        features: ['outdoor', 'security_camera'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Zone C',
        description: 'Economy parking area with electric charging',
        coordinates: { latitude: 36.8075, longitude: 10.1825 },
        totalSpots: 25,
        availableSpots: 20,
        priceMultiplier: 1.2,
        features: ['electric_charging', 'outdoor'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const zone of zones) {
      const zoneRef = await db.collection('zones').add(zone);
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
      await db.collection('parkingSpots').add(spot);
    }

    console.log(`Created ${spots.length} parking spots`);

    // Create a sample regular user
    const regularUserRecord = await auth.createUser({
      email: 'user@example.com',
      password: 'user123456',
      displayName: 'John Doe'
    });

    await db.collection('users').doc(regularUserRecord.uid).set({
      name: 'John Doe',
      email: 'user@example.com',
      phone: '+216 98 765 432',
      role: 'user',
      loyaltyPoints: 150,
      tier: 'silver',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    });

    console.log('Sample regular user created:', regularUserRecord.uid);

    // Create sample reservations
    const sampleReservations = [
      {
        userId: regularUserRecord.uid,
        userName: 'John Doe',
        userPhone: '+216 98 765 432',
        spotId: 'A-01',
        spotNumber: 'A-01',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        duration: 2,
        totalCost: 6.0,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: regularUserRecord.uid,
        userName: 'John Doe',
        userPhone: '+216 98 765 432',
        spotId: 'B-05',
        spotNumber: 'B-05',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        endTime: new Date(Date.now() - 22 * 60 * 60 * 1000), // Yesterday + 2h
        duration: 2,
        totalCost: 4.0,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: userRecord.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (const reservation of sampleReservations) {
      await db.collection('reservations').add(reservation);
    }

    console.log('Sample reservations created');

    console.log('\n=== SETUP COMPLETE ===');
    console.log('Admin credentials:');
    console.log('Email: admin@smartparking.com');
    console.log('Password: admin123456');
    console.log('\nRegular user credentials:');
    console.log('Email: user@example.com');
    console.log('Password: user123456');
    console.log('\nDatabase initialized with:');
    console.log('- 3 parking zones');
    console.log('- 75 parking spots');
    console.log('- 2 sample users');
    console.log('- 2 sample reservations');

  } catch (error) {
    console.error('Error creating admin user and sample data:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();