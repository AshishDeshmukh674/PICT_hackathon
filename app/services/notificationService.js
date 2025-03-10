import { getMessagingInstance } from "../config/FirebaseConfig";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const DEFAULT_PUSHBULLET_TOKEN = process.env.PUSHBULLET_ACCESS_TOKEN;

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

// Pushbullet notification service
export async function sendPushbulletNotification(title, message, userToken = null) {
  try {
    // Use user's token if provided, otherwise fall back to default token
    const accessToken = userToken || DEFAULT_PUSHBULLET_TOKEN;
    
    if (!accessToken) {
      console.error('Pushbullet access token is missing');
      return false;
    }

    const response = await fetch("https://api.pushbullet.com/v2/pushes", {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "note",
        title: title,
        body: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Pushbullet API error:", errorData);
      return false;
    }

    console.log("Notification sent successfully via Pushbullet!");
    return true;
  } catch (error) {
    console.error("Error sending Pushbullet notification:", error);
    return false;
  }
}

// Function to check if a metric exceeds threshold
export function checkMetricThreshold(metric, thresholds) {
  const results = [];
  
  if (metric.bloodPressure && metric.bloodPressure !== 'NA') {
    // Extract systolic/diastolic if in format "120/80"
    const bpParts = String(metric.bloodPressure).split('/');
    
    if (bpParts.length === 2) {
      const systolic = parseInt(bpParts[0]);
      const diastolic = parseInt(bpParts[1]);
      
      if (systolic >= thresholds.systolicHigh) {
        results.push({
          title: "High Blood Pressure Alert",
          message: `Your systolic blood pressure is high (${systolic}). Normal range is below ${thresholds.systolicHigh}.`
        });
      }
      
      if (diastolic >= thresholds.diastolicHigh) {
        results.push({
          title: "High Blood Pressure Alert",
          message: `Your diastolic blood pressure is high (${diastolic}). Normal range is below ${thresholds.diastolicHigh}.`
        });
      }
    } else {
      // Handle single BP value
      const bp = parseInt(metric.bloodPressure);
      if (!isNaN(bp) && bp >= thresholds.bloodPressureHigh) {
        results.push({
          title: "High Blood Pressure Alert",
          message: `Your blood pressure is high (${bp}). Please monitor your condition.`
        });
      }
    }
  }
  
  if (metric.heartRate && metric.heartRate !== 'NA') {
    const hr = parseInt(metric.heartRate);
    if (!isNaN(hr)) {
      if (hr >= thresholds.heartRateHigh) {
        results.push({
          title: "High Heart Rate Alert",
          message: `Your heart rate is elevated (${hr} bpm). Normal resting rate is below ${thresholds.heartRateHigh} bpm.`
        });
      }
      if (hr <= thresholds.heartRateLow) {
        results.push({
          title: "Low Heart Rate Alert",
          message: `Your heart rate is low (${hr} bpm). Normal resting rate is above ${thresholds.heartRateLow} bpm.`
        });
      }
    }
  }
  
  return results;
} 