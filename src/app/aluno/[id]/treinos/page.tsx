'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaChevronLeft, FaPlay, FaDumbbell, FaRunning, FaHeartbeat } from 'react-icons/fa';
import ParqForm from '@/components/ParqForm';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Treinos', subtitle: 'Sua jornada de alta performance', exercises: 'exercícios',
    last: 'Última', never: 'Inédito', progress: 'Progresso', start: 'Iniciar Treino',
    back: 'Voltar para Perfil', doneToday: 'Concluído Hoje', lastExec: 'Última Execução',
    date: 'Data:', time: 'Horário:', duration: 'Duração:', next: 'Próximo', validity: 'Validade:', sessions: 'sessões'
  },
  'pt-PT': {
    title: 'Treinos', subtitle: 'A sua jornada de alta performance', exercises: 'exercícios',
    last: 'Última', never: 'Inédito', progress: 'Progresso', start: 'Iniciar Treino',
    back: 'Voltar ao Perfil', doneToday: 'Concluído Hoje', lastExec: 'Última Execução',
    date: 'Data:', time: 'Horário:', duration: 'Duração:', next: 'Próximo', validity: 'Validade:', sessions: 'sessões'
  },
  'en': {
    title: 'Workouts', subtitle: 'Your high performance journey', exercises: 'exercises',
    last: 'Last', never: 'Never', progress: 'Progress', start: 'Start Workout',
    back: 'Back to Profile', doneToday: 'Completed Today', lastExec: 'Last Execution',
    date: 'Date:', time: 'Time:', duration: 'Duration:', next: 'Next', validity: 'Expires:', sessions: 'sessions'
  }
};

