'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Serie {
  reps: number | string;
  carga: number | string;         // Carga Recomendada
  CargaPlanejada: number | string; // Campo extra de planejamento
  intervalo: number | string;      // Tempo de descanso
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
        } catch (e) {
          setExercicios([]);
        }
      }
      setLoading(false);
    };

    carregarDados();
  }, [treinoId]);

  const atualizarFicha = async () => {
    setLoading(true);
    
    // Garantimos que os dados enviados ao banco sejam sempre números limpos
    const exerciciosLimpos = exercicios.map(ex => ({
      ...ex,
      series: ex.series.map(s => ({
        reps: Number(s.reps) || 0,
        carga: Number(s.carga) || 0,
        CargaPlanejada: Number(s.CargaPlanejada) || 0,
        intervalo: Number(s.intervalo) || 0
      }))
    }));

    const { error } = await supabase
      .from('fichas')
      .update({ 
        nome_treino: nome, 
        descricao: JSON.stringify(exerciciosLimpos)
      })
      .eq('id', treinoId);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      router.push(`/dashboard/aluno/${id}?aba=treinos`);
    }
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

  if (loading) return <main className="min-h-screen p-10 text-center text-gray-500">Carregando editor...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition">← Voltar</button>
          <button onClick={excluirFicha} className="text-red-600 font-bold text-xs bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition">Excluir Ficha</button>
        </div>

        <h1 className="text-3xl font-black mb-8 tracking-tighter">Editar Treino</h1>
        
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          placeholder="Nome do Treino"
        />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <input 
              className="font-black text-lg w-full mb-4 border-b border-gray-100 pb-2 outline-none" 
              value={ex.nome} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
            />
            
            {/* Cabeçalho alinhado ao seu layout de planejamento */}
            <div className="grid grid-cols-4 gap-2 text-[10px] font-black text-gray-400 uppercase px-1 mb-3">
              <span className="text-center">Reps</span>
              <span className="text-center">Carga Rec.</span>
              <span className="text-center">Intervalo</span>
              <span className="text-center">Carga Planejada</span>
            </div>

            <div className="space-y-2">
              {ex.series?.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-4 gap-2">
                  <input type="number" className="p-2 bg-gray-50 border rounded-lg font-bold text-sm text-center" value={s.reps} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].reps = e.target.value; setExercicios(n); }} />
                  <input type="number" className="p-2 bg-gray-50 border rounded-lg font-bold text-sm text-center" value={s.carga} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].carga = e.target.value; setExercicios(n); }} />
                  <input type="number" className="p-2 bg-gray-50 border rounded-lg font-black text-blue-600 text-sm text-center" value={s.intervalo} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].intervalo = e.target.value; setExercicios(n); }} />
                  <input type="number" className="p-2 bg-gray-50 border rounded-lg font-bold text-sm text-center" value={s.CargaPlanejada} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].CargaPlanejada = e.target.value; setExercicios(n); }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={atualizarFicha} 
          disabled={loading} 
          className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </main>
  );
}