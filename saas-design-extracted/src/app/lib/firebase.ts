import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDX3-UZN9pSTgMopELRd4dWq8_VA6Pi8Gw",
  authDomain: "snapsellapp-6649a.firebaseapp.com",
  projectId: "snapsellapp-6649a",
  storageBucket: "snapsellapp-6649a.firebasestorage.app",
  messagingSenderId: "503663017163",
  appId: "1:503663017163:web:8d02525549bd7f58f0af4e",
};

/** Single Firebase app instance. Call initializeApp() only once using getApps(). */
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

/** For code that needs the app instance directly. */
export const firebaseApp = getFirebaseApp();
