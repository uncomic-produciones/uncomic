import { db } from "@/firebase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { uid, email, name } = await request.json();
  
  const userRef = db.collection("usuarios").doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      nombre: name,
      correo: email,
      rol: "lector",
      creado: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}