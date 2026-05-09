import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const storage = getStorage(app)

export const machinesQuery = () => query(collection(db, 'machines'), orderBy('createdAt', 'desc'))
export const buyersQuery   = () => query(collection(db, 'buyers'),   orderBy('createdAt', 'desc'))
export const leadsQuery    = () => query(collection(db, 'leads'),    orderBy('createdAt', 'desc'))

export const addMachine    = (d) => addDoc(collection(db, 'machines'), { ...d, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
export const updateMachine = (id, d) => updateDoc(doc(db, 'machines', id), { ...d, updatedAt: serverTimestamp() })
export const deleteMachine = (id) => deleteDoc(doc(db, 'machines', id))

export const addBuyer    = (d) => addDoc(collection(db, 'buyers'), { ...d, createdAt: serverTimestamp() })
export const updateBuyer = (id, d) => updateDoc(doc(db, 'buyers', id), d)
export const deleteBuyer = (id) => deleteDoc(doc(db, 'buyers', id))

export const addLead = (d) => addDoc(collection(db, 'leads'), { ...d, createdAt: serverTimestamp() })

export const uploadMachineImage = async (file, machineId) => {
  const r = ref(storage, `machines/${machineId}/${Date.now()}_${file.name}`)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}
