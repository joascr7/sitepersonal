'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ModalVideo({ exercicio, treinoId, exerciciosAtuais, onClose, onSave }: any) {
  const [videoUrl, setVideoUrl] = useState(exercicio.video || '');

  const salvar = async () => {
    // Atualiza o objeto do exercício
    const novosExercicios = exerciciosAtuais.map((ex: any) => 
      ex.nome === exercicio.nome ? { ...ex, video: videoUrl } : ex
    );

    // Salva no banco (substitua 'treinos_padroes' pelo nome da sua tabela)
    await supabase
      .from('treinos_padroes')
      .update({ exercicios_json: novosExercicios })
      .eq('id', treinoId);

    onSave(novosExercicios);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl w-96">
        <h3 className="font-black mb-4">Adicionar Vídeo: {exercicio.nome}</h3>
        <input 
          className="w-full p-3 border rounded-xl mb-4"
          placeholder="URL do vídeo"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 p-3 rounded-xl bg-gray-100 font-bold">Cancelar</button>
          <button onClick={salvar} className="flex-1 p-3 rounded-xl bg-black text-white font-black">Salvar</button>
        </div>
      </div>
    </div>
  );
}