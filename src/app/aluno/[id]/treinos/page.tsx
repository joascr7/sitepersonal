'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ListaTreinosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const META_SESSOES = 30;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Otimização: Apenas uma chamada necessária para validar
      const { data: aluno } = await supabase.from('alunos').select('status_pagamento, data_vencimento').eq('id', id).single();
      
      if (aluno) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(aluno.data_vencimento);
        const dataLimite = new Date(vencimento); dataLimite.setDate(dataLimite.getDate() + 2);
        
        if (aluno.status_pagamento === 'bloqueado' || hoje > dataLimite) {
          router.push('/aluno/pagamento-pendente'); return;
        }
      }

      const [fichasRes, histRes] = await Promise.all([
        supabase.from('fichas').select('*').eq('aluno_id', id),
        supabase.from('conclusoes_treino').select('treino_id, data_conclusao').eq('aluno_id', id)
      ]);

      if (fichasRes.data) {
        const historicoData = histRes.data || [];
        const processadas = fichasRes.data.map(f => {
          let exercicios = [];
          try { exercicios = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []); } catch { exercicios = []; }
          const historicoDoTreino = historicoData.filter(h => h.treino_id === f.id);
          return { ...f, count: exercicios.length, sessõesCount: historicoDoTreino.length, ultimaSessao: historicoDoTreino.length > 0 ? historicoDoTreino[0].data_conclusao : null };
        });
        setFichas(processadas);
      }
      setLoading(false);
    };
    init();
  }, [id, router]);

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
    // PT-20: Reserva o espaço para a Navbar superior fixa.
    // PB-32: Reserva o espaço necessário para a Navbar inferior fixa.
    <main className="w-full bg-black text-white pt-20 pb-32 px-4">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="py-6">
          <h1 className="text-4xl font-black tracking-tighter">Treinos</h1>
          <p className="text-blue-500 font-black text-[9px] uppercase tracking-[0.2em] mt-1">
            Sua jornada de alta performance
          </p>
        </header>

        <div className="space-y-4">
          {fichas.map((f) => {
            const progressoPercent = Math.min(Math.round((f.sessõesCount / META_SESSOES) * 100), 100);
            
            return (
              <div key={f.id} className="bg-neutral-900/50 p-6 rounded-[2rem] border border-white/5 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-black text-white text-md">{f.nome_treino}</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mt-1">
                      {f.count} Exercícios
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-neutral-600">Última</p>
                    <p className="text-[10px] font-bold text-white/70">
                      {f.ultimaSessao ? new Date(f.ultimaSessao).toLocaleDateString('pt-BR') : 'Inédito'}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">Progresso</p>
                    <p className="text-[10px] font-black text-blue-500">{f.sessõesCount} / {META_SESSOES}</p>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${progressoPercent}%` }} />
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform"
                >
                  Iniciar Treino
                </button>
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={() => router.back()} 
          className="w-full text-neutral-700 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] mt-4"
        >
          Voltar para Perfil
        </button>

        {/* ESPAÇADOR DE SEGURANÇA: Garante que o scroll ultrapasse a Navbar inferior */}
        <div className="h-16 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}