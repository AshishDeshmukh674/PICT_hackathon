// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "healthcare-hackathon-0919.firebaseapp.com",
  projectId: "healthcare-hackathon-0919",
  storageBucket: "healthcare-hackathon-0919.firebasestorage.app",
  messagingSenderId: "883502788512",
  appId: "1:883502788512:web:021e36233c2d379cb13ec5",
  measurementId: "G-83TQX930SP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Messaging only on client side
export const getMessagingInstance = () => {
  if (typeof window !== 'undefined') {
    try {
      const { getMessaging } = require('firebase/messaging');
      return getMessaging(app);
    } catch (error) {
      console.log('Messaging not supported in this environment');
      return null;
    }
  }
  return null;
};