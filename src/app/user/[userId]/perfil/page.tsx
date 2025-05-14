// app/app/[userId]/autor/page.tsx
"use client";
import { useAuth } from "@/providers/AuthProvider";

export default function AutorDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Panel de Autor</h1>
      <p className="mt-4">Bienvenido autor {user?.displayName}</p>
      {/* Contenido específico para autor */}
    </div>
  );
}