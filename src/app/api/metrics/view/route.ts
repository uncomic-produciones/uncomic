// app/api/metrics/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin'; // Importa tu instancia de admin Firestore
// ===> RE-AÑADIENDO LA IMPORTACIÓN DE verifyToken <===
import { verifyToken } from '@/lib/auth/verifyToken'; // Importa la función de verificación de token
import admin from 'firebase-admin'; // Para FieldValue.increment

export async function POST(request: NextRequest) {
  // ===> RE-AÑADIENDO VERIFICACIÓN DE AUTENTICACIÓN SEGURA <===
  // Este es el comportamiento SEGURO y necesario para tu aplicación.
  const authenticatedRequest = await verifyToken(request);
  if (!authenticatedRequest || !authenticatedRequest.user) {
    // Si el token no es válido o el usuario no está autenticado, devolvemos 401.
    return NextResponse.json({ message: 'El usuario debe estar autenticado para registrar una vista.' }, { status: 401 });
  }
  // Si llegamos aquí, el usuario está autenticado y verificado.
  const userId = authenticatedRequest.user.uid; // Obtenemos el UID del usuario verificado.

  const data = await request.json(); // Obtenemos los datos enviados desde el frontend.

  // Validamos que los IDs necesarios estén presentes.
  const { serieId, capituloId } = data;
  if (!serieId || !capituloId) {
    return NextResponse.json({ message: 'Los IDs de serie y capítulo son obligatorios.' }, { status: 400 });
  }

  try {
    // ===> AÑADIR VERIFICACIÓN DE VISTA ÚNICA POR CAPÍTULO Y USUARIO <===
    // Consultamos la colección 'vistas' para ver si ya existe un documento
    // con el usuarioId, serieId y capituloId actuales.
    const existingViewQuery = adminDb.collection('vistas')
      .where('usuarioId', '==', userId)
      .where('serieId', '==', serieId)
      .where('capituloId', '==', capituloId)
      .limit(1); // Con limit(1) solo necesitamos el primer resultado si existe.

    const existingViewSnapshot = await existingViewQuery.get();

    if (!existingViewSnapshot.empty) {
      // ===> Si existingViewSnapshot NO está vacío, significa que ya existe una vista registrada <===
      console.log(`Vista ya registrada para user ${userId} en capítulo ${capituloId} de serie ${serieId}. Saltando nuevo registro y incremento.`);
      // Devolvemos un estado 'info' o 'success' con un mensaje claro al frontend.
      return NextResponse.json({ status: 'info', message: 'Vista ya registrada para este capítulo por este usuario.' });
    }

    // ===> SI existingViewSnapshot está vacío, significa que es la primera vista para este usuario y capítulo <===
    console.log(`Registrando NUEVA vista para user ${userId} en capítulo ${capituloId} de serie ${serieId}...`);

    // Procedemos a crear el nuevo documento de vista y actualizar los contadores agregados.
    const nuevaVistaRef = adminDb.collection('vistas').doc(); // Firestore asignará un ID automáticamente.
    const batch = adminDb.batch(); // Usamos batch para asegurar atomicidad en las escrituras.

    // 1. Creamos el documento de vista único.
    batch.set(nuevaVistaRef, {
        usuarioId: userId,
        serieId: serieId,
        capituloId: capituloId,
        fecha: admin.firestore.FieldValue.serverTimestamp(), // Usamos timestamp del servidor.
    });

    // 2. Preparamos las actualizaciones de contadores agregados en el documento del capítulo y la serie.
    const capituloRef = adminDb.collection('series').doc(serieId).collection('capitulos').doc(capituloId);
    const serieRef = adminDb.collection('series').doc(serieId);

    batch.update(capituloRef, {
        vistas: admin.firestore.FieldValue.increment(1) // Incrementamos el contador de vistas del capítulo.
    });
    batch.update(serieRef, {
         vistas: admin.firestore.FieldValue.increment(1) // Incrementamos el contador de vistas de la serie padre.
    });

    // 3. Ejecutamos el lote de escrituras.
    await batch.commit();

    console.log(`NUEVA vista registrada exitosamente y contadores actualizados.`);

    // ===> Devolvemos una respuesta exitosa al frontend <===
    return NextResponse.json({ status: 'success', message: 'Vista registrada correctamente.' });

  } catch (error: unknown) {
    // Capturamos y registramos cualquier error que ocurra durante el proceso.
    console.error('Error al registrar vista (con verificación de unicidad):', error);
    // Devolvemos un error interno al frontend.
    // El error "Unable to detect a Project Id" durante verifyToken (si persistiera) se capturaría aquí.
    // Si ves ese error aquí, el problema sigue siendo de permisos del Admin SDK.
    return NextResponse.json({ message: 'Error interno al registrar la vista.' }, { status: 500 });
  }
}