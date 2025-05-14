// components/AgregarCapituloModal.tsx
"use client";
import { useState } from "react";
import { db, storage } from "@/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

interface AgregarCapituloModalProps {
  serieId: string;
  autorId: string;
  onClose: () => void;
}

export default function AgregarCapituloModal({
  serieId,
  autorId,
  onClose,
}: AgregarCapituloModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [numero, setNumero] = useState("");
  const [paginas, setPaginas] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    

    try {
       // Generar un ID único para el capítulo
    const capituloId = uuidv4();
      // Subir páginas a Storage
    const paginasURLs = await Promise.all(
      paginas.map(async (pagina, index) => {
        const paginaRef = ref(
          storage,
          `img/capitulos/${serieId}/${capituloId}/page-${(index + 1).toString().padStart(2, '0')}.jpg`
        );
        await uploadBytes(paginaRef, pagina);
        return await getDownloadURL(paginaRef);
      })
    );

      // Crear documento en subcolección
      await addDoc(collection(db, "series", serieId, "capitulos"), {
        titulo,
        descripcion,
        numero: parseInt(numero),
        fechaPublicacion: new Date().toISOString(),
        vistas: 0,
        likes: 0,
        dislikes: 0,
        comentariosCount: 0,
        rankingLocal: 0,
        paginasURLs,
        autorId,
      });

      onClose();
      alert("Capítulo creado exitosamente!");
    } catch (err) {
      console.error("Error al crear capítulo:", err);
      setError("Error al crear el capítulo. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Encabezado */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-slate-100">Nuevo Capítulo</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo Título */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Título del capítulo"
                  required
                />
              </div>

              {/* Campo Número */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Número</label>
                <input
                  type="number"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="1"
                  placeholder="Número de capítulo"
                  required
                />
              </div>
            </div>

            {/* Campo Descripción */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder="Descripción del capítulo"
                required
              />
            </div>

            {/* Campo Páginas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Páginas</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPaginas(Array.from(e.target.files || []))}
                  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-600/20 file:text-emerald-400 hover:file:bg-emerald-600/30 text-slate-300 cursor-pointer"
                  required
                />
                <p className="mt-2 text-sm text-slate-400">
                  Selecciona las imágenes en orden de lectura
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 bg-emerald-600/80 hover:bg-emerald-500/80 text-white rounded-lg transition-colors flex items-center gap-2 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Publicar Capítulo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}