export default function ListaTreinosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [precisaParq, setPrecisaParq] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [ultimoTreinoConcluidoId, setUltimoTreinoConcluidoId] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const t = translations[lang];

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#1A1D24', '--surface-sec': '#222731', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)'
  } as React.CSSProperties : {
    '--bg': '#F9FAFB', '--surface': '#FFFFFF', '--surface-sec': '#F3F4F6', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)'
  } as React.CSSProperties;

  const META_SESSOES = 30;

  const getTreinoMediaConfig = (nomeTreino: string) => {
    const nome = nomeTreino.toLowerCase();
    if (nome.includes('peito') || nome.includes('superior') || nome.includes('braço') || nome.includes('triceps')) {
      return { localGif: '/gifs/peito.gif', gradient: 'from-blue-500 to-indigo-600', icon: <FaDumbbell className="text-white text-2xl" /> };
    }
    if (nome.includes('perna') || nome.includes('inferior') || nome.includes('glúteo') || nome.includes('coxa') || nome.includes('pernas')) {
      return { localGif: '/gifs/pernas.gif', gradient: 'from-emerald-500 to-teal-600', icon: <FaRunning className="text-white text-2xl" /> };
    }
    if (nome.includes('costas') || nome.includes('dorsal') || nome.includes('ombro') || nome.includes('biceps')) {
      return { localGif: '/gifs/costas.gif', gradient: 'from-purple-500 to-pink-600', icon: <FaDumbbell className="text-white text-2xl rotate-45" /> };
    }
    return { localGif: '/gifs/geral.gif', gradient: 'from-blue-600 to-cyan-500', icon: <FaHeartbeat className="text-white text-2xl" /> };
  };

  const getExercicios = (descricaoStr: any) => {
    if (!descricaoStr) return [];
    try {
      const parsed = typeof descricaoStr === 'string' ? JSON.parse(descricaoStr) : descricaoStr;
      if (parsed.subdivisoes) return parsed.subdivisoes.flatMap((s: any) => s.exercicios || []);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].exercicios) return parsed.flatMap((s: any) => s.exercicios || []);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: aluno } = await supabase.from('alunos').select('status_pagamento, data_vencimento, parq_valido').eq('id', id).single();
      
      if (aluno) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(aluno.data_vencimento);
        const dataLimite = new Date(vencimento); dataLimite.setDate(dataLimite.getDate() + 2);
        
        if (aluno.status_pagamento === 'bloqueado' || hoje > dataLimite) {
          router.push('/aluno/pagamento-pendente'); return;
        }

        if (aluno.parq_valido === false || aluno.parq_valido === null) {
          setPrecisaParq(true);
          setLoading(false);
          return; 
        }
      }

      const [fichasRes, histRes] = await Promise.all([
        supabase.from('fichas').select('*, tipo_treino, objetivo, dificuldade, data_inicio, data_vencimento').eq('aluno_id', id).eq('ativo', true),
        supabase.from('conclusoes_treino').select('treino_id, data_conclusao, data_inicio, data_fim, duracao_minutos').eq('aluno_id', id).order('data_conclusao', { ascending: false })
      ]);

      if (histRes.data && histRes.data.length > 0) {
        setUltimoTreinoConcluidoId(histRes.data[0].treino_id);
      }

      if (fichasRes.data) {
        const historicoData = histRes.data || [];
        const processadas = fichasRes.data.map(f => {
          const exerciciosFlat = getExercicios(f.descricao);
          const historicoDoTreino = historicoData.filter(h => h.treino_id === f.id);
          const ultimaSessaoObj = historicoDoTreino.length > 0 ? historicoDoTreino[0] : null;
          
          return { 
            ...f, 
            exercicios: exerciciosFlat, 
            count: exerciciosFlat.length, 
            sessõesCount: historicoDoTreino.length, 
            ultimaSessaoObj,
            ultimaSessao: ultimaSessaoObj ? ultimaSessaoObj.data_conclusao : null,
            ativo: f.ativo !== false 
          };
        });
        setFichas(processadas);
      }
      setLoading(false);
    };
    init();
  }, [id, router]);

  const fichasAgrupadas = useMemo(() => {
    return fichas.reduce((acc, f) => {
      const partes = f.nome_treino ? f.nome_treino.split(' - ') : ['PROGRAMA'];
      const programaMaster = partes[0].trim();
      const nomeExibicaoCard = partes.slice(1).join(' - ') || f.nome_treino;

      if (!acc[programaMaster]) acc[programaMaster] = [];
      acc[programaMaster].push({ ...f, nomeLimpoCard: nomeExibicaoCard });
      return acc;
    }, {} as Record<string, Array<any>>);
  }, [fichas]);

  if (precisaParq) {
    return (
      <div style={themeStyles} className="min-h-screen bg-[var(--bg)] pt-10 px-4 pb-20">
        <ParqForm alunoId={id} onComplete={() => window.location.reload()} />
      </div>
    );
  }

  if (loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-4 pt-[max(env(safe-area-inset-top),2rem)] animate-pulse">
      <div className="w-32 h-8 bg-[var(--surface-sec)] rounded-md mb-8 mx-auto"></div>
      <div className="w-full max-w-md mx-auto h-64 bg-[var(--surface-sec)] rounded-[2rem]"></div>
    </main>
  );
  
  return (
    <main style={themeStyles} className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-32 px-5 relative">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* CABEÇALHO DA PÁGINA */}
        <header className="flex items-center gap-4 pt-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-all shadow-sm hover:bg-[var(--surface-sec)]"
          >
            <FaChevronLeft className="text-[var(--text-primary)]" size={14} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Seu Programa</span>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none mt-0.5">{t.title}</h1>
          </div>
        </header>

        <div className="space-y-8">
          {Object.entries(fichasAgrupadas).map(([programaMaster, treinos]) => {
            
            const treinosList = treinos as any[]; 
            const totalSessoesPrograma = treinosList.reduce((acc: number, f: any) => acc + f.sessõesCount, 0);
            const progressoPercent = Math.min(Math.round((totalSessoesPrograma / META_SESSOES) * 100), 100);
            const datasVencimento = treinosList.map((f: any) => f.data_vencimento).filter(Boolean);
            const dataValidade = datasVencimento.length > 0 ? new Date(Math.max(...datasVencimento.map((d: any) => new Date(d).getTime()))) : null;

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // LÓGICA DO PRÓXIMO TREINO DINÂMICO
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            let indexDoProximo = 0; 
            if (ultimoTreinoConcluidoId) {
              const indexUltimo = treinosList.findIndex(t => t.id === ultimoTreinoConcluidoId);
              if (indexUltimo !== -1) {
                indexDoProximo = (indexUltimo + 1) % treinosList.length;
              }
            }

            return (
              <div key={programaMaster} className="bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* HEADER DO PROGRAMA (CARD) */}
                <div className="p-6 sm:p-8 border-b border-[var(--border)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  
                  <h2 className="text-2xl font-black tracking-tight uppercase text-[var(--text-primary)] mb-4 relative z-10">
                    {programaMaster}
                  </h2>

                  {/* TAGS SOFT UI */}
                  <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                    {treinosList[0]?.tipo_treino && <span className="px-3 py-1.5 bg-[var(--surface-sec)] text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[var(--border)]">{treinosList[0].tipo_treino}</span>}
                    {treinosList[0]?.objetivo && <span className="px-3 py-1.5 bg-[var(--surface-sec)] text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[var(--border)]">{treinosList[0].objective || treinosList[0].objetivo}</span>}
                    {treinosList[0]?.dificuldade && <span className="px-3 py-1.5 bg-[var(--surface-sec)] text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[var(--border)]">{treinosList[0].dificuldade}</span>}
                  </div>

                  {/* BARRA DE PROGRESSO NO TOPO */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">{t.progress}</span>
                      <span className="text-[12px] font-black text-[var(--primary)]">
                        {totalSessoesPrograma} <span className="text-[var(--text-secondary)]">/ {META_SESSOES} {t.sessions.toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--surface-sec)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out relative" 
                        style={{ width: `${progressoPercent}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-sm" />
                      </div>
                    </div>
                    {dataValidade && (
                      <p className="text-right text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mt-3">
                        {t.validity} <span className="text-[var(--text-primary)]">{dataValidade.toLocaleDateString(lang)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* LISTA DE TREINOS */}
                <div className="p-4 sm:p-6 space-y-3 bg-[var(--bg)]/30">
                  {treinosList.map((f: any, index: number) => {
                    const isProximo = index === indexDoProximo; 
                    const mediaConfig = getTreinoMediaConfig(f.nomeLimpoCard);
                    
                    return (
                      <button 
                        key={f.id}
                        onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                        className={`w-full p-4 rounded-[1.5rem] flex items-center justify-between transition-all duration-300 group text-left ${
                          isProximo 
                            ? 'bg-[var(--surface)] border-2 border-[var(--primary)] shadow-[0_8px_20px_rgba(37,99,235,0.15)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.25)] active:scale-[0.98]' 
                            : 'bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--primary)]/40 active:scale-[0.98]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          
                          {/* MINIATURA PREMIUM */}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative border border-[var(--border)] transition-transform group-hover:scale-105 ${isProximo ? 'shadow-inner' : ''}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${mediaConfig.gradient} opacity-90 z-10 flex items-center justify-center`}>
                              {mediaConfig.icon}
                            </div>
                            <img 
                              src={f.imagem_url || mediaConfig.localGif} 
                              alt={f.nomeLimpoCard} 
                              className="w-full h-full object-cover absolute inset-0 z-0" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-base uppercase tracking-tight text-[var(--text-primary)]">
                                {f.nomeLimpoCard}
                              </span>
                              
                              {/* ETIQUETA PRÓXIMO INTERNA */}
                              {isProximo && (
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                  {t.next}
                                </span>
                              )}
                            </div>
                            
                            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                              {f.count} {t.exercises}
                            </span>
                          </div>
                        </div>

                        {/* BOTÃO PLAY SUTIL */}
                        <div className="pl-3 shrink-0">
                          {isProximo ? (
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                              <FaPlay size={12} className="ml-1" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-colors">
                              <FaPlay size={12} className="ml-1 opacity-50 group-hover:opacity-100" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
