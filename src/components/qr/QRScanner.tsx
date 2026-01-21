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
  IonButtons,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonImg
} from '@ionic/react';
import { qrCode, close, camera, card, text } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { ParkingSpot } from '../../types';
import QRPaymentModal from '../payment/QRPaymentModal';
import './QRScanner.css';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [scannedSpot, setScannedSpot] = useState<ParkingSpot | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userReservation, setUserReservation] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

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

  const takePhotoForQR = async () => {
    if (!userReservation) {
      setToast({ message: 'You need an approved reservation to pay', color: 'warning' });
      return;
    }

    try {
      setLoading(true);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        promptLabelHeader: 'QR Code Scanner',
        promptLabelPhoto: 'Take Photo of QR Code',
        promptLabelPicture: 'Select from Gallery',
        width: 400,
        height: 400
      });
      
      if (image.webPath) {
        setCapturedImage(image.webPath);
        setToast({ 
          message: 'Photo captured! Now switch to Manual tab to enter the QR code data.', 
          color: 'success' 
        });
        // Auto-switch to manual mode after photo capture
        setTimeout(() => setScanMode('manual'), 1500);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.message?.includes('cancelled') || error.message?.includes('User cancelled')) {
        setToast({ message: 'Photo capture cancelled', color: 'warning' });
      } else {
        setToast({ message: 'Camera access failed. Please use manual input.', color: 'warning' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    if (!manualInput.trim()) {
      setToast({ message: 'Please enter QR code data', color: 'warning' });
      return;
    }
    handleQRResult(manualInput.trim());
  };

  const handleQRResult = async (qrData: string) => {
    setLoading(true);
    
    try {
      // Parse QR code data
      let spotData;
      try {
        spotData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as spot number
        spotData = { spotNumber: qrData };
      }
      
      // Find the spot that matches the QR code
      const spotQuery = query(
        collection(db, 'parkingSpots'),
        where('number', '==', spotData.spotNumber || userReservation.spotNumber)
      );
      
      const querySnapshot = await getDocs(spotQuery);
      
      if (!querySnapshot.empty) {
        const spotDoc = querySnapshot.docs[0];
        const spot = { id: spotDoc.id, ...spotDoc.data() } as ParkingSpot;
        
        // Verify this matches user's reservation
        if (spot.number !== userReservation.spotNumber) {
          setToast({ 
            message: `Wrong spot! You reserved ${userReservation.spotNumber}, but scanned ${spot.number}`, 
            color: 'danger' 
          });
          return;
        }
        
        setScannedSpot(spot);
        setShowPaymentModal(true);
      } else {
        setToast({ message: 'Parking spot not found', color: 'danger' });
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setToast({ message: 'Invalid QR code', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (spotId: string, duration: number, amount: number) => {
    if (!currentUser || !scannedSpot || !userReservation) return;
    
    try {
      setLoading(true);
      
      const startTime = new Date();
      const endTime = new Date(Date.now() + duration * 60 * 60 * 1000);
      
      // Create payment record
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
        reservationId: userReservation.id,
        startTime,
        endTime,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'payments'), paymentData);
      
      await updateDoc(doc(db, 'reservations', userReservation.id), {
        paymentStatus: 'paid',
        paidAt: serverTimestamp(),
        actualStartTime: serverTimestamp(),
        actualEndTime: new Date(Date.now() + duration * 60 * 60 * 1000)
      });
      
      await updateDoc(doc(db, 'parkingSpots', spotId), {
        status: 'occupied',
        occupiedBy: currentUser.id,
        occupiedUntil: endTime,
        lastUpdated: serverTimestamp()
      });
      
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
                
                {/* Scan Mode Selector */}
                <IonSegment 
                  value={scanMode} 
                  onIonChange={e => setScanMode(e.detail.value as 'camera' | 'manual')}
                  style={{ marginBottom: '20px' }}
                >
                  <IonSegmentButton value="camera">
                    <IonIcon icon={camera} />
                    <IonLabel>Camera</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="manual">
                    <IonIcon icon={text} />
                    <IonLabel>Manual</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
                
                {scanMode === 'camera' ? (
                  <>
                    {/* Capacitor Camera */}
                    {capturedImage && (
                      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <h4>Captured QR Code Photo:</h4>
                        <IonImg 
                          src={capturedImage} 
                          style={{ 
                            maxHeight: '200px', 
                            maxWidth: '100%',
                            borderRadius: '8px',
                            border: '2px solid #ccc'
                          }} 
                        />
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                          Photo saved! Now enter the QR code data manually below.
                        </p>
                      </div>
                    )}
                    
                    {!capturedImage && (
                      <div style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        height: '200px', 
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        border: '2px dashed #ccc'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <IonIcon icon={camera} size="large" color="medium" />
                          <p style={{ color: '#666', margin: '8px 0 0 0' }}>
                            Take a photo of the QR code
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <IonButton 
                      expand="block" 
                      size="large"
                      onClick={takePhotoForQR}
                      disabled={loading || !userReservation}
                      className="scan-button"
                      color="primary"
                    >
                      <IonIcon icon={camera} slot="start" />
                      {capturedImage ? 'Take Another Photo' : 'Take Photo of QR Code'}
                    </IonButton>
                    
                    {capturedImage && (
                      <p style={{ 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        color: '#666',
                        marginTop: '16px'
                      }}>
                        Switch to "Manual" tab to enter the QR code data from your photo
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Manual Input */}
                    <IonItem style={{ marginBottom: '20px' }}>
                      <IonLabel position="stacked">QR Code Data</IonLabel>
                      <IonInput
                        value={manualInput}
                        onIonInput={e => setManualInput(e.detail.value!)}
                        placeholder="Paste QR code data or enter spot number"
                      />
                    </IonItem>
                    
                    <IonButton 
                      expand="block" 
                      size="large"
                      onClick={handleManualInput}
                      disabled={loading || !userReservation || !manualInput.trim()}
                      className="scan-button"
                    >
                      <IonIcon icon={qrCode} slot="start" />
                      Process QR Code
                    </IonButton>
                  </>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="instructions-card">
            <IonCardContent>
              <h3>How to get QR code data</h3>
              <ul>
                <li><strong>Camera:</strong> Point camera at QR code on parking spot</li>
                <li><strong>Manual Options:</strong></li>
                <ul>
                  <li>Just enter your reserved spot number (e.g., "A-001")</li>
                  <li>Ask admin to show you the QR code data</li>
                  <li>Copy QR data from admin panel if you have access</li>
                  <li>Use another phone to scan and copy the text</li>
                </ul>
                <li><strong>Example:</strong> For spot A-001, just type "A-001"</li>
                <li>Make sure you're at the correct reserved spot</li>
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
          reservation={userReservation ? {
            duration: userReservation.duration,
            totalCost: userReservation.totalCost,
            spotNumber: userReservation.spotNumber
          } : null}
        />

        <IonLoading
          isOpen={loading}
          message={isScanning ? 'Scanning QR code...' : 'Processing payment...'}
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