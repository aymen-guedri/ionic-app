import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ParkingZone, ParkingSpot, Reservation } from '../types';

// Zone Management
export const createZone = async (zoneData: Omit<ParkingZone, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'zones'), {
      ...zoneData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating zone:', error);
    throw error;
  }
};

export const updateZone = async (zoneId: string, updates: Partial<ParkingZone>) => {
  try {
    const zoneRef = doc(db, 'zones', zoneId);
    await updateDoc(zoneRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating zone:', error);
    throw error;
  }
};

export const deleteZone = async (zoneId: string) => {
  try {
    await deleteDoc(doc(db, 'zones', zoneId));
  } catch (error) {
    console.error('Error deleting zone:', error);
    throw error;
  }
};

// Spot Management
export const createSpot = async (spotData: Omit<ParkingSpot, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'parkingSpots'), spotData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating spot:', error);
    throw error;
  }
};

export const updateSpot = async (spotId: string, updates: Partial<ParkingSpot>) => {
  try {
    const spotRef = doc(db, 'parkingSpots', spotId);
    await updateDoc(spotRef, updates);
  } catch (error) {
    console.error('Error updating spot:', error);
    throw error;
  }
};

export const deleteSpot = async (spotId: string) => {
  try {
    await deleteDoc(doc(db, 'parkingSpots', spotId));
  } catch (error) {
    console.error('Error deleting spot:', error);
    throw error;
  }
};

export const updateSpotAvailability = async (spotId: string, status: ParkingSpot['status']) => {
  try {
    const spotRef = doc(db, 'parkingSpots', spotId);
    await updateDoc(spotRef, { status });
  } catch (error) {
    console.error('Error updating spot availability:', error);
    throw error;
  }
};

// Reservation Management
export const approveReservation = async (reservationId: string, adminId: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving reservation:', error);
    throw error;
  }
};

export const rejectReservation = async (reservationId: string, adminId: string, notes?: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'cancelled',
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
      notes: notes || 'Rejected by admin'
    });
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    throw error;
  }
};

export const getAllReservations = () => {
  return collection(db, 'reservations');
};

export const getPendingReservations = () => {
  return query(
    collection(db, 'reservations'), 
    where('status', '==', 'pending')
  );
};

// Analytics
export const getAnalytics = async () => {
  try {
    const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
    const spotsSnapshot = await getDocs(collection(db, 'parkingSpots'));
    const usersSnapshot = await getDocs(collection(db, 'users'));

    const reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    const spots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ParkingSpot));
    
    const totalReservations = reservations.length;
    const pendingReservations = reservations.filter(r => r.status === 'pending').length;
    const approvedReservations = reservations.filter(r => r.status === 'approved').length;
    const completedReservations = reservations.filter(r => r.status === 'completed').length;
    
    const totalSpots = spots.length;
    const availableSpots = spots.filter(s => s.status === 'available').length;
    const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
    
    const totalRevenue = reservations
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalCost || 0), 0);

    return {
      totalUsers: usersSnapshot.size,
      totalSpots,
      availableSpots,
      occupiedSpots,
      totalReservations,
      pendingReservations,
      approvedReservations,
      completedReservations,
      totalRevenue,
      occupancyRate: totalSpots > 0 ? ((occupiedSpots / totalSpots) * 100).toFixed(1) : '0'
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
};