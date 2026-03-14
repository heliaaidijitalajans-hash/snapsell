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

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

export function getFirebaseAuth(): Auth {
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(app);
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(app);
}
