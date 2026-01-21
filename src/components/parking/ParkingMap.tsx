import React, { useState, useEffect, useRef } from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonFab, IonFabButton } from '@ionic/react';
import { car, checkmark, time, close, add, remove, locate } from 'ionicons/icons';
import { ParkingSpot } from '../../types';
import './ParkingMap.css';

interface ParkingMapProps {
  spots: ParkingSpot[];
  onSpotSelect: (spot: ParkingSpot) => void;
  selectedSpotId?: string;
}

const ParkingMap = ({ spots, onSpotSelect, selectedSpotId }: ParkingMapProps) => {
  const [hoveredSpot, setHoveredSpot] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSpotColor = (spot: ParkingSpot) => {
    switch (spot.status) {
      case 'available':
        return '#10dc60';
      case 'reserved':
        return '#ffce00';
      case 'occupied':
        return '#f04141';
      case 'maintenance':
        return '#7044ff';
      default:
        return '#92949c';
    }
  };

  const getSpotIcon = (spot: ParkingSpot) => {
    switch (spot.status) {
      case 'available':
        return checkmark;
      case 'reserved':
        return time;
      case 'occupied':
        return car;
      case 'maintenance':
        return close;
      default:
        return car;
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  const renderSpot = (spot: ParkingSpot) => {
    const isSelected = selectedSpotId === spot.id;
    const isHovered = hoveredSpot === spot.id;
    const isClickable = spot.status === 'available';

    return (
      <div
        key={spot.id}
        className={`parking-spot ${spot.type} ${spot.size} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isClickable ? 'clickable' : ''}`}
        style={{
          position: 'absolute',
          left: `${spot.coordinates.x}px`,
          top: `${spot.coordinates.y}px`,
          width: '60px',
          height: '40px',
          backgroundColor: getSpotColor(spot),
          border: '2px solid #fff',
          borderRadius: '8px',
          cursor: isClickable ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#fff',
          transition: 'all 0.2s ease',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          zIndex: isSelected ? 10 : 1,
          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onClick={() => isClickable && onSpotSelect(spot)}
        onMouseEnter={() => setHoveredSpot(spot.id)}
        onMouseLeave={() => setHoveredSpot(null)}
      >
        <div style={{ textAlign: 'center' }}>
          <IonIcon icon={getSpotIcon(spot)} size="small" />
          <div style={{ fontSize: '10px', marginTop: '2px' }}>{spot.number}</div>
          {spot.accessible && <div style={{ fontSize: '8px' }}>♿</div>}
        </div>
        
        {(isHovered || isSelected) && (
          <div 
            className="spot-tooltip"
            style={{
              position: 'absolute',
              top: '-120px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 1000,
              minWidth: '150px',
              fontSize: '12px'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{spot.number}</div>
            <div>Zone: {spot.zone}</div>
            <div>Type: {spot.type}</div>
            <div>Size: {spot.size}</div>
            <div>Price: {spot.pricePerHour} TND/h</div>
            {spot.features.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                {spot.features.map((feature, index) => (
                  <IonBadge key={index} color="primary" style={{ marginRight: '2px', fontSize: '8px' }}>
                    {feature}
                  </IonBadge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <IonCard className="parking-map-card">
      <IonCardContent>
        <div 
          ref={containerRef}
          className="parking-map-container"
          style={{
            position: 'relative',
            width: '100%',
            height: '400px',
            overflow: 'hidden',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#f5f5f5',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div
            ref={mapRef}
            className="parking-map"
            style={{
              position: 'relative',
              width: '800px',
              height: '600px',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              backgroundImage: `
                linear-gradient(90deg, #e0e0e0 1px, transparent 1px),
                linear-gradient(#e0e0e0 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              backgroundPosition: '0 0'
            }}
          >
            {/* Zone Areas */}
            <div 
              className="zone-area zone-a"
              style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                width: '300px',
                height: '200px',
                backgroundColor: 'rgba(16, 220, 96, 0.1)',
                border: '2px dashed #10dc60',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#10dc60'
              }}
            >
              Zone A - Premium
            </div>
            
            <div 
              className="zone-area zone-b"
              style={{
                position: 'absolute',
                left: '350px',
                top: '20px',
                width: '400px',
                height: '250px',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                border: '2px dashed #007bff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#007bff'
              }}
            >
              Zone B - Standard
            </div>
            
            <div 
              className="zone-area zone-c"
              style={{
                position: 'absolute',
                left: '20px',
                top: '300px',
                width: '350px',
                height: '250px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '2px dashed #ffc107',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#ffc107'
              }}
            >
              Zone C - Electric
            </div>
            
            {/* Roads */}
            <div 
              className="road road-main"
              style={{
                position: 'absolute',
                left: '0px',
                top: '280px',
                width: '800px',
                height: '40px',
                backgroundColor: '#666',
                borderRadius: '4px'
              }}
            />
            
            <div 
              className="road road-vertical"
              style={{
                position: 'absolute',
                left: '330px',
                top: '0px',
                width: '40px',
                height: '600px',
                backgroundColor: '#666',
                borderRadius: '4px'
              }}
            />
            
            {/* Entrance/Exit */}
            <div 
              className="entrance"
              style={{
                position: 'absolute',
                left: '10px',
                top: '250px',
                padding: '8px 12px',
                backgroundColor: '#28a745',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ENTRANCE
            </div>
            
            <div 
              className="exit"
              style={{
                position: 'absolute',
                right: '10px',
                top: '250px',
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              EXIT
            </div>
            
            {/* Parking Spots */}
            {spots.map(renderSpot)}
          </div>
          
          {/* Map Controls */}
          <div 
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 100
            }}
          >
            <IonFabButton size="small" onClick={handleZoomIn}>
              <IonIcon icon={add} />
            </IonFabButton>
            <IonFabButton size="small" onClick={handleZoomOut}>
              <IonIcon icon={remove} />
            </IonFabButton>
            <IonFabButton size="small" onClick={handleResetView}>
              <IonIcon icon={locate} />
            </IonFabButton>
          </div>
          
          {/* Scale Indicator */}
          <div 
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              padding: '4px 8px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 100
            }}
          >
            Zoom: {Math.round(scale * 100)}%
          </div>
        </div>
        
        {/* Legend */}
        <div className="map-legend" style={{ marginTop: '16px' }}>
          <h4>Legend</h4>
          <IonGrid>
            <IonRow>
              <IonCol size="6" sizeMd="3">
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-color" style={{ width: '20px', height: '20px', backgroundColor: '#10dc60', borderRadius: '4px' }}></div>
                  <span>Available</span>
                </div>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-color" style={{ width: '20px', height: '20px', backgroundColor: '#ffce00', borderRadius: '4px' }}></div>
                  <span>Reserved</span>
                </div>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-color" style={{ width: '20px', height: '20px', backgroundColor: '#f04141', borderRadius: '4px' }}></div>
                  <span>Occupied</span>
                </div>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="legend-color" style={{ width: '20px', height: '20px', backgroundColor: '#7044ff', borderRadius: '4px' }}></div>
                  <span>Maintenance</span>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ParkingMap;