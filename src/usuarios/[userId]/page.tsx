import { db } from "@/firebase/admin";

export default async function UserPage({
  params,
}: {
  params: { userId: string };
}) {
  const userDoc = await db.collection("usuarios").doc(params.userId).get();
  const userData = userDoc.data();

  return (
    <div>
      <h1>{userData?.nombre}</h1>
      <p>Email: {userData?.correo}</p>
      <p>Rol: {userData?.rol}</p>
    </div>
  );
}