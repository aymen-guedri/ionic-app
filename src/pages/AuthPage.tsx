import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import './AuthPage.css';

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Smart Parking</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="auth-page">
        <div className="auth-container">
          <div className="auth-logo">
            <h1>🚗 Smart Parking</h1>
            <p>Your premium parking solution</p>
          </div>

          <IonSegment
            value={authMode}
            onIonChange={(e) => setAuthMode(e.detail.value as 'login' | 'register')}
            className="auth-segment"
          >
            <IonSegmentButton value="login">
              <IonLabel>Sign In</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="register">
              <IonLabel>Sign Up</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <div className="auth-form-container">
            {authMode === 'login' ? (
              <Login onToggleMode={() => setAuthMode('register')} />
            ) : (
              <Register onToggleMode={() => setAuthMode('login')} />
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuthPage;