import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1veRe34d1uuxPzb5jVshHZwO-2_hkJuM",
  authDomain: "lumajirahub-5f72b.firebaseapp.com",
  projectId: "lumajirahub-5f72b",
  storageBucket: "lumajirahub-5f72b.firebasestorage.app",
  messagingSenderId: "939486029231",
  appId: "1:939486029231:web:c18b20e5de7a6c76597b5a",
  measurementId: "G-D17EGFWNM8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);