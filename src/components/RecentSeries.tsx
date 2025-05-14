'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/client';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Image from 'next/image';

interface Series {
  id: string;
  titulo: string;
  portadaURL: string;
  descripcion?: string;
  fechaCreacion?: Timestamp;
}

export default function RecentSeries() {
  const [recentSeries, setRecentSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentSeries = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'series'),
          orderBy('fechaCreacion', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const seriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          titulo: doc.data().titulo || 'Título Desconocido',
          portadaURL: doc.data().portadaURL || '/placeholder-portada.jpg',
          descripcion: doc.data().descripcion || 'Descripción no disponible',
          fechaCreacion: doc.data().fechaCreacion as Timestamp | undefined,
        })) as Series[];

        setRecentSeries(seriesList);
      } catch (err) {
        console.error("Error fetching recent series:", err);
        setError("Error al cargar las últimas series.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSeries();
  }, []);

  if (loading) {
    return (
      <div className="  flex flex-col items-center justify-center  relative overflow-hidden">
        {/* Fondo dinámico para PC */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-stripes.png')]" />
        
        {/* Loader central */}
        <div className="relative flex flex-col items-center justify-center space-y-6 group">
          {/* Spinner con efecto 3D */}
          <div className="relative h-24 w-24">
            <div className="absolute inset-0 animate-spin rounded-full border-8 border-emerald-500/30 border-t-emerald-400 shadow-2xl shadow-emerald-500/30" />
            <div className="absolute inset-0 animate-pulse rounded-full border-4 border-emerald-400/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full backdrop-blur-sm" />
          </div>
  
          {/* Texto con efecto holográfico */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent animate-text-glow">
              Cine<span className="font-light">Stream</span>
            </h2>
            <p className="text-xl text-gray-300 font-light tracking-wide animate-pulse-slow">
              Cargando experiencia cinematográfica...
            </p>
          </div>
  
          {/* Barra de progreso mejorada */}
          <div className="w-96 h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-emerald-400/80 to-emerald-600/80 animate-progress-bar rounded-full" />
          </div>
        </div>
  
        {/* Efectos de partículas para PC */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-20 animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${6 + i}s infinite cubic-bezier(0.4, 0, 0.6, 1)`,
                transform: `scale(${0.5 + Math.random() * 1.5})`
              }}
            />
          ))}
        </div>
  
        
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

 // ... (imports y interface se mantienen igual)

    // ... (estados y useEffect se mantienen igual)
  
    return (
        <div className="relative h-screen w-full bg-black">
          <Swiper
            modules={[EffectFade, Navigation, Pagination, Autoplay]}
            effect="fade"
            speed={1000}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true, type: 'progressbar' }}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            loop={true}
            className="h-full w-full"
          >
            {recentSeries.map((series) => (
              <SwiperSlide key={series.id}>
                <div className="relative h-full w-full flex flex-col lg:flex-row">
                  {/* Sección izquierda - Portada con extensión inmersiva */}
                  <div className="w-full lg:w-1/2 h-1/2 lg:h-full relative overflow-hidden bg-black/50">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-20  scale-125"
                      style={{ backgroundImage: `url(${series.portadaURL})` }}
                    />
                    
                    <div className="relative h-full w-full flex items-center justify-center p-8">
                    <Image
    src={series.portadaURL}
    alt={series.titulo}
    fill={true} // <-- Usa 'fill' para que la imagen llene este contenedor
    // Las clases de comportamiento visual dentro del contenedor van aquí
    className="object-contain"
    // Las props width y height NO se usan con fill
  />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent/80 to-transparent" />
                  </div>
    
                  {/* Sección derecha - Contenido */}
                  {/* Sección derecha - Contenido */}
<div className="w-full lg:w-1/2 h-1/2 lg:h-full flex items-center justify-center p-8 lg:p-16 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm">
  <div className="max-w-2xl space-y-6 lg:space-y-8 text-center relative group">
    {/* Título con efecto de flujo luminoso */}
    <h2 className="text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 leading-tight animate-text-flow hover:animate-pulse">
      {series.titulo}
    </h2>
    
    {/* Descripción con efecto de aparición progresiva */}
    <p className="text-lg lg:text-xl text-gray-300 leading-relaxed text-justify line-clamp-4 lg:line-clamp-5 px-4 lg:px-8 transform transition-all duration-500 group-hover:translate-y-2 group-hover:opacity-100 opacity-90">
      {series.descripcion}
      {/* Subrayado dinámico */}
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400/0 via-emerald-400/50 to-emerald-400/0 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
    </p>

    {/* Botón con efecto holográfico */}
    <div className="mt-10 lg:mt-14 perspective-1000">
      <Link
        href={`/explorar/${series.id}`}
        className="inline-flex items-center justify-center space-x-3 px-10 py-5 bg-gradient-to-br from-emerald-500/90 via-emerald-600 to-emerald-700/90 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 group shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 hover:rotate-x-[15deg] hover:rotate-y-[-5deg] relative overflow-hidden"
      >
        {/* Efecto de luz móvil */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-30 hover:opacity-50 hover:animate-light-sweep" />
        
        <span className="tracking-wide relative z-10 drop-shadow-md">
          Explorar Serie
        </span>
        
        {/* Icono con efecto de movimiento 3D */}
        <span className="inline-block relative z-10 group-hover:translate-x-2 group-hover:rotate-12 transition-transform duration-300">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M17 8l4 4m0 0l-4 4m4-4H3" 
            />
          </svg>
        </span>
      </Link>
    </div>

    {/* Efecto de partículas sutiles */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-emerald-400 rounded-full opacity-20 animate-particle-float" />
      <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-emerald-300 rounded-full opacity-20 animate-particle-float-delayed" />
    </div>
  </div>
</div>
                </div>
              </SwiperSlide>
            ))}
    
            {/* Controles de navegación */}
            <div className="swiper-button-prev !text-emerald-400 !opacity-80 hover:!opacity-100 !left-4 lg:!left-8 !h-12 lg:!h-16 !w-12 lg:!w-16 after:text-2xl lg:after:text-3xl !transition-all" />
            <div className="swiper-button-next !text-emerald-400 !opacity-80 hover:!opacity-100 !right-4 lg:!right-8 !h-12 lg:!h-16 !w-12 lg:!w-16 after:text-2xl lg:after:text-3xl !transition-all" />
          </Swiper>
        </div>
      );
    }