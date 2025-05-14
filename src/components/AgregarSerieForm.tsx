// components/AgregarSerieForm.tsx
"use client";
import { useState } from "react";
import { db, storage } from "@/firebase/client";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import Image from 'next/image';

export default function AgregarSerieForm({ autorId }: { autorId: string }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [generos, setGeneros] = useState("");
  const [portada, setPortada] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPortada(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let portadaURL = "";
      if (portada) {
        const portadaRef = ref(storage, `img/portadas/${uuidv4()}`);
        await uploadBytes(portadaRef, portada);
        portadaURL = await getDownloadURL(portadaRef);
      }

      await addDoc(collection(db, "series"), {
        titulo,
        descripcion,
        generos: generos.split(",").map(g => g.trim()),
        autorId,
        portadaURL,
        fechaCreacion: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        vistas: 0,
        ranking: 0,
        estado: "activa"
      });

      setTitulo("");
      setDescripcion("");
      setGeneros("");
      setPortada(null);
      setPreviewImage(null);
      alert("¡Serie creada exitosamente!");

    } catch (err) {
      console.error("Error al crear serie:", err);
      setError("Error al crear la serie. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-2xl border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h2 className="text-2xl font-bold text-white">Nueva Serie</h2>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-slate-300 mb-2 font-medium">Título de la Serie</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
            placeholder="Ej: La Leyenda del Dragón"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
            rows={4}
            placeholder="Describe brevemente tu serie..."
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">Géneros</label>
          <input
            type="text"
            value={generos}
            onChange={(e) => setGeneros(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-slate-400 transition-all"
            placeholder="Separados por comas (ej: fantasía, aventura, romance)"
            required
          />
          <p className="mt-1 text-sm text-slate-400">Los géneros ayudan a los lectores a encontrar tu obra</p>
        </div>

        <div>
          <label className="block text-slate-300 mb-2 font-medium">Portada</label>
          
          {previewImage && (
            <div className="mb-3">
              <Image
  src={previewImage}
  alt="Vista previa de portada"
  // Define width y height según la relación de aspecto de tus imágenes de portada
  // h-40 suele ser 160px. Si tus portadas son 2:3 (vertical), un ancho de ~107px estaría bien.
  // Si son cuadradas 1:1, el ancho sería 160px. Ajusta estos valores a tus imágenes.
  width={107} // <-- Ajusta esto según la relación de aspecto esperada
  height={160} // <-- Esto corresponde a h-40
  className="h-40 object-cover rounded-lg border border-slate-600"
/>
            </div>
          )}

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-slate-400">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra la imagen
                </p>
                <p className="text-xs text-slate-500">PNG, JPG (Recomendado: 800x1200px)</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="hidden" 
                required
              />
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-medium shadow-lg transition-all ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando Serie...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publicar Serie
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}