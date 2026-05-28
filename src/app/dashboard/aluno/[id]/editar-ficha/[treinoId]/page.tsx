'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Serie { reps: string; carga: string; intervalo: string; }
interface Exercicio { nome: string; video: string; series: Serie[]; }

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
    const { error } = await supabase
      .from('fichas')
      .update({ 
        nome_treino: nome, 
        descricao: JSON.stringify(exercicios)
      })
      .eq('id', treinoId);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      router.push(`/dashboard/aluno/${id}/treino/${treinoId}`);
    }
    setLoading(false);
  };

 const excluirFicha = async () => {
  if (!confirm("Tem certeza?")) return;
  
  setLoading(true);
  // O Supabase apaga a ficha e o banco apaga o resto automaticamente!
  const { error } = await supabase.from('fichas').delete().eq('id', treinoId);
  
  if (!error) router.push(`/dashboard/aluno/${id}`);
  else alert("Erro: " + error.message);
  setLoading(false);
};

  if (loading) return <main className="min-h-screen p-10 text-center text-gray-500">Carregando editor...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho Profissional */}
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={() => router.back()} 
            className="text-sm font-bold text-gray-400 hover:text-gray-900 transition"
          >
            ← Voltar
          </button>
          <button 
            onClick={excluirFicha}
            className="text-red-600 font-bold text-xs bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition"
          >
            Excluir Ficha
          </button>
        </div>

        <h1 className="text-3xl font-black mb-8 tracking-tighter">Editar Treino</h1>
        
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
          placeholder="Nome do Treino"
        />
        
        {exercicios.length === 0 && (
            <p className="text-center p-10 text-gray-400">Nenhum exercício encontrado.</p>
        )}

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <input 
              className="font-black text-xl w-full mb-4 border-b border-gray-100 pb-2 outline-none" 
              value={ex.nome} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
            />
            
            <div className="space-y-3">
              {ex.series?.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-3 gap-3">
                  <input className="p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" placeholder="Rep" value={s.reps} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].reps = e.target.value; setExercicios(n); }} />
                  <input className="p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" placeholder="Carga" value={s.carga} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].carga = e.target.value; setExercicios(n); }} />
                  <input className="p-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900" placeholder="Int" value={s.intervalo} onChange={(e) => { const n = [...exercicios]; n[exIndex].series[sIndex].intervalo = e.target.value; setExercicios(n); }} />
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