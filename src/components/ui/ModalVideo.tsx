'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ModalVideo({ exercicio, treinoId, exerciciosAtuais, onClose, onSave }: any) {
  const [videoUrl, setVideoUrl] = useState(exercicio.video || '');

  const salvar = async () => {
    const novosExercicios = exerciciosAtuais.map((ex: any) => 
      ex.nome === exercicio.nome ? { ...ex, video: videoUrl } : ex
    );

    await supabase
      .from('treinos_padroes')
      .update({ exercicios_json: novosExercicios })
      .eq('id', treinoId);

    onSave(novosExercicios);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
      <div className="bg-neutral-950/90 p-8 rounded-[2.5rem] w-full max-w-sm border border-white/10 shadow-2xl">
        <h3 className="font-black text-white mb-6 text-lg tracking-tighter">
          Vídeo: {exercicio.nome}
        </h3>
        
        <input 
          className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-white mb-6 outline-none focus:border-blue-500 transition-all placeholder:text-neutral-600"
          placeholder="URL do vídeo"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 p-4 rounded-2xl bg-white/5 text-neutral-400 font-bold hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={salvar} 
            className="flex-1 p-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 transition-all"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}