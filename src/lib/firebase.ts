import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // Ajouté pour le stockage
import { getFirestore } from "firebase/firestore"; // Optionnel, si vous utilisez la DB

const firebaseConfig = {
  apiKey: "AIzaSyBXWOi-tfLNFRqo8gwSHpmfYq4F_2X6mTg",
  authDomain: "platforms-invest.firebaseapp.com",
  projectId: "platforms-invest",
  storageBucket: "platforms-invest.firebasestorage.app",
  messagingSenderId: "387096076622",
  appId: "1:387096076622:web:6210a75ffd88398a327e1f",
  measurementId: "G-KEHYSJ8DGW"
};

// Initialisation
const app = initializeApp(firebaseConfig);

// Exports des services
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;
