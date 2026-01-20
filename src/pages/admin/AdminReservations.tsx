import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { checkmark, close, time } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Reservation } from '../../types';
import { approveReservation, rejectReservation } from '../../services/admin';

const AdminReservations: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reservations'), (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate()
      })) as Reservation[];
      
      reservationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReservations(reservationsData);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (reservationId: string) => {
    if (!currentUser) return;
    try {
      await approveReservation(reservationId, currentUser.id);
    } catch (error) {
      console.error('Error approving reservation:', error);
    }
  };

  const handleReject = async (reservationId: string) => {
    if (!currentUser) return;
    try {
      await rejectReservation(reservationId, currentUser.id);
    } catch (error) {
      console.error('Error rejecting reservation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'active': return 'primary';
      case 'completed': return 'medium';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Manage Reservations</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => setTimeout(() => e.detail.complete(), 1000)}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>All Reservations</h3>
            <IonBadge color="warning">{reservations.filter(r => r.status === 'pending').length} Pending</IonBadge>
          </div>
          
          {reservations.length === 0 ? (
            <IonCard>
              <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
                <IonIcon icon={time} size="large" color="medium" />
                <h3>No Reservations</h3>
                <p>No reservations found in the system.</p>
              </IonCardContent>
            </IonCard>
          ) : (
            reservations.map((reservation) => (
              <IonCard key={reservation.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3>Spot {reservation.spotNumber}</h3>
                      <p><strong>User:</strong> {reservation.userName}</p>
                      <p><strong>Phone:</strong> {reservation.userPhone || 'N/A'}</p>
                      <p><strong>Duration:</strong> {reservation.duration}h</p>
                      <p><strong>Cost:</strong> {reservation.totalCost} TND</p>
                      <p><strong>Created:</strong> {formatDate(reservation.createdAt)}</p>
                      <p><strong>Start:</strong> {formatDate(reservation.startTime)}</p>
                      {reservation.notes && <p><strong>Notes:</strong> {reservation.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <IonBadge color={getStatusColor(reservation.status)}>
                        {reservation.status.toUpperCase()}
                      </IonBadge>
                      {reservation.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <IonButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(reservation.id)}
                          >
                            <IonIcon icon={checkmark} />
                          </IonButton>
                          <IonButton
                            size="small"
                            color="danger"
                            onClick={() => handleReject(reservation.id)}
                          >
                            <IonIcon icon={close} />
                          </IonButton>
                        </div>
                      )}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminReservations;