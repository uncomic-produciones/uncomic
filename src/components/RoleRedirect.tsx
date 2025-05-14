// components/RoleRedirect.tsx
"use client";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect } from "react";

export default function RoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    if (loading) return;

    // 1. Verificar autenticación y propiedad del perfil
    if (!user || user.uid !== userId) {
      console.warn(`Access denied: User ${user?.uid} tried to access profile ${userId}.`);
      router.push(user ? "/acceso-denegado" : "/login");
      return;
    }

    // 2. Configuración de permisos
    const permissions: Record<string, string[]> = {
      'perfil': ['admin', 'autor', 'lector'],
      'autor': ['admin', 'autor'],
      'admin': ['admin'],
    };

    const basePath = `/user/${userId}`;
    const pathSegment = pathname.startsWith(`${basePath}/`)
      ? pathname.substring(basePath.length + 1).split('/')[0]
      : pathname === basePath 
          ? 'perfil' 
          : null;

    // 3. Validación de ruta y permisos
    if (pathSegment) {
      if (!permissions[pathSegment]) {
        router.push(`${basePath}/perfil`);
        return;
      }

      if (!permissions[pathSegment].includes(user.rol || '')) {
        console.warn(`Role "${user.rol}" cannot access "${pathSegment}". Redirecting...`);
        router.push(`${basePath}/perfil`);
      }
    }
    
  }, [user, loading, userId, pathname, router]);

  return null;
}