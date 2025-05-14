// app/dashboard/page.tsx
"use client";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(`/user/${user.uid}/${user.rol === 'admin' ? 'admin' : user.rol === 'autor' ? 'autor' : 'perfil'}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return <div className="p-4">Redirigiendo...</div>;
}