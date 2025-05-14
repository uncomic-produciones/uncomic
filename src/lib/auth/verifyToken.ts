// lib/auth/verifyToken.ts o similar
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin'; // Importa tu instancia de admin Auth
import { DecodedIdToken } from 'firebase-admin/auth';

interface AuthenticatedRequest extends NextRequest {
    user?: DecodedIdToken; // Añadimos el usuario decodificado a la solicitud si la verificación es exitosa
}

export async function verifyToken(request: NextRequest): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No hay token o no tiene el formato correcto
    return null; // No autenticado
  }

  const idToken = authHeader.split(' ')[1]; // Obtiene el token después de 'Bearer '

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    // Adjunta el usuario decodificado a la solicitud para usarlo en el manejador de la ruta
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = decodedToken;
    return authenticatedRequest; // Autenticado exitosamente
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null; // Verificación fallida (token inválido, expirado, etc.)
  }
}