import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonIcon
} from '@ionic/react';
import { people } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User } from '../../types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Manage Users</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => setTimeout(() => e.detail.complete(), 1000)}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <h3>All Users</h3>
          {users.length === 0 ? (
            <IonCard>
              <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
                <IonIcon icon={people} size="large" color="medium" />
                <h3>No Users</h3>
                <p>No users found in the system.</p>
              </IonCardContent>
            </IonCard>
          ) : (
            users.map((user) => (
              <IonCard key={user.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>{user.name}</h3>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                      <p><strong>Loyalty Points:</strong> {user.loyaltyPoints}</p>
                      <p><strong>Tier:</strong> {user.tier}</p>
                      <p><strong>Joined:</strong> {formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <IonBadge color={user.role === 'admin' ? 'danger' : 'primary'}>
                        {user.role.toUpperCase()}
                      </IonBadge>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;