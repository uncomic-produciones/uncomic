// File: src/firebase/admin.ts (o donde tengas tu init)
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!json) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no está definido");
}

const serviceAccount = JSON.parse(json);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore();
