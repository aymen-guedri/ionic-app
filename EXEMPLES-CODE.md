# 💻 EXEMPLES DE CODE COMMENTÉS

## 1. AUTHENTIFICATION (AuthContext.tsx)

### Création du Context
```typescript
// Définition du type de données que le contexte va partager
interface AuthContextType {
  currentUser: User | null;        // L'utilisateur connecté (ou null si déconnecté)
  firebaseUser: FirebaseUser | null; // L'objet Firebase Auth
  loading: boolean;                 // État de chargement
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Création du contexte (vide au départ)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte facilement
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Explication :**
- Le Context permet de partager l'état d'authentification dans toute l'app
- `useAuth()` est un hook personnalisé pour accéder facilement au contexte
- Si utilisé hors du Provider, une erreur est levée

---

### Fonction Login
```typescript
const login = async (email: string, password: string) => {
  // Appel à Firebase Auth pour connecter l'utilisateur
  await signInWithEmailAndPassword(auth, email, password);
  // Note: Pas besoin de gérer la suite ici car onAuthStateChanged
  // va automatiquement détecter le changement et récupérer les données
};
```

**Explication :**
- `signInWithEmailAndPassword` est une fonction Firebase
- Elle vérifie les identifiants côté serveur
- Si OK, Firebase crée une session
- `onAuthStateChanged` détecte automatiquement le changement

---

### Écoute des Changements d'État
```typescript
useEffect(() => {
  // Écoute les changements d'état d'authentification
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setFirebaseUser(firebaseUser);
    
    if (firebaseUser) {
      // Utilisateur connecté → Récupérer ses données depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user: User = {
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          // ... autres champs
        };
        setCurrentUser(user);
      }
    } else {
      // Utilisateur déconnecté
      setCurrentUser(null);
    }
    
    setLoading(false);
  });

  // Nettoyage : Arrêter d'écouter quand le composant est démonté
  return () => unsubscribe();
}, []);
```

**Explication :**
- `onAuthStateChanged` est un listener Firebase
- Il se déclenche à chaque changement (connexion, déconnexion)
- On récupère les données complètes depuis Firestore
- `unsubscribe()` nettoie le listener pour éviter les fuites mémoire

---

## 2. ROUTAGE (App.tsx)

### Protection des Routes
```typescript
const AppRoutes: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // Pendant le chargement, afficher un écran de chargement
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Si utilisateur connecté
  if (currentUser) {
    // Vérifier le rôle
    if (currentUser.role === 'admin') {
      // Routes pour admin
      return (
        <IonRouterOutlet>
          <Route path="/admin" component={AdminTabsLayout} />
          <Route exact path="/" render={() => <Redirect to="/admin" />} />
          <Route exact path="/auth" render={() => <Redirect to="/admin" />} />
        </IonRouterOutlet>
      );
    } else {
      // Routes pour utilisateur normal
      return (
        <IonRouterOutlet>
          <Route path="/tabs" component={TabsLayout} />
          <Route exact path="/" render={() => <Redirect to="/tabs" />} />
          <Route exact path="/auth" render={() => <Redirect to="/tabs" />} />
        </IonRouterOutlet>
      );
    }
  } else {
    // Utilisateur non connecté → Page d'authentification
    return (
      <IonRouterOutlet>
        <Route exact path="/auth" component={AuthPage} />
        <Route render={() => <Redirect to="/auth" />} />
      </IonRouterOutlet>
    );
  }
};
```

**Explication :**
- Vérification de l'état de chargement en premier
- Si connecté, vérification du rôle pour rediriger correctement
- Si non connecté, redirection vers /auth
- Toutes les routes sont protégées automatiquement

---

## 3. FIRESTORE - RÉCUPÉRATION DE DONNÉES

### Récupérer les Réservations en Temps Réel
```typescript
const [reservations, setReservations] = useState<Reservation[]>([]);

useEffect(() => {
  // Créer une requête Firestore
  const q = query(
    collection(db, 'reservations'),
    where('userId', '==', currentUser.id),  // Filtrer par utilisateur
    orderBy('createdAt', 'desc'),           // Trier par date (plus récent en premier)
    limit(20)                                // Limiter à 20 résultats
  );

  // Écouter les changements en temps réel
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convertir les Timestamps en Dates
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Reservation[];
    
    setReservations(data);
  });

  // Nettoyage
  return () => unsubscribe();
}, [currentUser.id]);
```

**Explication :**
- `query()` crée une requête avec filtres et tri
- `onSnapshot()` écoute les changements en temps réel
- Chaque fois qu'une réservation change, le composant se met à jour automatiquement
- `unsubscribe()` arrête l'écoute quand le composant est démonté

---

### Créer une Réservation
```typescript
const createReservation = async (spotId: string, startTime: Date, duration: number) => {
  try {
    // Récupérer les infos de la place
    const spotDoc = await getDoc(doc(db, 'parkingSpots', spotId));
    const spot = spotDoc.data() as ParkingSpot;
    
    // Récupérer les infos de la zone
    const zoneDoc = await getDoc(doc(db, 'zones', spot.zone));
    const zone = zoneDoc.data() as ParkingZone;
    
    // Calculer le coût total
    const totalCost = spot.pricePerHour * duration * zone.priceMultiplier;
    
    // Calculer l'heure de fin
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    // Créer la réservation dans Firestore
    const reservationData = {
      userId: currentUser.id,
      userName: currentUser.name,
      spotId: spotId,
      spotNumber: spot.number,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      duration: duration,
      totalCost: totalCost,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
    };
    
    await addDoc(collection(db, 'reservations'), reservationData);
    
    // Mettre à jour le statut de la place
    await updateDoc(doc(db, 'parkingSpots', spotId), {
      status: 'reserved'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating reservation:', error);
    return { success: false, error: error.message };
  }
};
```

**Explication :**
- Récupération des données nécessaires (place, zone)
- Calcul du coût total avec la formule
- Création du document dans Firestore
- Mise à jour du statut de la place
- Gestion des erreurs avec try/catch

---

## 4. ADMIN - APPROUVER UNE RÉSERVATION

```typescript
const approveReservation = async (reservationId: string, notes?: string) => {
  try {
    // Récupérer la réservation
    const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
    const reservation = reservationDoc.data() as Reservation;
    
    // Mettre à jour la réservation
    await updateDoc(doc(db, 'reservations', reservationId), {
      status: 'approved',
      approvedBy: currentUser.id,
      approvedAt: serverTimestamp(),
      notes: notes || ''
    });
    
    // Mettre à jour le statut de la place
    await updateDoc(doc(db, 'parkingSpots', reservation.spotId), {
      status: 'reserved'
    });
    
    // Envoyer une notification à l'utilisateur
    await addDoc(collection(db, 'notifications'), {
      userId: reservation.userId,
      title: 'Réservation approuvée',
      message: `Votre réservation pour la place ${reservation.spotNumber} a été approuvée`,
      type: 'reservation',
      read: false,
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error approving reservation:', error);
    return { success: false, error: error.message };
  }
};
```

**Explication :**
- Récupération de la réservation
- Mise à jour du statut à "approved"
- Enregistrement de qui a approuvé et quand
- Mise à jour de la place
- Création d'une notification pour l'utilisateur

---

## 5. COMPOSANT IONIC - LISTE DE RÉSERVATIONS

```typescript
const ReservationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les réservations en temps réel
    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Reservation[];
      
      setReservations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'active': return 'primary';
      case 'completed': return 'medium';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mes Réservations</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {loading ? (
          <div className="loading-container">
            <IonSpinner />
          </div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={calendarOutline} size="large" />
            <p>Aucune réservation</p>
          </div>
        ) : (
          <IonList>
            {reservations.map(reservation => (
              <IonItem key={reservation.id} button detail>
                <IonLabel>
                  <h2>{reservation.spotNumber}</h2>
                  <p>{format(reservation.startTime, 'dd/MM/yyyy HH:mm')}</p>
                  <p>{reservation.duration}h - {reservation.totalCost} TND</p>
                </IonLabel>
                <IonBadge color={getStatusColor(reservation.status)} slot="end">
                  {reservation.status}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};
```

**Explication :**
- Structure Ionic standard (IonPage, IonHeader, IonContent)
- Récupération des données en temps réel
- Affichage conditionnel (loading, empty, data)
- Utilisation des composants Ionic (IonList, IonItem, IonBadge)
- Fonction helper pour les couleurs selon le statut

---

## 6. TYPESCRIPT - INTERFACES

```typescript
// Interface User - Définit la structure d'un utilisateur
export interface User {
  id: string;                    // ID unique Firebase
  name: string;                  // Nom complet
  email: string;                 // Email
  phone?: string;                // Téléphone (optionnel avec ?)
  role: 'user' | 'admin';        // Rôle (union type)
  loyaltyPoints: number;         // Points de fidélité
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'; // Tier
  createdAt: Date;               // Date de création
  preferences: {                 // Objet imbriqué
    theme: 'light' | 'dark';
    notifications: boolean;
    language: 'fr' | 'en' | 'ar';
  };
}

// Interface Reservation
export interface Reservation {
  id: string;
  userId: string;
  spotId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalCost: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
}
```

**Explication :**
- Les interfaces définissent la structure des données
- `?` rend un champ optionnel
- Union types (`'user' | 'admin'`) limitent les valeurs possibles
- TypeScript vérifie que vous utilisez les bonnes propriétés
- Autocomplétion dans l'IDE

---

## 7. HOOKS REACT

### useState
```typescript
// Déclarer un état
const [count, setCount] = useState<number>(0);

// Utiliser l'état
<p>Count: {count}</p>

// Modifier l'état
<button onClick={() => setCount(count + 1)}>+1</button>
```

### useEffect
```typescript
// S'exécute après chaque rendu
useEffect(() => {
  console.log('Component rendered');
});

// S'exécute une seule fois au montage
useEffect(() => {
  console.log('Component mounted');
}, []);

// S'exécute quand 'count' change
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);

// Nettoyage
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Tick');
  }, 1000);
  
  // Fonction de nettoyage
  return () => clearInterval(timer);
}, []);
```

### useContext
```typescript
// Utiliser un contexte
const { currentUser, login, logout } = useAuth();

// Équivalent à :
const context = useContext(AuthContext);
const currentUser = context.currentUser;
const login = context.login;
const logout = context.logout;
```

---

## 8. GESTION DES ERREURS

```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError('');
    
    // Validation
    if (!email || !password) {
      throw new Error('Veuillez remplir tous les champs');
    }
    
    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    // Appel API
    await login(email, password);
    
    // Succès
    window.location.href = '/';
    
  } catch (error: any) {
    // Gestion des erreurs
    console.error('Login error:', error);
    
    // Messages d'erreur personnalisés
    if (error.code === 'auth/user-not-found') {
      setError('Utilisateur non trouvé');
    } else if (error.code === 'auth/wrong-password') {
      setError('Mot de passe incorrect');
    } else {
      setError(error.message || 'Une erreur est survenue');
    }
  } finally {
    // S'exécute toujours (succès ou erreur)
    setLoading(false);
  }
};
```

**Explication :**
- `try` : Code qui peut générer une erreur
- `catch` : Gestion de l'erreur
- `finally` : S'exécute toujours (pour nettoyer, arrêter le loading, etc.)
- Messages d'erreur personnalisés selon le code d'erreur Firebase

---

## 9. ASYNC/AWAIT

```typescript
// Sans async/await (Promises)
function getData() {
  return fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      return data;
    })
    .catch(error => {
      console.error(error);
    });
}

