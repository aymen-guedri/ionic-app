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
  IonItem,
  IonText,
  IonAlert
} from '@ionic/react';
import { add, create, trash, close, car, qrCode, download, copy } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ParkingSpot, ParkingZone } from '../../types';
import { createSpot, updateSpot, deleteSpot, updateSpotAvailability } from '../../services/admin';
import QRCode from 'qrcode';

const AdminSpots: React.FC = () => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const [spotForm, setSpotForm] = useState({
    number: '',
    zone: '',
    type: 'outdoor' as 'covered' | 'outdoor',
    size: 'standard' as 'standard' | 'large' | 'compact',
    accessible: false,
    coordinates: { x: 0, y: 0 },
    pricePerHour: 2.0,
    position: '' // New field for predefined positions
  });

  // Predefined positions for each zone
  const zonePositions = {
    'Zone A': [
      { label: 'A1 - Front Left', x: 50, y: 50 },
      { label: 'A2 - Front Center', x: 120, y: 50 },
      { label: 'A3 - Front Right', x: 190, y: 50 },
      { label: 'A4 - Back Left', x: 50, y: 120 },
      { label: 'A5 - Back Center', x: 120, y:120 },
      { label: 'A6 - Back Right', x: 190, y: 120 },
      { label: 'A7 - Side Left', x: 260, y: 80 },
      { label: 'A8 - Side Right', x: 260, y: 140 }
    ],
    'Zone B': [
      { label: 'B1 - Row 1 Left', x: 380, y: 50 },
      { label: 'B2 - Row 1 Center', x: 450, y: 50 },
      { label: 'B3 - Row 1 Right', x: 520, y: 50 },
      { label: 'B4 - Row 2 Left', x: 380, y: 110 },
      { label: 'B5 - Row 2 Center', x: 450, y: 110 },
      { label: 'B6 - Row 2 Right', x: 520, y: 110 },
      { label: 'B7 - Row 3 Left', x: 380, y: 170 },
      { label: 'B8 - Row 3 Center', x: 450, y: 170 },
      { label: 'B9 - Row 3 Right', x: 520, y: 170 },
      { label: 'B10 - Back Left', x: 590, y: 80 },
      { label: 'B11 - Back Center', x: 590, y: 140 },
      { label: 'B12 - Back Right', x: 650, y: 110 }
    ],
    'Zone C': [
      { label: 'C1 - Front Left', x: 50, y: 330 },
      { label: 'C2 - Front Center', x: 120, y: 330 },
      { label: 'C3 - Front Right', x: 190, y: 330 },
      { label: 'C4 - Middle Left', x: 50, y: 390 },
      { label: 'C5 - Middle Center', x: 120, y: 390 },
      { label: 'C6 - Middle Right', x: 190, y: 390 },
      { label: 'C7 - Back Left', x: 50, y: 450 },
      { label: 'C8 - Back Center', x: 120, y: 450 },
      { label: 'C9 - Back Right', x: 190, y: 450 },
      { label: 'C10 - Side Top', x: 260, y: 350 },
      { label: 'C11 - Side Bottom', x: 260, y: 420 }
    ]
  };

  useEffect(() => {
    const unsubscribeSpots = onSnapshot(collection(db, 'parkingSpots'), (snapshot) => {
      const spotsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          occupiedUntil: data.occupiedUntil?.toDate ? data.occupiedUntil.toDate() : data.occupiedUntil
        };
      }) as ParkingSpot[];
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
      pricePerHour: spot.pricePerHour,
      position: '' // Add position field for editing
    });
    setShowModal(true);
  };

  const handlePositionChange = (position: string) => {
    const selectedZone = spotForm.zone as keyof typeof zonePositions;
    if (selectedZone && zonePositions[selectedZone]) {
      const positionData = zonePositions[selectedZone].find(p => p.label === position);
      if (positionData) {
        setSpotForm({
          ...spotForm,
          position,
          coordinates: { x: positionData.x, y: positionData.y }
        });
      }
    }
  };

  const handleZoneChange = (zone: string) => {
    setSpotForm({
      ...spotForm,
      zone,
      position: '', // Reset position when zone changes
      coordinates: { x: 0, y: 0 }
    });
  };

  const resetForm = () => {
    setSpotForm({
      number: '',
      zone: '',
      type: 'outdoor',
      size: 'standard',
      accessible: false,
      coordinates: { x: 0, y: 0 },
      pricePerHour: 2.0,
      position: ''
    });
  };

  const showQRCode = async (spot: ParkingSpot) => {
    console.log('QR Code button clicked for spot:', spot.number);
    try {
      const qrData = JSON.stringify({
        spotId: spot.id,
        spotNumber: spot.number,
        zone: spot.zone,
        price: spot.pricePerHour
      });
      
      console.log('Generating QR code with data:', qrData);
      
      const qrImageUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('QR code generated successfully');
      
      setSelectedSpot(spot);
      setQrCodeImage(qrImageUrl);
      setShowQRModal(true);
      
      console.log('Modal should be open now');
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyQRData = () => {
    if (!selectedSpot) return;
    
    const qrData = JSON.stringify({
      spotId: selectedSpot.id,
      spotNumber: selectedSpot.number,
      zone: selectedSpot.zone,
      price: selectedSpot.pricePerHour
    });
    
    navigator.clipboard.writeText(qrData).then(() => {
      // You could add a toast notification here if needed
      console.log('QR data copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy QR data:', err);
    });
  };

  const downloadQRCode = () => {
    if (!selectedSpot || !qrCodeImage) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${selectedSpot.number}.png`;
    link.href = qrCodeImage;
    link.click();
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <IonButton color="secondary" onClick={() => setShowQRModal(true)}>
                Test QR Modal
              </IonButton>
              <IonButton onClick={() => setShowModal(true)}>
                <IonIcon icon={add} slot="start" />
                Add Spot
              </IonButton>
            </div>
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
                            {spot.occupiedUntil && spot.status === 'occupied' && (
                              <p><strong>Available at:</strong> {new Date(spot.occupiedUntil).toLocaleString()}</p>
                            )}
                            <p><strong>QR Code:</strong> 
                              <IonText color="success">✓ Generated</IonText>
                            </p>
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
                          <IonButton size="small" color="tertiary" fill="outline" onClick={() => showQRCode(spot)}>
                            <IonIcon icon={qrCode} />
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
                  onIonChange={e => handleZoneChange(e.detail.value)}
                  placeholder="Select zone"
                >
                  {zones.map(zone => (
                    <IonSelectOption key={zone.id} value={zone.name}>
                      {zone.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              {/* Position Selector - Only show when zone is selected */}
              {spotForm.zone && zonePositions[spotForm.zone as keyof typeof zonePositions] && (
                <IonItem>
                  <IonLabel position="stacked">Position in {spotForm.zone}</IonLabel>
                  <IonSelect
                    value={spotForm.position}
                    onIonChange={e => handlePositionChange(e.detail.value)}
                    placeholder="Select position"
                  >
                    {zonePositions[spotForm.zone as keyof typeof zonePositions].map(position => (
                      <IonSelectOption key={position.label} value={position.label}>
                        {position.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}
              
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
              
              {/* Show coordinates for reference */}
              {spotForm.position && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#2d2d2d', 
                  color: '#ffffff',
                  borderRadius: '8px', 
                  margin: '16px 0',
                  fontSize: '0.9rem'
                }}>
                  <strong>Selected Position:</strong> {spotForm.position}<br/>
                  <strong>Coordinates:</strong> X: {spotForm.coordinates.x}, Y: {spotForm.coordinates.y}
                </div>
              )}
              
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
                  disabled={!spotForm.number.trim() || !spotForm.zone.trim() || !spotForm.position.trim()}
                >
                  {editingSpot ? 'Update Spot' : 'Create Spot'}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* QR Code Modal */}
        <IonModal isOpen={showQRModal} onDidDismiss={() => setShowQRModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>QR Code - {selectedSpot?.number}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowQRModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {selectedSpot && (
                <>
                  <h3>Parking Spot: {selectedSpot.number}</h3>
                  <p><strong>Zone:</strong> {selectedSpot.zone}</p>
                  <p><strong>Price:</strong> {selectedSpot.pricePerHour} TND/h</p>
                  
                  <div style={{ margin: '20px 0' }}>
                    {qrCodeImage && (
                      <img 
                        src={qrCodeImage} 
                        alt={`QR Code for ${selectedSpot.number}`}
                        style={{ 
                          maxWidth: '300px', 
                          width: '100%', 
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          padding: '10px',
                          backgroundColor: 'white'
                        }} 
                      />
                    )}
                  </div>
                  
                  {/* QR Code Data */}
                  <IonCard style={{ marginTop: '20px', textAlign: 'left' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>QR Code Data:</h4>
                        <IonButton size="small" fill="clear" onClick={copyQRData}>
                          <IonIcon icon={copy} />
                        </IonButton>
                      </div>
                      <div style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '10px', 
                        borderRadius: '4px', 
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        wordBreak: 'break-all'
                      }}>
                        {JSON.stringify({
                          spotId: selectedSpot.id,
                          spotNumber: selectedSpot.number,
                          zone: selectedSpot.zone,
                          price: selectedSpot.pricePerHour
                        }, null, 2)}
                      </div>
                      <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                        Users can enter just the spot number: <strong>{selectedSpot.number}</strong>
                      </p>
                    </IonCardContent>
                  </IonCard>
                  
                  <IonButton 
                    expand="block" 
                    color="primary" 
                    onClick={downloadQRCode}
                    style={{ marginTop: '20px' }}
                  >
                    <IonIcon icon={download} slot="start" />
                    Download QR Code
                  </IonButton>
                  
                  <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                    Scan this QR code to access parking spot information
                  </p>
                </>
              )}
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminSpots;