
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

export interface ParkingSpot {
  id: string;
  number: string; // A-01, B-15, etc.
  zone: string; // Zone A, Zone B, etc.
  type: 'covered' | 'outdoor';
  size: 'standard' | 'large' | 'compact';
  accessible: boolean; // For disabled persons
  coordinates: {
    x: number;
    y: number;
  };
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  pricePerHour: number; 
  features: string[];
  qrCode?: string;
  occupiedBy?: string;
  occupiedUntil?: Date;
  lastUpdated?: Date;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  spotId: string;
  spotNumber: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalCost: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled' | 'expired';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency: 'TND';
  method: 'card' | 'cash' | 'mobile';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

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

export interface Analytics {
  id: string;
  date: Date;
  totalReservations: number;
  approvedReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  totalRevenue: number;
  averageOccupancy: number;
  peakHours: string[];
  popularSpots: string[];
}
export interface Weather {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ParkingZone {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinates;
  totalSpots: number;
  availableSpots: number;
  priceMultiplier: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}