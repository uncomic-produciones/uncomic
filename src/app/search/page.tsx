// app/series/page.tsx
"use client";
import { db } from "@/firebase/client";
// Asegúrate de importar todo lo necesario desde firestore
import { collection, query, orderBy, onSnapshot, getDoc, doc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; 

// Interfaz para datos del Autor (si la tienes en otro lado, impórtala)
interface Autor {
  nombre: string;
  // otros campos relevantes del autor...
}

// Interfaz para la Serie (refleja los campos que USAS en el componente)
interface Serie {
  id: string;
  titulo: string;
  descripcion: string;
  generos: string[];
  portadaURL: string;
  autorId: string;
  autorNombre: string;
  vistas: number;
  likes: number;
  fechaCreacion: string; // Fecha formateada para mostrar
  // -- Campos opcionales si decides usarlos más tarde --
  // dislikes?: number;
  // estado?: string;
  // ranking?: number;
  // originalFecha?: unknown; // Si necesitas la fecha original para ordenar o lógica
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "series"),
      orderBy("fechaCreacion", "desc") // Obtiene todas, ordenadas
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      const seriesPromises = snapshot.docs.map(async (seriesDoc: QueryDocumentSnapshot<DocumentData>) => {
        const data = seriesDoc.data();
        let autorNombre = "Autor desconocido";

        try {
          if (data.autorId) {
            const autorDocRef = doc(db, "usuarios", data.autorId);
            const autorDocSnap = await getDoc(autorDocRef);
            if (autorDocSnap.exists()) {
              const autorData = autorDocSnap.data() as Autor;
              autorNombre = autorData?.nombre || "Autor desconocido";
            }
          }
        } catch (error) {
          console.error(`Error fetching author ${data.autorId}:`, error);
        }

        // Formatear fecha (tu formato ISO funciona bien con new Date)
        let fechaStr = "Fecha inválida";
        try {
          if (typeof data.fechaCreacion === 'string') {
            const parsedDate = new Date(data.fechaCreacion);
            if (!isNaN(parsedDate.getTime())) {
              fechaStr = parsedDate.toLocaleDateString(); // o .toLocaleString() si quieres hora
            }
          }
          // Si fuera Timestamp de Firestore:
          // else if (data.fechaCreacion && typeof data.fechaCreacion.toDate === 'function') {
          //   fechaStr = data.fechaCreacion.toDate().toLocaleDateString();
          // }
        } catch (dateError) {
          console.error("Error parsing date:", data.fechaCreacion, dateError);
        }

        // Mapear datos de Firestore a la interfaz Serie
        return {
          id: seriesDoc.id,
          titulo: data.titulo || "Sin Título",
          descripcion: data.descripcion || "",
          generos: Array.isArray(data.generos) ? data.generos : [],
          portadaURL: data.portadaURL || "",
          autorId: data.autorId || "",
          autorNombre: autorNombre,
          vistas: data.vistas || 0,
          likes: data.likes || 0,
          fechaCreacion: fechaStr, // Usa la fecha formateada
          // --- Si añades campos opcionales, mapealos aquí ---
          // dislikes: data.dislikes || 0,
          // estado: data.estado || "desconocido",
          // ranking: data.ranking || 0,
          // originalFecha: data.fechaCreacion // Guarda la original si es necesario
        } as Serie;
      });

      try {
        const resolvedSeriesData = await Promise.all(seriesPromises);
        setSeries(resolvedSeriesData);
      } catch (error) {
        console.error("Error processing series data:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
        console.error("Error listening to series collection:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtra sobre el array completo de series
  const filteredSeries = series.filter(serie =>
    serie.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    serie.autorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(serie.generos) && serie.generos.some(genero =>
      typeof genero === 'string' && genero.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // ... (El resto del JSX para renderizar las tarjetas es el mismo) ...
  // Asegúrate de que el JSX use los campos definidos en la interfaz Serie
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header y buscador */}
        <div className="mb-8 text-center">
           {/* Asegúrate de que el contenido del header (título, párrafo, etc.) esté aquí si lo omitiste */}
           <h1 className="text-4xl font-bold text-gray-800 mb-2">Explora las Series</h1>
           <p className="text-gray-600 mb-6">Descubre historias creadas por nuestra comunidad</p>
          <div className="max-w-md mx-auto">
             <div className="relative">
               <input
                 type="text"
                 placeholder="Buscar series, autores o géneros..."
                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" // Clases completas
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
               {/* Icono de búsqueda SVG */}
               <svg
                  className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
             </div>
           </div>
        </div>

        {/* Listado de series */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
             {/* Mensajes completos de 'no encontrado' */}
             <h3 className="text-xl font-medium text-gray-700 mb-2">
              {searchTerm ? "No se encontraron resultados" : "Aún no hay series publicadas"}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? "Intenta con otro término de búsqueda" : "Sé el primero en publicar una serie"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mapea sobre filteredSeries */}
            {filteredSeries.map((serie) => (
              <div key={serie.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                {/* Link a la portada (ACTUALIZADO) */}
                <Link
  href={`/explorar/${serie.id}`}
  className="block relative flex-shrink-0"
  style={{ height: '50%' }}
>
                  <Image
  src={serie.portadaURL || "/placeholder-portada.jpg"}
  alt={`Portada de ${serie.titulo}`}
  width={300} // Ajusta el tamaño según tu diseño
  height={450}
  className="w-full h-full object-cover"
  unoptimized // Puedes quitar esto si usas imágenes externas correctamente configuradas
/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </Link>

                {/* Contenido de la tarjeta */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Título y Fecha */}
                  <div className="flex justify-between items-start mb-2">
                    {/* Link del título (ACTUALIZADO) */}
                    <Link href={`/explorar/${serie.id}`}>
                      <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                        {serie.titulo} {/* Usa titulo */}
                      </h3>
                    </Link>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
                      {serie.fechaCreacion} {/* Usa fechaCreacion formateada */}
                    </span>
                  </div>

                  {/* Autor (Enlace sin cambios, apunta al perfil) */}
                  <Link href={`/perfil/${serie.autorId}`}> {/* Usa autorId */}
                    <p className="text-sm text-gray-600 mb-3 hover:text-blue-600 transition-colors">
                      Por: {serie.autorNombre} {/* Usa autorNombre */}
                    </p>
                  </Link>

                  {/* Descripción */}
                  <p className="text-gray-700 mb-4 line-clamp-3 flex-grow">
                    {serie.descripcion} {/* Usa descripcion */}
                  </p>

                  {/* Géneros */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {serie.generos.slice(0, 3).map((genero) => ( // Usa generos
                      <span key={genero} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {genero}
                      </span>
                    ))}
                    {/* Muestra contador si hay más de 3 géneros */}
                    {serie.generos.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        +{serie.generos.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Vistas y Likes */}
                  <div className="flex justify-between text-sm text-gray-500 border-t pt-3 mt-auto">
                    <div className="flex items-center">
                      {/* Icono vistas SVG */}
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                       </svg>
                      {serie.vistas} {/* Usa vistas */}
                    </div>
                    <div className="flex items-center">
                       {/* Icono likes SVG */}
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                       </svg>
                      {serie.likes} {/* Usa likes */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}