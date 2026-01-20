import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonNote,
  IonToast
} from '@ionic/react';
import { card, time, car, checkmark } from 'ionicons/icons';
import { ParkingSpot } from '../../types';
import { StripeService } from '../../services/stripe';
import StripePaymentForm from './StripePaymentForm';

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: ParkingSpot | null;
  onPayment: (spotId: string, duration: number, amount: number) => Promise<void>;
}

const QRPaymentModal: React.FC<QRPaymentModalProps> = ({ isOpen, onClose, spot, onPayment }) => {
  const [duration, setDuration] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

  const calculateAmount = () => {
    return spot ? spot.pricePerHour * duration : 0;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!spot) return;
    
    try {
      await onPayment(spot.id, duration, calculateAmount());
      setToast({ message: 'Payment successful!', color: 'success' });
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      setToast({ message: 'Failed to process payment', color: 'danger' });
    }
  };

  const handlePaymentError = (error: string) => {
    setToast({ message: error, color: 'danger' });
  };

  if (!spot) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pay for Parking</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {!showPaymentForm ? (
          <>
            <IonCard>
              <IonCardContent>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <IonIcon icon={car} size="large" color="primary" />
                  <h2>Spot {spot.number}</h2>
                  <p>{spot.zone} - {spot.type}</p>
                </div>

                <IonItem>
                  <IonIcon icon={time} slot="start" />
                  <IonLabel>Duration</IonLabel>
                  <IonSelect
                    value={duration}
                    onSelectionChange={e => setDuration(e.detail.value)}
                  >
                    <IonSelectOption value={1}>1 hour</IonSelectOption>
                    <IonSelectOption value={2}>2 hours</IonSelectOption>
                    <IonSelectOption value={3}>3 hours</IonSelectOption>
                    <IonSelectOption value={4}>4 hours</IonSelectOption>
                    <IonSelectOption value={6}>6 hours</IonSelectOption>
                    <IonSelectOption value={8}>8 hours</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <div style={{ margin: '20px 0', textAlign: 'center' }}>
                  <h3>Total: {calculateAmount().toFixed(2)} TND</h3>
                  <p>Rate: {spot.pricePerHour} TND/hour</p>
                </div>

                <IonButton
                  expand="block"
                  onClick={() => setShowPaymentForm(true)}
                >
                  <IonIcon icon={card} slot="start" />
                  Continue to Payment
                </IonButton>

                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={onClose}
                >
                  Cancel
                </IonButton>
              </IonCardContent>
            </IonCard>
          </>
        ) : (
          <StripePaymentForm
            amount={calculateAmount()}
            currency="tnd"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          duration={3000}
          color={toast?.color}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonModal>
  );
};

export default QRPaymentModal;