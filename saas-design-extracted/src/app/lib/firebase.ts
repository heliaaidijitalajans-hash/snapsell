import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

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

export function getFirebaseAuth(): Auth {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}
