// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3tHwz8-6MBuj6b2EI3QMNuYwIP8AXfig", // Use direct value since it's public
  authDomain: "pict-hackathon-2e532.firebaseapp.com",
  projectId: "pict-hackathon-2e532",
  storageBucket: "pict-hackathon-2e532.firebasestorage.app",
  messagingSenderId: "123757817140",
  appId: "1:123757817140:web:a9b6058a4984e32ba9c961",
  measurementId: "G-604H7WZ957",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };