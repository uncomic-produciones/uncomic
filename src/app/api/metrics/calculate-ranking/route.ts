// app/api/metrics/calculate-ranking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';

// --- CONFIGURACIÓN DEL FACTOR ---
const VISTAS_RANKING_FACTOR = 0.01; // Ajusta este factor

// ===> IMPORTANTE: Seguridad para esta API Route <===
// Esta ruta NO debe ser invocable libremente desde el cliente.
// Debe ser llamada por un servicio de cron job externo.
// Añade un mecanismo de seguridad, ej. una clave API secreta en el encabezado.
const API_SECRET_KEY = process.env.CRON_API_SECRET_KEY; // Configura esta variable de entorno


export async function GET(request: NextRequest) {
 // Puedes usar GET, o POST si prefieres enviar algún dato en el cuerpo.

 // 1. Verificar la clave API secreta (Seguridad)
 const authHeader = request.headers.get('Authorization');
 if (!authHeader || authHeader !== `Bearer ${API_SECRET_KEY}`) {
     return NextResponse.json({ message: 'Acceso no autorizado.' }, { status: 401 });
 }

  console.log('Iniciando cálculo de ranking (vía API Route)...');

  try {
      // 2. Implementar la lógica del cálculo de ranking (similar a la Cloud Function)
      const seriesSnapshot = await adminDb.collection('series').get();

      const rankingData: { elementoId: string, puntuacion: number, tipo: string, fechaCalculo: admin.firestore.FieldValue }[] = [];
      const fechaCalculo = admin.firestore.FieldValue.serverTimestamp();

      seriesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const serieId = doc.id;
          const vistas = data.vistas || 0;
          const likes = data.likes || 0;
          const dislikes = data.dislikes || 0;

          const puntuacion = (likes - dislikes) + (vistas * VISTAS_RANKING_FACTOR);

          rankingData.push({
              elementoId: serieId,
              puntuacion: puntuacion,
              tipo: 'serie',
              fechaCalculo: fechaCalculo,
          });
      });

      const batch = adminDb.batch();
      const rankingsCollectionRef = adminDb.collection('rankings');

      rankingData.forEach(item => {
          const rankingDocRef = rankingsCollectionRef.doc(item.elementoId);
          batch.set(rankingDocRef, item, { merge: true });
      });

      await batch.commit();

      console.log(`Cálculo de ranking completado (vía API Route). ${rankingData.length} series actualizadas.`);

      // 3. Devolver una respuesta exitosa
      return NextResponse.json({ status: 'success', message: 'Cálculo de ranking completado.' });

// ... other code ...
} catch (error: unknown) { // Changed from unknown to unknown
    console.error('Error en el cálculo de ranking (vía API Route):', error);
    // Note: console.error can safely log a variable of type unknown
    // If you needed to access properties like error.message, you would need to
    // perform a type check, e.g.:
    // if (error instanceof Error) {
    //   console.error('Error message:', error.message);
    // }
    return NextResponse.json({ message: 'Error interno al calcular ranking.' }, { status: 500 });
  }
// ... other code ...
}

// Puedes añadir otras funciones HTTP (PUT, DELETE) si las necesitas para esta ruta
// export async function POST(request: NextRequest) { ... }