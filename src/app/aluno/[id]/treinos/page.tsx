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
      const { data: fichasData } = await supabase.from('fichas').select('*').eq('aluno_id', id);
      const { data: conclusoesData } = await supabase.from('conclusoes_treino').select('treino_id').eq('aluno_id', id);

      if (conclusoesData) setConclusoes(conclusoesData.map(c => c.treino_id));
      if (fichasData) {
        const processadas = fichasData.map(f => {
          let exercicios = [];
          try { exercicios = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []); } catch (e) { exercicios = []; }
          return { ...f, exercicios, count: exercicios.length };
        });
        setFichas(processadas);
      }
      setLoading(false);
    };
    fetchTreinos();
  }, [id]);

  if (loading) return <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-blue-600 font-bold tracking-widest uppercase text-xs">Carregando Treinos...</main>;

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6 md:p-12">
      <div className="max-w-xl mx-auto">
        <h1 
          className="text-4xl font-black tracking-tighter mb-10"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Meus Treinos
        </h1>
        
        {fichas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-medium">Nenhum treino liberado ainda.</p>
          </div>
        ) : (
          fichas.map((f) => {
            const estaConcluido = conclusoes.includes(f.id);
            return (
              <div 
                key={f.id} 
                className={`group bg-white p-6 rounded-3xl mb-4 flex justify-between items-center transition-all duration-500 border ${
                  estaConcluido 
                    ? 'border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'border-gray-100 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className={`text-lg font-black transition-colors ${estaConcluido ? 'text-blue-600' : 'text-gray-950'}`}>
                      {f.nome_treino}
                    </p>
                    {estaConcluido && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-blue-100">
                        Concluído
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                    {f.count} Exercícios
                  </p>
                </div>
                
                <button 
                  onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                  className={`px-8 py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.95] ${
                    estaConcluido 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-900 text-white hover:bg-black'
                  }`}
                >
                  {estaConcluido ? 'Revisar' : 'Abrir'}
                </button>
              </div>
            );
          })
        )}
        
        <button 
          onClick={() => router.back()} 
          className="text-gray-400 mt-10 hover:text-gray-900 transition-all w-full text-center text-[10px] font-black uppercase tracking-[0.25em]"
        >
          ← Voltar para perfil
        </button>
      </div>
    </main>
  );
}