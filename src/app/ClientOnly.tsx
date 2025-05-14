// Componente para evitar hidratación en el lado del servidor

import { useEffect, useState } from "react";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);
  
    if (!mounted) return null;
  
    return <>{children}</>;
  }