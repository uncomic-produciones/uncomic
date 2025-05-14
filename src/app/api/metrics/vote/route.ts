// app/api/metrics/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin'; // Importa tu instancia de admin Firestore
import { verifyToken } from '@/lib/auth/verifyToken'; // Importa la función de verificación de token
import admin from 'firebase-admin'; // Para FieldValue.increment

export async function POST(request: NextRequest) {
  // Puedes usar POST, PUT o incluso un diseño RESTful más complejo si lo necesitas.
  // Aquí usamos POST para simplificar, pasando el 'valor' en el cuerpo.

  // 1. Verificar autenticación
  const authenticatedRequest = await verifyToken(request);
  if (!authenticatedRequest || !authenticatedRequest.user) {
    return NextResponse.json({ message: 'Usuario no autenticado.' }, { status: 401 });
  }

  const userId = authenticatedRequest.user.uid;
  const data = await request.json(); // Obtén los datos del cuerpo

  // 2. Validar datos de entrada
  const { tipo, targetId, valor, serieId } = data;
   if (!tipo || !targetId || (valor !== 1 && valor !== -1 && valor !== 0)) {
       return NextResponse.json({ message: 'Datos de voto incompletos o inválidos.' }, { status: 400 });
   }
    if (tipo === 'capitulo' && !serieId) {
        return NextResponse.json({ message: 'serieId es obligatorio para votos de capítulo.' }, { status: 400 });
    }
    if (tipo !== 'capitulo' && tipo !== 'serie') {
         return NextResponse.json({ message: 'tipo debe ser "serie" o "capitulo".' }, { status: 400 });
    }


  try {
    // 3. Implementar la lógica de la Cloud Function gestionarLike usando una transacción
    const likesDislikesRef = adminDb.collection('likes_dislikes');
    const targetDocRef = tipo === 'serie'
        ? adminDb.collection('series').doc(targetId)
        : adminDb.collection('series').doc(serieId!).collection('capitulos').doc(targetId);


// Remove 'const transactionResult ='
await adminDb.runTransaction(async (transaction) => {
    const existingVoteQuery = likesDislikesRef
        .where('usuarioId', '==', userId)
        .where('tipo', '==', tipo)
        .where('targetId', '==', targetId);

    const querySnapshot = await transaction.get(existingVoteQuery);
    const existingVoteDoc = querySnapshot.docs[0];

    const increments: { likes?: number, dislikes?: number } = {};

    if (existingVoteDoc) {
        const currentValor = existingVoteDoc.data().valor;

        if (valor === currentValor) {
            // The return value here is still the result of the transaction callback,
            // it's just not captured in a variable outside.
            return { status: 'info', message: 'Voto no cambió' };
        }

        if (currentValor === 1) increments.likes = -1;
        if (currentValor === -1) increments.dislikes = -1;

        if (valor === 1) increments.likes = (increments.likes || 0) + 1;
        if (valor === -1) increments.dislikes = (increments.dislikes || 0) + 1;

        if (valor === 0) {
             transaction.delete(existingVoteDoc.ref);
        } else {
            transaction.update(existingVoteDoc.ref, {
                valor: valor,
                fecha: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

    } else {
        if (valor === 1 || valor === -1) {
            const nuevoVotoRef = likesDislikesRef.doc();
             transaction.set(nuevoVotoRef, {
                 usuarioId: userId,
                 tipo: tipo,
                 targetId: targetId,
                 valor: valor,
                 fecha: admin.firestore.FieldValue.serverTimestamp(),
             });
             if (valor === 1) increments.likes = 1;
             if (valor === -1) increments.dislikes = -1;
        } else {
             return { status: 'info', message: 'No había voto que quitar' };
        }
    }

    
    if (Object.keys(increments).length > 0 && ((increments.likes || 0) !== 0 || (increments.dislikes || 0) !== 0) ) {
        // Define el tipo de updatePayload de forma más específica
        const updatePayload: {
          likes?: admin.firestore.FieldValue;
          dislikes?: admin.firestore.FieldValue;
        } = {}; // <-- Solución: Especificar el tipo en lugar de 'unknown'
 
        if (increments.likes !== undefined) updatePayload.likes = admin.firestore.FieldValue.increment(increments.likes);
        if (increments.dislikes !== undefined) updatePayload.dislikes = admin.firestore.FieldValue.increment(increments.dislikes);
 
         const targetDocSnapshot = await transaction.get(targetDocRef);
         if (targetDocSnapshot.exists) {
             transaction.update(targetDocRef, updatePayload);
         } else {
               console.warn(`Documento objetivo no encontrado para ${tipo} ${targetId}. Saltando actualización de contador agregado.`);
         }
      }

     // This value is still returned by the transaction function, just not assigned outside.
     return { status: 'success', message: 'Transacción de voto completada' };
});

    console.log(`Voto gestionado para user ${userId} en ${tipo} ${targetId}.`);

    return NextResponse.json({ status: 'success', message: 'Voto gestionado correctamente' });

  } catch (error: unknown) {
    console.error('Error en transacción de voto:', error);
    // Puedes diferenciar errores aquí si lo necesitas (ej. error.code === 'aborted')
    return NextResponse.json({ message: 'Error interno al gestionar el voto.' }, { status: 500 });
  }
}