import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId',
];
const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
  throw new Error(
    `Firebase config is missing: ${missing.join(', ')}. ` +
    `Check that your .env file (or Vercel project env vars) sets VITE_FIREBASE_* values. ` +
    `See .env.example.`
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
export const db = databaseId && databaseId !== '(default)'
  ? initializeFirestore(app, {}, databaseId)
  : getFirestore(app);

export default app;