import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { messaging } from '../firebase/config';
import { getToken, onMessage } from 'firebase/messaging';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: number;
}

export class NotificationService {
  private static fcmToken: string | null = null;
  private static isInitialized = false;

  /**
   * Initialize push notifications
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission for push notifications
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      // Register for push notifications
      await PushNotifications.register();

      // Initialize FCM
      await this.initializeFCM();

      // Set up listeners
      this.setupListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Error initializing notifications:', error);
      throw error;
    }
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private static async initializeFCM(): Promise<void> {
    try {
      // Get FCM token
      this.fcmToken = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_VAPID_KEY || 'your-vapid-key'
      });

      console.log('FCM Token:', this.fcmToken);

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        this.handleForegroundMessage(payload);
      });

    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private static setupListeners(): void {
    // Registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Notification received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Notification action performed (user tapped notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      this.handleNotificationAction(notification);
    });
  }

  /**
   * Handle foreground FCM message
   */
  private static handleForegroundMessage(payload: any): void {
    const { notification, data } = payload;
    
    if (notification) {
      // Show local notification when app is in foreground
      this.showLocalNotification({
        title: notification.title || 'Smart Parking',
        body: notification.body || 'You have a new notification',
        data: data || {}
      });
    }
  }

  /**
   * Handle notification received in foreground
   */
  private static handleNotificationReceived(notification: PushNotificationSchema): void {
    // You can customize how notifications are displayed in foreground
    console.log('Notification received in foreground:', notification);
  }

  /**
   * Handle notification action (user tapped)
   */
  private static handleNotificationAction(action: ActionPerformed): void {
    const { notification, actionId } = action;
    
    // Handle different notification types
    if (notification.data?.type) {
      this.handleNotificationType(notification.data.type, notification.data);
    }
    
    console.log('Notification action:', actionId, notification);
  }

  /**
   * Handle different notification types
   */
  private static handleNotificationType(type: string, data: any): void {
    switch (type) {
      case 'reservation':
        // Navigate to reservations page
        window.location.href = '/reservations';
        break;
      case 'payment':
        // Navigate to payment page
        window.location.href = '/payments';
        break;
      case 'promotion':
        // Navigate to promotions page
        window.location.href = '/promotions';
        break;
      default:
        // Navigate to home page
        window.location.href = '/parking';
        break;
    }
  }

  /**
   * Show local notification
   */
  static async showLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Request permission for local notifications
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display !== 'granted') {
        console.warn('Local notification permission denied');
        return;
      }

      // Schedule local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: Date.now(),
            extra: payload.data || {},
            iconColor: '#3880ff',
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample'
          }
        ]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  /**
   * Send notification to specific user (server-side function)
   */
  static async sendNotificationToUser(
    userId: string, 
    payload: NotificationPayload
  ): Promise<void> {
    try {
      // This should be called from your backend/cloud function
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification: payload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendBulkNotifications(
    userIds: string[], 
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          notification: payload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send bulk notifications');
      }
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Schedule local notification for later
   */
  static async scheduleNotification(
    payload: NotificationPayload,
    scheduleTime: Date
  ): Promise<void> {
    try {
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display !== 'granted') {
        console.warn('Local notification permission denied');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: Date.now(),
            schedule: { at: scheduleTime },
            extra: payload.data || {},
            iconColor: '#3880ff',
            sound: 'default'
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Cancel scheduled notification
   */
  static async cancelNotification(notificationId: number): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }]
      });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Get FCM token
   */
  static getFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Update FCM token in user profile
   */
  static async updateUserFCMToken(userId: string): Promise<void> {
    if (!this.fcmToken) return;

    try {
      // Update user's FCM token in Firestore
      const response = await fetch('/api/users/update-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fcmToken: this.fcmToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update FCM token');
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications
        });
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const permission = await PushNotifications.checkPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Show notification permission prompt
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      const permission = await PushNotifications.requestPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Create notification templates
   */
  static createReservationApprovedNotification(spotNumber: string): NotificationPayload {
    return {
      title: '✅ Reservation Approved',
      body: `Your reservation for spot ${spotNumber} has been approved!`,
      data: { type: 'reservation', action: 'approved' }
    };
  }

  static createReservationRejectedNotification(spotNumber: string, reason?: string): NotificationPayload {
    return {
      title: '❌ Reservation Rejected',
      body: `Your reservation for spot ${spotNumber} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
      data: { type: 'reservation', action: 'rejected' }
    };
  }

  static createReservationReminderNotification(spotNumber: string, minutesLeft: number): NotificationPayload {
    return {
      title: '⏰ Reservation Reminder',
      body: `Your reservation for spot ${spotNumber} expires in ${minutesLeft} minutes`,
      data: { type: 'reservation', action: 'reminder' }
    };
  }

  static createPaymentDueNotification(amount: number): NotificationPayload {
    return {
      title: '💳 Payment Due',
      body: `You have a pending payment of ${amount} TND`,
      data: { type: 'payment', action: 'due' }
    };
  }

  static createPromotionNotification(title: string, description: string): NotificationPayload {
    return {
      title: `🎉 ${title}`,
      body: description,
      data: { type: 'promotion', action: 'new' }
    };
  }
}