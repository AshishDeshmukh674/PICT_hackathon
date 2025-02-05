// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
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

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Analytics initialization only on client side
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };