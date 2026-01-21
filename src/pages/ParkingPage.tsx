import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonFab,
  IonFabButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButtons,
  IonAvatar,
  IonPopover,
  IonList,
  IonModal
} from '@ionic/react';
import { refresh, car, time, checkmark, location, person, logOut, settings, qrCode, shield } from 'ionicons/icons';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ParkingSpot, Reservation } from '../types';
import ParkingMap from '../components/parking/ParkingMap';
import ReservationModal from '../components/parking/ReservationModal';
import QRScanner from '../components/qr/QRScanner';
import { OccupancyService } from '../services/occupancy';
import './ParkingPage.css';

const ParkingPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showUserPopover, setShowUserPopover] = useState(false);

  // Mock data for development - replace with Firebase data later
  const mockSpots: ParkingSpot[] = [
    // Zone A - Covered spots
    { id: 'A01', number: 'A-01', zone: 'Zone A', type: 'covered', size: 'standard', accessible: false, coordinates: { x: 50, y: 80 }, status: 'available', pricePerHour: 2.5, features: ['covered', 'security_camera'], qrCode: 'QR_A01' },
    { id: 'A02', number: 'A-02', zone: 'Zone A', type: 'covered', size: 'standard', accessible: true, coordinates: { x: 100, y: 80 }, status: 'occupied', pricePerHour: 2.5, features: ['covered', 'accessible'], qrCode: 'QR_A02' },
    { id: 'A03', number: 'A-03', zone: 'Zone A', type: 'covered', size: 'large', accessible: false, coordinates: { x: 150, y: 80 }, status: 'available', pricePerHour: 3.0, features: ['covered', 'large_vehicle'], qrCode: 'QR_A03' },
    { id: 'A04', number: 'A-04', zone: 'Zone A', type: 'covered', size: 'standard', accessible: false, coordinates: { x: 200, y: 80 }, status: 'reserved', pricePerHour: 2.5, features: ['covered'], qrCode: 'QR_A04' },
    
    // Zone B - Mixed spots
    { id: 'B01', number: 'B-01', zone: 'Zone B', type: 'outdoor', size: 'standard', accessible: false, coordinates: { x: 50, y: 200 }, status: 'available', pricePerHour: 2.0, features: ['electric_charging'], qrCode: 'QR_B01' },
    { id: 'B02', number: 'B-02', zone: 'Zone B', type: 'outdoor', size: 'compact', accessible: false, coordinates: { x: 100, y: 200 }, status: 'available', pricePerHour: 1.5, features: [], qrCode: 'QR_B02' },
    { id: 'B03', number: 'B-03', zone: 'Zone B', type: 'outdoor', size: 'standard', accessible: true, coordinates: { x: 150, y: 200 }, status: 'maintenance', pricePerHour: 2.0, features: ['accessible'], qrCode: 'QR_B03' },
    { id: 'B04', number: 'B-04', zone: 'Zone B', type: 'covered', size: 'standard', accessible: false, coordinates: { x: 200, y: 200 }, status: 'available', pricePerHour: 2.5, features: ['covered'], qrCode: 'QR_B04' },
    
    // Zone C - Premium spots
    { id: 'C01', number: 'C-01', zone: 'Zone C', type: 'covered', size: 'large', accessible: false, coordinates: { x: 50, y: 320 }, status: 'available', pricePerHour: 3.5, features: ['covered', 'premium', 'valet'], qrCode: 'QR_C01' },
    { id: 'C02', number: 'C-02', zone: 'Zone C', type: 'covered', size: 'large', accessible: true, coordinates: { x: 100, y: 320 }, status: 'occupied', pricePerHour: 3.5, features: ['covered', 'premium', 'accessible'], qrCode: 'QR_C02' },
    { id: 'C03', number: 'C-03', zone: 'Zone C', type: 'covered', size: 'standard', accessible: false, coordinates: { x: 150, y: 320 }, status: 'available', pricePerHour: 3.0, features: ['covered', 'premium'], qrCode: 'QR_C03' },
    { id: 'C04', number: 'C-04', zone: 'Zone C', type: 'covered', size: 'standard', accessible: false, coordinates: { x: 200, y: 320 }, status: 'reserved', pricePerHour: 3.0, features: ['covered', 'premium'], qrCode: 'QR_C04' }
  ];

  useEffect(() => {
    // Connect to real Firebase data
    const unsubscribe = onSnapshot(collection(db, 'parkingSpots'), (snapshot) => {
      const spotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        occupiedUntil: doc.data().occupiedUntil?.toDate()
      })) as ParkingSpot[];
      setSpots(spotsData);
      setLoading(false);
    });

    // Update expired occupancies on load
    OccupancyService.updateExpiredOccupancies();

    return () => unsubscribe();
  }, []);

  const handleSpotSelect = async (spot: ParkingSpot) => {
    if (spot.status === 'available') {
      setSelectedSpot(spot);
      setIsReservationModalOpen(true);
    } else if (spot.status === 'occupied' && spot.occupiedUntil) {
      const nextAvailable = await OccupancyService.getNextAvailableTime(spot.id);
      if (nextAvailable) {
        setToast({ 
          message: `Spot ${spot.number} will be available at ${nextAvailable.toLocaleString()}`, 
          color: 'warning' 
        });
      } else {
        setToast({ 
          message: `Spot ${spot.number} availability unknown`, 
          color: 'warning' 
        });
      }
    } else {
      setToast({ 
        message: `Spot ${spot.number} is ${spot.status}`, 
        color: 'warning' 
      });
    }
  };

  const handleReservation = async (spotId: string, duration: number, startTime: Date) => {
    if (!currentUser) {
      setToast({ message: 'Please login to make a reservation', color: 'warning' });
      return;
    }

    try {
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + duration);

      // Check if spot is available for the requested time
      const isAvailable = await OccupancyService.isSpotAvailable(spotId, startTime, endTime);
      if (!isAvailable) {
        const nextAvailable = await OccupancyService.getNextAvailableTime(spotId);
        setToast({ 
          message: `Spot not available for selected time. Next available: ${nextAvailable?.toLocaleString() || 'Unknown'}`, 
          color: 'danger' 
        });
        return;
      }

      const spot = spots.find(s => s.id === spotId);
      if (!spot) return;

      const reservationData: Omit<Reservation, 'id'> = {
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        spotId,
        spotNumber: spot.number,
        startTime,
        endTime,
        duration,
        totalCost: spot.pricePerHour * duration,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date()
      };

      // Add to Firebase
      await addDoc(collection(db, 'reservations'), {
        ...reservationData,
        startTime: serverTimestamp(),
        endTime: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      setToast({ 
        message: `Reservation request sent for spot ${spot.number}. Waiting for admin approval.`, 
        color: 'success' 
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      setToast({ message: 'Failed to create reservation', color: 'danger' });
    }
  };

  const handleRefresh = (event: CustomEvent) => {
    // Simulate refresh
    setTimeout(() => {
      event.detail.complete();
      setToast({ message: 'Parking data refreshed', color: 'success' });
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigateToAdmin = () => {
    window.location.href = '/admin';
  };

  const getAvailableSpots = () => spots.filter(s => s.status === 'available').length;
  const getTotalSpots = () => spots.length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Smart Parking</IonTitle>
          <IonButtons slot="end">
            <IonButton id="user-trigger" fill="clear">
              <IonAvatar slot="icon-only">
                <IonIcon icon={person} />
              </IonAvatar>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* User Popover */}
        <IonPopover trigger="user-trigger" isOpen={showUserPopover} onDidDismiss={() => setShowUserPopover(false)}>
          <IonContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h2>{currentUser?.name}</h2>
                  <p>{currentUser?.email}</p>
                  <p>Tier: {currentUser?.tier}</p>
                </IonLabel>
              </IonItem>
              {currentUser?.role === 'admin' && (
                <IonItem button onClick={navigateToAdmin}>
                  <IonIcon icon={shield} slot="start" />
                  <IonLabel>Admin Panel</IonLabel>
                </IonItem>
              )}
              <IonItem button onClick={handleLogout}>
                <IonIcon icon={logOut} slot="start" />
                <IonLabel>Logout</IonLabel>
              </IonItem>
            </IonList>
          </IonContent>
        </IonPopover>

        {/* Stats Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonCard className="stats-card">
                <IonCardContent>
                  <div className="stat-item">
                    <IonIcon icon={checkmark} color="success" />
                    <div>
                      <h2>{getAvailableSpots()}</h2>
                      <p>Available</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard className="stats-card">
                <IonCardContent>
                  <div className="stat-item">
                    <IonIcon icon={car} color="primary" />
                    <div>
                      <h2>{getTotalSpots()}</h2>
                      <p>Total Spots</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Parking Map */}
        <ParkingMap
          spots={spots}
          onSpotSelect={handleSpotSelect}
          selectedSpotId={selectedSpot?.id}
        />

        {/* Reservation Modal */}
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedSpot(null);
          }}
          spot={selectedSpot}
          onReserve={handleReservation}
        />

        {/* QR Scanner Modal */}
        <IonModal isOpen={isQRScannerOpen} onDidDismiss={() => setIsQRScannerOpen(false)}>
          <QRScanner onClose={() => setIsQRScannerOpen(false)} />
        </IonModal>

        {/* Floating Action Buttons */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsQRScannerOpen(true)}>
            <IonIcon icon={qrCode} />
          </IonFabButton>
        </IonFab>

        <IonFab vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton onClick={() => handleRefresh({ detail: { complete: () => {} } } as any)}>
            <IonIcon icon={refresh} />
          </IonFabButton>
        </IonFab>

        {/* Toast */}
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

export default ParkingPage;