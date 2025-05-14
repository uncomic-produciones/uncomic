// components/CapitulosModal.tsx
"use client";
import { useState, useEffect } from "react";
import { db } from "@/firebase/client";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from 'next/image'

interface Capitulo {
  id: string;
  titulo: string;
  numero: number;
  fechaPublicacion: string;
  vistas: number;
  likes: number;
  paginasURLs: string[];
}

interface CapitulosModalProps {
  serieId: string;
  onClose: () => void;
}

export default function CapitulosModal({ serieId, onClose }: CapitulosModalProps) {
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCapitulo, setSelectedCapitulo] = useState<Capitulo | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "series", serieId, "capitulos"),
      orderBy("numero", "desc") // Orden descendente por número de capítulo
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Capitulo[] = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as Capitulo);
      });
      setCapitulos(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serieId]);

  const handleVerPaginas = (capitulo: Capitulo) => {
    setSelectedCapitulo(capitulo);
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (selectedCapitulo && currentPage < selectedCapitulo.paginasURLs.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      {selectedCapitulo ? (
        /* VISUALIZADOR DE PÁGINAS */
        <div className="relative w-full max-w-4xl h-[90vh] bg-black rounded-lg overflow-hidden">
          {/* Barra superior */}
          <div className="absolute top-0 left-0 right-0 bg-black/80 text-white p-3 z-10 flex justify-between items-center">
            <button 
              onClick={() => setSelectedCapitulo(null)}
              className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver a capítulos
            </button>
            
            <div className="text-center">
              <h3 className="font-semibold">
                {selectedCapitulo.titulo} - Página {currentPage + 1} de {selectedCapitulo.paginasURLs.length}
              </h3>
            </div>
            
            <button 
              onClick={onClose}
              className="hover:text-red-400 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Controles de navegación */}
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full z-10 hover:bg-emerald-600 transition-colors ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowLeftIcon className="w-8 h-8" />
          </button>
          
          <button 
            onClick={handleNextPage}
            disabled={selectedCapitulo && currentPage === selectedCapitulo.paginasURLs.length - 1}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full z-10 hover:bg-emerald-600 transition-colors ${selectedCapitulo && currentPage === selectedCapitulo.paginasURLs.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowRightIcon className="w-8 h-8" />
          </button>

          {/* Visualizador de página */}
{/* MODIFICAR: Añadir className="relative" al div contenedor */}
<div className="h-full flex items-center justify-center p-4 relative"> {/* <-- Añadido 'relative' aquí */}
  {selectedCapitulo.paginasURLs.length > 0 && (
    // REEMPLAZAR: la etiqueta <img> por <Image>
    <Image
      src={selectedCapitulo.paginasURLs[currentPage]}
      alt={`Página ${currentPage + 1} del capítulo ${selectedCapitulo.numero}`}
      fill={true} // <-- Usar la prop 'fill' para que llene el contenedor
      // <-- Mantener las clases de cómo la imagen se ajusta dentro del espacio llenado
      className="object-contain"
      // <-- Eliminar las props width y height si existieran
    />
  )}
</div>

          {/* Miniaturas de páginas (footer) */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 overflow-x-auto flex gap-2">
            {selectedCapitulo.paginasURLs.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-16 h-20 flex-shrink-0 border-2 ${currentPage === index ? 'border-emerald-500' : 'border-transparent'} rounded overflow-hidden`}
              >
                <Image
        src={url}
        alt={`Miniatura página ${index + 1}`}
        fill={true} // <-- Usar 'fill'
        className="object-cover" // <-- Mantener object-cover
        // Eliminar width y height si existen
      />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* LISTADO DE CAPÍTULOS */
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Capítulos Publicados</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-2">Cargando capítulos...</p>
            </div>
          ) : capitulos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay capítulos publicados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {capitulos.map((capitulo) => (
                <div 
                  key={capitulo.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                          Cap. {capitulo.numero}
                        </span>
                        <h3 className="text-xl font-medium">{capitulo.titulo}</h3>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        Publicado: {new Date(capitulo.fechaPublicacion).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Vistas</p>
                        <p className="font-semibold">{capitulo.vistas}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Likes</p>
                        <p className="font-semibold">{capitulo.likes}</p>
                      </div>
                      <button
                        onClick={() => handleVerPaginas(capitulo)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                      >
                        Ver Páginas
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}