'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MeusVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [nomeExercicio, setNomeExercicio] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarVideos();
  }, []);

  const carregarVideos = async () => {
    const { data } = await supabase.from('videos_biblioteca').select('*');
    if (data) setVideos(data);
  };

  const salvarVideo = async () => {
    if (!nomeExercicio || !urlVideo) return alert("Preencha todos os campos");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('videos_biblioteca').insert({
      exercicio_nome: nomeExercicio,
      url_video: urlVideo,
      personal_id: user?.id
    });
    
    setNomeExercicio('');
    setUrlVideo('');
    carregarVideos();
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-black mb-6">Minha Biblioteca de Vídeos</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <input className="w-full p-3 border rounded-xl mb-3" placeholder="Nome do Exercício (ex: Supino Reto)" value={nomeExercicio} onChange={(e) => setNomeExercicio(e.target.value)} />
        <input className="w-full p-3 border rounded-xl mb-3" placeholder="Link do Vídeo (YouTube/Shorts)" value={urlVideo} onChange={(e) => setUrlVideo(e.target.value)} />
        <button onClick={salvarVideo} disabled={loading} className="w-full bg-black text-white p-3 rounded-xl font-bold">
          {loading ? 'Salvando...' : 'Adicionar à Biblioteca'}
        </button>
      </div>

      <div className="space-y-4">
        {videos.map((v) => (
          <div key={v.id} className="p-4 bg-white rounded-xl border border-gray-100 flex justify-between">
            <span className="font-bold">{v.exercicio_nome}</span>
            <span className="text-blue-600 text-sm">Cadastrado</span>
          </div>
        ))}
      </div>
    </div>
  );
}