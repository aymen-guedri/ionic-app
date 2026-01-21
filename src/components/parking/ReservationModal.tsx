import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonText,
  IonButtons
} from '@ionic/react';
import { close, car, time, card } from 'ionicons/icons';
import { ParkingSpot } from '../../types';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: ParkingSpot | null;
  onReserve: (spotId: string, duration: number, startTime: Date) => void;
}

const ReservationModal = ({
  isOpen,
  onClose,
  spot,
  onReserve
}: ReservationModalProps) => {
  const [duration, setDuration] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>(new Date().toISOString());

  const calculateCost = () => {
    if (!spot) return 0;
    return spot.pricePerHour * duration;
  };

  const handleReserve = () => {
    if (spot) {
      onReserve(spot.id, duration, new Date(startTime));
      onClose();
    }
  };

  if (!spot) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reserve Parking Spot</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div className="reservation-modal-content">
          {/* Spot Information */}
          <IonCard>
            <IonCardContent>
              <div className="spot-info">
                <div className="spot-header">
                  <IonIcon icon={car} color="primary" />
                  <h2>{spot.number}</h2>
                  <IonBadge color="success">{spot.status}</IonBadge>
                </div>
                
                <div className="spot-details">
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Zone</h3>
                      <p>{spot.zone}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Type</h3>
                      <p>{spot.type}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Size</h3>
                      <p>{spot.size}</p>
                    </IonLabel>
                  </IonItem>
                  
                  <IonItem lines="none">
                    <IonLabel>
                      <h3>Price per Hour</h3>
                      <p>{spot.pricePerHour} TND</p>
                    </IonLabel>
                  </IonItem>
                </div>
                
                {spot.features.length > 0 && (
                  <div className="spot-features">
                    <h4>Features</h4>
                    <div className="features-list">
                      {spot.features.map((feature, index) => (
                        <IonBadge key={index} color="primary">
                          {feature}
                        </IonBadge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Reservation Form */}
          <IonCard>
            <IonCardContent>
              <h3>Reservation Details</h3>
              
              <IonItem>
                <IonLabel position="stacked">Start Time</IonLabel>
                <IonDatetime
                  value={startTime}
                  onIonChange={e => setStartTime(e.detail.value as string)}
                  min={new Date().toISOString()}
                  presentation="date-time"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Duration (hours)</IonLabel>
                <IonSelect
                  value={duration}
                  onIonChange={e => setDuration(e.detail.value)}
                >
                  <IonSelectOption value={0.5}>30 minutes</IonSelectOption>
                  <IonSelectOption value={1}>1 hour</IonSelectOption>
                  <IonSelectOption value={2}>2 hours</IonSelectOption>
                  <IonSelectOption value={3}>3 hours</IonSelectOption>
                  <IonSelectOption value={4}>4 hours</IonSelectOption>
                  <IonSelectOption value={6}>6 hours</IonSelectOption>
                  <IonSelectOption value={8}>8 hours</IonSelectOption>
                  <IonSelectOption value={12}>12 hours</IonSelectOption>
                  <IonSelectOption value={24}>24 hours</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>

          {/* Cost Summary */}
          <IonCard>
            <IonCardContent>
              <div className="cost-summary">
                <h3>Cost Summary</h3>
                
                <div className="cost-breakdown">
                  <div className="cost-item">
                    <span>Base Rate ({duration}h × {spot.pricePerHour} TND)</span>
                    <span>{calculateCost().toFixed(2)} TND</span>
                  </div>
                  
                  <div className="cost-total">
                    <strong>
                      <span>Total Cost</span>
                      <span>{calculateCost().toFixed(2)} TND</span>
                    </strong>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div className="modal-actions">
            <IonButton
              expand="block"
              color="primary"
              onClick={handleReserve}
              className="reserve-button"
            >
              <IonIcon icon={time} slot="start" />
              Reserve Spot
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={onClose}
            >
              Cancel
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ReservationModal;