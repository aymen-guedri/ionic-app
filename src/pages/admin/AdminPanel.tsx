import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonToast,
  IonAlert,
  IonText,
  IonButtons,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { 
  people, 
  car, 
  time, 
  checkmark, 
  close, 
  add, 
  create, 
  trash, 
  analytics as analyticsIcon,
  location,
  settings
} from 'ionicons/icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { ParkingZone, ParkingSpot, Reservation, User } from '../../types';
import {
  createZone,
  updateZone,
  deleteZone,
  createSpot,
  updateSpot,
  deleteSpot,
  updateSpotAvailability,
  approveReservation,
  rejectReservation,
  getAnalytics
} from '../../services/admin';

type AdminTab = 'dashboard' | 'reservations' | 'zones' | 'spots' | 'users';

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

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({});
  
  // Modal states
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ParkingZone | null>(null);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  
  // Form states
  const [zoneForm, setZoneForm] = useState({
    name: '',
    description: '',
    priceMultiplier: 1.0,
    features: [] as string[]
  });
  
  const [spotForm, setSpotForm] = useState({
    number: '',
    zone: '',
    type: 'outdoor' as 'covered' | 'outdoor',
    size: 'standard' as 'standard' | 'large' | 'compact',
    accessible: false,
    coordinates: { x: 0, y: 0 },
    pricePerHour: 2.0,
    features: [] as string[]
  });

  // Check admin access
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <IonIcon icon={close} size="large" color="danger" />
            <h2>Access Denied</h2>
            <p>You don't have permission to access the admin panel.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Load data
  useEffect(() => {
    const unsubscribeZones = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ParkingZone[];
      setZones(zonesData);
    });

    const unsubscribeSpots = onSnapshot(collection(db, 'parkingSpots'), (snapshot) => {
      const spotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[];
      setSpots(spotsData);
    });

    const unsubscribeReservations = onSnapshot(
      collection(db, 'reservations'),
      (snapshot) => {
        const reservationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate() || new Date(),
          endTime: doc.data().endTime?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          approvedAt: doc.data().approvedAt?.toDate()
        })) as Reservation[];
        
        // Sort by createdAt in memory
        reservationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setReservations(reservationsData);
      }
    );

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as User[];
      setUsers(usersData);
    });

    return () => {
      unsubscribeZones();
      unsubscribeSpots();
      unsubscribeReservations();
      unsubscribeUsers();
    };
  }, []);

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analyticsData = await getAnalytics();
        setAnalytics(analyticsData as Analytics);
      } catch (error) {
        console.error('Error loading analytics:', error);
        setAnalytics(null);
      }
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Zone management
  const handleCreateZone = async () => {
    try {
      await createZone({
        ...zoneForm,
        coordinates: { latitude: 0, longitude: 0 },
        totalSpots: 0,
        availableSpots: 0
      });
      setShowZoneModal(false);
      resetZoneForm();
      setToast({ message: 'Zone created successfully!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to create zone', color: 'danger' });
    }
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;
    try {
      await updateZone(editingZone.id, zoneForm);
      setShowZoneModal(false);
      setEditingZone(null);
      resetZoneForm();
      setToast({ message: 'Zone updated successfully!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to update zone', color: 'danger' });
    }
  };

  const handleDeleteZone = (zone: ParkingZone) => {
    setAlertConfig({
      header: 'Delete Zone',
      message: `Are you sure you want to delete ${zone.name}? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteZone(zone.id);
              setToast({ message: 'Zone deleted successfully!', color: 'success' });
            } catch (error) {
              setToast({ message: 'Failed to delete zone', color: 'danger' });
            }
          }
        }
      ]
    });
    setShowAlert(true);
  };

  // Spot management
  const handleCreateSpot = async () => {
    try {
      await createSpot({
        ...spotForm,
        status: 'available',
        qrCode: `spot-${spotForm.number}-${Date.now()}`
      });
      setShowSpotModal(false);
      resetSpotForm();
      setToast({ message: 'Spot created successfully!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to create spot', color: 'danger' });
    }
  };

  const handleUpdateSpot = async () => {
    if (!editingSpot) return;
    try {
      await updateSpot(editingSpot.id, spotForm);
      setShowSpotModal(false);
      setEditingSpot(null);
      resetSpotForm();
      setToast({ message: 'Spot updated successfully!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to update spot', color: 'danger' });
    }
  };

  const handleDeleteSpot = (spot: ParkingSpot) => {
    setAlertConfig({
      header: 'Delete Spot',
      message: `Are you sure you want to delete spot ${spot.number}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteSpot(spot.id);
              setToast({ message: 'Spot deleted successfully!', color: 'success' });
            } catch (error) {
              setToast({ message: 'Failed to delete spot', color: 'danger' });
            }
          }
        }
      ]
    });
    setShowAlert(true);
  };

  const handleSpotStatusChange = async (spotId: string, status: ParkingSpot['status']) => {
    try {
      await updateSpotAvailability(spotId, status);
      setToast({ message: 'Spot status updated!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to update spot status', color: 'danger' });
    }
  };

  // Reservation management
  const handleApproveReservation = async (reservationId: string) => {
    try {
      await approveReservation(reservationId, currentUser.id);
      setToast({ message: 'Reservation approved!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to approve reservation', color: 'danger' });
    }
  };

  const handleRejectReservation = async (reservationId: string, notes?: string) => {
    try {
      await rejectReservation(reservationId, currentUser.id, notes);
      setToast({ message: 'Reservation rejected!', color: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to reject reservation', color: 'danger' });
    }
  };

  // Form helpers
  const resetZoneForm = () => {
    setZoneForm({
      name: '',
      description: '',
      priceMultiplier: 1.0,
      features: []
    });
  };

  const resetSpotForm = () => {
    setSpotForm({
      number: '',
      zone: '',
      type: 'outdoor',
      size: 'standard',
      accessible: false,
      coordinates: { x: 0, y: 0 },
      pricePerHour: 2.0,
      features: []
    });
  };

  const openEditZone = (zone: ParkingZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      description: zone.description,
      priceMultiplier: zone.priceMultiplier,
      features: zone.features
    });
    setShowZoneModal(true);
  };

  const openEditSpot = (spot: ParkingSpot) => {
    setEditingSpot(spot);
    setSpotForm({
      number: spot.number,
      zone: spot.zone,
      type: spot.type,
      size: spot.size,
      accessible: spot.accessible,
      coordinates: spot.coordinates,
      pricePerHour: spot.pricePerHour,
      features: spot.features
    });
    setShowSpotModal(true);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'active': return 'primary';
      case 'completed': return 'medium';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'available': return 'success';
      case 'occupied': return 'danger';
      case 'reserved': return 'warning';
      case 'maintenance': return 'dark';
      default: return 'medium';
    }
  };

  // Render functions
  const renderDashboard = () => (
    <div>
      <IonGrid>
        <IonRow>
          <IonCol size="6" sizeMd="3">
            <IonCard>
              <IonCardContent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <IonIcon icon={people} color="primary" size="large" />
                  <div>
                    <h2>{analytics?.totalUsers || 0}</h2>
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
                    <h2>{analytics?.availableSpots || 0}</h2>
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
                    <h2>{analytics?.pendingReservations || 0}</h2>
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
                  <IonIcon icon={analyticsIcon} color="tertiary" size="large" />
                  <div>
                    <h2>{analytics?.totalRevenue || 0} TND</h2>
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
                  {analytics?.occupancyRate || '0'}%
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
                  <div>Total Spots: {analytics?.totalSpots || 0}</div>
                  <div>Occupied: {analytics?.occupiedSpots || 0}</div>
                  <div>Total Reservations: {analytics?.totalReservations || 0}</div>
                  <div>Completed: {analytics?.completedReservations || 0}</div>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );

  const renderReservations = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Manage Reservations</h3>
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
                        onClick={() => handleApproveReservation(reservation.id)}
                      >
                        <IonIcon icon={checkmark} />
                      </IonButton>
                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() => handleRejectReservation(reservation.id)}
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
  );

  const renderZones = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Manage Zones</h3>
        <IonButton onClick={() => setShowZoneModal(true)}>
          <IonIcon icon={add} slot="start" />
          Add Zone
        </IonButton>
      </div>
      
      {zones.length === 0 ? (
        <IonCard>
          <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
            <IonIcon icon={location} size="large" color="medium" />
            <h3>No Zones</h3>
            <p>Create your first parking zone to get started.</p>
          </IonCardContent>
        </IonCard>
      ) : (
        zones.map((zone) => (
          <IonCard key={zone.id}>
            <IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3>{zone.name}</h3>
                  <p>{zone.description}</p>
                  <p><strong>Price Multiplier:</strong> ×{zone.priceMultiplier}</p>
                  <p><strong>Total Spots:</strong> {zone.totalSpots}</p>
                  <p><strong>Available:</strong> {zone.availableSpots}</p>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {zone.features.map((feature, index) => (
                      <IonBadge key={index} color="primary">{feature}</IonBadge>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IonButton size="small" fill="outline" onClick={() => openEditZone(zone)}>
                    <IonIcon icon={create} />
                  </IonButton>
                  <IonButton size="small" color="danger" fill="outline" onClick={() => handleDeleteZone(zone)}>
                    <IonIcon icon={trash} />
                  </IonButton>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))
      )}
    </div>
  );

  const renderSpots = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Manage Spots</h3>
        <IonButton onClick={() => setShowSpotModal(true)}>
          <IonIcon icon={add} slot="start" />
          Add Spot
        </IonButton>
      </div>
      
      {spots.length === 0 ? (
        <IonCard>
          <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
            <IonIcon icon={car} size="large" color="medium" />
            <h3>No Spots</h3>
            <p>Create your first parking spot to get started.</p>
          </IonCardContent>
        </IonCard>
      ) : (
        <IonGrid>
          <IonRow>
            {spots.map((spot) => (
              <IonCol key={spot.id} size="12" sizeMd="6" sizeLg="4">
                <IonCard>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3>{spot.number}</h3>
                        <p><strong>Zone:</strong> {spot.zone}</p>
                        <p><strong>Type:</strong> {spot.type}</p>
                        <p><strong>Size:</strong> {spot.size}</p>
                        <p><strong>Price:</strong> {spot.pricePerHour} TND/h</p>
                        {spot.accessible && <IonBadge color="secondary">Accessible</IonBadge>}
                      </div>
                      <IonBadge color={getStatusColor(spot.status)}>
                        {spot.status.toUpperCase()}
                      </IonBadge>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                      {spot.features.map((feature, index) => (
                        <IonBadge key={index} color="primary" size="small">{feature}</IonBadge>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <IonButton size="small" fill="outline" onClick={() => openEditSpot(spot)}>
                        <IonIcon icon={create} />
                      </IonButton>
                      <IonButton size="small" color="danger" fill="outline" onClick={() => handleDeleteSpot(spot)}>
                        <IonIcon icon={trash} />
                      </IonButton>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <IonButton 
                        size="small" 
                        color="success" 
                        fill={spot.status === 'available' ? 'solid' : 'outline'}
                        onClick={() => handleSpotStatusChange(spot.id, 'available')}
                      >
                        Available
                      </IonButton>
                      <IonButton 
                        size="small" 
                        color="danger" 
                        fill={spot.status === 'occupied' ? 'solid' : 'outline'}
                        onClick={() => handleSpotStatusChange(spot.id, 'occupied')}
                      >
                        Occupied
                      </IonButton>
                      <IonButton 
                        size="small" 
                        color="dark" 
                        fill={spot.status === 'maintenance' ? 'solid' : 'outline'}
                        onClick={() => handleSpotStatusChange(spot.id, 'maintenance')}
                      >
                        Maintenance
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      )}
    </div>
  );

  const renderUsers = () => (
    <div>
      <h3>Manage Users</h3>
      {users.length === 0 ? (
        <IonCard>
          <IonCardContent style={{ textAlign: 'center', padding: '40px' }}>
            <IonIcon icon={people} size="large" color="medium" />
            <h3>No Users</h3>
            <p>No users found in the system.</p>
          </IonCardContent>
        </IonCard>
      ) : (
        users.map((user) => (
          <IonCard key={user.id}>
            <IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{user.name}</h3>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                  <p><strong>Loyalty Points:</strong> {user.loyaltyPoints}</p>
                  <p><strong>Tier:</strong> {user.tier}</p>
                  <p><strong>Joined:</strong> {formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <IonBadge color={user.role === 'admin' ? 'danger' : 'primary'}>
                    {user.role.toUpperCase()}
                  </IonBadge>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        ))
      )}
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Panel</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { setTimeout(() => e.detail.complete(), 1000); }}>
          <IonRefresherContent />
        </IonRefresher>
        
        <IonSegment
          value={activeTab}
          onIonChange={e => setActiveTab(e.detail.value as AdminTab)}
          style={{ margin: '16px' }}
        >
          <IonSegmentButton value="dashboard">
            <IonLabel>Dashboard</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="reservations">
            <IonLabel>Reservations</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="zones">
            <IonLabel>Zones</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="spots">
            <IonLabel>Spots</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="users">
            <IonLabel>Users</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        
        <div style={{ padding: '16px' }}>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'reservations' && renderReservations()}
          {activeTab === 'zones' && renderZones()}
          {activeTab === 'spots' && renderSpots()}
          {activeTab === 'users' && renderUsers()}
        </div>

        {/* Zone Modal */}
        <IonModal isOpen={showZoneModal} onDidDismiss={() => { setShowZoneModal(false); setEditingZone(null); resetZoneForm(); }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingZone ? 'Edit Zone' : 'Create Zone'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowZoneModal(false); setEditingZone(null); resetZoneForm(); }}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">Zone Name</IonLabel>
                <IonInput
                  value={zoneForm.name}
                  onIonInput={e => setZoneForm({ ...zoneForm, name: e.detail.value! })}
                  placeholder="Enter zone name"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={zoneForm.description}
                  onIonInput={e => setZoneForm({ ...zoneForm, description: e.detail.value! })}
                  placeholder="Enter zone description"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Price Multiplier</IonLabel>
                <IonInput
                  type="number"
                  value={zoneForm.priceMultiplier}
                  onIonInput={e => setZoneForm({ ...zoneForm, priceMultiplier: parseFloat(e.detail.value!) || 1.0 })}
                  placeholder="1.0"
                />
              </IonItem>
              
              <div style={{ marginTop: '24px' }}>
                <IonButton
                  expand="block"
                  onClick={editingZone ? handleUpdateZone : handleCreateZone}
                  disabled={!zoneForm.name.trim()}
                >
                  {editingZone ? 'Update Zone' : 'Create Zone'}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Spot Modal */}
        <IonModal isOpen={showSpotModal} onDidDismiss={() => { setShowSpotModal(false); setEditingSpot(null); resetSpotForm(); }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingSpot ? 'Edit Spot' : 'Create Spot'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowSpotModal(false); setEditingSpot(null); resetSpotForm(); }}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">Spot Number</IonLabel>
                <IonInput
                  value={spotForm.number}
                  onIonInput={e => setSpotForm({ ...spotForm, number: e.detail.value! })}
                  placeholder="A-01"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Zone</IonLabel>
                <IonSelect
                  value={spotForm.zone}
                  onIonChange={e => setSpotForm({ ...spotForm, zone: e.detail.value })}
                  placeholder="Select zone"
                >
                  {zones.map(zone => (
                    <IonSelectOption key={zone.id} value={zone.name}>
                      {zone.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Type</IonLabel>
                <IonSelect
                  value={spotForm.type}
                  onIonChange={e => setSpotForm({ ...spotForm, type: e.detail.value })}
                >
                  <IonSelectOption value="outdoor">Outdoor</IonSelectOption>
                  <IonSelectOption value="covered">Covered</IonSelectOption>
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Size</IonLabel>
                <IonSelect
                  value={spotForm.size}
                  onIonChange={e => setSpotForm({ ...spotForm, size: e.detail.value })}
                >
                  <IonSelectOption value="compact">Compact</IonSelectOption>
                  <IonSelectOption value="standard">Standard</IonSelectOption>
                  <IonSelectOption value="large">Large</IonSelectOption>
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Price per Hour (TND)</IonLabel>
                <IonInput
                  type="number"
                  value={spotForm.pricePerHour}
                  onIonInput={e => setSpotForm({ ...spotForm, pricePerHour: parseFloat(e.detail.value!) || 2.0 })}
                  placeholder="2.0"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">X Coordinate</IonLabel>
                <IonInput
                  type="number"
                  value={spotForm.coordinates.x}
                  onIonInput={e => setSpotForm({ 
                    ...spotForm, 
                    coordinates: { ...spotForm.coordinates, x: parseInt(e.detail.value!) || 0 }
                  })}
                  placeholder="0"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Y Coordinate</IonLabel>
                <IonInput
                  type="number"
                  value={spotForm.coordinates.y}
                  onIonInput={e => setSpotForm({ 
                    ...spotForm, 
                    coordinates: { ...spotForm.coordinates, y: parseInt(e.detail.value!) || 0 }
                  })}
                  placeholder="0"
                />
              </IonItem>
              
              <IonItem>
                <IonCheckbox
                  checked={spotForm.accessible}
                  onIonChange={e => setSpotForm({ ...spotForm, accessible: e.detail.checked })}
                />
                <IonLabel style={{ marginLeft: '12px' }}>Accessible (Disabled Access)</IonLabel>
              </IonItem>
              
              <div style={{ marginTop: '24px' }}>
                <IonButton
                  expand="block"
                  onClick={editingSpot ? handleUpdateSpot : handleCreateSpot}
                  disabled={!spotForm.number.trim() || !spotForm.zone.trim()}
                >
                  {editingSpot ? 'Update Spot' : 'Create Spot'}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          {...alertConfig}
        />

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

export default AdminPanel;