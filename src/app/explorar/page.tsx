"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/"); // Usa replace para no dejar historial de esta página
  }, [router]);

  return null; // No renderiza nada en pantalla
}
