// TypeScript interfaces for Smart Parking App
// Interfaces TypeScript pour l'application Smart Parking

// User interface - represents a user in the system
// Interface utilisateur - représente un utilisateur dans le système
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  avatar?: string;
  loyaltyPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  createdAt: Date;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: 'fr' | 'en' | 'ar';
  };
}

// Parking spot interface - represents a parking spot
// Interface place de parking - représente une place de parking
export interface ParkingSpot {
  id: string;
  number: string; // A-01, B-15, etc.
  zone: string; // Zone A, Zone B, etc.
  type: 'covered' | 'outdoor';
  size: 'standard' | 'large' | 'compact';
  accessible: boolean; // For disabled persons
  coordinates: {
    x: number; // X position on map
    y: number; // Y position on map
  };
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  pricePerHour: number; // Base price in TND
  features: string[]; // ['covered', 'electric_charging', 'security_camera']
  qrCode?: string; // QR code for check-in
  occupiedBy?: string; // User ID who is currently occupying
  occupiedUntil?: Date; // When the spot will be available again
  lastUpdated?: Date; // Last status update
}

// Reservation interface - represents a parking reservation
// Interface réservation - représente une réservation de parking
export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  spotId: string;
  spotNumber: string;
  startTime: Date;
  endTime: Date;
  duration: number; // Duration in hours
  totalCost: number; // Total cost in TND
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  approvedBy?: string; // Admin ID who approved
  approvedAt?: Date;
  notes?: string; // Admin notes
}

// Payment interface - represents a payment transaction
// Interface paiement - représente une transaction de paiement
export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number; // Amount in TND
  currency: 'TND';
  method: 'card' | 'cash' | 'mobile';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Notification interface - represents a push notification
// Interface notification - représente une notification push
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reservation' | 'payment' | 'reminder' | 'promotion';
  data?: any; // Additional data for the notification
  read: boolean;
  createdAt: Date;
}

// Analytics interface - represents usage analytics
// Interface analytique - représente les analyses d'utilisation
export interface Analytics {
  id: string;
  date: Date;
  totalReservations: number;
  approvedReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  totalRevenue: number;
  averageOccupancy: number; // Percentage
  peakHours: string[]; // ['09:00', '17:00']
  popularSpots: string[]; // Most reserved spot IDs
}

// Weather interface - represents weather data
// Interface météo - représente les données météorologiques
export interface Weather {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

// Map coordinates interface - represents geographical coordinates
// Interface coordonnées - représente les coordonnées géographiques
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Parking zone interface - represents a parking zone/area
// Interface zone de parking - représente une zone de parking
export interface ParkingZone {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinates;
  totalSpots: number;
  availableSpots: number;
  priceMultiplier: number; // 1.0 = normal, 1.5 = premium zone
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}