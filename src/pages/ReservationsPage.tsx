import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { Reservation } from '../types';
import { time, checkmark, close, card, car } from 'ionicons/icons';

const ReservationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate()
      })) as Reservation[];
      
      // Sort by createdAt in memory instead of using orderBy in query
      reservationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setReservations(reservationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'active': return 'primary';
      case 'completed': return 'medium';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'expired': return 'dark';
      default: return 'medium';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return checkmark;
      case 'active': return time;
      case 'completed': return checkmark;
      case 'pending': return time;
      case 'cancelled': return close;
      case 'expired': return close;
      default: return time;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'refunded': return 'medium';
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

  const handleRefresh = (event: CustomEvent) => {
    // Refresh will happen automatically through onSnapshot
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  if (!currentUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Mes Réservations</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Please Login</h2>
            <p>You need to be logged in to view your reservations.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mes Réservations</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p>Loading your reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <IonIcon icon={car} size="large" color="medium" />
            <h2>No Reservations</h2>
            <p>You haven't made any parking reservations yet.</p>
          </div>
        ) : (
          reservations.map((reservation) => (
            <IonCard key={reservation.id}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={getStatusIcon(reservation.status)} />
                      Place {reservation.spotNumber}
                    </h2>
                    <IonBadge color={getStatusColor(reservation.status)}>
                      {reservation.status.toUpperCase()}
                    </IonBadge>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <IonText color="primary">
                      <h3 style={{ margin: 0 }}>{reservation.totalCost} TND</h3>
                    </IonText>
                    <IonBadge color={getPaymentStatusColor(reservation.paymentStatus)} size="small">
                      <IonIcon icon={card} style={{ marginRight: '4px' }} />
                      {reservation.paymentStatus}
                    </IonBadge>
                  </div>
                </div>
                
                <IonItem lines="none" style={{ '--padding-start': '0px' }}>
                  <IonLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                      <div>
                        <strong>Créé le:</strong><br />
                        {formatDate(reservation.createdAt)}
                      </div>
                      <div>
                        <strong>Début:</strong><br />
                        {formatDate(reservation.startTime)}
                      </div>
                      <div>
                        <strong>Fin:</strong><br />
                        {formatDate(reservation.endTime)}
                      </div>
                      <div>
                        <strong>Durée:</strong><br />
                        {reservation.duration}h
                      </div>
                    </div>
                    
                    {reservation.approvedAt && (
                      <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--ion-color-success)' }}>
                        <strong>Approuvé le:</strong> {formatDate(reservation.approvedAt)}
                      </div>
                    )}
                    
                    {reservation.notes && (
                      <div style={{ marginTop: '8px', fontSize: '14px', fontStyle: 'italic', color: 'var(--ion-color-medium)' }}>
                        <strong>Note:</strong> {reservation.notes}
                      </div>
                    )}
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReservationsPage;