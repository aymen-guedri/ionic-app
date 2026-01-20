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
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonItem
} from '@ionic/react';
import { add, create, trash, close, car } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ParkingSpot, ParkingZone } from '../../types';
import { createSpot, updateSpot, deleteSpot, updateSpotAvailability } from '../../services/admin';

const AdminSpots: React.FC = () => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [spotForm, setSpotForm] = useState({
    number: '',
    zone: '',
    type: 'outdoor' as 'covered' | 'outdoor',
    size: 'standard' as 'standard' | 'large' | 'compact',
    accessible: false,
    coordinates: { x: 0, y: 0 },
    pricePerHour: 2.0
  });

  useEffect(() => {
    const unsubscribeSpots = onSnapshot(collection(db, 'parkingSpots'), (snapshot) => {
      const spotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSpot[];
      setSpots(spotsData);
    });

    const unsubscribeZones = onSnapshot(collection(db, 'zones'), (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as ParkingZone[];
      setZones(zonesData);
    });

    return () => {
      unsubscribeSpots();
      unsubscribeZones();
    };
  }, []);

  const handleCreate = async () => {
    try {
      await createSpot({
        ...spotForm,
        status: 'available',
        features: [],
        qrCode: `spot-${spotForm.number}-${Date.now()}`
      });
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating spot:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSpot) return;
    try {
      await updateSpot(editingSpot.id, spotForm);
      setShowModal(false);
      setEditingSpot(null);
      resetForm();
    } catch (error) {
      console.error('Error updating spot:', error);
    }
  };

  const handleDelete = async (spotId: string) => {
    try {
      await deleteSpot(spotId);
    } catch (error) {
      console.error('Error deleting spot:', error);
    }
  };

  const handleStatusChange = async (spotId: string, status: ParkingSpot['status']) => {
    try {
      await updateSpotAvailability(spotId, status);
    } catch (error) {
      console.error('Error updating spot status:', error);
    }
  };

  const openEdit = (spot: ParkingSpot) => {
    setEditingSpot(spot);
    setSpotForm({
      number: spot.number,
      zone: spot.zone,
      type: spot.type,
      size: spot.size,
      accessible: spot.accessible,
      coordinates: spot.coordinates,
      pricePerHour: spot.pricePerHour
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setSpotForm({
      number: '',
      zone: '',
      type: 'outdoor',
      size: 'standard',
      accessible: false,
      coordinates: { x: 0, y: 0 },
      pricePerHour: 2.0
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'occupied': return 'danger';
      case 'reserved': return 'warning';
      case 'maintenance': return 'dark';
      default: return 'medium';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Manage Spots</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => setTimeout(() => e.detail.complete(), 1000)}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Parking Spots</h3>
            <IonButton onClick={() => setShowModal(true)}>
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
                        
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <IonButton size="small" fill="outline" onClick={() => openEdit(spot)}>
                            <IonIcon icon={create} />
                          </IonButton>
                          <IonButton size="small" color="danger" fill="outline" onClick={() => handleDelete(spot.id)}>
                            <IonIcon icon={trash} />
                          </IonButton>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <IonButton 
                            size="small" 
                            color="success" 
                            fill={spot.status === 'available' ? 'solid' : 'outline'}
                            onClick={() => handleStatusChange(spot.id, 'available')}
                          >
                            Available
                          </IonButton>
                          <IonButton 
                            size="small" 
                            color="danger" 
                            fill={spot.status === 'occupied' ? 'solid' : 'outline'}
                            onClick={() => handleStatusChange(spot.id, 'occupied')}
                          >
                            Occupied
                          </IonButton>
                          <IonButton 
                            size="small" 
                            color="dark" 
                            fill={spot.status === 'maintenance' ? 'solid' : 'outline'}
                            onClick={() => handleStatusChange(spot.id, 'maintenance')}
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

        {/* Spot Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => { setShowModal(false); setEditingSpot(null); resetForm(); }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingSpot ? 'Edit Spot' : 'Create Spot'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowModal(false); setEditingSpot(null); resetForm(); }}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonInput
                label="Spot Number"
                labelPlacement="stacked"
                value={spotForm.number}
                onIonInput={e => setSpotForm({ ...spotForm, number: e.detail.value! })}
                placeholder="A-01"
              />
              
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
              
              <IonInput
                label="Price per Hour (TND)"
                labelPlacement="stacked"
                type="number"
                value={spotForm.pricePerHour}
                onIonInput={e => setSpotForm({ ...spotForm, pricePerHour: parseFloat(e.detail.value!) || 2.0 })}
                placeholder="2.0"
              />
              
              <IonInput
                label="X Coordinate"
                labelPlacement="stacked"
                type="number"
                value={spotForm.coordinates.x}
                onIonInput={e => setSpotForm({ 
                  ...spotForm, 
                  coordinates: { ...spotForm.coordinates, x: parseInt(e.detail.value!) || 0 }
                })}
                placeholder="0"
              />
              
              <IonInput
                label="Y Coordinate"
                labelPlacement="stacked"
                type="number"
                value={spotForm.coordinates.y}
                onIonInput={e => setSpotForm({ 
                  ...spotForm, 
                  coordinates: { ...spotForm.coordinates, y: parseInt(e.detail.value!) || 0 }
                })}
                placeholder="0"
              />
              
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
                  onClick={editingSpot ? handleUpdate : handleCreate}
                  disabled={!spotForm.number.trim() || !spotForm.zone.trim()}
                >
                  {editingSpot ? 'Update Spot' : 'Create Spot'}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminSpots;