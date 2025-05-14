// lib/firebase/admin.ts (MODIFICACIÓN TEMPORAL PARA DEPURACIÓN)
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  console.log('===> DEBUG: Intentando inicializar Firebase Admin App FORZANDO FIREBASE_SERVICE_ACCOUNT_JSON...'); // Log de inicio de inicialización

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  console.log(`===> DEBUG: FIREBASE_SERVICE_ACCOUNT_JSON is ${serviceAccountJson ? 'SET' : 'NOT SET'}. Length: ${serviceAccountJson ? serviceAccountJson.length : 0}`);

  if (serviceAccountJson) {
     try {
         // Usa la lógica de parseo que funcionó para ti (JSON crudo)
         const serviceAccount = JSON.parse(serviceAccountJson);

         //console.log('===> DEBUG: Successfully parsed service account JSON.');

         // ===> LOGGEA EL OBJETO PARSADO (CON CUIDADO) <===
         //console.log('===> DEBUG: Parsed Service Account Structure (FORCED):', {
           //  type: serviceAccount.type,
           //  project_id: serviceAccount.project_id,
           //  private_key_id: serviceAccount.private_key_id,
           //  client_email: serviceAccount.client_email,
           //  private_key_present: typeof serviceAccount.private_key === 'string' && serviceAccount.private_key.length > 0,
           //  private_key_snippet_start: typeof serviceAccount.private_key === 'string' ? serviceAccount.private_key.substring(0, 30) + '...' : 'N/A',
           //  private_key_snippet_end: typeof serviceAccount.private_key === 'string' ? serviceAccount.private_key.slice(-30) + '...' : 'N/A',
         //});
         // =================================================

         admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
         });
         console.log('===> DEBUG: Firebase Admin App initialized SUCCESSFULLY using FIREBASE_SERVICE_ACCOUNT_JSON.'); // Log de éxito

     } catch (parseError: unknown) {
          console.error('===> DEBUG: Error parsing FIREBASE_SERVICE_ACCOUNT_JSON (FORCED):', parseError);
          console.error('===> DEBUG: Asegúrate de que el valor de la variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON es un JSON válido.');
     }
  } else {
     console.error('===> DEBUG: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is NOT set (FORCED PATH). Cannot initialize Admin SDK.');
  }

} else {
   console.log('===> DEBUG: Firebase Admin App already initialized.'); // Log si ya estaba inicializada (esperado en llamadas subsiguientes)
}

// El resto del código sigue igual
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();