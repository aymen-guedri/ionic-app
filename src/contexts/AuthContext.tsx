import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { IonApp } from '@ionic/react';
import { auth, db } from '../firebase/config';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const userData: Omit<User, 'id'> = {
      name,
      email,
      phone,
      role: 'user',
      loyaltyPoints: 0,
      tier: 'bronze',
      createdAt: new Date(),
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userData,
      createdAt: serverTimestamp()
    });
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthProvider: Auth state changed', firebaseUser?.uid || null);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log('AuthProvider: Setting user from Firestore');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || 'User',
              email: userData.email || firebaseUser.email || '',
              phone: userData.phone,
              role: userData.role || 'user',
              loyaltyPoints: userData.loyaltyPoints || 0,
              tier: userData.tier || 'bronze',
              createdAt: userData.createdAt?.toDate() || new Date(),
              preferences: userData.preferences || {
                theme: 'light',
                notifications: true,
                language: 'fr'
              }
            };
            console.log('AuthProvider: Setting user from Firestore', user);
            setCurrentUser(user);
          } else {
            const basicUserData: Omit<User, 'id'> = {
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user',
              loyaltyPoints: 0,
              tier: 'bronze',
              createdAt: new Date(),
              preferences: {
                theme: 'light',
                notifications: true,
                language: 'fr'
              }
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...basicUserData,
              createdAt: serverTimestamp()
            });
            
            setCurrentUser({
              id: firebaseUser.uid,
              ...basicUserData
            });
          }
        } catch (error) {
          console.error('AuthProvider: Error fetching user data:', error);
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'user',
            loyaltyPoints: 0,
            tier: 'bronze',
            createdAt: new Date(),
            preferences: {
              theme: 'light',
              notifications: true,
              language: 'fr'
            }
          });
        }
      } else {
        console.log('AuthProvider: No user, setting currentUser to null');
        setCurrentUser(null);
      }
      
      console.log('AuthProvider: Setting loading to false');
      setLoading(false);
    });

    // Timeout fallback to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.log('AuthProvider: Timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    login,
    register,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};