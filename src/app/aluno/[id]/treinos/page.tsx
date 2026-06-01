'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ListaTreinosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Meta global de sessões (ex: 30)
  const META_SESSOES = 30;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // 1. Validação de Acesso com Tolerância de 2 dias
      const { data: aluno } = await supabase
        .from('alunos')
        .select('status_pagamento, data_vencimento')
        .eq('id', id)
        .single();

      if (aluno) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Converte data_vencimento (YYYY-MM-DD) para data local
        const [ano, mes, dia] = aluno.data_vencimento.split('-').map(Number);
        const vencimento = new Date(ano, mes - 1, dia);
        
        // Define o limite: vencimento + 2 dias
        const dataLimite = new Date(vencimento);
        dataLimite.setDate(dataLimite.getDate() + 2);
        dataLimite.setHours(0, 0, 0, 0);

        // Bloqueia apenas se: status for manual 'bloqueado' OU se hoje passou do limite
        const estaBloqueado = aluno.status_pagamento === 'bloqueado' || hoje > dataLimite;

        if (estaBloqueado) {
          router.push('/aluno/pagamento-pendente');
          return;
        }
      } else {
        // Se não encontrar o aluno, segurança extra: redireciona
        router.push('/login-aluno');
        return;
      }

      // 2. Fetch paralelo otimizado (restante do código original)
      const [fichasRes, histRes] = await Promise.all([
        supabase.from('fichas').select('*').eq('aluno_id', id),
        supabase.from('conclusoes_treino')
          .select('treino_id, data_conclusao')
          .eq('aluno_id', id)
          .order('data_conclusao', { ascending: false })
      ]);

      if (fichasRes.data) {
        const historicoData = histRes.data || [];
        
        const processadas = fichasRes.data.map(f => {
          let exercicios = [];
          try { exercicios = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []); } catch { exercicios = []; }
          
          const historicoDoTreino = historicoData.filter(h => h.treino_id === f.id);
          
          return { 
            ...f, 
            count: exercicios.length, 
            sessõesCount: historicoDoTreino.length,
            ultimaSessao: historicoDoTreino.length > 0 ? historicoDoTreino[0].data_conclusao : null 
          };
        });
        setFichas(processadas);
      }
      setLoading(false);
    };
    init();
  }, [id, router]);

  if (loading) return (
    <main className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4">
        <div className="h-20 bg-white rounded-[2rem] animate-pulse" />
        <div className="h-40 bg-white rounded-[2rem] animate-pulse" />
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12">
      <div className="max-w-xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter text-gray-950">Treinos</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mt-2">Centro de Performance</p>
        </header>

        <div className="space-y-6">
          {fichas.map((f) => {
            const progressoPercent = Math.min(Math.round((f.sessõesCount / META_SESSOES) * 100), 100);
            
            return (
              <div key={f.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-lg font-black text-gray-950">{f.nome_treino}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{f.count} Exercícios</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-gray-400">Último treino</p>
                    <p className="text-[10px] font-bold text-gray-950">
                      {f.ultimaSessao ? new Date(f.ultimaSessao).toLocaleDateString('pt-BR') : 'Nunca realizado'}
                    </p>
                  </div>
                </div>

                {/* COMPONENTE DE PROGRESSO PREMIUM */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[9px] font-black uppercase text-gray-400">Progresso de Treino</p>
                    <p className="text-[10px] font-black text-gray-950">Sessões: <span className="text-sm">{f.sessõesCount}/{META_SESSOES}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-black tracking-tighter">{progressoPercent}%</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 transition-all duration-1000 ease-out" 
                        style={{ width: `${progressoPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]"
                >
                  Iniciar Treino
                </button>
              </div>
            );
          })}
        </div>
        
        <button onClick={() => router.back()} className="mt-12 w-full text-gray-400 hover:text-gray-900 transition-all text-[9px] font-black uppercase tracking-[0.25em]">
          Voltar para Perfil
        </button>
      </div>
    </main>
  );
}