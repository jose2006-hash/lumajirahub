# LumajiraHub 🏭

Plataforma que conecta clientes con talleres de manufactura en Lima — sin intermediarios.

---

## 🚀 Inicio rápido

```bash
npm install
cp .env.example .env   # edita con tus credenciales
npm run dev            # → http://localhost:3000
```

---

## ⚙️ Configuración obligatoria (.env)

### 1. Firebase (datos persistentes)
1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un proyecto nuevo
3. Habilita **Authentication → Email/Password**
4. Habilita **Firestore Database** (modo test para empezar)
5. Ve a *Configuración del proyecto → Tus apps → Web → Agregar app*
6. Copia las credenciales en tu `.env`

### 2. Reglas de Firestore sugeridas (modo producción)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if request.auth != null; // talleres pueden ver pedidos de usuarios
    }
    match /orders/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /quotes/{id} {
      allow read, write: if request.auth != null;
    }
    match /chats/{chatId}/msgs/{msgId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. OpenAI API Key
Obtén tu key en [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
```env
VITE_OPENAI_API_KEY=sk-proj-TuKeyAqui
```
También puedes ingresarla directamente en la app con el botón 🔑 en la barra de navegación.

---

## 🔐 Admin
- **Correo:** admin@lumajirahub.com
- **Contraseña:** lumaadmin2024

---

## ✨ Funcionalidades

| Función | Estado |
|---------|--------|
| Registro usuario (nombre, WhatsApp, correo, contraseña) | ✅ Firebase Auth |
| Registro taller (nombre, nombre taller, WhatsApp, correo) | ✅ Firebase Auth |
| Contraseña mostrada en pantalla al registrarse | ✅ Modal con botón copiar |
| 4 servicios: 3D, CNC, Láser, Plástico | ✅ |
| Chatbot IA GPT-4o genera brief técnico | ✅ |
| Adjuntar imágenes y audio al pedido | ✅ |
| Pedidos guardados en Firestore | ✅ Persistente |
| Taller ve pedidos en tiempo real | ✅ onSnapshot |
| Taller envía cotización | ✅ Firestore |
| Chat en tiempo real taller ↔ cliente | ✅ onSnapshot |
| Cliente cierra trato | ✅ |
| Comisión 5% registrada automáticamente | ✅ |
| Auto-bloqueo taller si deuda > 30 días | ✅ En cada login |
| Admin ve todos los usuarios y talleres | ✅ Firestore |
| Admin bloquea/habilita talleres manualmente | ✅ |
| Admin marca deudas como pagadas | ✅ |

---

## 🗂️ Estructura

```
lumajirahub/
├── src/
│   ├── App.jsx        ← toda la app React
│   ├── firebase.js    ← config Firebase
│   └── main.jsx
├── public/
├── index.html
├── package.json       ← incluye firebase SDK
├── vite.config.js
└── .env.example
```

---

## 🏗️ Build producción

```bash
npm run build
# Deploy en Vercel: conecta el repo y agrega las env vars en el dashboard
```

> ⚠️ Para producción, protege tu `VITE_OPENAI_API_KEY` con un backend proxy.

---

MIT — LumajiraHub 2025
