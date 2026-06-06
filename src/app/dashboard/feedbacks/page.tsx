'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaSearch, FaArrowLeft, FaCommentDots, FaClock, FaUser, FaChevronDown } from 'react-icons/fa';

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
    back: 'Voltar',
    title: 'Feedbacks dos Alunos',
    subtitle: 'Acompanhe as avaliações recentes dos treinos.',
    searchPlaceholder: 'Pesquisar por aluno...',
    emptyState: 'Nenhum feedback encontrado no histórico.',
    student: 'Aluno',
    unknownStudent: 'Aluno Desconhecido',
    loading: 'Carregando histórico...',
    loadMore: 'Carregar mais históricos'
  },
  'pt-PT': {
    back: 'Voltar',
    title: 'Feedbacks dos Alunos',
    subtitle: 'Acompanhe as avaliações recentes dos treinos.',
    searchPlaceholder: 'Procurar por aluno...',
    emptyState: 'Nenhum feedback encontrado no histórico.',
    student: 'Aluno',
    unknownStudent: 'Aluno Desconhecido',
    loading: 'A carregar histórico...',
    loadMore: 'Carregar mais históricos'
  },
  'en': {
    back: 'Back',
    title: 'Student Feedbacks',
    subtitle: 'Track recent workout evaluations.',
    searchPlaceholder: 'Search by student...',
    emptyState: 'No feedback found in history.',
    student: 'Student',
    unknownStudent: 'Unknown Student',
    loading: 'Loading history...',
    loadMore: 'Load more history'
  }
};

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  
  // Limite de exibição para não poluir a tela (Paginação simples)
  const [itensVisiveis, setItensVisiveis] = useState(10);
  
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

      // Busca os feedbacks mais recentes (limite de 100 para evitar travamentos)
      const { data, error } = await supabase
        .from('feedbacks_treino')
        .select(`
          id,
          observacoes,
          data_criacao,
          aluno_id,
          alunos ( nome, avatar_url )
        `)
        .eq('personal_id', personalId)
        .order('data_criacao', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) setFeedbacks(data as any);
    } catch (error: any) {
      console.error("Erro ao buscar feedbacks:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  // Filtra e limita a quantidade de itens na tela
  const feedbacksFiltrados = useMemo(() => {
    return feedbacks.filter(fb => 
      fb.alunos?.nome?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [feedbacks, busca]);

  const feedbacksExibidos = feedbacksFiltrados.slice(0, itensVisiveis);

  const carregarMais = () => {
    setItensVisiveis(prev => prev + 10);
  };

  const formatarDataHora = (isoString: string) => {
    const data = new Date(isoString);
    const locale = lang === 'en' ? 'en-US' : 'pt-BR';
    return {
      data: data.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: data.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div style={themeStyles} className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center text-[var(--text-primary)]">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_10px_var(--primary)]"></div>
        <p className="font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div style={themeStyles} className="w-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans pb-12">
      
      {/* ━━━━━━━━━━ HEADER PREMIUM (Mais enxuto) ━━━━━━━━━━ */}
      <header className="bg-gradient-to-b from-[#151E2E] to-[#1C283F] text-white pt-[max(env(safe-area-inset-top),1.5rem)] pb-8 px-5 sm:px-8 relative shadow-lg flex flex-col items-center text-center">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="absolute top-[max(env(safe-area-inset-top),1.5rem)] left-5 flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 uppercase tracking-widest"
          aria-label={t.back}
        >
          <FaArrowLeft size={12} /> {t.back}
        </button>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-6 flex items-center gap-3">
          <FaCommentDots className="text-blue-400" size={20} />
          {t.title}
        </h1>
        <p className="text-slate-400 text-xs mt-1 font-medium max-w-xs sm:max-w-md">
          {t.subtitle}
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
        
        {/* ━━━━━━━━━━ BARRA DE PESQUISA COMPACTA ━━━━━━━━━━ */}
        <div className="bg-[var(--surface)] px-4 py-1.5 rounded-2xl shadow-sm border border-[var(--border)] mb-6 flex items-center transition-all focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)]">
          <FaSearch size={14} className="text-[var(--text-secondary)] mr-3 shrink-0" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setItensVisiveis(10); // Reseta a paginação ao buscar
            }}
            className="w-full bg-transparent py-2 outline-none text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>

        {/* ━━━━━━━━━━ LISTA DE FEEDBACKS (Design Limpo) ━━━━━━━━━━ */}
        <div className="space-y-3">
          {feedbacksExibidos.length === 0 ? (
            <div className="bg-[var(--surface)] py-12 rounded-2xl border border-[var(--border)] text-center flex flex-col items-center justify-center">
              <FaCommentDots size={24} className="text-[var(--text-secondary)] opacity-30 mb-3" />
              <p className="text-[var(--text-secondary)] font-medium text-sm">{t.emptyState}</p>
            </div>
          ) : (
            feedbacksExibidos.map((fb) => {
              const { data, hora } = formatarDataHora(fb.data_criacao);
              
              return (
                <div key={fb.id} className="bg-[var(--surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--surface-sec)] transition-all group animate-in fade-in slide-in-from-bottom-2">
                  
                  <div className="flex justify-between items-start gap-4">
                    {/* Avatar e Infos */}
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-[var(--surface-sec)] rounded-full flex items-center justify-center border border-[var(--border)] overflow-hidden shrink-0 shadow-inner">
                        {fb.alunos?.avatar_url ? (
                          <img 
                            src={fb.alunos.avatar_url} 
                            alt={fb.alunos.nome} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <FaUser className="text-[var(--text-secondary)] opacity-50" size={14} />
                        )}
                        {!fb.alunos?.avatar_url && (
                          <span className="font-bold text-sm text-[var(--text-secondary)] absolute">
                            {fb.alunos?.nome?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col truncate">
                        <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">
                          {fb.alunos?.nome || t.unknownStudent}
                        </h3>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                          {data} • {hora}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Texto do Feedback (Sem balões gigantes) */}
                  <div className="mt-3 pl-[3.25rem]">
                    <p className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors leading-relaxed">
                      "{fb.observacoes}"
                    </p>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ━━━━━━━━━━ BOTÃO CARREGAR MAIS ━━━━━━━━━━ */}
        {feedbacksFiltrados.length > itensVisiveis && (
          <div className="mt-6 flex justify-center pb-8">
            <button 
              onClick={carregarMais}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] rounded-full text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm"
            >
              <FaChevronDown size={10} />
              {t.loadMore}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}