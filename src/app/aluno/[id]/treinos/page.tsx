'use client';
import { useEffect, useState, use } from 'react';
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
      const { data: aluno } = await supabase.from('alunos').select('status_pagamento, data_vencimento').eq('id', id).single();
      
      if (aluno) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const [ano, mes, dia] = aluno.data_vencimento.split('-').map(Number);
        const vencimento = new Date(ano, mes - 1, dia);
        const dataLimite = new Date(vencimento); dataLimite.setDate(dataLimite.getDate() + 2);
        
        if (aluno.status_pagamento === 'bloqueado' || hoje > dataLimite) {
          router.push('/aluno/pagamento-pendente'); return;
        }
      }

      const [fichasRes, histRes] = await Promise.all([
        supabase.from('fichas').select('*').eq('aluno_id', id),
        supabase.from('conclusoes_treino').select('treino_id, data_conclusao').eq('aluno_id', id).order('data_conclusao', { ascending: false })
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

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black">CARREGANDO...</main>;

  return (
    <main className="min-h-screen bg-black p-6 md:p-12 text-white selection:bg-blue-500 selection:text-white">
      <div className="max-w-xl mx-auto animate-in fade-in duration-700">
        <header className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600">Treinos</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">Ecossistema de Alta Performance</p>
        </header>

        <div className="space-y-8">
          {fichas.map((f) => {
            const progressoPercent = Math.min(Math.round((f.sessõesCount / META_SESSOES) * 100), 100);
            
            return (
              <div key={f.id} className="group relative bg-neutral-900/40 p-8 rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:bg-neutral-900/60 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                {/* Efeito de brilho sutil ao passar o mouse */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex justify-between items-start mb-8 relative">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white/90">{f.nome_treino}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1">{f.count} Exercícios</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-neutral-700">Última Sessão</p>
                    <p className="text-[10px] font-bold text-white/70">
                      {f.ultimaSessao ? new Date(f.ultimaSessao).toLocaleDateString('pt-BR') : 'Nunca realizado'}
                    </p>
                  </div>
                </div>

                <div className="mb-8 relative">
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-[9px] font-black uppercase text-neutral-500 tracking-widest">Progresso do Ciclo</p>
                    <p className="text-[10px] font-black text-blue-400">{f.sessõesCount} / {META_SESSOES} Sessões</p>
                  </div>
                  <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(37,99,235,0.6)]" 
                      style={{ width: `${progressoPercent}%` }}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                  className="relative w-full bg-white/5 hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.98] border border-white/5"
                >
                  Iniciar Treino
                </button>
              </div>
            );
          })}
        </div>
        
        <button onClick={() => router.back()} className="mt-12 w-full text-neutral-700 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.3em]">
          Voltar para Perfil
        </button>
      </div>
    </main>
  );
}