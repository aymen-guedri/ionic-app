import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonIcon,
  IonNote
} from '@ionic/react';
import { card, checkmark } from 'ionicons/icons';
import { StripeService } from '../../services/stripe';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency,
  onSuccess,
  onError,
  loading,
  setLoading
}) => {
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expiry, setExpiry] = useState('12/25');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('Test User');

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo - always succeed with test card
      if (cardNumber === '4242424242424242') {
        const paymentId = `pi_test_${Date.now()}`;
        onSuccess(paymentId);
      } else if (cardNumber === '4000000000000002') {
        throw new Error('Your card was declined.');
      } else {
        throw new Error('Invalid card number.');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonCard>
      <IonCardContent>
        <h3>Payment Details</h3>
        
        <IonItem>
          <IonLabel position="stacked">Card Number</IonLabel>
          <IonInput
            value={cardNumber}
            onIonInput={e => setCardNumber(e.detail.value!)}
            placeholder="1234 5678 9012 3456"
            maxlength={16}
          />
        </IonItem>

        <div style={{ display: 'flex', gap: '10px' }}>
          <IonItem style={{ flex: 1 }}>
            <IonLabel position="stacked">Expiry</IonLabel>
            <IonInput
              value={expiry}
              onIonInput={e => setExpiry(e.detail.value!)}
              placeholder="MM/YY"
              maxlength={5}
            />
          </IonItem>
          
          <IonItem style={{ flex: 1 }}>
            <IonLabel position="stacked">CVC</IonLabel>
            <IonInput
              value={cvc}
              onIonInput={e => setCvc(e.detail.value!)}
              placeholder="123"
              maxlength={3}
            />
          </IonItem>
        </div>

        <IonItem>
          <IonLabel position="stacked">Cardholder Name</IonLabel>
          <IonInput
            value={name}
            onIonInput={e => setName(e.detail.value!)}
            placeholder="John Doe"
          />
        </IonItem>

        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <h3>Total: {amount.toFixed(2)} {currency.toUpperCase()}</h3>
        </div>

        <IonButton
          expand="block"
          onClick={handlePayment}
          disabled={loading || !cardNumber || !expiry || !cvc || !name}
        >
          <IonIcon icon={card} slot="start" />
          {loading ? <IonSpinner /> : `Pay ${amount.toFixed(2)} ${currency.toUpperCase()}`}
        </IonButton>

        <IonNote color="medium" style={{ textAlign: 'center', margin: '10px 0', display: 'block' }}>
          <IonIcon icon={checkmark} /> Test Mode - Use: 4242 4242 4242 4242
        </IonNote>
        
        <IonNote color="medium" style={{ textAlign: 'center', fontSize: '12px', display: 'block' }}>
          Decline test: 4000 0000 0000 0002
        </IonNote>
      </IonCardContent>
    </IonCard>
  );
};

export default StripePaymentForm;