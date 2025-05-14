// src/components/FloatingImage.tsx
'use client';

import Image from 'next/image';

interface FloatingImageProps {
  src: string;
  alt: string;
  positionClasses?: string;
  sizeClasses?: string;
  zIndexClasses?: string;
}

/**
 * Componente que muestra una imagen flotante fija en una esquina, con tamaño responsivo.
 * Utiliza next/image para optimización.
 */
export default function FloatingImage({
  src,
  alt,
  // === Posición por defecto: bottom-full right-[2%] en móvil, cambia a top-4 right-8 desde md ===
  positionClasses = 'bottom-100% right-2% md:bottom-118 md:right-8',
  // ============================================================================================
  sizeClasses = 'w-20 md:w-24 lg:w-28',
  zIndexClasses = 'z-50',
}: FloatingImageProps) {
  return (
    <div className={`fixed ${positionClasses} ${zIndexClasses}`}>
      <Image
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes="80vw"
        style={{ width: 'auto', height: 'auto' }}
        className={`${sizeClasses} object-contain`}
      />
    </div>
  );
}