// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7O6-5qiqGmed4y2jVwavqegQThTcI7NM",
  authDomain: "healthcare-hackathon-0919.firebaseapp.com",
  projectId: "healthcare-hackathon-0919",
  storageBucket: "healthcare-hackathon-0919.firebasestorage.app",
  messagingSenderId: "883502788512",
  appId: "1:883502788512:web:021e36233c2d379cb13ec5",
  measurementId: "G-83TQX930SP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };