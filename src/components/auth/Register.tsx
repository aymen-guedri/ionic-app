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
import { personAdd, person, mail, lockClosed, call } from 'ionicons/icons';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterProps {
  onToggleMode: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleMode }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(formData.email, formData.password, formData.name, formData.phone);
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonCard>
      <IonCardContent>
        <div className="auth-header">
          <IonIcon icon={personAdd} color="primary" size="large" />
          <h2>Create Account</h2>
          <p>Join Smart Parking today</p>
        </div>

        <form onSubmit={handleRegister}>
          <IonItem>
            <IonIcon icon={person} slot="start" color="medium" />
            <IonLabel position="stacked">Full Name *</IonLabel>
            <IonInput
              type="text"
              value={formData.name}
              onIonInput={(e) => handleInputChange('name', e.detail.value!)}
              placeholder="Enter your full name"
              required
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={mail} slot="start" color="medium" />
            <IonLabel position="stacked">Email *</IonLabel>
            <IonInput
              type="email"
              value={formData.email}
              onIonInput={(e) => handleInputChange('email', e.detail.value!)}
              placeholder="Enter your email"
              required
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={call} slot="start" color="medium" />
            <IonLabel position="stacked">Phone Number</IonLabel>
            <IonInput
              type="tel"
              value={formData.phone}
              onIonInput={(e) => handleInputChange('phone', e.detail.value!)}
              placeholder="+216 XX XXX XXX"
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={lockClosed} slot="start" color="medium" />
            <IonLabel position="stacked">Password *</IonLabel>
            <IonInput
              type="password"
              value={formData.password}
              onIonInput={(e) => handleInputChange('password', e.detail.value!)}
              placeholder="Enter your password"
              required
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={lockClosed} slot="start" color="medium" />
            <IonLabel position="stacked">Confirm Password *</IonLabel>
            <IonInput
              type="password"
              value={formData.confirmPassword}
              onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
              placeholder="Confirm your password"
              required
            />
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
            className="auth-button"
          >
            <IonIcon icon={personAdd} slot="start" />
            Create Account
          </IonButton>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <IonButton fill="clear" size="small" onClick={onToggleMode}>
              Sign In
            </IonButton>
          </p>
        </div>

        <IonLoading isOpen={loading} message="Creating account..." />
      </IonCardContent>
    </IonCard>
  );
};

export default Register;