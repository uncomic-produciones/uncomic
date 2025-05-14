'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase/client';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface VoteButtonsProps {
  tipo: 'serie' | 'capitulo';
  targetId: string;
}

/**
 * Componente de Like/Dislike que permite a un usuario autenticado votar una sola vez
 * y actualizar su voto (entre like y dislike). Muestra contadores basados en la colección "likes_dislikes".
 */
export default function VoteButtons({ tipo, targetId }: VoteButtonsProps) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Referencia a la colección de votos
  const votesCollection = collection(db, 'likes_dislikes');

  // Cargar datos iniciales: contadores y voto del usuario
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Query para todos los votos de este target
      const allQ = query(
        votesCollection,
        where('tipo', '==', tipo),
        where('targetId', '==', targetId)
      );
      const allSnap = await getDocs(allQ);
      let likes = 0;
      let dislikes = 0;
      allSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.valor === 1) likes++;
        if (data.valor === -1) dislikes++;
      });
      setLikesCount(likes);
      setDislikesCount(dislikes);

      // Query para voto del usuario actual
      const userQ = query(
        votesCollection,
        where('tipo', '==', tipo),
        where('targetId', '==', targetId),
        where('usuarioId', '==', user.uid)
      );
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        const voteDoc = userSnap.docs[0];
        setUserVote(voteDoc.data().valor);
      }
      

      setLoading(false);
    };

    fetchData();
  }, [user, tipo, targetId, votesCollection]);

  // Manejar click de like o dislike
  const handleVote = async (newValor: 1 | -1) => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    // Query para voto existente
    const userQ = query(
      votesCollection,
      where('tipo', '==', tipo),
      where('targetId', '==', targetId),
      where('usuarioId', '==', user.uid)
    );
    const userSnap = await getDocs(userQ);
    console.log('VoteButtons user:', user);
console.log('handleVote called with', newValor);

    // Lógica de actualización
    if (userSnap.empty) {
      // No existe voto: crear uno nuevo
      await addDoc(votesCollection, {
        usuarioId: user.uid,
        tipo,
        targetId,
        valor: newValor,
        fecha: serverTimestamp(),
      });
      if (newValor === 1) setLikesCount(prev => prev + 1);
      if (newValor === -1) setDislikesCount(prev => prev + 1);
      setUserVote(newValor);
    } else {
      const voteDoc = userSnap.docs[0];
      const prevValor = voteDoc.data().valor as number;
      if (prevValor === newValor) {
        // Mismo voto: no hacemos nada
        setActionLoading(false);
        return;
      }
      // Actualizar el voto existente
      await updateDoc(doc(db, 'likes_dislikes', voteDoc.id), {
        valor: newValor,
        fecha: serverTimestamp(),
      });
      // Ajustar contadores locales
      if (prevValor === 1) setLikesCount(prev => prev - 1);
      if (prevValor === -1) setDislikesCount(prev => prev - 1);
      if (newValor === 1) setLikesCount(prev => prev + 1);
      if (newValor === -1) setDislikesCount(prev => prev + 1);
      setUserVote(newValor);
    }

    setActionLoading(false);
  };

  const getButtonClass = (voteType: 1 | -1) => {
    if (userVote === voteType) {
      return voteType === 1 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold';
    }
    return 'text-gray-400 hover:text-gray-800';
  };

  // Render mientras cargan los datos iniciales
  if (loading) return <div>Cargando votos...</div>;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
      <button
        onClick={() => handleVote(1)}
        disabled={!user || actionLoading}
        className={`flex items-center justify-center space-x-1 p-3 rounded-full shadow-lg bg-white/90 backdrop-blur-md text-black hover:bg-green-100 transition ${
          getButtonClass(1)
        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Like"
      >
        👍 <span>{likesCount}</span>
      </button>
  
      <button
        onClick={() => handleVote(-1)}
        disabled={!user || actionLoading}
        className={`flex items-center justify-center space-x-1 p-3 rounded-full shadow-lg bg-white/90 backdrop-blur-md text-black hover:bg-red-100 transition ${
          getButtonClass(-1)
        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Dislike"
      >
        👎 <span>{dislikesCount}</span>
      </button>
    </div>
  );
  
}