// Avec async/await (plus lisible)
async function getData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
  }
}
```

**Explication :**
- `async` : Déclare une fonction asynchrone
- `await` : Attend la résolution d'une Promise
- Plus lisible que les `.then().then()`
- Permet d'utiliser try/catch pour les erreurs

---

## 10. COMPOSANT FONCTIONNEL COMPLET

```typescript
import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';

// Props du composant (avec TypeScript)
interface MyComponentProps {
  title: string;
  onSave?: () => void;
}

// Composant fonctionnel avec props typées
const MyComponent: React.FC<MyComponentProps> = ({ title, onSave }) => {
  // États locaux
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Contexte
  const { currentUser } = useAuth();
  
  // Effet au montage
  useEffect(() => {
    console.log('Component mounted');
    
    // Nettoyage
    return () => {
      console.log('Component unmounted');
    };
  }, []);
  
  // Fonction handler
  const handleClick = async () => {
    setLoading(true);
    try {
      // Logique asynchrone
      await someAsyncFunction();
      setCount(count + 1);
      
      // Appeler la fonction callback si elle existe
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Rendu
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="container">
          <p>User: {currentUser?.name}</p>
          <p>Count: {count}</p>
          
          <IonButton 
            onClick={handleClick}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Click me'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyComponent;
```

**Explication :**
- Props typées avec interface
- États locaux avec useState
- Contexte avec useAuth
- Effet avec useEffect
- Handler asynchrone
- Rendu conditionnel
- Composants Ionic

---

**Ces exemples couvrent 90% du code que vous pourriez avoir à expliquer !**
