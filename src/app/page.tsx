"use client";

import FloatingImage from "@/components/FloatingImage";
import RecentSeries from "@/components/RecentSeries";

export default function Inicio() {
  return (<>
  <FloatingImage src="/logo.png" alt="Descripción de la imagen" />
    <div className="h-screen flex items-center justify-center bg-white text-black">
      
      <RecentSeries></RecentSeries>
      
    </div></>
  );
}
