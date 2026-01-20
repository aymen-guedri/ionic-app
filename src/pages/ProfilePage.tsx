import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonAvatar
} from '@ionic/react';
import { logOut, person, settings } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonCard>
          <IonCardContent>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <IonAvatar style={{ width: '80px', height: '80px', margin: '0 auto 16px' }}>
                <IonIcon icon={person} style={{ fontSize: '40px' }} />
              </IonAvatar>
              <h2>{currentUser?.name}</h2>
              <p>{currentUser?.email}</p>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardContent>
            <IonItem button>
              <IonIcon icon={settings} slot="start" />
              <IonLabel>Paramètres</IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel>
                <h3>Points de fidélité</h3>
                <p>{currentUser?.loyaltyPoints || 0} points</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel>
                <h3>Niveau</h3>
                <p>{currentUser?.tier || 'Bronze'}</p>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <IonButton 
          expand="block" 
          fill="clear" 
          color="danger" 
          onClick={handleLogout}
          style={{ margin: '20px' }}
        >
          <IonIcon icon={logOut} slot="start" />
          Se déconnecter
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;