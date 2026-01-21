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

async function createUser() {
  try {
    // Modifiez ces informations pour créer un nouvel utilisateur
    const email = 'user@example.com';
    const password = 'password123';
    const name = 'Nom Utilisateur';
    const phone = '+216 12 345 678';
    const role = 'user'; // 'user' ou 'admin'
    
    console.log('Création de l\'utilisateur...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('Utilisateur créé dans Auth:', userCredential.user.uid);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      phone,
      role,
      loyaltyPoints: 0,
      tier: 'bronze',
      createdAt: serverTimestamp(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    });
    
    console.log('Document utilisateur créé dans Firestore');
    console.log('\n=== UTILISATEUR CRÉÉ ===');
    console.log('Email:', email);
    console.log('Mot de passe:', password);
    console.log('Rôle:', role);
    
  } catch (error) {
    console.error('Erreur lors de la création:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Cet email est déjà utilisé.');
    }
  } finally {
    process.exit(0);
  }
}

createUser();
