'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Serie {
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
        reps: s.reps || "0",
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
        {/* Header de Ações */}
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">← Voltar</button>
          <button onClick={excluirFicha} className="text-red-500 font-semibold text-sm hover:text-red-600 transition-colors">Excluir Ficha</button>
        </div>

        {/* Input Nome do Treino */}
        <input 
          className="w-full text-2xl font-bold bg-transparent mb-8 outline-none border-b border-transparent focus:border-gray-200 transition-all placeholder:text-gray-300" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          placeholder="Nome do Treino" 
        />

        {/* Lista de Exercícios */}
        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 transition-all hover:shadow-md">
            <input 
              className="font-semibold text-gray-900 w-full mb-6 outline-none border-b border-transparent focus:border-gray-200 pb-1" 
              value={ex.nome} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
              placeholder="Nome do Exercício"
            />
            
            <div className="mb-6 space-y-2">
              <input 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-gray-300 transition-all" 
                placeholder="URL do vídeo" 
                value={ex.video} 
                onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} 
              />
              <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                {uploading ? 'Enviando...' : 'Upload de Vídeo (Máx 10MB)'}
              </button>
              <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
            </div>

            <div className="grid grid-cols-4 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              <span>Reps</span><span>Carga</span><span>Desc.</span><span>Planej.</span>
            </div>

            <div className="space-y-2">
              {ex.series?.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-4 gap-2">
                  <input type="text" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 transition-all outline-none" value={s.reps} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].reps = e.target.value; setExercicios(n); }} />
                  <input type="number" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 transition-all outline-none" value={s.carga} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].carga = e.target.value; setExercicios(n); }} />
                  <input type="number" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 transition-all outline-none" value={s.intervalo} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].intervalo = e.target.value; setExercicios(n); }} />
                  <input type="number" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 transition-all outline-none" value={s.CargaPlanejada} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].CargaPlanejada = e.target.value; setExercicios(n); }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={atualizarFicha} 
          className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          Salvar Alterações
        </button>
      </div>
    </main>
  );
}