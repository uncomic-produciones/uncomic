"use client";

import MenuFlotanteDerecho from "@/components/MenuFlotanteDerecho";

export default function Lay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      <MenuFlotanteDerecho />
      <main >{children}</main>
    </div>
  );
}
