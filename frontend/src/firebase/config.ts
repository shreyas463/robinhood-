// This file will be updated with your new Firebase configuration
// After you create a new Firebase project, replace this content with the new config

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4hHhGzF6GNaVu4Eia2mdbtOUw_1bJOgo",
  authDomain: "stocker-db315.firebaseapp.com",
  projectId: "stocker-db315",
  storageBucket: "stocker-db315.firebasestorage.app",
  messagingSenderId: "620590333368",
  appId: "1:620590333368:web:e942bb5ecd35788911234d",
  measurementId: "G-X981MEJ8Q2"
};

// Initialize Firebase
console.log("Initializing Firebase with config:", { ...firebaseConfig, apiKey: "HIDDEN" });
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Set persistence
try {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase persistence set to local");
    })
    .catch((error) => {
      console.error("Error setting persistence:", error);
    });
} catch (error) {
  console.error("Failed to set persistence:", error);
}

export { auth, db };
export default app; 