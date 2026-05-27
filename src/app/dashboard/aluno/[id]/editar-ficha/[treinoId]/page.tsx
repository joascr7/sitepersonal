'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Serie {
  reps: string;
  carga: string;
  intervalo: string;
}

interface Exercicio {
  nome: string;
  video: string;
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

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      const { data } = await supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle();

      if (data) {
        setNome(data.nome_treino || '');
        try {
          const parsed = typeof data.descricao === 'string' ? JSON.parse(data.descricao) : data.descricao;
          setExercicios(parsed || []);
        } catch (e) {
          console.error("Erro ao converter dados:", e);
          setExercicios([]);
        }
      }
      setLoading(false);
    };

    if (treinoId) carregarDados();
  }, [treinoId]);

  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => {
    const novas = [...exercicios];
    novas[exIndex].series[sIndex][campo] = valor;
    setExercicios(novas);
  };

  const atualizarFicha = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('fichas')
      .update({ 
        nome_treino: nome, 
        descricao: JSON.stringify(exercicios)
      })
      .eq('id', treinoId);

    if (error) alert('Erro ao salvar: ' + error.message);
    else router.push(`/dashboard/aluno/${id}/treino/${treinoId}`);
    setLoading(false);
  };

  if (loading) return <main className="min-h-screen p-10 text-center text-gray-500">Carregando editor...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tighter">Editar Treino</h1>
        
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" 
          value={nome} 
          placeholder="Nome do Treino"
          onChange={(e) => setNome(e.target.value)} 
        />
        
        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <input 
              className="font-black text-xl w-full mb-4 outline-none border-b border-gray-100 pb-2" 
              placeholder="Nome do Exercício" 
              value={ex.nome} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
            />
            
            <input 
              className="w-full p-4 border border-gray-200 rounded-xl mb-6 text-sm outline-none focus:ring-2 focus:ring-gray-900" 
              placeholder="Link do vídeo (YouTube)" 
              value={ex.video} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} 
            />
            
            <div className="space-y-3">
              {ex.series.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-3 gap-3">
                  <input className="p-3 border border-gray-200 rounded-xl" placeholder="Rep" value={s.reps} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                  <input className="p-3 border border-gray-200 rounded-xl" placeholder="Carga" value={s.carga} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                  <input className="p-3 border border-gray-200 rounded-xl" placeholder="Int" value={s.intervalo} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => { const n = [...exercicios]; n[exIndex].series.push({reps:'', carga:'', intervalo:'0'}); setExercicios(n); }} 
              className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 transition"
            >
              + Adicionar série
            </button>
          </div>
        ))}

        <button 
          onClick={atualizarFicha} 
          disabled={loading} 
          className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </main>
  );
}