import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBnkoijQcoHqn7rH-07FqZXutD0N_9qmmQ",
  authDomain: "trustfy-5f02f.firebaseapp.com",
  projectId: "trustfy-5f02f",
  storageBucket: "trustfy-5f02f.firebasestorage.app",
  messagingSenderId: "194082251272",
  appId: "1:194082251272:web:e6b025453e3daf563627bd",
  measurementId: "G-CY59QE6LG4",
};

export const VAPID_KEY = 'BKioj5i6nEkM1S-IVD8j0y9HS855pw43RQfVTRehHboX7A1nkAwrhVGdeJD3bElZ1bTkO-JkhHSFHtNh9i0fErs';

const app = initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (messagingInstance) return messagingInstance;
  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (e) {
    console.warn('Firebase Messaging not supported:', e);
    return null;
  }
}

export { getToken, onMessage };
