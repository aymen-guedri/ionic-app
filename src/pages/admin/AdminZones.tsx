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
  IonTextarea,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonBadge
} from '@ionic/react';
import { add, create, trash, close, location } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ParkingZone } from '../../types';
import { createZone, updateZone, deleteZone } from '../../services/admin';

const AdminZones: React.FC = () => {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ParkingZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    description: '',
    priceMultiplier: 1.0
  });

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

  const handleCreate = async () => {
    try {
      await createZone({
        ...zoneForm,
        coordinates: { latitude: 0, longitude: 0 },
        totalSpots: 0,
        availableSpots: 0,
        features: []
      });
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating zone:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingZone) return;
    try {
      await updateZone(editingZone.id, zoneForm);
      setShowModal(false);
      setEditingZone(null);
      resetForm();
    } catch (error) {
      console.error('Error updating zone:', error);
    }
  };

  const handleDelete = async (zoneId: string) => {
    try {
      await deleteZone(zoneId);
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  const openEdit = (zone: ParkingZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      description: zone.description,
      priceMultiplier: zone.priceMultiplier
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setZoneForm({
      name: '',
      description: '',
      priceMultiplier: 1.0
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Manage Zones</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => setTimeout(() => e.detail.complete(), 1000)}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Parking Zones</h3>
            <IonButton onClick={() => setShowModal(true)}>
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
                      <IonButton size="small" fill="outline" onClick={() => openEdit(zone)}>
                        <IonIcon icon={create} />
                      </IonButton>
                      <IonButton size="small" color="danger" fill="outline" onClick={() => handleDelete(zone.id)}>
                        <IonIcon icon={trash} />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* Zone Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => { setShowModal(false); setEditingZone(null); resetForm(); }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingZone ? 'Edit Zone' : 'Create Zone'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowModal(false); setEditingZone(null); resetForm(); }}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonInput
                label="Zone Name"
                labelPlacement="stacked"
                value={zoneForm.name}
                onIonInput={e => setZoneForm({ ...zoneForm, name: e.detail.value! })}
                placeholder="Enter zone name"
              />
              
              <IonTextarea
                label="Description"
                labelPlacement="stacked"
                value={zoneForm.description}
                onIonInput={e => setZoneForm({ ...zoneForm, description: e.detail.value! })}
                placeholder="Enter zone description"
              />
              
              <IonInput
                label="Price Multiplier"
                labelPlacement="stacked"
                type="number"
                value={zoneForm.priceMultiplier}
                onIonInput={e => setZoneForm({ ...zoneForm, priceMultiplier: parseFloat(e.detail.value!) || 1.0 })}
                placeholder="1.0"
              />
              
              <div style={{ marginTop: '24px' }}>
                <IonButton
                  expand="block"
                  onClick={editingZone ? handleUpdate : handleCreate}
                  disabled={!zoneForm.name.trim()}
                >
                  {editingZone ? 'Update Zone' : 'Create Zone'}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminZones;