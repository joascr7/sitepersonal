'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaSearch, FaArrowLeft, FaCommentDots, FaClock, FaUser } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPAGENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Feedback {
  id: string;
  observacoes: string;
  data_criacao: string;
  aluno_id: string;
  alunos: {
    nome: string;
    avatar_url: string | null;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', // <--- Adicione esta linha
    title: 'Central de Feedbacks',
    subtitle: 'Acompanhe o que seus alunos estão achando dos treinos',
    searchPlaceholder: 'Pesquisar por nome do aluno...',
    emptyState: 'Nenhum feedback encontrado.',
    student: 'Aluno',
    unknownStudent: 'Aluno Desconhecido',
    loading: 'Carregando feedbacks...'
  },
  'pt-PT': {
    back: 'Voltar', // <--- Adicione esta linha
    title: 'Central de Feedbacks',
    subtitle: 'Acompanhe o que os seus alunos estão a achar dos treinos',
    searchPlaceholder: 'Procurar por nome do aluno...',
    emptyState: 'Nenhum feedback encontrado.',
    student: 'Aluno',
    unknownStudent: 'Aluno Desconhecido',
    loading: 'A carregar feedbacks...'
  },
  'en': {
    back: 'Back', // <--- Adicione esta linha
    title: 'Feedback Center',
    subtitle: 'Track what your students think about the workouts',
    searchPlaceholder: 'Search by student name...',
    emptyState: 'No feedback found.',
    student: 'Student',
    unknownStudent: 'Unknown Student',
    loading: 'Loading feedbacks...'
  }
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  
  const router = useRouter();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEMA PADRÃO PREMIUM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    // Carrega o tema e a linguagem salvos no localStorage
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    
    fetchFeedbacks();
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push('/');
        return;
      }
      
      const personalId = sessionData.session.user.id;

      const { data, error } = await supabase
        .from('feedbacks_treino')
        .select(`
          id,
          observacoes,
          data_criacao,
          aluno_id,
          alunos (
            nome,
            avatar_url
          )
        `)
        .eq('personal_id', personalId)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      if (data) setFeedbacks(data as any);
    } catch (error: any) {
      console.error("Erro ao buscar feedbacks:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  // Filtra os feedbacks pelo nome do aluno
  const feedbacksFiltrados = useMemo(() => {
    return feedbacks.filter(fb => 
      fb.alunos?.nome?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [feedbacks, busca]);

  // Formata a data e hora para exibição
  const formatarDataHora = (isoString: string) => {
    const data = new Date(isoString);
    // Usa a localidade 'pt-BR' ou 'en-US' dependendo do idioma selecionado
    const locale = lang === 'en' ? 'en-US' : 'pt-BR';
    return {
      data: data.toLocaleDateString(locale),
      hora: data.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Tela de Loading Padronizada
  if (loading) {
    return (
      <div style={themeStyles} className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-[var(--text-primary)]">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_var(--primary)]"></div>
        <p className="font-bold text-sm text-[var(--text-secondary)] animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div style={themeStyles} className="w-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans pb-12">
      
      {/* ━━━━━━━━━━ HEADER PREMIUM (Responsivo) ━━━━━━━━━━ */}
      <header className="bg-[#1C283F] text-white pt-[max(env(safe-area-inset-top),2rem)] pb-10 px-5 sm:px-8 relative rounded-b-[2.5rem] shadow-lg flex flex-col items-center text-center">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="absolute top-[max(env(safe-area-inset-top),2rem)] left-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all backdrop-blur-md active:scale-95"
          aria-label={translations['pt-BR'].back || 'Voltar'}
        >
          <FaArrowLeft size={16} />
        </button>

        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mt-4 mb-3 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <FaCommentDots size={28} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{t.title}</h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-2 font-medium max-w-xs sm:max-w-md opacity-90">
          {t.subtitle}
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        
        {/* ━━━━━━━━━━ BARRA DE PESQUISA ━━━━━━━━━━ */}
        <div className="bg-[var(--surface)] p-2 rounded-[2rem] shadow-xl border border-[var(--border)] mb-8 flex items-center transition-all focus-within:border-[var(--primary)]">
          <div className="pl-5 pr-3 text-[var(--text-secondary)]">
            <FaSearch size={18} />
          </div>
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-transparent p-3 sm:p-4 outline-none text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:font-medium"
          />
        </div>

        {/* ━━━━━━━━━━ LISTA DE FEEDBACKS ━━━━━━━━━━ */}
        <div className="space-y-4">
          {feedbacksFiltrados.length === 0 ? (
            <div className="bg-[var(--surface)] p-10 sm:p-14 rounded-[2rem] border border-[var(--border)] text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-20 h-20 bg-[var(--surface-sec)] rounded-full flex items-center justify-center mb-4">
                <FaCommentDots size={32} className="text-[var(--text-secondary)] opacity-50" />
              </div>
              <p className="text-[var(--text-secondary)] font-bold text-sm sm:text-base">{t.emptyState}</p>
            </div>
          ) : (
            feedbacksFiltrados.map((fb) => {
              const { data, hora } = formatarDataHora(fb.data_criacao);
              
              return (
                <div key={fb.id} className="bg-[var(--surface)] p-5 sm:p-6 rounded-[2rem] border border-[var(--border)] shadow-sm hover:border-[#3B82F6]/50 transition-all group animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* Cabeçalho do Card (Mobile e PC integrados) */}
                  <div className="flex flex-row justify-between items-start gap-3 mb-4">
                    
                    {/* Lado Esquerdo: Avatar e Nome */}
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--surface-sec)] rounded-full flex items-center justify-center border border-[var(--border)] overflow-hidden shrink-0 relative shadow-inner">
                        {fb.alunos?.avatar_url ? (
                          <img 
                            src={fb.alunos.avatar_url} 
                            alt={fb.alunos.nome} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FaUser className="text-[var(--text-secondary)] opacity-50 absolute" size={18} />
                        )}
                        {!fb.alunos?.avatar_url && (
                          <span className="font-black text-lg sm:text-xl text-[var(--text-secondary)] relative z-10">
                            {fb.alunos?.nome?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col truncate">
                        <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] tracking-tight truncate">
                          {fb.alunos?.nome || t.unknownStudent}
                        </h3>
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest bg-[#3B82F6]/10 px-2 py-0.5 rounded-md w-max mt-1">
                          {t.student}
                        </span>
                      </div>
                    </div>

                    {/* Lado Direito: Data e Hora */}
                    <div className="flex flex-col items-end gap-1 shrink-0 mt-1 sm:mt-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-secondary)] bg-[var(--surface-sec)] px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-[var(--border)]">
                        <FaClock className="text-[#3B82F6]" size={10} /> {hora}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-[var(--text-secondary)] pr-1">
                        {data}
                      </span>
                    </div>
                  </div>

                  {/* Mensagem do Feedback */}
                  <div className="bg-[var(--surface-sec)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] relative mt-2 sm:mt-3 shadow-inner">
                    <div className="absolute -top-2 left-6 w-4 h-4 bg-[var(--surface-sec)] border-l border-t border-[var(--border)] rotate-45"></div>
                    <p className="relative z-10 text-sm sm:text-base text-[var(--text-primary)] leading-relaxed font-medium">
                      "{fb.observacoes}"
                    </p>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </main>

    </div>
  );
}