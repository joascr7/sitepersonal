'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaChevronLeft, FaPlay, FaChevronDown } from 'react-icons/fa'; // <-- Adicionado FaChevronDown

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Treinos',
    subtitle: 'Sua jornada de alta performance',
    exercises: 'Exercícios',
    last: 'Última',
    never: 'Inédito',
    progress: 'Progresso',
    start: 'Iniciar Treino',
    back: 'Voltar para Perfil'
  },
  'pt-PT': {
    title: 'Treinos',
    subtitle: 'A sua jornada de alta performance',
    exercises: 'Exercícios',
    last: 'Última',
    never: 'Inédito',
    progress: 'Progresso',
    start: 'Iniciar Treino',
    back: 'Voltar ao Perfil'
  },
  'en': {
    title: 'Workouts',
    subtitle: 'Your high performance journey',
    exercises: 'Exercises',
    last: 'Last',
    never: 'Never',
    progress: 'Progress',
    start: 'Start Workout',
    back: 'Back to Profile'
  }
};

interface Treino {
  id: string;
  sessõesCount: number;
  [key: string]: any; // Isso permite outros campos vindos do banco
}

export default function ListaTreinosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  
  // Controle de quais programas estão abertos (Accordion)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');

  // Inicialização de Tema e Idioma (Persistência)
  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const META_SESSOES = 30;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
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
          try { 
            exercicios = typeof f.descricao === 'string' ? JSON.parse(f.descricao || '[]') : (f.descricao || []); 
          } catch { 
            exercicios = []; 
          }
          const historicoDoTreino = historicoData.filter(h => h.treino_id === f.id);
          
          return { 
            ...f, 
            exercicios, 
            count: exercicios.length, 
            sessõesCount: historicoDoTreino.length, 
            ultimaSessao: historicoDoTreino.length > 0 ? historicoDoTreino[0].data_conclusao : null,
            ativo: f.ativo !== false 
          };
        });
        setFichas(processadas);
      }
      setLoading(false);
    };
    init();
  }, [id, router]);

  // PROCESSAMENTO DOS 3 NÍVEIS COM useMemo
  const fichasAgrupadas = useMemo(() => {
    const ativas = fichas.filter((f) => f.ativo);
    
    return ativas.reduce((acc, f) => {
      const partes = f.nome_treino ? f.nome_treino.split(' - ') : ['GERAL'];
      const programaMaster = partes[0].trim().toUpperCase();
      const nomeExibicaoCard = partes[1] ? partes[1].trim() : f.nome_treino;

      if (!acc[programaMaster]) acc[programaMaster] = [];
      
      acc[programaMaster].push({
        ...f,
        nomeLimpoCard: nomeExibicaoCard
      });
      
      return acc;
    }, {} as Record<string, Array<any>>);
  }, [fichas]);

  // Abre automaticamente o primeiro programa quando os dados carregam
  useEffect(() => {
    const programas = Object.keys(fichasAgrupadas);
    if (programas.length > 0 && Object.keys(expandedSections).length === 0) {
      setExpandedSections({ [programas[0]]: true });
    }
  }, [fichasAgrupadas]);

  const toggleSection = (programaMaster: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [programaMaster]: !prev[programaMaster]
    }));
  };

  if (loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 space-y-8 animate-pulse pt-[max(env(safe-area-inset-top),2rem)]">
      <div className="space-y-4 mb-10">
        <div className="w-48 h-10 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-32 h-3 bg-[var(--surface-sec)] rounded-full" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] space-y-5">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="w-32 h-5 bg-[var(--surface-sec)] rounded-full" />
                <div className="w-20 h-3 bg-[var(--surface-sec)] rounded-full" />
              </div>
              <div className="w-16 h-8 bg-[var(--surface-sec)] rounded-xl" />
            </div>
            <div className="w-full h-1.5 bg-[var(--surface-sec)] rounded-full" />
            <div className="w-full h-12 bg-[var(--surface-sec)] rounded-2xl" />
          </div>
        ))}
      </div>
    </main>
  );
  
  return (
    <main 
      style={themeStyles} 
      className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),2rem)] pb-[env(safe-area-inset-bottom)] px-4"
    >
      <div className="max-w-md mx-auto space-y-6 pb-32">
        
        {/* ━━━━━━━━━━ HEADER ━━━━━━━━━━ */}
        <header className="py-4">
          <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
          <p className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            {t.subtitle}
          </p>
        </header>

        {/* ━━━━━━━━━━ ESTRUTURA DE TREINOS EM 3 NÍVEIS ━━━━━━━━━━ */}
        <div className="space-y-6">
          {Object.entries(fichasAgrupadas).map(([programaMaster, treinos]) => {
            const isExpanded = expandedSections[programaMaster];

            return (
              <div key={programaMaster} className="bg-[var(--surface)]/30 rounded-3xl p-2 border border-[var(--border)]">
                
                {/* 🎯 NÍVEL 1: Programa Master (Clicável / Accordion) */}
                <button 
                  onClick={() => toggleSection(programaMaster)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--surface-sec)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`h-5 w-1 bg-gradient-to-b from-[var(--primary-soft)] to-[var(--primary)] rounded-full transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-50'}`} />
                    <h2 className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)]">
                      {programaMaster}
                    </h2>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-sec)] transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)]'}`}>
                    <FaChevronDown size={12} />
                  </div>
                </button>

                {/* 📋 NÍVEL 2: Lista de Treinos Relacionados (Animação de Sanfona) */}
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden space-y-4 px-1 pb-1">
                    {(treinos as any[]).map((f) => {
                      const progressoPercent = Math.min(Math.round((f.sessõesCount / META_SESSOES) * 100), 100);
                      
                      return (
                        <div 
                          key={f.id} 
                          className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                              <h3 className="font-black text-[var(--text-primary)] text-base leading-tight tracking-tight">
                                {f.nomeLimpoCard}
                              </h3>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-70"></span>
                                {f.count} {t.exercises}
                              </p>
                            </div>
                            <div className="text-right bg-[var(--surface-sec)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                              <p className="text-[8px] font-bold uppercase text-[var(--text-secondary)] tracking-widest mb-0.5">{t.last}</p>
                              <p className="text-[11px] font-black text-[var(--text-primary)]">
                                {f.ultimaSessao ? new Date(f.ultimaSessao).toLocaleDateString(lang, { day: '2-digit', month: '2-digit' }) : t.never}
                              </p>
                            </div>
                          </div>

                          {/* 💪 NÍVEL 3: Lista Interna de Exercícios Totalmente Blindada */}
                          <div className="mb-5 space-y-1.5 relative z-10 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {f.exercicios && f.exercicios.length > 0 ? (
                              f.exercicios.map((ex: any, idx: number) => {
                                
                                const totalSeries = Array.isArray(ex.series) 
                                  ? ex.series.length 
                                  : (typeof ex.series === 'object' ? 1 : (ex.series || 3));

                                const reps = Array.isArray(ex.series) && ex.series[0]
                                  ? (ex.series[0].reps || ex.series[0].repeticoes || '12')
                                  : (ex.reps || ex.repeticoes || '12');

                                const carga = Array.isArray(ex.series) && ex.series[0]
                                  ? ex.series[0].carga
                                  : ex.carga;

                                let nomeFinal = `Exercício ${idx + 1}`;
                                if (ex.nome) nomeFinal = ex.nome;
                                else if (ex.exercicio) {
                                  nomeFinal = typeof ex.exercicio === 'object' ? (ex.exercicio.nome || ex.exercicio.titulo || nomeFinal) : ex.exercicio;
                                }

                                return (
                                  <div 
                                    key={idx} 
                                    className="flex justify-between items-center bg-[var(--surface-sec)]/50 border border-[var(--border)] px-3 py-2 rounded-xl text-xs hover:bg-[var(--surface-sec)]/80 transition-colors"
                                  >
                                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[190px]">
                                      {nomeFinal}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-secondary)] font-mono font-bold shrink-0 pl-2">
                                      {totalSeries}x{reps} {carga ? `• ${carga}kg` : ''}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-[var(--text-secondary)] italic pl-1">Nenhum exercício cadastrado.</p>
                            )}
                          </div>

                          {/* Barra de Progresso do Treino */}
                          <div className="mb-5 relative z-10">
                            <div className="flex justify-between items-end mb-2">
                              <p className="text-[9px] font-bold uppercase text-[var(--text-secondary)] tracking-widest">{t.progress}</p>
                              <p className="text-[11px] font-black text-[var(--primary)]">{f.sessõesCount} <span className="text-[var(--text-secondary)] opacity-50 font-bold text-[9px]">/ {META_SESSOES}</span></p>
                            </div>
                            <div className="h-2 bg-[var(--surface-sec)] rounded-full overflow-hidden border border-[var(--border)]">
                              <div 
                                className="h-full bg-gradient-to-r from-[var(--primary-soft)] to-[var(--primary)] rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${progressoPercent}%` }} 
                              />
                            </div>
                          </div>

                          {/* Botão de Ação */}
                          <button 
                            onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)}
                            className="w-full relative z-10 flex items-center justify-center gap-2 bg-[var(--primary)] text-white py-4 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 hover:bg-blue-600"
                          >
                            <FaPlay className="text-[10px]" />
                            {t.start}
                          </button>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
        
        {/* ━━━━━━━━━━ BACK BUTTON ━━━━━━━━━━ */}
        <button 
          onClick={() => router.back()} 
          className="w-full flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-[10px] font-bold uppercase tracking-[0.2em] mt-8 py-4 active:scale-95"
        >
          <FaChevronLeft className="text-[10px]" />
          {t.back}
        </button>

        <div className="h-16 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}