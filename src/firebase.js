// ================================================================
// firebase.js — Configuración de Firebase
// Copia .env.example → .env y completa tus credenciales
// ================================================================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);

// ================================================================
// Colecciones Firestore:
//   profiles/{uid}          → datos del usuario o taller
//   orders/{orderId}        → pedidos publicados
//   quotes/{quoteId}        → cotizaciones de talleres
//   chats/{chatId}/msgs/{id} → mensajes de chat
//
// Estructura de un profile:
//   type: "usuario" | "taller"
//   name, email, whatsapp
//   (taller) tallerName, blocked, debts: [{id,amount,date,paid,orderId}]
// ================================================================
