// usuarios/[userId]/actions.ts
"use server";

import { db } from "@/firebase/admin";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: string) {
  await db.collection("usuarios").doc(userId).update({ rol: newRole });
  revalidatePath(`/usuarios/${userId}`);
}