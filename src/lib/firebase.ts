// src/firebase.ts

// 1. Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // If you need authentication
// Add any other services you need, like getStorage

// 2. Your web app's Firebase configuration (PASTE YOURS HERE)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Initialize and export the Firebase services you want to use
// This makes them available to your entire app
export const db = getFirestore(app);
export const auth = getAuth(app);
// export const storage = getStorage(app);