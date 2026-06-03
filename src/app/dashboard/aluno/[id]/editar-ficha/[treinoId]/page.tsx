'use client';
import { useEffect, useState, use } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Serie {
  ordem: string;
  reps: string;
  carga: number | string;
  CargaPlanejada: number | string;
  intervalo: number | string;
}

interface Exercicio {
  nome: string;
  video: string;
  metodo: string;
  tipoSerie: string;
  series: Serie[];
  observacao?: string;
}

export default function EditarFicha() {
  const params = useParams();
  const id = params?.id as string;
  const treinoId = (params?.treinoId || params?.treinoid) as string;
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!treinoId) return;
    const carregarDados = async () => {
      setLoading(true);
      const { data } = await supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle();
      if (data) {
        setNome(data.nome_treino || '');
        try {
          const parsed = typeof data.descricao === 'string' ? JSON.parse(data.descricao) : data.descricao;
          setExercicios(Array.isArray(parsed) ? parsed : []);
        } catch (e) { setExercicios([]); }
      }
      setLoading(false);
    };
    carregarDados();
  }, [treinoId]);

  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string | number) => {
    setExercicios(prev => {
      const novos = [...prev];
      novos[exIndex].series[sIndex] = { ...novos[exIndex].series[sIndex], [campo]: valor };
      return novos;
    });
  };

  const uploadVideo = async (exIndex: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) return alert("Limite de 10MB excedido!");
    try {
      setUploading(true);
      const filePath = `exercicios/${Math.random()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
      const n = [...exercicios];
      n[exIndex].video = data.publicUrl;
      setExercicios(n);
    } catch (err: any) { alert('Erro: ' + err.message); } finally { setUploading(false); }
  };

  const atualizarFicha = async () => {
    setLoading(true);
    const exerciciosLimpos = exercicios.map(ex => ({
      ...ex,
      series: ex.series.map(s => ({
        ordem: String(s.ordem || ""),
        reps: String(s.reps || ""),
        carga: Number(s.carga) || 0,
        CargaPlanejada: Number(s.CargaPlanejada) || 0,
        intervalo: Number(s.intervalo) || 0
      }))
    }));

    const { error } = await supabase.from('fichas').update({ nome_treino: nome, descricao: JSON.stringify(exerciciosLimpos) }).eq('id', treinoId);
    if (error) alert('Erro: ' + error.message);
    else router.push(`/dashboard/aluno/${id}?aba=treinos`);
    setLoading(false);
  };

  const excluirFicha = async () => {
    if (!confirm("Tem certeza?")) return;
    setLoading(true);
    const { error } = await supabase.from('fichas').delete().eq('id', treinoId);
    if (!error) router.push(`/dashboard/aluno/${id}`);
    else alert("Erro: " + error.message);
    setLoading(false);
  };

  
 if (loading) return (
    <main className="min-h-screen bg-black p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div className="w-16 h-4 bg-neutral-900 rounded-full" />
        <div className="w-24 h-8 bg-neutral-900 rounded-xl" />
      </div>

      {/* Título e Barra de Progresso Skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-8 bg-neutral-900 rounded-full" />
        <div className="w-32 h-3 bg-neutral-900 rounded-full" />
        <div className="w-full h-2 bg-neutral-900 rounded-full" />
      </div>

      {/* Cards de Exercícios Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-8 bg-neutral-900/50 rounded-[2.5rem] border border-white/5 space-y-4">
          <div className="w-full h-40 bg-neutral-900 rounded-2xl" />
          <div className="w-1/2 h-6 bg-neutral-900 rounded-full" />
        </div>
      ))}
    </main>
  );

 return (
    // pt-20: compensa o Header superior (AuraFit), pb-32: compensa a Navbar inferior
    <main className="w-full min-h-screen bg-black p-6 md:p-12 text-white pt-20 pb-32">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">← Voltar</button>
          <h1 className="text-xl font-black tracking-tighter">Editar Ficha</h1>
          <button onClick={excluirFicha} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-400">Excluir Ficha</button>
        </div>

        <input 
          className="w-full text-4xl font-black bg-transparent mb-10 outline-none placeholder:text-neutral-800" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          placeholder="Nome do Treino" 
        />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 mb-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <input 
                className="font-black text-white text-lg w-full outline-none bg-transparent" 
                placeholder="Nome do Exercício"
                value={ex.nome} 
                onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
              />
              <button onClick={() => { const n = exercicios.filter((_, i) => i !== exIndex); setExercicios(n); }} className="text-neutral-600 text-xs font-black ml-4 hover:text-red-500">EXCLUIR</button>
            </div>
            
            <div className="mb-8 space-y-4">
              <input className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none" placeholder="URL do vídeo" value={ex.video || ''} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
              <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"> {uploading ? 'ENVIANDO...' : 'UPLOAD DE VÍDEO'} </button>
              <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
              <input className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-xs italic outline-none placeholder:text-neutral-600" placeholder="Observação técnica..." value={ex.observacao || ''} onChange={(e) => { const n = [...exercicios]; n[exIndex].observacao = e.target.value; setExercicios(n); }} />
            </div>

            <div className="grid grid-cols-6 gap-2 text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3 px-1 text-center">
              <span>Série</span><span>Reps</span><span>Carga</span><span>Desc.</span><span>Planej.</span><span></span>
            </div>

            <div className="space-y-3">
              {ex.series?.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-6 gap-2 items-center">
                  <input type="text" className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center font-bold text-white outline-none focus:border-blue-500" value={s.ordem ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)} />
                  <input type="text" className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center outline-none" value={s.reps ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                  <input type="number" className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center outline-none" value={s.carga ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                  <input type="number" className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center outline-none" value={s.intervalo ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                  <input type="number" className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center outline-none" value={s.CargaPlanejada ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} />
                  <button onClick={() => { const n = [...exercicios]; n[exIndex].series.splice(sIndex, 1); setExercicios(n); }} className="text-neutral-600 hover:text-red-500 font-black text-lg">×</button>
                </div>
              ))}
              <button onClick={() => { const n = [...exercicios]; n[exIndex].series.push({ordem: '', reps: '', carga: '', intervalo: '', CargaPlanejada: ''}); setExercicios(n); }} className="w-full mt-6 py-4 border-2 border-dashed border-white/10 rounded-2xl text-neutral-500 text-[10px] font-black uppercase hover:border-white/20 transition-all"> + ADICIONAR SÉRIE </button>
            </div>
          </div>
        ))}

        <button onClick={atualizarFicha} className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-500 transition-all active:scale-[0.98]"> SALVAR ALTERAÇÕES </button>
        
        {/* ESPAÇADOR DE SEGURANÇA: Garante scroll total até o final */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}