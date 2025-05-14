"use client";
import { auth, provider, db } from "@/firebase/client";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Referencia al documento del usuario en Firestore
      const userRef = doc(db, "usuarios", user.uid);
      
      // Verificar si el usuario ya existe
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Crear nuevo documento si no existe
        await setDoc(userRef, {
          nombre: user.displayName || "Usuario sin nombre",
          correo: user.email,
          rol: "lector", // Rol por defecto
          creado: new Date().toISOString(), // Fecha de creación
          ultimoAcceso: new Date().toISOString() // Fecha de último acceso
        });
      } else {
        // Actualizar último acceso si ya existe
        await setDoc(userRef, {
          ultimoAcceso: new Date().toISOString()
        }, { merge: true });
      }

    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}