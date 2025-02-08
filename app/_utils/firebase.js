// import { initializeApp } from 'firebase/app';

// const firebaseConfig = {
//   apiKey: "AIzaSyD3tHwz8-6MBuj6b2EI3QMNuYwIP8AXfig",
//   authDomain: "doctor-website-e5e29.firebaseapp.com",
//   projectId: "doctor-website-e5e29",
//   storageBucket: "doctor-website-e5e29.appspot.com",
//   messagingSenderId: "403987284226",
//   appId: "1:403987284226:web:7c1d2e9c9d9f9b9f9f9f9f"
// };

// export const app = initializeApp(firebaseConfig); 


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "pict-hackathon-2e532.firebaseapp.com",
  projectId: "pict-hackathon-2e532",
  storageBucket: "pict-hackathon-2e532.firebasestorage.app",
  messagingSenderId: "123757817140",
  appId: "1:123757817140:web:a9b6058a4984e32ba9c961",
  measurementId: "G-604H7WZ957",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);