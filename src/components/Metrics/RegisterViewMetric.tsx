// components/Metrics/RegisterView.tsx
'use client'; // Esto lo marca como un Client Component

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Asumiendo que tienes este hook para obtener el usuario autenticado

interface RegisterViewProps {
  serieId: string;
  capituloId: string;
  // Puedes añadir otras props si el API Route las necesitara (ej. idioma, etc.)
}

/**
 * Componente que registra una vista para un capítulo dado usando la API Route.
 * Se ejecuta una vez cuando el componente se monta y los datos están disponibles.
 * No renderiza nada visualmente.
 */
export default function RegisterView({ serieId, capituloId }: RegisterViewProps) {
  const { user } = useAuth(); // Obtén el usuario autenticado
  // Usamos una referencia para asegurarnos de que el efecto solo se ejecute una vez por IDs de capítulo/serie
  const hasViewBeenRegistered = useRef(false);

  useEffect(() => {
    // Solo intentar registrar la vista si tenemos un usuario autenticado, serieId y capituloId
    // Y si aún no la hemos registrado para estos IDs en esta instancia del componente
    if (user?.uid && serieId && capituloId && !hasViewBeenRegistered.current) {
      const registerView = async () => {
        try {
          // Obtén el token de autenticación del usuario actual
          const idToken = await user.getIdToken();

          if (!idToken) {
             console.warn('No se pudo obtener el token de autenticación. Vista no registrada.');
             return;
          }

          // Llama a tu API Route para registrar la vista
          const response = await fetch('/api/metrics/view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`, // Envía el token de autenticación
            },
            body: JSON.stringify({ serieId: serieId, capituloId: capituloId }), // Envía los IDs necesarios
          });

          const result = await response.json();

          if (response.ok) {
            console.log('Vista registrada (vía API Route):', result.message);
            hasViewBeenRegistered.current = true; // Marca como registrado exitosamente
          } else {
            console.error('Error al registrar vista (vía API Route):', result.message, result);
            // Puedes manejar errores específicos aquí (ej. mostrar un mensaje si el token es inválido/expirado)
             if (response.status === 401) {
                 console.error('Autenticación fallida al registrar vista.');
                 // Aquí podrías forzar un logout o redireccionar al login si el token es inválido.
             }
          }
        } catch (error) {
          console.error('Error de red o inesperado al registrar vista:', error);
        }
      };

      // Ejecuta la función asíncrona
      registerView();
    }
     // Dependencias del efecto: re-ejecutar si el usuario o los IDs del capítulo/serie cambian.
     // El ref hasViewBeenRegistered.current asegura que, aunque las dependencias cambien,
     // solo se ejecute una vez para cada combinación única de IDs.
  }, [user, serieId, capituloId]);

  // Este componente no necesita renderizar nada visible
  return null;
}