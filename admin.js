import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@smartparking.com', 
      'admin123456'
    );
    
    console.log('Admin user created in Auth:', userCredential.user.uid);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: 'Admin User',
      email: 'admin@smartparking.com',
      phone: '+216 12 345 678',
      role: 'admin',
      loyaltyPoints: 0,
      tier: 'platinum',
      createdAt: serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    });
    
    console.log('Admin user document created in Firestore');
    console.log('\n=== ADMIN CREATED ===');
    console.log('Email: admin@smartparking.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('Error creating admin:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. Try logging in with:');
      console.log('Email: admin@smartparking.com');
      console.log('Password: admin123456');
    }
  } finally {
    process.exit(0);
  }
}

createAdmin();