'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BibliotecaAdmin() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [treinoAberto, setTreinoAberto] = useState<string | null>(null);

  useEffect(() => { carregarModelos(); }, []);

  const carregarModelos = async () => {
    setLoading(true);
    const { data } = await supabase.from('treinos_padrao').select('*');
    setModelos(data || []);
    setLoading(false);
  };

  const salvarTreino = async (modelo: any) => {
    const { error } = await supabase
      .from('treinos_padrao')
      .update({ exercicios_json: modelo.exercicios_json })
      .eq('id', modelo.id);
    
    if (error) return alert("Erro ao salvar no banco.");
    alert("Alterações salvas com sucesso!");
  };

  const handleFileUpload = async (e: any, m: any, exIdx: number) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileId = `${m.id}-${exIdx}`;
    setUploading(fileId);

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(`exercicios/${Date.now()}_${file.name}`, file);

    if (error) {
      setUploading(null);
      return alert("Erro no upload: " + error.message);
    }

    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(data.path);
    
    const novosExercicios = [...m.exercicios_json];
    novosExercicios[exIdx] = { ...novosExercicios[exIdx], video: publicUrl };
    
    const modeloAtualizado = { ...m, exercicios_json: novosExercicios };
    setModelos(prev => prev.map(item => item.id === m.id ? modeloAtualizado : item));
    
    setUploading(null);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center font-black bg-black text-blue-500 uppercase tracking-[0.2em]">CARREGANDO SISTEMA...</main>;

  return (
    <main className="p-6 md:p-12 max-w-3xl mx-auto bg-black min-h-screen text-white">
      <h1 className="text-3xl font-black mb-10 tracking-tighter text-white">Biblioteca de Treinos</h1>
      
      <div className="space-y-4">
        {modelos.map((m) => (
          <div key={m.id} className="bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <button 
              onClick={() => setTreinoAberto(treinoAberto === m.id ? null : m.id)}
              className="w-full p-8 text-left flex justify-between items-center hover:bg-white/5 transition-all"
            >
              <h2 className="font-black text-white">{m.nome_modelo}</h2>
              <div className="text-neutral-500 font-black">{treinoAberto === m.id ? '−' : '+'}</div>
            </button>
            
            {treinoAberto === m.id && (
              <div className="px-8 pb-8 space-y-4">
                {m.exercicios_json?.map((ex: any, idx: number) => (
                  <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-4">{ex.nome}</p>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 p-4 rounded-2xl border border-white/5 bg-transparent text-xs font-medium outline-none focus:border-blue-500 text-white"
                        placeholder="Link do vídeo (YouTube/Drive)..."
                        value={ex.video || ''}
                        onChange={(e) => {
                          const novos = [...m.exercicios_json];
                          novos[idx].video = e.target.value;
                          setModelos(prev => prev.map(i => i.id === m.id ? {...i, exercicios_json: novos} : i));
                        }}
                      />
                      <label className={`cursor-pointer px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${uploading === `${m.id}-${idx}` ? 'bg-neutral-800' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                        {uploading === `${m.id}-${idx}` ? '...' : 'Arquivo'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, m, idx)} />
                      </label>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => salvarTreino(m)}
                  className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}