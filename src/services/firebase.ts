import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ParkingSpot, Reservation, User, Payment, Notification } from '../types';

export class FirebaseService {
  // Get all parking spots with real-time updates
  static subscribeToSpots(callback: (spots: ParkingSpot[]) => void): () => void {
    const spotsRef = collection(db, 'parkingSpots');
    const q = query(spotsRef, orderBy('number'));
    
    return onSnapshot(q, (snapshot) => {
      const spots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ParkingSpot[];
      callback(spots);
    });
  }

  // Update parking spot status
  static async updateSpotStatus(spotId: string, status: ParkingSpot['status']): Promise<void> {
    const spotRef = doc(db, 'parkingSpots', spotId);
    await updateDoc(spotRef, {
      status,
      updatedAt: serverTimestamp()
    });
  }

  // Create new reservation
  static async createReservation(reservationData: Omit<Reservation, 'id'>): Promise<string> {
    const reservationsRef = collection(db, 'reservations');
    const docRef = await addDoc(reservationsRef, {
      ...reservationData,
      startTime: Timestamp.fromDate(reservationData.startTime),
      endTime: Timestamp.fromDate(reservationData.endTime),
      createdAt: serverTimestamp()
    });
    
    await this.updateSpotStatus(reservationData.spotId, 'reserved');
    return docRef.id;
  }

  // Get user reservations with real-time updates
  static subscribeToUserReservations(
    userId: string, 
    callback: (reservations: Reservation[]) => void
  ): () => void {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate()
      })) as Reservation[];
      callback(reservations);
    });
  }

  // Get pending reservations for admin
  static subscribeToPendingReservations(
    callback: (reservations: Reservation[]) => void
  ): () => void {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Reservation[];
      callback(reservations);
    });
  }

  // Approve reservation
  static async approveReservation(reservationId: string, adminId: string): Promise<void> {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'approved',
      approvedBy: adminId,
      approvedAt: serverTimestamp()
    });
  }

  // Send notification
  static async sendNotification(notificationData: Omit<Notification, 'id'>): Promise<string> {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  // Check-in to reservation
  static async checkInReservation(reservationId: string): Promise<void> {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'active',
      checkInTime: serverTimestamp()
    });
  }

  // Check-out from reservation
  static async checkOutReservation(reservationId: string): Promise<void> {
    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationDoc = await getDoc(reservationRef);
    
    if (reservationDoc.exists()) {
      const reservation = reservationDoc.data() as Reservation;
      
      await updateDoc(reservationRef, {
        status: 'completed',
        checkOutTime: serverTimestamp()
      });
      
      await this.updateSpotStatus(reservation.spotId, 'available');
    }
  }
}