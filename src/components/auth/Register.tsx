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
import { personAdd, person, mail, lockClosed, call, eye, eyeOff } from 'ionicons/icons';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      window.location.href = '/';
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
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
            <IonIcon icon={person} slot="start" color="primary" />
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
            <IonIcon icon={mail} slot="start" color="primary" />
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
            <IonIcon icon={call} slot="start" color="primary" />
            <IonLabel position="stacked">Phone Number</IonLabel>
            <IonInput
              type="tel"
              value={formData.phone}
              onIonInput={(e) => handleInputChange('phone', e.detail.value!)}
              placeholder="+216 XX XXX XXX"
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={lockClosed} slot="start" color="primary" />
            <IonLabel position="stacked">Password *</IonLabel>
            <IonInput
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onIonInput={(e) => handleInputChange('password', e.detail.value!)}
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

          <IonItem>
            <IonIcon icon={lockClosed} slot="start" color="primary" />
            <IonLabel position="stacked">Confirm Password *</IonLabel>
            <IonInput
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
              placeholder="Confirm your password"
              required
            />
            <IonButton 
              fill="clear" 
              slot="end" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              size="small"
            >
              <IonIcon icon={showConfirmPassword ? eyeOff : eye} color="medium" />
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
            <IonIcon icon={personAdd} slot="start" />
            Create Account
          </IonButton>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <IonButton fill="clear" size="small" color="primary" onClick={onToggleMode}>
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