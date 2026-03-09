import { initializeApp, type FirebaseApp } from "firebase/app";
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

let app: FirebaseApp;
let auth: Auth;
let storage: FirebaseStorage;
let firestore: Firestore;

function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  getApp();
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getApp());
  }
  return storage;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getApp());
  }
  return firestore;
}
