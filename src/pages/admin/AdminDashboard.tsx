import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { people, car, time, analytics } from 'ionicons/icons';
import { getAnalytics } from '../../services/admin';

interface Analytics {
  totalUsers: number;
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  totalReservations: number;
  pendingReservations: number;
  approvedReservations: number;
  completedReservations: number;
  totalRevenue: number;
  occupancyRate: string;
}

const AdminDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<Analytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleRefresh = (event: CustomEvent) => {
    loadAnalytics().finally(() => event.detail.complete());
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonGrid>
          <IonRow>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <IonIcon icon={people} color="primary" size="large" />
                    <div>
                      <h2>{analyticsData?.totalUsers || 0}</h2>
                      <p>Total Users</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <IonIcon icon={car} color="success" size="large" />
                    <div>
                      <h2>{analyticsData?.availableSpots || 0}</h2>
                      <p>Available Spots</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <IonIcon icon={time} color="warning" size="large" />
                    <div>
                      <h2>{analyticsData?.pendingReservations || 0}</h2>
                      <p>Pending Requests</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <IonIcon icon={analytics} color="tertiary" size="large" />
                    <div>
                      <h2>{analyticsData?.totalRevenue || 0} TND</h2>
                      <p>Total Revenue</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardContent>
                  <h3>Occupancy Rate</h3>
                  <div style={{ fontSize: '2rem', color: 'var(--ion-color-primary)' }}>
                    {analyticsData?.occupancyRate || '0'}%
                  </div>
                  <p>Current parking utilization</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardContent>
                  <h3>Quick Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>Total Spots: {analyticsData?.totalSpots || 0}</div>
                    <div>Occupied: {analyticsData?.occupiedSpots || 0}</div>
                    <div>Total Reservations: {analyticsData?.totalReservations || 0}</div>
                    <div>Completed: {analyticsData?.completedReservations || 0}</div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;