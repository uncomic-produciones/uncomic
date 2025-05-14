import { db } from "@/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getUserRole(uid: string) {
  const userDoc = await getDoc(doc(db, "usuarios", uid));
  return userDoc.exists() ? userDoc.data().rol : null;
}

export async function setUserRole(uid: string, rol: string) {
  await setDoc(doc(db, "usuarios", uid), { rol }, { merge: true });
}

export async function initializeUser(uid: string, email: string, name: string) {
  const userRef = doc(db, "usuarios", uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      nombre: name,
      correo: email,
      rol: "lector",
      creado: new Date().toISOString(),
    });
  }
}