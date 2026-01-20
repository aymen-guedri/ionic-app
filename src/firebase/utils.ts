import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from './config';

export const handleFirestoreConnectionIssues = () => {
  // Handle network connectivity issues
  window.addEventListener('online', async () => {
    try {
      await enableNetwork(db);
      console.log('Firestore network enabled');
    } catch (error) {
      console.error('Failed to enable Firestore network:', error);
    }
  });

  window.addEventListener('offline', async () => {
    try {
      await disableNetwork(db);
      console.log('Firestore network disabled');
    } catch (error) {
      console.error('Failed to disable Firestore network:', error);
    }
  });
};

export const retryFirestoreOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
};