'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BibliotecaAdmin() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // ID do exercicio sendo carregado
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
    
    // Atualiza estado local
    const novosExercicios = [...m.exercicios_json];
    novosExercicios[exIdx] = { ...novosExercicios[exIdx], video: publicUrl };
    
    const modeloAtualizado = { ...m, exercicios_json: novosExercicios };
    setModelos(prev => prev.map(item => item.id === m.id ? modeloAtualizado : item));
    
    setUploading(null);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center font-black">CARREGANDO SISTEMA...</main>;

  return (
    <main className="p-6 md:p-12 max-w-3xl mx-auto bg-[#F8F9FA] min-h-screen">
      <h1 className="text-3xl font-extrabold mb-10 tracking-tight text-slate-950">Biblioteca de Treinos</h1>
      
      <div className="space-y-4">
        {modelos.map((m) => (
          <div key={m.id} className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <button 
              onClick={() => setTreinoAberto(treinoAberto === m.id ? null : m.id)}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-all"
            >
              <h2 className="font-bold text-slate-800">{m.nome_modelo}</h2>
              <div className="text-slate-400">{treinoAberto === m.id ? '−' : '+'}</div>
            </button>
            
            {treinoAberto === m.id && (
              <div className="px-6 pb-8 space-y-4">
                {m.exercicios_json?.map((ex: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{ex.nome}</p>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 p-3 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:border-indigo-500"
                        placeholder="Link do vídeo (YouTube/Drive)..."
                        value={ex.video || ''}
                        onChange={(e) => {
                          const novos = [...m.exercicios_json];
                          novos[idx].video = e.target.value;
                          setModelos(prev => prev.map(i => i.id === m.id ? {...i, exercicios_json: novos} : i));
                        }}
                      />
                      <label className={`cursor-pointer px-4 py-3 rounded-lg text-[10px] font-bold uppercase transition-all ${uploading === `${m.id}-${idx}` ? 'bg-slate-300' : 'bg-slate-900 text-white hover:bg-black'}`}>
                        {uploading === `${m.id}-${idx}` ? '...' : 'Arquivo'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, m, idx)} />
                      </label>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => salvarTreino(m)}
                  className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all"
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