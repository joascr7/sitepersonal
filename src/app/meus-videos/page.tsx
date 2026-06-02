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
    <main className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tighter">Biblioteca de Vídeos</h1>
          <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Gerencie seu acervo de execuções</p>
        </header>
        
        {/* Formulário de entrada com estilo Glass */}
        <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" 
              placeholder="Nome do Exercício" 
              value={nomeExercicio} 
              onChange={(e) => setNomeExercicio(e.target.value)} 
            />
            <input 
              className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" 
              placeholder="Link do Vídeo (YouTube/Shorts)" 
              value={urlVideo} 
              onChange={(e) => setUrlVideo(e.target.value)} 
            />
          </div>
          <button 
            onClick={salvarVideo} 
            disabled={loading} 
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {loading ? 'Processando...' : 'Adicionar à Biblioteca'}
          </button>
        </div>

        {/* Grid de Vídeos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((v) => (
            <div key={v.id} className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl flex justify-between items-center hover:border-blue-500/30 transition-all duration-300">
              <span className="font-bold text-white tracking-wide">{v.exercicio_nome}</span>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ativo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}