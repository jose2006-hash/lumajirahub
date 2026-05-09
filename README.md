# LumajiraHub 🏭

Plataforma inteligente de consignación de maquinaria industrial usada.

## Stack
- **React + Vite** — frontend
- **Firebase Firestore** — base de datos en tiempo real
- **Firebase Storage** — almacenamiento de fotos
- **OpenAI GPT-4o-mini** — generación de descripciones, estimaciones de costos y mensajes WhatsApp
- **Vercel** — deploy

## Setup local

```bash
# 1. Clonar e instalar
git clone https://github.com/tu-usuario/lumajirahub.git
cd lumajirahub
npm install

# 2. Variables de entorno
cp .env.example .env
# Edita .env con tus claves de Firebase y OpenAI

# 3. Correr en desarrollo
npm run dev
```

## Configurar Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un proyecto nuevo
3. Habilita **Firestore Database** (modo producción o prueba)
4. Habilita **Storage**
5. En Configuración del proyecto → Tus apps → Web app → copia las claves al `.env`

### Reglas Firestore (modo desarrollo)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Deploy en Vercel

```bash
# 1. Subir a GitHub
git init && git add . && git commit -m "Initial LumajiraHub MVP"
git remote add origin https://github.com/tu-usuario/lumajirahub.git
git push -u origin main

# 2. En vercel.com → Import Repository → lumajirahub
# 3. Agregar variables de entorno en el panel de Vercel:
#    VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
#    VITE_OPENAI_API_KEY
# 4. Deploy automático
```

## Colecciones Firestore

| Colección  | Campos principales |
|------------|-------------------|
| `machines` | tipo, marca, modelo, anio, estado, pvendedor, pminimo, ppublicado, margenReal, fotos[] |
| `buyers`   | nombre, empresa, telefono, email, tipos[], presupuesto |
| `leads`    | maquinaNombre, comprador, accion, color |

## Funcionalidades MVP

- ✅ Motor de pricing automático con viabilidad
- ✅ Generación de descripciones con IA (OpenAI)
- ✅ Estimación de mantenimiento con IA
- ✅ Sugerencia de precio de mercado con IA
- ✅ Subida de fotos a Firebase Storage
- ✅ CRM de compradores con tags por tipo
- ✅ Notificaciones WhatsApp con mensajes generados por IA
- ✅ Pipeline de estados en tiempo real
- ✅ Log de actividad (leads)
