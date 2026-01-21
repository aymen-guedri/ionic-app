import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonToast,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge
} from '@ionic/react';
import { qrCode, checkmark, car, location } from 'ionicons/icons';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { ParkingSpot, Reservation, ParkingZone } from '../types';
import ParkingMap from '../components/parking/ParkingMap';
import ReservationModal from '../components/parking/ReservationModal';
import QRScanner from '../components/qr/QRScanner';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ParkingZone[];
      setZones(zonesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const spotsQuery = selectedZone === 'all' 
      ? collection(db, 'parkingSpots')
      : query(collection(db, 'parkingSpots'), where('zone', '==', selectedZone));
      
    const unsubscribe = onSnapshot(spotsQuery, (snapshot) => {
      const spotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[];
      setSpots(spotsData);
    });

    return () => unsubscribe();
  }, [selectedZone]);

  const handleSpotSelect = (spot: ParkingSpot) => {
    if (spot.status === 'available') {
      setSelectedSpot(spot);
      setIsReservationModalOpen(true);
    }
  };

  const handleReservation = async (spotId: string, duration: number, startTime: Date) => {
    if (!currentUser) {
      setToast({ message: 'Please login to make a reservation', color: 'warning' });
      return;
    }

    const spot = spots.find(s => s.id === spotId);
    if (!spot) return;

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + duration);

    const reservationData = {
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone || '',
      spotId,
      spotNumber: spot.number,
      startTime,
      endTime,
      duration,
      totalCost: spot.pricePerHour * duration,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'reservations'), reservationData);
      setToast({ 
        message: `Reservation created for spot ${spot.number}! Waiting for admin approval.`, 
        color: 'success' 
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      setToast({ message: 'Failed to create reservation', color: 'danger' });
    }
  };

  const getAvailableSpots = () => spots.filter(s => s.status === 'available').length;
  const getTotalSpots = () => spots.length;
  const getOccupiedSpots = () => spots.filter(s => s.status === 'occupied').length;
  const getReservedSpots = () => spots.filter(s => s.status === 'reserved').length;

  const filteredZones = selectedZone === 'all' ? zones : zones.filter(z => z.name === selectedZone);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Smart Parking</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        {/* Zone Selector */}
        {zones.length > 0 && (
          <IonCard>
            <IonCardContent>
              <IonSegment
                value={selectedZone}
                onIonChange={e => setSelectedZone(e.detail.value as string)}
              >
                <IonSegmentButton value="all">
                  <IonLabel>All Zones</IonLabel>
                </IonSegmentButton>
                {zones.map(zone => (
                  <IonSegmentButton key={zone.id} value={zone.name}>
                    <IonLabel>{zone.name}</IonLabel>
                  </IonSegmentButton>
                ))}
              </IonSegment>
            </IonCardContent>
          </IonCard>
        )}

        {/* Stats Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={checkmark} color="success" size="large" />
                    <div>
                      <h2>{getAvailableSpots()}</h2>
                      <p>Available</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={car} color="primary" size="large" />
                    <div>
                      <h2>{getTotalSpots()}</h2>
                      <p>Total Spots</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={car} color="danger" size="large" />
                    <div>
                      <h2>{getOccupiedSpots()}</h2>
                      <p>Occupied</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IonIcon icon={car} color="warning" size="large" />
                    <div>
                      <h2>{getReservedSpots()}</h2>
                      <p>Reserved</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Zone Information */}
        {filteredZones.map(zone => (
          <IonCard key={zone.id}>
            <IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{zone.name}</h3>
                  <p>{zone.description}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {zone.features.map((feature, index) => (
                      <IonBadge key={index} color="primary">{feature}</IonBadge>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <IonIcon icon={location} color="primary" size="large" />
                  <p>Price: ×{zone.priceMultiplier}</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))}

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

        {/* QR Scanner FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setIsQRScannerOpen(true)}>
            <IonIcon icon={qrCode} />
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

export default Home;
