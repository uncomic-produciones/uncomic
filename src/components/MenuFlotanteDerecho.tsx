"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // Importar Link para navegación interna
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  CogIcon,
  UserCircleIcon // Icono alternativo para perfil si no hay foto
} from "@heroicons/react/24/outline";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/client"; // Asegúrate de que estas rutas sean correctas
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation"; // Importa usePathname

// Definir la interfaz del usuario, incluyendo el rol y photoURL que pueden ser null
interface UserProfile {
    uid: string;
    rol?: string | null; // Permite string, null o undefined
    photoURL?: string | null; // Permite string, null o undefined
    // Añade aquí otras propiedades que necesites del usuario
}

export default function MenuFlotanteDerecho() {
  // Inicializamos user a undefined para distinguir entre 'no cargado' y 'no hay usuario'
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const [perfilAbierto, setPerfilAbierto] = useState(false); // Estado para controlar el menú desplegable del perfil
  const router = useRouter(); // Hook para navegación programática
  const pathname = usePathname(); // <--- Obtiene la ruta actual

  // Efecto para escuchar cambios en el estado de autenticación de Firebase y obtener datos de Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Si hay un usuario autenticado, intenta obtener sus datos de Firestore
        const userRef = doc(db, "usuarios", firebaseUser.uid);
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              // Combina datos de Firebase Auth y Firestore
              setUser({
                  uid: firebaseUser.uid,
                  rol: data.rol || null, // Asigna el rol de Firestore, default a null si no existe o es falsy
                  photoURL: firebaseUser.photoURL,
                  // Añade otras propiedades de `data` aquí si las necesitas
              });
            } else {
              // Usuario autenticado en Auth, pero no encontrado en Firestore (usuario nuevo?)
              console.warn(`User ${firebaseUser.uid} found in Auth but not in Firestore.`);
              // Decide asignar un rol por defecto (ej. 'lector') o null
               setUser({
                  uid: firebaseUser.uid,
                  rol: 'lector', // O null, dependiendo de tu lógica de negocio
                  photoURL: firebaseUser.photoURL,
              });
               // Opcional: Crea el documento del usuario en Firestore aquí si es un usuario nuevo
            }
        } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
             // En caso de error al obtener de Firestore, establece un usuario básico con uid
             setUser({
                uid: firebaseUser.uid,
                rol: null, // O un rol por defecto seguro si falla la lectura
                photoURL: firebaseUser.photoURL,
            });
        }

      } else {
        // No hay usuario autenticado
        setUser(null);
      }
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []); // Dependencias vacías: el efecto solo se ejecuta una vez al montar

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push("/login"); // Redirige al login después de cerrar sesión
    } catch (error) {
        console.error("Error signing out:", error);
        // Opcional: mostrar un mensaje de error al usuario
    }
  };

   // Efecto para cerrar el menú de perfil si se hace clic fuera de él
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Verifica si el clic ocurrió fuera del contenedor del menú principal y fuera del botón que abre el perfil
      // Usamos las clases CSS 'menu-flotante-derecho' y 'perfil-button'
      if (
        perfilAbierto && // Solo si el menú está abierto
        !target.closest(".menu-flotante-derecho") && // El clic no está dentro del menú principal
        !target.closest(".perfil-button") // El clic no es el botón que abre el perfil
      ) {
        setPerfilAbierto(false);
      }
    };

    // Añade el listener solo cuando el menú de perfil está abierto Y si hay un usuario logueado
    // También nos aseguramos de que no estemos en una ruta donde el menú deba estar oculto
    if (perfilAbierto && user && !pathname.startsWith('/leer/')) { // Añade comprobación de pathname
      document.addEventListener("mousedown", handleOutsideClick);
    }

    // Limpia el listener al cerrar el menú, desmontar el componente O si el usuario se desloguea O si cambia la ruta
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [perfilAbierto, user, pathname]); // Añade pathname a las dependencias


  // Opcional: Puedes mostrar un estado de carga si user es undefined inicialmente
  if (user === undefined) {
       // return <div>Cargando menú...</div>; // O un spinner simple
       return null; // Oculta el menú mientras carga para evitar destellos
  }

  // --- Condición para ocultar el menú en rutas específicas ---
  // Si la ruta actual comienza con '/leer/', no renderizamos el menú
  if (pathname.startsWith('/leer/')) {
      console.log(`Ocultando menú para la ruta: ${pathname}`); // Opcional: log para saber cuándo se oculta
      return null;
  }
  // --- Fin Condición para ocultar ---


  // El menú principal se renderiza si user no es undefined (ya cargó) Y la ruta NO comienza con '/leer/'
  return (
    // Añade una clase para identificar el contenedor principal para el manejo de clics fuera
    <div className="menu-flotante-derecho fixed top-1/2 right-4 -translate-y-1/2 bg-black/90 text-white p-3 rounded-2xl shadow-lg border border-white z-30">
      <div className="flex flex-col space-y-4 items-center">

        

        {/* Series - Visible siempre (asumimos es pública) */}
        <Link href="/" className="flex flex-col items-center text-xs hover:text-emerald-400 transition">
          <BookOpenIcon className="w-6 h-6" />
          <span className="mt-1">Series</span>
        </Link>

        {/* Favoritos - Visible siempre (el control de acceso real debe estar en la página) 
        <Link href="/favoritos" className="flex flex-col items-center text-xs hover:text-emerald-400 transition">
          <StarIcon className="w-6 h-6" />
          <span className="mt-1">Favoritos</span>
         {/* Nota: La página /favoritos *debe* estar protegida a nivel de ruta para solo usuarios logueados 
        </Link>*/}

        {/* Buscar - Visible siempre */}
        <Link href="/search" className="flex flex-col items-center text-xs hover:text-emerald-400 transition">
          <MagnifyingGlassIcon className="w-6 h-6" />
          <span className="mt-1">Buscar</span>
        </Link>

        {/* Gestión por rol (Mis obras para autor) - Visible solo si logueado y es autor */}
        {/* Comprobamos que user existe (aunque ya lo hicimos arriba) y que tiene el rol 'autor' */}
        {user?.rol === "autor" && (
          <Link
            href={`/user/${user.uid}/autor`} // Ruta para gestionar obras (asumiendo que no está bajo /user/:userId)
            className="flex flex-col items-center text-xs hover:text-emerald-400 transition"
          >
            <BookOpenIcon className="w-6 h-6" />
            <span className="mt-1">Mis obras</span>
          </Link>
          // Nota: La página /gestionar-obras debe estar protegida a nivel de ruta para solo permitir autores/admins
        )}

        {/* Gestión por rol (Admin para admin) - Visible solo si logueado y es admin */}
         {/* Comprobamos user?.rol y user?.uid para la ruta dinámica */}
        {user?.rol === "admin" && user?.uid && (
          <Link
            href={`/user/${user.uid}/admin`} // ¡Ruta dinámica usando el ID del usuario!
            className="flex flex-col items-center text-xs hover:text-emerald-400 transition"
          >
            <CogIcon className="w-6 h-6" />
            <span className="mt-1">Admin</span>
          </Link>
          // Nota: La página /user/[userId]/admin debe estar protegida a nivel de ruta para solo permitir el admin propietario
        )}

        {/* --- Sección Perfil / Login --- */}
        {/* Este div relativo contiene ya sea el botón de perfil (logueado) o el enlace de Login (no logueado) */}
        <div className="relative">
          {!user ? (
            // Si NO hay usuario logueado, muestra el enlace de Login
            <Link href="/login" className="perfil-button flex flex-col items-center text-xs hover:text-emerald-400 transition">
              <UserCircleIcon className="w-6 h-6" />
              <span className="mt-1">Login</span>
            </Link>
          ) : (
            // Si SÍ hay usuario logueado, muestra el botón de Perfil y su menú desplegable
            <> {/* Usamos un fragmento para agrupar el botón y el menú desplegable */}
              <button
                onClick={() => setPerfilAbierto(!perfilAbierto)}
                className="perfil-button flex flex-col items-center text-xs hover:text-emerald-400 transition" // Añade clase para identificar el botón
                aria-expanded={perfilAbierto} // Atributo para accesibilidad
                aria-haspopup="true" // Atributo para accesibilidad
                title="Abrir menú de perfil" // Título para accesibilidad
              >
                {user.photoURL ? (
                  // Muestra la foto de perfil si existe
                  <Image
                    src={user.photoURL}
                    alt="Foto de perfil"
                    width={28}
                    height={28}
                    className="rounded-full border border-white object-cover" // object-cover para asegurar que la imagen no se deforme
                    // Añadir otras props de Image según necesidad (priority, loading)
                  />
                ) : (
                   // Muestra un icono por defecto si no hay foto de perfil
                  <UserCircleIcon className="w-6 h-6" />
                )}
                <span className="mt-1">Perfil</span>
              </button>

              {/* Menú desplegable del perfil - Visible solo si perfilAbierto es true */}
              {perfilAbierto && (
                 // Añade clase para identificar el menú desplegable para el manejo de clics fuera
                <div className="perfil-dropdown absolute right-12 top-0 bg-white text-black rounded-md shadow-lg py-2 px-3 w-40 z-40 animate-fadeIn">
                   {/* Enlace a la página de perfil del usuario actual */}
                   {/* Nos aseguramos de que user?.uid exista, aunque el renderizado ya garantiza que user existe */}
                  {user?.uid && (
                    <button
                      onClick={() => {
                          router.push(`/user/${user.uid}/perfil`); // ¡Ruta dinámica usando el ID del usuario!
                          setPerfilAbierto(false); // Cerrar menú al navegar
                      }}
                      className="block w-full text-left text-sm hover:text-emerald-600 py-1"
                    >
                      Ver perfil
                    </button>
                  )}
                  {/* Enlace a configuraciones */}
                  <button
                    onClick={() => {
                       router.push("/#"); // Ruta para configuraciones (asumiendo que no está bajo /user/:userId)
                       setPerfilAbierto(false); // Cerrar menú al navegar
                    }}
                    className="block w-full text-left text-sm hover:text-blue-500 py-1"
                  >
                    Configuraciones
                  </button>
                   {/* Botón para cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-sm hover:text-red-500 py-1"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </> // Fin del fragmento para usuario logueado
          )}
        </div>
        {/* --- Fin Sección Perfil / Login --- */}

      </div> {/* Fin flex flex-col */}

      {/* Animación para el menú desplegable (si no usas una utilidad de animación de Tailwind) */}
      {/* Puedes mover esto a un archivo CSS global o usar @layer components con Tailwind */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards; /* forwards mantiene el estado final */
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px); /* Pequeño movimiento hacia arriba */
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div> // Fin menu-flotante-derecho
  );
}