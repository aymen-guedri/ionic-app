import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonToast,
  IonLoading,
  IonButtons
} from '@ionic/react';
import { qrCode, close, camera, card } from 'ionicons/icons';
import { collection, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { ParkingSpot } from '../../types';
import QRPaymentModal from '../payment/QRPaymentModal';
import './QRScanner.css';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [scannedSpot, setScannedSpot] = useState<ParkingSpot | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userReservation, setUserReservation] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      loadUserReservation();
    }
  }, [currentUser]);

  const loadUserReservation = async () => {
    if (!currentUser) return;
    
    try {
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('userId', '==', currentUser.id),
        where('status', '==', 'approved')
      );
      
      const querySnapshot = await getDocs(reservationsQuery);
      
      if (!querySnapshot.empty) {
        const reservationDoc = querySnapshot.docs[0];
        const reservationData = { id: reservationDoc.id, ...reservationDoc.data() };
        setUserReservation(reservationData);
      }
    } catch (error) {
      console.error('Error loading reservation:', error);
    }
  };

  const simulateQRScan = async () => {
    if (!userReservation) {
      setToast({ message: 'You need an approved reservation to pay', color: 'warning' });
      return;
    }

    setScanning(true);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find the spot that matches user's reservation
      const spotQuery = query(
        collection(db, 'parkingSpots'),
        where('number', '==', userReservation.spotNumber)
      );
      
      const querySnapshot = await getDocs(spotQuery);
      
      if (!querySnapshot.empty) {
        const spotDoc = querySnapshot.docs[0];
        const spotData = { id: spotDoc.id, ...spotDoc.data() } as ParkingSpot;
        
        setScannedSpot(spotData);
        setShowPaymentModal(true);
      } else {
        setToast({ message: 'Reserved spot not found', color: 'danger' });
      }
    } catch (error) {
      console.error('Error scanning QR:', error);
      setToast({ message: 'Failed to scan QR code', color: 'danger' });
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const handlePayment = async (spotId: string, duration: number, amount: number) => {
    if (!currentUser || !scannedSpot) return;
    
    try {
      setLoading(true);
      
      // Create Stripe payment session (simplified)
      const paymentData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone || '',
        spotId,
        spotNumber: scannedSpot.number,
        duration,
        amount,
        paymentMethod: 'stripe',
        status: 'paid',
        startTime: new Date(),
        endTime: new Date(Date.now() + duration * 60 * 60 * 1000),
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'payments'), paymentData);
      
      setToast({ 
        message: `Payment successful! You can park for ${duration} hours.`, 
        color: 'success' 
      });
      
      setTimeout(() => onClose(), 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setToast({ message: 'Payment failed', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>QR Payment Scanner</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="qr-scanner-container">
          <IonCard className="scanner-card">
            <IonCardContent>
              <div className="scanner-content">
                <IonIcon icon={qrCode} className="qr-icon" />
                <h2>Pay for Your Reservation</h2>
                {userReservation ? (
                  <>
                    <p>Scan QR code on spot <strong>{userReservation.spotNumber}</strong> to pay</p>
                    <p>Duration: {userReservation.duration} hours</p>
                    <p>Total: {userReservation.totalCost} TND</p>
                  </>
                ) : (
                  <p>You need an approved reservation to use QR payment</p>
                )}
                
                <IonButton 
                  expand="block" 
                  size="large"
                  onClick={simulateQRScan}
                  disabled={loading || scanning || !userReservation}
                  className="scan-button"
                >
                  <IonIcon icon={scanning ? close : camera} slot="start" />
                  {scanning ? 'Scanning...' : 'Scan QR Code'}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="instructions-card">
            <IonCardContent>
              <h3>How it works</h3>
              <ul>
                <li>Find an available parking spot</li>
                <li>Scan the QR code on the spot</li>
                <li>Select parking duration</li>
                <li>Pay securely with Stripe</li>
                <li>Start parking immediately</li>
              </ul>
            </IonCardContent>
          </IonCard>
        </div>

        <QRPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setScannedSpot(null);
          }}
          spot={scannedSpot}
          onPayment={handlePayment}
        />

        <IonLoading
          isOpen={loading}
          message={scanning ? 'Scanning QR code...' : 'Processing payment...'}
        />

        <IonToast
          isOpen={!!toast}
          message={toast?.message}
          duration={3000}
          color={toast?.color}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default QRScanner;