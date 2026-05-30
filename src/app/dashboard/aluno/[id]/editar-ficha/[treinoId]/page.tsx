'use client';
import { useEffect, useState } from 'react';
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
      const { data, error } = await supabase
        .from('fichas')
        .select('*')
        .eq('id', treinoId)
        .maybeSingle();

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
      novos[exIndex].series[sIndex] = {
        ...novos[exIndex].series[sIndex],
        [campo]: valor
      };
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
    // CORREÇÃO: Mapeando corretamente todos os campos incluindo 'ordem'
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

    const { error } = await supabase
      .from('fichas')
      .update({ nome_treino: nome, descricao: JSON.stringify(exerciciosLimpos) })
      .eq('id', treinoId);

    if (error) alert('Erro ao salvar: ' + error.message);
    else router.push(`/dashboard/aluno/${id}?aba=treinos`);
    setLoading(false);
  };

  const excluirFicha = async () => {
    if (!confirm("Tem certeza que deseja excluir esta ficha?")) return;
    setLoading(true);
    const { error } = await supabase.from('fichas').delete().eq('id', treinoId);
    if (!error) router.push(`/dashboard/aluno/${id}`);
    else alert("Erro: " + error.message);
    setLoading(false);
  };

  if (loading) return <main className="min-h-screen p-10 text-center text-gray-500 font-medium">Carregando editor...</main>;

 return (
  <main className="min-h-screen bg-gray-50/50 p-6 md:p-12">
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => router.back()} className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">← Voltar</button>
        <button onClick={excluirFicha} className="text-red-500 font-semibold text-sm hover:text-red-600 transition-colors">Excluir Ficha</button>
      </div>

      <input 
        className="w-full text-2xl font-bold bg-transparent mb-8 outline-none border-b border-transparent focus:border-gray-200 transition-all placeholder:text-gray-300" 
        value={nome} 
        onChange={(e) => setNome(e.target.value)} 
        placeholder="Nome do Treino" 
      />

      {exercicios.map((ex, exIndex) => (
        <div key={exIndex} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <input 
              className="font-semibold text-gray-900 w-full outline-none border-b border-transparent focus:border-gray-200 pb-1" 
              value={ex.nome} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
              placeholder="Nome do Exercício"
            />
            <button onClick={() => { const n = exercicios.filter((_, i) => i !== exIndex); setExercicios(n); }} className="text-red-400 text-xs font-bold ml-4 hover:text-red-600">Excluir</button>
          </div>
          
          <div className="mb-6 space-y-3">
            <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none" placeholder="URL do vídeo" value={ex.video || ''} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
            <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"> {uploading ? 'Enviando...' : 'Upload de Vídeo'} </button>
            <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
            
            {/* Campo de Observação Adicionado */}
            <input 
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs italic outline-none placeholder:text-gray-400" 
              placeholder="Adicionar observação técnica (ex: foco na negativa)..." 
              value={ex.observacao || ''} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].observacao = e.target.value; setExercicios(n); }} 
            />
          </div>

          <div className="grid grid-cols-6 gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1 text-center">
            <span>Série</span><span>Reps</span><span>Carga</span><span>Desc.</span><span>Planej.</span><span></span>
          </div>

          <div className="space-y-2">
            {ex.series?.map((s, sIndex) => (
              <div key={sIndex} className="grid grid-cols-6 gap-2 items-center">
                <input 
                  type="text" 
                  className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center font-bold text-gray-700 focus:bg-white focus:border-gray-200 outline-none transition-all" 
                  value={s.ordem ?? ''} 
                  onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)}
                  placeholder={String(sIndex + 1)}
                />
                <input type="text" className="p-2 bg-gray-50 border rounded-lg text-sm text-center outline-none" value={s.reps ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                <input type="number" className="p-2 bg-gray-50 border rounded-lg text-sm text-center outline-none" value={s.carga ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                <input type="number" className="p-2 bg-gray-50 border rounded-lg text-sm text-center outline-none" value={s.intervalo ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                <input type="number" className="p-2 bg-gray-50 border rounded-lg text-sm text-center outline-none" value={s.CargaPlanejada ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} />
                <button onClick={() => { const n = [...exercicios]; n[exIndex].series.splice(sIndex, 1); setExercicios(n); }} className="text-gray-300 hover:text-red-500 font-bold text-lg">×</button>
              </div>
            ))}
            <button onClick={() => { const n = [...exercicios]; n[exIndex].series.push({ordem: '', reps: '', carga: '', intervalo: '', CargaPlanejada: ''}); setExercicios(n); }} className="w-full mt-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs font-bold hover:border-gray-300 transition-all"> + Adicionar Série </button>
          </div>
        </div>
      ))}

      <button onClick={atualizarFicha} className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"> Salvar Alterações </button>
    </div>
  </main>
);
}