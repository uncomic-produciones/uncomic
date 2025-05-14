"use client";

import { useEffect, useState, useMemo } from "react"; // Import useMemo for filteredCapitulos
import { useParams } from 'next/navigation';
import Link from "next/link";
import { db } from "@/firebase/client";
import { doc, getDoc, collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import React from "react"; // Import React for typing
import Image from 'next/image';
// Define a more specific type for Icon props
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    children?: React.ReactNode; // Added children type for clarity
}

// Re-defining Icons with better typing and consistent structure
// Added className="shrink-0" to prevent icons from shrinking in flex containers
const Icon = ({ children, className = "", ...props }: IconProps) => (
  <svg {...props} className={`w-5 h-5 shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    {children}
  </svg>
);

const HeartIcon = ({ filled = false, className = '' }: { filled?: boolean, className?: string }) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5c-1.935 0-3.597 1.126-4.312 2.733c-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      fill={filled ? "currentColor" : "none"} // Fill based on 'filled' prop
    />
  </Icon>
);



const CalendarIcon = (props: IconProps) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </Icon>
);

const BookmarkIcon = ({ filled = false, className = '' }: { filled?: boolean, className?: string }) => (
  <Icon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
      fill={filled ? "currentColor" : "none"} // Fill based on 'filled' prop
    />
  </Icon>
);

const MagnifyingGlassIcon = (props: IconProps) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </Icon>
);

const DocumentTextIcon = (props: IconProps) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </Icon>
);

const UserCircleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </Icon>
);

const StarIcon = ({ filled = false, className = '' }: { filled?: boolean, className?: string }) => (
  <Icon className={`!w-4 !h-4 ${className}`}> {/* Adjusted size directly for star icon */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      fill={filled ? "currentColor" : "none"}
    />
  </Icon>
);

// Interfaces remain the same
interface SerieDetalles {
  id: string;
  titulo: string;
  descripcion: string;
  generos: string[];
  portadaURL: string;
  autorId: string;
  autorNombre: string;
  vistas: number;
  likes: number; // This will be the base count
  dislikes?: number;
  estado?: string;
  ranking?: number;
  fechaCreacion: Date | string | Timestamp;
}

interface Capitulo {
  id: string;
  titulo: string;
  numero: number;
  serieId: string;
  fechaPublicacion?: Timestamp | Date | string;
}

interface Autor {
  nombre: string;
  // Add other author details you might have, e.g., fotoURL, bio
}

export default function SerieDetailPage() {
  const params = useParams();
  const serieid = params.serieid as string;

  const [serieData, setSerieData] = useState<SerieDetalles | null>(null);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loadingSerie, setLoadingSerie] = useState(true);
  const [loadingCapitulos, setLoadingCapitulos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false); // State for bookmark status
  const [isLiked, setIsLiked] = useState(false); // State for like status
  const [likeCount, setLikeCount] = useState(0); // State for displayed like count
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false); // State for description toggle


  useEffect(() => {
    if (!serieid) {
      setError("ID de serie no encontrado en la URL.");
      setLoadingSerie(false);
      setLoadingCapitulos(false);
      return;
    }

    let unsubscribeCapitulos: () => void = () => {};

    const fetchSerieDetails = async () => {
      setLoadingSerie(true);
      setError(null);
      try {
        const serieDocRef = doc(db, "series", serieid);
        const serieDocSnap = await getDoc(serieDocRef);

        if (serieDocSnap.exists()) {
          const data = serieDocSnap.data();
          let autorNombre = "Autor desconocido";
          // Assume bookmark/like status might come from user-specific data,
          // but for this example, we'll initialize with false and use state.
          // In a real app, you'd check if the *current user* has bookmarked/liked this serie.
          // setIsBookmarked(checkIfUserBookmarked(serieid));
          // setIsLiked(checkIfUserLiked(serieid));
          setLikeCount(data.likes || 0);


          if (data.autorId) {
            try {
              const autorDocRef = doc(db, "usuarios", data.autorId);
              const autorDocSnap = await getDoc(autorDocRef);
              if (autorDocSnap.exists()) {
                const autorData = autorDocSnap.data() as Autor;
                autorNombre = autorData?.nombre || "Autor desconocido";
              }
            } catch (authorError) {
              console.error("Error fetching author:", authorError);
            }
          }

          let fechaFormateada: Date | string | Timestamp = data.fechaCreacion;
          if (data.fechaCreacion instanceof Timestamp) {
            fechaFormateada = data.fechaCreacion.toDate();
          } else if (typeof data.fechaCreacion === 'string') {
            const parsedDate = new Date(data.fechaCreacion);
             fechaFormateada = isNaN(parsedDate.getTime()) ? new Date() : parsedDate; // Handle invalid date strings
          } else if (!data.fechaCreacion) {
             fechaFormateada = new Date(); // Default to now if missing
          }


          setSerieData({
            id: serieDocSnap.id,
            titulo: data.titulo || "Sin título",
            descripcion: data.descripcion || "Sin descripción.",
            generos: data.generos || [],
            portadaURL: data.portadaURL || "/placeholder-portada.jpg",
            autorId: data.autorId || "",
            autorNombre: autorNombre,
            vistas: data.vistas || 0,
            likes: data.likes || 0, // Keep original likes from DB
            dislikes: data.dislikes,
            estado: data.estado,
            ranking: data.ranking,
            fechaCreacion: fechaFormateada,
          });
        } else {
          setError(`Serie con ID "${serieid}" no encontrada.`);
          setSerieData(null);
        }
      } catch (err) {
        console.error("Error fetching serie details:", err);
        setError("Error al cargar la información de la serie.");
        setSerieData(null);
      } finally {
        setLoadingSerie(false);
      }
    };

    const subscribeToCapitulos = () => {
      setLoadingCapitulos(true);
      // Clear previous chapter errors, but don't overwrite a serie error
      if (!error || error.includes("capítulos")) {
         setError(null);
      }

      const capitulosQuery = query(
        collection(db, "series", serieid, "capitulos"),
        orderBy("numero", "asc")
      );

      unsubscribeCapitulos = onSnapshot(capitulosQuery, (snapshot) => {
        const capitulosData: Capitulo[] = snapshot.docs.map(doc => {
          const data = doc.data();
           // Basic validation for essential fields
           if (data === null || typeof data !== 'object' || data.numero === undefined) return null;

          return {
            id: doc.id,
            titulo: data.titulo || `Capítulo ${data.numero}`, // Better default title if number exists
            numero: data.numero,
            serieId: serieid, // This is known
            fechaPublicacion: data.fechaPublicacion,
          } as Capitulo; // Assert to Capitulo type after mapping
        }).filter((capitulo): capitulo is Capitulo => capitulo !== null); // Type guard filter

        setCapitulos(capitulosData); // Assuming Firebase order handles sorting
        setLoadingCapitulos(false);
      }, (err) => {
        console.error("Error fetching chapters:", err);
        // Only set chapter error if a serie error hasn't already occurred
        if (!error || !error.includes("Serie con ID")) {
           setError("Error al cargar los capítulos.");
        }
        setCapitulos([]);
        setLoadingCapitulos(false);
      });
    };

    fetchSerieDetails();
    subscribeToCapitulos();

    return () => {
      unsubscribeCapitulos();
    };
  }, [serieid, error]); // Added error to dependencies


  const formatDate = (date: Date | Timestamp | string | undefined) => {
    if (!date) return 'Fecha desconocida'; // Handle undefined/null
    try {
        let jsDate: Date;
        if (date instanceof Timestamp) {
            jsDate = date.toDate();
        } else if (typeof date === 'string') {
            const parsedDate = new Date(date);
             if (isNaN(parsedDate.getTime())) return 'Fecha inválida';
             jsDate = parsedDate;
        } else if (date instanceof Date) {
            jsDate = date;
        } else {
             return 'Fecha inválida';
        }
        // Use localeCompare for potentially better handling of formats
        return jsDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (e) {
        console.error("Failed to format date:", date, e);
        return 'Fecha inválida';
    }
  };

  // Filter chapters based on search term - Use useMemo for performance
  const filteredCapitulos = useMemo(() => {
    if (!searchTerm) return capitulos;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return capitulos.filter(capitulo =>
      capitulo.titulo.toLowerCase().includes(lowerCaseSearchTerm) ||
      capitulo.numero.toString().includes(lowerCaseSearchTerm) // Search by chapter number string
    );
  }, [capitulos, searchTerm]);


  // Placeholder handlers for interactions
  const handleBookmark = () => {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    // TODO: Add Firebase logic to save/remove bookmark for the current user
    console.log(newState ? "Serie marcada como favorita" : "Serie eliminada de favoritos");
  };

  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    // Optimistically update count
    setLikeCount(prevCount => prevCount + (newState ? 1 : -1));
    // TODO: Add Firebase logic to record like/unlike for the current user
    console.log(newState ? "Serie marcada con Like" : "Like eliminado");
  };

  // Determine if the first chapter link is available
  const firstChapter = useMemo(() => {
      // Find the chapter with the lowest number or just the first in the sorted list
      if (capitulos.length === 0) return null;
      // Assuming capitulos state is already sorted by number ascending due to Firebase query
      return capitulos[0];
  }, [capitulos]);


  // --- Render Logic ---

  // Loading State
  if (loadingSerie || loadingCapitulos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6"> {/* Added padding */}
        <div className="animate-pulse flex flex-col items-center p-8 bg-white rounded-lg shadow-xl"> {/* Card style loading */}
          <div className="h-16 w-16 bg-indigo-300 rounded-full mb-6 animate-bounce"></div> {/* Larger bouncing effect */}
          <div className="h-6 w-48 bg-indigo-200 rounded mb-3"></div>
          <div className="h-5 w-40 bg-indigo-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Error State (when serieData is null due to error)
  if (error && serieData === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6"> {/* Added padding */}
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center"> {/* Card style error */}
          <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-2xl font-bold text-gray-900 mb-3">Algo salió mal</h3> {/* Darker text, larger */}
          <p className="text-gray-700 mb-6">{error}</p> {/* Darker text */}
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-semibold"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Not Found State (when loading is done, no serieData, and no explicit fetch error)
   if (!loadingSerie && !serieData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-6"> {/* Added padding */}
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center"> {/* Consistent card styling */}
           <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172l3.536-3.536m0 0L15.828 9.172M12 12l.01 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
          <h3 className="mt-4 text-2xl font-bold text-gray-900 mb-3">Serie no encontrada</h3> {/* Darker text, larger */}
          <p className="text-gray-700 mb-6">No se pudo cargar la información de la serie solicitada. Verifique la URL.</p> {/* Darker text, improved message */}
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-semibold"
          >
            Explorar otras series
          </Link>
        </div>
      </div>
    );
  }

   // Main Render (when serieData is available)
   // Added a check here just in case TypeScript flow isn't perfect, though the above checks should prevent this.
  if (!serieData) return null;


  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen text-gray-900">
      {/* Hero Section with Background Image and Overlay */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110" // Scale up background
          // Note: backgroundAttachment: 'fixed' can sometimes cause issues with scale/blur.
          // A common alternative is to use a fixed position element with scale/blur
          // behind a scrollable container, or use CSS transform based parallax.
          // Sticking with scaled/blurred background image for simplicity.
          style={{ backgroundImage: `url(${serieData.portadaURL})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div> {/* Darker overlay */}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            {serieData.titulo}
          </h1>
           {/* Short description or tagline in the hero */}
           {serieData.descripcion && (
              <p className="text-lg md:text-xl text-white/90 mb-6 drop-shadow line-clamp-3">
                 {serieData.descripcion}
              </p>
           )}

          {/* Genres in Hero */}
          {serieData.generos && serieData.generos.length > 0 && (
             <div className="flex flex-wrap justify-center gap-3 mb-6">
               {serieData.generos.map((genero) => (
                 <span
                   key={genero}
                   className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/30 shadow-inner" // Added shadow-inner
                 >
                   {genero}
                 </span>
               ))}
             </div>
          )}

          {/* Optional: Quick action like Read First Chapter */}
          {firstChapter && (
              <Link
                href={`/leer/${serieid}/${firstChapter.id}`}
                className="inline-flex items-center px-8 py-3 bg-white text-indigo-700 rounded-lg font-semibold text-lg shadow-lg hover:bg-gray-100 transition-colors mt-4 animate-bounce-subtle" // Added subtle bounce
              >
                 <svg className="w-6 h-6 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                Leer Primer Capítulo
              </Link>
           )}

        </div>
      </div>

      {/* Main Content Container */}
      {/* Negative margin pulls the main card up into the hero section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 -mt-16 relative z-20"> {/* Increased z-index */}

        {/* Serie Details Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-12 ring-1 ring-black ring-opacity-5"> {/* Added ring for definition */}
          <div className="md:flex">
            {/* Cover Image area */}
            {/* Using same width ratios but p-0 to make image fill edge */}
            <div className="md:w-1/3 lg:w-1/4 p-0 relative group">
              {/* Added rounded-tl-2xl/tr-0 for top left corner on md */}
              <div className="aspect-w-3 aspect-h-4 w-full overflow-hidden md:rounded-tl-2xl md:rounded-tr-none rounded-t-2xl">
              <Image
    src={serieData.portadaURL}
    alt={`Portada de ${serieData.titulo}`}
    fill={true} // <-- Usa 'fill' para que la imagen llene el div padre
    // Las clases que afectan la imagen dentro del contenedor (ajuste, hover, transición)
    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
    // No necesitas width ni height cuando usas fill
  />
              </div>
              {/* Optional: Remove the 'shelf' effect if it conflicts with the overall look */}
              {/* <div className="absolute -bottom-4 left-4 right-4 h-4 bg-white/30 backdrop-blur-sm rounded-b-xl"></div> */}
            </div>

            {/* Serie Info */}
            {/* Adjusted padding and layout for different screens */}
            <div className="p-6 md:p-8 lg:p-10 md:w-2/3 lg:w-3/4 flex flex-col justify-between"> {/* Flex column for layout */}
                <div> {/* Wrapper for top info */}
                    {/* Ranking and Status */}
                    <div className="flex flex-wrap items-center mb-3 gap-y-2"> {/* Added gap-y */}
                      {serieData.ranking !== undefined && serieData.ranking !== null && (
                         <div className="flex items-center mr-6 pr-6 border-r border-gray-200"> {/* Added border separator */}
                           {[...Array(5)].map((_, i) => (
                             <StarIcon
                               key={i}
                               filled={i < Math.floor(serieData.ranking || 0)}
                               className="text-yellow-400 mr-0.5 last:mr-0" // Adjust margin between stars
                             />
                           ))}
                            {serieData.ranking > 0 && (
                              <span className="ml-2 text-gray-600 text-sm font-medium">{serieData.ranking.toFixed(1)}</span> // Display ranking number
                            )}
                         </div>
                      )}
                       {serieData.estado && (
                           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ // Rounded-full and larger padding/text
                               serieData.estado.toLowerCase() === 'completada' ? 'bg-green-100 text-green-800' :
                               serieData.estado.toLowerCase() === 'en curso' ? 'bg-yellow-100 text-yellow-800' :
                               'bg-gray-100 text-gray-800'
                           }`}>
                               {serieData.estado}
                           </span>
                       )}
                    </div>

                    {/* Title (already in hero, maybe smaller here?) or just author */}
                    {/* Since title is in hero, maybe just author/stats/description here */}

                    {/* Author Link */}
                    <Link
                        href={`/perfil/${serieData.autorId}`}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors text-base font-medium mb-6" // Adjusted margin
                    >
                        <UserCircleIcon className="w-5 h-5 mr-2" />
                        <span>{serieData.autorNombre}</span>
                    </Link>

                    {/* Description with Read More */}
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Sinopsis</h3> {/* Changed heading */}
                      {/* Use line-clamp on a div and toggle it */}
                      <div className={`text-gray-700 leading-relaxed ${showFullDescription ? '' : 'line-clamp-4'}`}> {/* Apply line-clamp */}
                         {serieData.descripcion || "Esta serie no tiene sinopsis disponible."}
                      </div>
                       {/* Show Read More/Less button if description is potentially long */}
                       {serieData.descripcion && serieData.descripcion.length > 200 && ( // Basic check for length
                          <button
                             onClick={() => setShowFullDescription(!showFullDescription)}
                             className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 focus:outline-none"
                          >
                             {showFullDescription ? 'Leer menos' : 'Leer más'}
                          </button>
                       )}
                    </div>
                </div>

                {/* Interaction Buttons and Stats Grid */}
                <div> {/* Wrapper for bottom info */}
                     <div className="flex flex-wrap items-center gap-4 mb-6"> {/* Use gap for spacing */}
                         {/* Like Button */}
                         <button
                            onClick={handleLike}
                            className={`inline-flex items-center px-5 py-2.5 rounded-lg transition-colors font-semibold text-base shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${isLiked ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'}`}
                         >
                            <HeartIcon filled={isLiked} className="w-5 h-5 mr-2" />
                            <span>{likeCount}</span> {/* Use likeCount state */}
                         </button>

                         {/* Bookmark Button */}
                          <button
                            onClick={handleBookmark}
                            className={`inline-flex items-center px-5 py-2.5 rounded-lg transition-colors font-semibold text-base shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${isBookmarked ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'}`}
                         >
                           <BookmarkIcon filled={isBookmarked} className="w-5 h-5 mr-2" />
                            <span>{isBookmarked ? 'Guardado' : 'Guardar'}</span>
                         </button>

                         {/* Optional: Share Button */}
                         {/* <button className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-semibold text-base shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300">
                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 6a3 3 0 110-6m0 6a3 3 0 100-6"></path></svg>
                             Compartir
                         </button> */}

                     </div>


                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-6 mt-6"> {/* Added border-t and padding */}
                       <div className="p-3 bg-gray-50 rounded-lg text-center shadow-sm"> {/* Reduced padding, added shadow-sm */}
                           <div className="text-gray-600 text-sm mb-1 font-medium">Capítulos</div>
                           <div className="text-2xl font-bold text-indigo-600">{capitulos.length}</div>
                       </div>
                       <div className="p-3 bg-gray-50 rounded-lg text-center shadow-sm">
                           <div className="text-gray-600 text-sm mb-1 font-medium">Vistas</div>
                           <div className="text-2xl font-bold text-purple-600">{serieData.vistas}</div>
                       </div>
                       <div className="p-3 bg-gray-50 rounded-lg text-center shadow-sm">
                           <div className="text-gray-600 text-sm mb-1 font-medium">Likes</div>
                           <div className="text-2xl font-bold text-red-600">{likeCount}</div> {/* Use likeCount state */}
                       </div>
                       <div className="p-3 bg-gray-50 rounded-lg text-center shadow-sm">
                           <div className="text-gray-600 text-sm mb-1 font-medium">Publicación</div>
                            <div className="text-base font-semibold text-gray-700"> {/* Adjusted text size/weight */}
                               {formatDate(serieData.fechaCreacion) || "Desconocida"}
                            </div>
                       </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black ring-opacity-5"> {/* Consistent card styling */}
          <div className="border-b border-gray-200 px-6 md:px-8 py-5 md:py-6 bg-gray-50"> {/* Adjusted padding */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Capítulos</h2>
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Buscar capítulo..."
                  className="w-full pl-5 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 placeholder-gray-400 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"> {/* Centered vertically */}
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loadingCapitulos && (
               <div className="p-10 flex justify-center items-center min-h-[100px]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
               </div>
            )}

            {!loadingCapitulos && filteredCapitulos.length === 0 ? (
              <div className="p-12 text-center text-gray-600">
                <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="mt-4 text-xl font-semibold text-gray-800">
                  {searchTerm ? "No se encontraron resultados" : "No hay capítulos aún"}
                </h3>
                <p className="mt-2 text-gray-600">
                  {searchTerm ? "Intenta con otro término de búsqueda." : "El autor no ha publicado capítulos para esta serie o están en preparación."}
                </p>
                {searchTerm && capitulos.length > 0 && (
                     <button
                        onClick={() => setSearchTerm("")}
                        className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm font-medium focus:outline-none"
                     >
                        Mostrar todos los capítulos
                     </button>
                )}
              </div>
            ) : (
              filteredCapitulos.map((capitulo) => (
                <Link
                  key={capitulo.id}
                  href={`/leer/${serieid}/${capitulo.id}`}
                  className="block p-6 hover:bg-indigo-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0"> {/* Added gap */}
                    <div className="flex items-start flex-grow mr-4"> {/* Added flex-grow and margin */}
                       {/* Chapter Number Bubble */}
                       <div className="bg-indigo-100 text-indigo-800 rounded-full w-10 h-10 flex items-center justify-center p-2 mr-4 flex-shrink-0 group-hover:bg-indigo-200 transition-colors shadow-sm"> {/* Rounded-full, fixed size */}
                           <span className="font-bold text-lg">{capitulo.numero}</span>
                       </div>
                       {/* Chapter Title and Date */}
                       <div>
                           <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug">
                               {capitulo.titulo}
                           </h3>
                           {capitulo.fechaPublicacion && (
                               <div className="flex items-center text-sm text-gray-500 mt-1">
                                   <CalendarIcon className="w-4 h-4 mr-1" /> {/* Smaller icon */}
                                   <span>{formatDate(capitulo.fechaPublicacion)}</span>
                               </div>
                           )}
                       </div>
                    </div>
                    {/* Read Now Tag */}
                    <div className="flex-shrink-0"> {/* Prevent shrinking */}
                       <span className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium group-hover:bg-indigo-100 transition-colors shadow-sm"> {/* Pill shape */}
                           Leer ahora
                           <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                           </svg>
                       </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination (Basic Styling - Logic needs implementation) */}
          {/* Show pagination only if there are chapters to list and filtering isn't hiding them all */}
          {filteredCapitulos.length > 0 && capitulos.length > filteredCapitulos.length && ( // Example: only show pagination if filtering is active and hid some chapters, or if there are munknown chapters
             <div className="px-6 md:px-8 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-gray-50 rounded-b-2xl gap-3 sm:gap-0"> {/* Adjusted padding and layout */}
              <div className="text-sm text-gray-600">
                {/* Placeholder text - actual pagination needs logic */}
                 Mostrando <span className="font-medium">1-{Math.min(filteredCapitulos.length, 10)}</span> de <span className="font-medium">{filteredCapitulos.length}</span> {searchTerm && `(total ${capitulos.length})`} {/* Show total if filtered */}
              </div>
              <div className="flex space-x-2">
                {/* Basic pagination buttons with disabled state */}
                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm" disabled>
                  Anterior
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm" disabled>
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Author Section */}
        {serieData.autorId && ( // Only show if authorId is present
           <div className="mt-12 bg-white rounded-2xl shadow-2xl overflow-hidden p-8 md:p-10 ring-1 ring-black ring-opacity-5"> {/* Added padding, ring */}
             <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre el autor</h2>
             <div className="flex items-center flex-wrap gap-6"> {/* Added gap */}
               <div className="flex-shrink-0">
                 {/* Placeholder for author image or avatar */}
                 {/* Replace with actual author.fotoURL if available */}
                 <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden ring-2 ring-indigo-600 ring-offset-2"> {/* Added ring */}
                    {/* If author has a photoURL, use img tag */}
                    {/* <img src={autorData.fotoURL} alt={serieData.autorNombre} className="object-cover w-full h-full" /> */}
                    {/* Otherwise, use the icon */}
                   <UserCircleIcon className="w-12 h-12 text-indigo-600" />
                 </div>
               </div>
               <div className="flex-grow"> {/* Allow text to grow */}
                 <h3 className="text-xl font-semibold text-gray-900">{serieData.autorNombre}</h3>
                 {/* Optional: Add author bio snippet */}
                 {/* <p className="text-gray-600 mt-1 line-clamp-2">{autorData.bio}</p> */}
                 <p className="text-gray-600 mt-1">Autor de <span className="font-semibold">{serieData.titulo}</span></p> {/* Added highlight */}
                 {/* Optional: Show author stats here */}
               </div>
               {/* View Profile Button */}
               <div className="flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0"> {/* Responsive button width */}
                 <Link
                   href={`/perfil/${serieData.autorId}`}
                   className="inline-flex justify-center items-center w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                 >
                   Ver perfil
                    <svg className="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                 </Link>
               </div>
             </div>
           </div>
        )}

      </div>
       {/* Optional Footer or other content */}
       {/* <footer className="py-8 text-center text-gray-600 text-sm">
           <p>© {new Date().getFullYear()} Tu Plataforma. Todos los derechos reservados.</p>
       </footer> */}
    </div>
  );
}


// Add keyframe for subtle bounce animation (add this to your global CSS file or a style tag)
// Example in your global CSS file (e.g., globals.css)

/*
@keyframes bounce-subtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px); // Adjust bounce height
  }
}

.animate-bounce-subtle {
  animation: bounce-subtle 1.5s ease-in-out infinite; // Adjust duration/timing
}
*/