import { createRequire } from "module";

const require = createRequire(import.meta.url);

let firebaseAdmin = null;
let firestoreDb = null;

function initFirebaseAdmin() {
  // Note: initializeApp should only be called once per runtime.
  // In serverless, multiple instances can exist, but within one instance we guard with admin.apps.length.
  let admin;
  try {
    admin = require("firebase-admin");
  } catch (e) {
    throw new Error("firebase-admin not installed");
  }

  if (!admin.apps.length) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json || typeof json !== "string") {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
    }
    const cred = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  }

  firebaseAdmin = admin;
}

export function getFirestore() {
  if (firestoreDb) return firestoreDb;
  if (!firebaseAdmin) initFirebaseAdmin();
  firestoreDb = firebaseAdmin.firestore();
  return firestoreDb;
}

