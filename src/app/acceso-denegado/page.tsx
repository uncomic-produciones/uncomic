import Link from 'next/link';
import React from 'react';

export default function AccesoDenegadoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-5 bg-gray-100 text-gray-800">
      <h1 className="text-4xl font-bold text-red-700 mb-6 md:text-5xl">
        Acceso Denegado
      </h1>
      <p className="text-lg mb-8 md:text-xl">
        No tienes los permisos necesarios para acceder a esta página.
      </p>
      {/* Opcional: Un enlace para volver a un lugar seguro */}
      <Link
        href="/"
        className="inline-block px-6 py-3 text-lg text-blue-700 border border-blue-700 rounded-md hover:bg-blue-700 hover:text-white transition duration-300 ease-in-out"
      >
          Volver al Inicio
      </Link>
    </div>
  );
}