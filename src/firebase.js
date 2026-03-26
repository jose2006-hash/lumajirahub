// ================================================================
// firebase.js — Configuración de Firebase
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

// ✅ SOLUCIÓN AL ERROR 400 en Listen/channel
export const db = getFirestore(app, '(default)');   // ← Especificamos el nombre exacto

// Recomendado: Forzar long polling (evita muchos problemas de WebChannel en Vite)
db.settings({
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);

// ================================================================
// Colecciones Firestore:
//   profiles/{uid}          → datos del usuario o taller
//   orders/{orderId}        → pedidos publicados
//   quotes/{quoteId}        → cotizaciones de talleres
//   chats/{chatId}/msgs/{id} → mensajes de chat
// ================================================================