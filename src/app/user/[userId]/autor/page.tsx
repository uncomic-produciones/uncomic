// app/[userId]/autor/page.tsx
"use client";
import { useAuth } from "@/providers/AuthProvider";
import { useState, useEffect } from "react";
import AgregarSerieForm from "@/components/AgregarSerieForm";
import { db } from "@/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import AgregarCapituloModal from "@/components/AgregarCapituloModal";
import CapitulosModal from "@/components/CapitulosModal";
import Image from 'next/image'

interface Serie {
  id: string;
  titulo: string;
  descripcion: string;
  generos: string[];
  portadaURL: string;
  fechaCreacion: string;
  likes: number;
  vistas: number;
}

export default function AutorDashboard() {
  const { user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [series, setSeries] = useState<Serie[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null);
  const [selectedSerieParaVer, setSelectedSerieParaVer] = useState<string | null>(null);


  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "series"),
      where("autorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const seriesData: Serie[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        seriesData.push({
          id: doc.id,
          titulo: data.titulo,
          descripcion: data.descripcion,
          generos: data.generos,
          portadaURL: data.portadaURL,
          fechaCreacion: data.fechaCreacion,
          likes: data.likes,
          vistas: data.vistas
        });
      });
      setSeries(seriesData);
      setLoadingSeries(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800">🎨 Tu Espacio Tu Mundo</h1>
          <p className="mt-2 text-gray-500 text-lg">
            ¡Bienvenido, <span className="font-semibold text-green-600">{user.displayName}</span>! Gestiona tus series y capítulos.
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="mt-4 md:mt-0 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow transition-all"
        >
          {mostrarFormulario ? "Cancelar" : "+ Crear Nueva Serie"}
        </button>
      </div>

      {/* FORMULARIO DE AGREGAR SERIE */}
      {mostrarFormulario && (
        <div className="mb-8">
          <AgregarSerieForm autorId={user.uid} />
        </div>
      )}

      {/* SERIES PUBLICADAS */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Tus Series Publicadas</h2>

        {loadingSeries ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-500 text-lg">Cargando tus obras...</p>
          </div>
        ) : series.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-gray-50 p-10 rounded-xl">
            <p className="text-gray-500 text-lg mb-4">Aún no has creado ninguna serie</p>
            <Image 
  src="/no-data.svg" 
  alt="Sin series" 
  className="w-40" 
  width={160}  // Establece el ancho para la optimización
  height={160} // Establece la altura correspondiente
/>
          </div>
        ) : (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {series.map((serie) => (
              <div
                key={serie.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-shadow"
              >
                <Image
  src={serie.portadaURL || "/placeholder-portada.jpg"}
  alt={`Portada de ${serie.titulo}`}
  width={300} // Ajusta según tu diseño
  height={208} // Aproximadamente la mitad de 416 (h-52)
  className="w-full object-cover"
  style={{ height: '50%' }}
  unoptimized // Si usas Firebase Storage y no quieres optimización
/>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{serie.titulo}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {serie.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {serie.generos.map((genero) => (
                      <span
                        key={genero}
                        className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      >
                        {genero}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>👍 {serie.likes}</span>
                    <span>👀 {serie.vistas}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedSerie(serie.id)}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold"
                    >
                      + Capítulo
                    </button>
                    <button
                      onClick={() => setSelectedSerieParaVer(serie.id)}
                      className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm font-semibold"
                    >
                      Ver Capítulos
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODALES */}
      {selectedSerie && (
        <AgregarCapituloModal
          serieId={selectedSerie}
          autorId={user.uid}
          onClose={() => setSelectedSerie(null)}
        />
      )}

      {selectedSerieParaVer && (
        <CapitulosModal
          serieId={selectedSerieParaVer}
          onClose={() => setSelectedSerieParaVer(null)}
        />
      )}
    </div>
  );
}