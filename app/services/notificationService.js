import { getMessagingInstance } from "../config/FirebaseConfig";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Helper function to check if we're on the client side
const isClient = typeof window !== 'undefined';

export const initializeNotifications = async () => {
  if (!isClient) {
    console.log('Notifications are only supported in browser environment');
    return null;
  }

  try {
    // Check if notifications are supported in this browser
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Try to initialize Firebase messaging
    try {
      const { isSupported } = await import('firebase/messaging');
      const supported = await isSupported();
      
      if (supported) {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service workers not supported');
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        const messaging = getMessagingInstance();
        if (!messaging) {
          throw new Error('Failed to initialize messaging');
        }

        const { getToken } = await import('firebase/messaging');
        const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        console.log('FCM Token:', token);
        return token;
      }
    } catch (error) {
      console.log('Firebase messaging not supported, falling back to regular notifications');
    }

    // Return true to indicate notifications are supported (even if just regular ones)
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
};

export const sendHealthAlert = async (message) => {
  if (!isClient) return;

  try {
    if (Notification.permission !== 'granted') {
      console.log('Notifications not permitted');
      return;
    }

    // Try Firebase messaging first
    try {
      const messaging = getMessagingInstance();
      if (messaging) {
        // In a real app, you'd send this to your backend to trigger FCM
        // For now, fall back to regular notification
        new Notification('Health Alert', {
          body: message,
          icon: '/notification-icon.png' // Make sure this exists in your public folder
        });
        return;
      }
    } catch (error) {
      console.log('Firebase messaging not available');
    }

    // Fall back to regular notifications
    new Notification('Health Alert', {
      body: message,
      icon: '/notification-icon.png'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Set up message listener only on client side
if (isClient) {
  const setupMessageListener = async () => {
    try {
      const messaging = getMessagingInstance();
      if (messaging) {
        const { onMessage } = await import('firebase/messaging');
        onMessage(messaging, (payload) => {
          console.log('Received foreground message:', payload);
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/notification-icon.png'
          });
        });
      }
    } catch (error) {
      console.log('Failed to set up message listener:', error);
    }
  };
  
  setupMessageListener();
} 