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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAPEAMENTO LOCAL DE GIFS + ICONES DE CLASSE PREMIUM (FALLBACK)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const getTreinoMediaConfig = (nomeTreino: string) => {
    const nome = nomeTreino.toLowerCase();
    
    if (nome.includes('peito') || nome.includes('superior') || nome.includes('braço') || nome.includes('triceps')) {
      return {
        localGif: '/gifs/peito.gif',
        gradient: 'from-blue-500 to-indigo-600',
        icon: <FaDumbbell className="text-white text-2xl animate-pulse" />
      };
    }
    if (nome.includes('perna') || nome.includes('inferior') || nome.includes('glúteo') || nome.includes('coxa') || nome.includes('pernas')) {
      return {
        localGif: '/gifs/pernas.gif',
        gradient: 'from-emerald-500 to-teal-600',
        icon: <FaRunning className="text-white text-2xl animate-pulse" />
      };
    }
    if (nome.includes('costas') || nome.includes('dorsal') || nome.includes('ombro') || nome.includes('biceps')) {
      return {
        localGif: '/gifs/costas.gif',
        gradient: 'from-purple-500 to-pink-600',
        icon: <FaDumbbell className="text-white text-2xl rotate-45 animate-pulse" />
      };
    }
    
    // Default (Cardio / Geral)
    return {
      localGif: '/gifs/geral.gif',
      gradient: 'from-blue-600 to-cyan-500',
      icon: <FaHeartbeat className="text-white text-2xl animate-pulse" />
    };
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
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-4 pt-10 animate-pulse">
      <div className="w-32 h-8 bg-[var(--surface-sec)] rounded-md mb-8"></div>
      <div className="w-full h-64 bg-[var(--surface-sec)] rounded-xl"></div>
    </main>
  );
  
  return (
    <main style={themeStyles} className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),2rem)] pb-[env(safe-area-inset-bottom)] px-4">
      <div className="max-w-md mx-auto space-y-6 pb-32">
        
        <header className="py-2 mb-4">
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">{t.title}</h1>
        </header>

        <div className="space-y-6">
          {Object.entries(fichasAgrupadas).map(([programaMaster, treinos]) => {
            
            const treinosList = treinos as any[]; 
            const totalSessoesPrograma = treinosList.reduce((acc: number, f: any) => acc + f.sessõesCount, 0);
            const progressoPercent = Math.min(Math.round((totalSessoesPrograma / META_SESSOES) * 100), 100);
            
            const datasVencimento = treinosList.map((f: any) => f.data_vencimento).filter(Boolean);
            const dataValidade = datasVencimento.length > 0 ? new Date(Math.max(...datasVencimento.map((d: any) => new Date(d).getTime()))) : null;

            return (
              <div key={programaMaster} className="bg-[var(--surface-sec)] rounded-3xl p-4 border border-[var(--border)] relative shadow-sm">
                
                <h2 className="text-xl font-black uppercase tracking-wider text-[var(--text-primary)] mb-2 ml-1">
                  {programaMaster}
                </h2>

                <div className="flex flex-wrap gap-2 mb-5 ml-1">
                  {treinosList[0]?.tipo_treino && (
                    <span className="text-[9px] font-bold bg-[var(--surface)] text-[var(--text-secondary)] px-2.5 py-1 rounded-md border border-[var(--border)] uppercase tracking-widest shadow-sm">
                      {treinosList[0].tipo_treino}
                    </span>
                  )}
                  {treinosList[0]?.objetivo && (
                    <span className="text-[9px] font-bold bg-[var(--surface)] text-[var(--text-secondary)] px-2.5 py-1 rounded-md border border-[var(--border)] uppercase tracking-widest shadow-sm">
                      {treinosList[0].objective || treinosList[0].objetivo}
                    </span>
                  )}
                  {treinosList[0]?.dificuldade && (
                    <span className="text-[9px] font-bold bg-[var(--surface)] text-[var(--text-secondary)] px-2.5 py-1 rounded-md border border-[var(--border)] uppercase tracking-widest shadow-sm">
                      {treinosList[0].dificuldade}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {treinosList.map((f: any, index: number) => {
                    const isFirst = index === 0; 
                    const mediaConfig = getTreinoMediaConfig(f.nomeLimpoCard);
                    
                    return (
                      <div key={f.id} className="bg-[var(--surface)] p-3 rounded-[1.2rem] flex items-center gap-4 relative shadow-sm border border-[var(--border)] group hover:shadow-md transition-all">
                        
                        {isFirst && (
                          <span className="absolute -top-3 right-4 bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30 text-[10px] font-black px-3 py-1 rounded-lg z-10 uppercase tracking-wider">
                            {t.next}
                          </span>
                        )}

                        {/* CONTAINER DA MIDIA - CARREGA O GIF LOCAL OU O ICONE PREMIUM */}
                        <div className="w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden shrink-0 relative border border-[var(--border)]">
                          
                          {/* Imagem/GIF dinâmico (Carrega do banco ou da sua pasta local /gifs) */}
                          <img 
                            src={f.imagem_url || mediaConfig.localGif} 
                            alt={f.nomeLimpoCard} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 z-10 relative" 
                            onError={(e) => {
                              // Se você ainda não salvou o arquivo .gif na pasta, ele esconde a imagem quebrada
                              e.currentTarget.style.display = 'none';
                              const fallbackDiv = e.currentTarget.nextElementSibling;
                              if (fallbackDiv) fallbackDiv.classList.remove('hidden');
                            }}
                          />
                          
                          {/* FALLBACK PREMIUM: Gradiente com ícone temático pulsando */}
                          <div className={`w-full h-full bg-gradient-to-br ${mediaConfig.gradient} flex flex-col items-center justify-center shadow-inner`}>
                            {mediaConfig.icon}
                          </div>

                        </div>
                        
                        <div className="flex-grow py-1">
                          <h3 className="font-black text-[16px] uppercase tracking-tight leading-tight text-[var(--text-primary)]">
                            {f.nomeLimpoCard}
                          </h3>
                          <p className="text-[12px] font-bold text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-70"></span>
                            {f.count} {t.exercises}
                          </p>
                        </div>

                        <button 
                          onClick={() => router.push(`/aluno/${id}/treino/${f.id}`)} 
                          className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-lg shadow-[var(--primary)]/30 hover:bg-blue-600 mr-1"
                        >
                          <FaPlay className="ml-1 text-lg" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 flex justify-between items-end border-t border-[var(--border)] mx-1">
                  <div className="w-[45%]">
                    <div className="h-1.5 bg-[var(--border)] rounded-full mb-2 overflow-hidden flex shadow-inner">
                      <div className="h-full bg-[var(--primary-soft)]/30 rounded-l-full" style={{ width: '40%' }}>
                        <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${(progressoPercent / 40) * 100}%` }}></div>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      <span className="text-[var(--text-primary)]">{totalSessoesPrograma}</span>/{META_SESSOES} {t.sessions}
                    </p>
                  </div>

                  {dataValidade && (
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      {t.validity} <span className="text-[var(--text-primary)]">{dataValidade.toLocaleDateString('pt-BR')}</span>
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>
        
        <button onClick={() => router.back()} className="w-full flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs uppercase tracking-widest mt-10 py-4 active:scale-95">
          <FaChevronLeft className="text-[10px]" /> {t.back}
        </button>

      </div>
    </main>
  );
}
