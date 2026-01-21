import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonLoading
} from '@ionic/react';
import { logIn, person, mail, lockClosed, eye, eyeOff } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onToggleMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onToggleMode }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      window.location.href = '/';
    } catch (error: any) {
      setError(error.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <IonCard>
      <IonCardContent>
        <div className="auth-header">
          <IonIcon icon={logIn} color="primary" size="large" />
          <h2>Welcome Back</h2>
          <p>Sign in to your Smart Parking account</p>
        </div>

        <form onSubmit={handleLogin}>
          <IonItem>
            <IonIcon icon={mail} slot="start" color="primary" />
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonInput={(e) => setEmail(e.detail.value!)}
              placeholder="Enter your email"
              required
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={lockClosed} slot="start" color="primary" />
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput
              type={showPassword ? 'text' : 'password'}
              value={password}
              onIonInput={(e) => setPassword(e.detail.value!)}
              placeholder="Enter your password"
              required
            />
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={() => setShowPassword(!showPassword)}
              size="small"
            >
              <IonIcon icon={showPassword ? eyeOff : eye} color="medium" />
            </IonButton>
          </IonItem>

          {error && (
            <IonText color="danger">
              <p className="error-message">{error}</p>
            </IonText>
          )}

          <IonButton
            expand="block"
            type="submit"
            disabled={loading}
            color="primary"
            className="auth-button"
            style={{ marginTop: '20px' }}
          >
            <IonIcon icon={logIn} slot="start" />
            Sign In
          </IonButton>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <IonButton fill="clear" size="small" color="primary" onClick={onToggleMode}>
              Sign Up
            </IonButton>
          </p>
        </div>

        <IonLoading isOpen={loading} message="Signing in..." />
      </IonCardContent>
    </IonCard>
  );
};

export default Login;