importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "process.env.NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "pict-hackathon-2e532.firebaseapp.com",
  projectId: "pict-hackathon-2e532",
  storageBucket: "pict-hackathon-2e532.firebasestorage.app",
  messagingSenderId: "123757817140",
  appId: "1:123757817140:web:a9b6058a4984e32ba9c961",
  measurementId: "G-604H7WZ957"
};

try {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Health Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || 'New health update',
      tag: 'health-alert'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error('Failed to initialize Firebase in service worker:', error);
} 