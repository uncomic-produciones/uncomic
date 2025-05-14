// File: ./src/app/leer/[serieid]/[capituloId]/page.tsx
"use client";
import { useAuth } from "@/providers/AuthProvider";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from 'next/image';

import { db } from "@/firebase/client";
import { doc, getDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import RegisterView from '@/components/Metrics/RegisterViewMetric';
import VoteButtons from '@/components/Metrics/VoteButtons';

interface Capitulo {
  id: string;
  titulo: string;
  numero: number;
  paginasURLs: string[];
  fechaPublicacion?: string;
  vistas?: number;
  likes?: number;
}

export default function LectorMangaVertical() {
  const router = useRouter();
  const params = useParams();
  const serieid = params.serieid as string;
  const capituloId = params.capituloId as string;

  const [capitulo, setCapitulo] = useState<Capitulo | null>(null);
  const [capitulosList, setCapitulosList] = useState<{ id: string; numero: number }[]>([]);
  const [loadingw, setLoadingw] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [currentPage, setCurrentPage] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingw(true);
        const docRef = doc(db, 'series', serieid, 'capitulos', capituloId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Capítulo no encontrado');
        const data = docSnap.data();
        
        setCapitulo({
          id: docSnap.id,
          titulo: data.titulo || `Capítulo ${data.numero}`,
          numero: data.numero,
          paginasURLs: data.paginasURLs || [],
          fechaPublicacion: data.fechaPublicacion,
          vistas: data.vistas,
          likes: data.likes
        });

        const q = query(
          collection(db, 'series', serieid, 'capitulos'),
          orderBy('numero', 'desc')
        );
        const snapshot = await getDocs(q);
        setCapitulosList(snapshot.docs.map(d => ({ id: d.id, numero: d.data().numero })));
        setCurrentPage(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el capítulo');
      } finally {
        setLoadingw(false);
      }
    };
    fetchData();
  }, [serieid, capituloId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || readingMode === 'horizontal') return;
      const y = containerRef.current.scrollTop;
      setShowHeader(!(y > lastScrollY && y > 100));
      setLastScrollY(y);
    };
    const c = containerRef.current;
    c?.addEventListener('scroll', handleScroll);
    return () => c?.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, readingMode]); // Considerar añadir containerRef si ESLint pide

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (readingMode === 'horizontal' && containerRef.current) {
      // Nota: El children[0] aquí asume que el primer hijo del contenedor es el div que envuelve las imágenes
      // Acceder directamente al hijo div envolvente
      const page = containerRef.current.children[currentPage] as HTMLElement;
      page?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    }
  }, [currentPage, readingMode]); // Considerar añadir containerRef si ESLint pide

  const handleHorizontalScroll = useCallback(() => {
    if (readingMode === 'horizontal' && containerRef.current) {
      const idx = Math.round(containerRef.current.scrollLeft / containerRef.current.clientWidth);
      if (idx !== currentPage) setCurrentPage(idx);
    }
  }, [readingMode, currentPage]); // Considerar añadir containerRef si ESLint pide

  useEffect(() => {
    const c = containerRef.current;
    if (c && readingMode === 'horizontal') c.addEventListener('scroll', handleHorizontalScroll);
    return () => {
        if (c) { // Verificar si c existe antes de intentar remover el listener
            c.removeEventListener('scroll', handleHorizontalScroll);
        }
    };
  }, [readingMode, handleHorizontalScroll]); // Considerar añadir containerRef si ESLint pide

  const idx = capitulosList.findIndex(c => c.id === capituloId);
  const prevChapter = idx < capitulosList.length - 1 ? capitulosList[idx + 1] : null;
  const nextChapter = idx > 0 ? capitulosList[idx - 1] : null;
  const totalPages = capitulo?.paginasURLs.length || 0;
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;
  const showPrevButton = readingMode === 'vertical' ? !!prevChapter : (canGoPrev || !!prevChapter);
  const showNextButton = readingMode === 'vertical' ? !!nextChapter : (canGoNext || !!nextChapter);

 const handlePrev = () => {
    if (loadingw) return;
    if (readingMode === 'vertical') {
      if (prevChapter) router.push(`/leer/${serieid}/${prevChapter.id}`);
    } else {
      if (canGoPrev) setCurrentPage(currentPage - 1);
      else if (prevChapter) router.push(`/leer/${serieid}/${prevChapter.id}`);
    }
  };

  const handleNext = () => {
    if (loadingw) return;
    if (readingMode === 'vertical') {
      if (nextChapter) router.push(`/leer/${serieid}/${nextChapter.id}`);
    } else {
      if (canGoNext) setCurrentPage(currentPage + 1);
      else if (nextChapter) router.push(`/leer/${serieid}/${nextChapter.id}`);
    }
  };

  const handleFsToggle = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  // Toggle lectura y reset scroll
  const handleModeToggle = () => {
    const m = readingMode === 'vertical' ? 'horizontal' : 'vertical';
    setReadingMode(m);
    setCurrentPage(0);
    // Reset scroll position when toggling modes
    if (m === 'vertical') {
      containerRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      containerRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  };

  if (loadingw) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto" />
        <p className="mt-4 text-lg">Cargando capítulo...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center p-6 bg-white rounded shadow">
        <h2 className="text-red-500">Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push(`/explorar/${params.serieid}`)} className="px-4 py-2 bg-black text-white rounded">Volver</button>
      </div>
    </div>
  );

  return (
    <div className="relative bg-black min-h-screen">
      {serieid && capituloId && <RegisterView serieId={serieid} capituloId={capituloId}/>}
      <div className={`fixed top-0 w-full bg-black/90 text-white p-3 flex justify-between items-center z-20 transition-transform ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <button onClick={() => router.push(`/explorar/${params.serieid}`)} className="flex items-center gap-2 text-white hover:text-gray-300">
          <XMarkIcon className="w-5 h-5"/>Cerrar
        </button>
        <h3 className="truncate text-2xl font-bold">{capitulo?.titulo}</h3>
        {readingMode === 'horizontal'
          ? <span className="text-white">{currentPage+1}/{totalPages}</span>
          : <div className="w-14"/>
        }
      </div>

      {showPrevButton && (
        <button onClick={handlePrev} className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-black text-white p-3 rounded-full">
          <ChevronLeftIcon className="w-8 h-8"/>
        </button>
      )}
      <VoteButtons tipo="capitulo" targetId={capituloId}/>

      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <button onClick={handleModeToggle} className="bg-black text-white p-3 rounded-full">
          <BookOpenIcon className="w-8 h-8"/>
        </button>
        <button onClick={handleFsToggle} className="bg-black text-white p-3 rounded-full">
          {isFullscreen ? <ArrowsPointingInIcon className="w-8 h-8"/> : <ArrowsPointingOutIcon className="w-8 h-8"/>}
        </button>
        {showNextButton && (
          <button onClick={handleNext} className="bg-black text-white p-3 rounded-full">
            <ChevronRightIcon className="w-8 h-8"/>
          </button>
        )}
      </div>

      {/* CONTENEDOR PRINCIPAL DE PÁGINAS */}
      {/* Este contenedor es el área de scroll */}
      <div
        ref={containerRef}
        className={`
          h-screen hide-scrollbar pt-16
          ${readingMode === 'vertical'
            ? 'overflow-y-auto flex flex-col items-center' // Vertical: columna centrada horizontalmente, scroll Y
            : 'overflow-x-auto flex flex-row snap-x snap-mandatory items-center justify-start'} // Horizontal: fila, scroll X, snap, centrado verticalmente (items-center)
          // Eliminar justify-start si se quiere centrar el grupo completo de imágenes si no llenan el ancho (menos común para lector)
        `}
      >
        {capitulo?.paginasURLs.map((url, i) => (
          // Cada div hijo es el CONTENEDOR de cada página
          // Este div debe ser relativo y tener las dimensiones y centrado para la imagen
          <div
            key={i} // <-- key va en el elemento externo del map
            className={`
              relative flex items-center justify-center // Flex y centrado para la imagen dentro de este div
              ${readingMode === 'vertical'
                // Vertical mode: w-full up to max-w, altura auto
                ? 'w-full max-w-screen-lg mx-auto h-auto' // Añadir mx-auto para centrar el bloque si es más estrecho que el padre
                // Horizontal mode: w-screen para el snap, altura completa, no encoge
                : 'w-screen h-screen flex-shrink-0 snap-start px-[10%]' // w-screen h-screen para el contenedor snap, padding horizontal
              }
            `}
          >
            {/* La imagen que debe ser 80% del ancho y centrada */}
            <Image
              src={url}
              alt={`Página ${i + 1}`}
              // Usamos width/height como hints + className para controlar el tamaño
              // Proporciona las dimensiones intrínsecas si las conoces, o un tamaño representativo
              width={1280}
              height={1800}
              priority={i === 0}
              quality={100} // Calidad (si unoptimized no está)
              unoptimized // Usar imagen original sin optimizaciones de Next.js
              // Clases para controlar el tamaño renderizado y ajuste
              className={`
                object-contain // La imagen se ajusta dentro del contenedor sin cortarse
                ${readingMode === 'vertical'
                  ? 'w-full h-auto' // Vertical: Ancho completo del div padre, altura auto
                  // Horizontal: Ancho 80% del div padre (que es w-screen con padding), altura auto para mantener aspecto
                  : 'w-4/5 h-auto' // <-- ANCHO 80% aquí, altura auto
                }
              `}
              // Eliminar fill y style directo
            />
          </div>
        ))}
      </div>
    </div>
  );
}