'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ListaTreinosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [conclusoes, setConclusoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTreinos = async () => {
      setLoading(true);
      
      // 1. Busca os treinos do aluno
      const { data: fichasData } = await supabase
        .from('fichas')
        .select('*')
        .eq('aluno_id', id);

      // 2. Busca as conclusões para marcar o que já foi feito
      const { data: conclusoesData } = await supabase
        .from('conclusoes_treino')
        .select('treino_id')
        .eq('aluno_id', id);

      if (conclusoesData) {
        setConclusoes(conclusoesData.map(c => c.treino_id));
      }

      if (fichasData) {
        const processadas = fichasData.map(f => {
          let exercicios = [];
          try {
            exercicios = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []);
          } catch (e) {
            exercicios = []; // Fallback simples
          }
          return { ...f, exercicios, count: exercicios.length };
        });
        setFichas(processadas);
      }
      setLoading(false);
    };
    fetchTreinos();
  }, [id]);

  if (loading) return <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Carregando...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">Meus Treinos</h1>
        
        {fichas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">Nenhuma ficha disponível no momento.</p>
          </div>
        ) : (
          fichas.map((f) => {
            const estaConcluido = conclusoes.includes(f.id);
            
            return (
              <div 
                key={f.id} 
                className={`bg-white p-8 rounded-3xl mb-4 flex justify-between items-center shadow-sm border transition-all ${
                  estaConcluido ? 'border-green-200' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-gray-900">{f.nome_treino}</p>
                    {estaConcluido && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                        Concluído
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {f.count} exercícios
                  </p>
                </div>
                
                <button 
                  onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                  className={`${
                    estaConcluido 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-900 hover:bg-black'
                  } text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]`}
                >
                  {estaConcluido ? 'Visualizar' : 'Abrir'}
                </button>
              </div>
            );
          })
        )}
        
        <button 
          onClick={() => router.back()} 
          className="text-gray-400 mt-10 hover:text-gray-900 transition w-full text-center text-sm font-bold"
        >
          Voltar para o perfil
        </button>
      </div>
    </main>
  );
}