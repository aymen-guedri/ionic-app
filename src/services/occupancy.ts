import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export class OccupancyService {
  // Check and update expired occupancies
  static async updateExpiredOccupancies() {
    try {
      const now = new Date();
      
      // Query spots that are occupied but should be available now
      const spotsQuery = query(
        collection(db, 'parkingSpots'),
        where('status', '==', 'occupied')
      );
      
      const querySnapshot = await getDocs(spotsQuery);
      
      for (const spotDoc of querySnapshot.docs) {
        const spotData = spotDoc.data();
        const occupiedUntil = spotData.occupiedUntil?.toDate();
        
        // If occupancy has expired, mark as available
        if (occupiedUntil && occupiedUntil <= now) {
          await updateDoc(doc(db, 'parkingSpots', spotDoc.id), {
            status: 'available',
            occupiedBy: null,
            occupiedUntil: null,
            lastUpdated: serverTimestamp()
          });
          
          console.log(`Spot ${spotData.number} is now available (occupancy expired)`);
        }
      }
    } catch (error) {
      console.error('Error updating expired occupancies:', error);
    }
  }

  // Check if a spot is available for a given time period
  static async isSpotAvailable(spotId: string, startTime: Date, endTime: Date): Promise<boolean> {
    try {
      // Check current occupancy
      const spotDoc = await getDocs(query(
        collection(db, 'parkingSpots'),
        where('__name__', '==', spotId)
      ));
      
      if (spotDoc.empty) return false;
      
      const spotData = spotDoc.docs[0].data();
      
      // If spot is currently occupied, check if it conflicts with requested time
      if (spotData.status === 'occupied' && spotData.occupiedUntil) {
        const occupiedUntil = spotData.occupiedUntil.toDate();
        if (occupiedUntil > startTime) {
          return false; // Spot is occupied during requested time
        }
      }
      
      // Check for existing reservations that conflict
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('spotId', '==', spotId),
        where('status', 'in', ['approved', 'active'])
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      
      for (const reservationDoc of reservationsSnapshot.docs) {
        const reservation = reservationDoc.data();
        const resStart = reservation.startTime.toDate();
        const resEnd = reservation.endTime.toDate();
        
        // Check for time overlap
        if (startTime < resEnd && endTime > resStart) {
          return false; // Time conflict with existing reservation
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking spot availability:', error);
      return false;
    }
  }

  // Get next available time for a spot
  static async getNextAvailableTime(spotId: string): Promise<Date | null> {
    try {
      const now = new Date();
      
      // Check current occupancy
      const spotDoc = await getDocs(query(
        collection(db, 'parkingSpots'),
        where('__name__', '==', spotId)
      ));
      
      if (spotDoc.empty) return null;
      
      const spotData = spotDoc.docs[0].data();
      
      let nextAvailable = now;
      
      // If currently occupied, next available is when occupancy ends
      if (spotData.status === 'occupied' && spotData.occupiedUntil) {
        const occupiedUntil = spotData.occupiedUntil.toDate();
        if (occupiedUntil > now) {
          nextAvailable = occupiedUntil;
        }
      }
      
      // Check future reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('spotId', '==', spotId),
        where('status', 'in', ['approved', 'active'])
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const futureReservations = reservationsSnapshot.docs
        .map(doc => doc.data())
        .filter(res => res.endTime.toDate() > nextAvailable)
        .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime());
      
      // Find the earliest gap or time after all reservations
      for (const reservation of futureReservations) {
        const resStart = reservation.startTime.toDate();
        const resEnd = reservation.endTime.toDate();
        
        if (resStart > nextAvailable) {
          // There's a gap before this reservation
          return nextAvailable;
        }
        
        // Move next available to after this reservation
        nextAvailable = resEnd;
      }
      
      return nextAvailable;
    } catch (error) {
      console.error('Error getting next available time:', error);
      return null;
    }
  }
}

// Auto-update expired occupancies every minute
setInterval(() => {
  OccupancyService.updateExpiredOccupancies();
}, 60000);