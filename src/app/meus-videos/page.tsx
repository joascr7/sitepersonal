'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaVideo, FaPlus, FaCheckCircle, FaExclamationCircle, FaPlayCircle, FaYoutube } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Biblioteca de Vídeos',
    subtitle: 'Gerencie seu acervo de execuções',
    namePlaceholder: 'Nome do Exercício',
    urlPlaceholder: 'Link do Vídeo (YouTube/Shorts)',
    btnAdd: 'Adicionar à Biblioteca',
    processing: 'Processando...',
    statusActive: 'Ativo',
    emptyState: 'Nenhum vídeo cadastrado.',
    errFields: 'Preencha todos os campos.',
    errGeneral: 'Erro ao salvar vídeo: ',
    success: 'Vídeo adicionado com sucesso!'
  },
  'pt-PT': {
    title: 'Biblioteca de Vídeos',
    subtitle: 'Gira o seu acervo de execuções',
    namePlaceholder: 'Nome do Exercício',
    urlPlaceholder: 'Link do Vídeo (YouTube/Shorts)',
    btnAdd: 'Adicionar à Biblioteca',
    processing: 'A processar...',
    statusActive: 'Ativo',
    emptyState: 'Nenhum vídeo registado.',
    errFields: 'Preencha todos os campos.',
    errGeneral: 'Erro ao guardar vídeo: ',
    success: 'Vídeo adicionado com sucesso!'
  },
  'en': {
    title: 'Video Library',
    subtitle: 'Manage your execution collection',
    namePlaceholder: 'Exercise Name',
    urlPlaceholder: 'Video Link (YouTube/Shorts)',
    btnAdd: 'Add to Library',
    processing: 'Processing...',
    statusActive: 'Active',
    emptyState: 'No videos registered.',
    errFields: 'Please fill in all fields.',
    errGeneral: 'Error saving video: ',
    success: 'Video added successfully!'
  }
};

export default function MeusVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [nomeExercicio, setNomeExercicio] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);
    carregarVideos();

    window.addEventListener('storage', updateSettings);
    return () => window.removeEventListener('storage', updateSettings);
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const carregarVideos = async () => {
    // Idealmente com RLS ativado no Supabase, select('*') traz apenas os vídeos do usuário.
    const { data } = await supabase.from('videos_biblioteca').select('*');
    if (data) setVideos(data);
  };

  const salvarVideo = async () => {
    if (!nomeExercicio.trim() || !urlVideo.trim()) {
      showToast(t.errFields, 'error');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('videos_biblioteca').insert({
        exercicio_nome: nomeExercicio.trim(),
        url_video: urlVideo.trim(),
        personal_id: user?.id
      });
      
      if (error) throw error;

      setNomeExercicio('');
      setUrlVideo('');
      await carregarVideos();
      showToast(t.success, 'success');
    } catch (err: any) {
      showToast(t.errGeneral + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center animate-pulse" />
  );

  return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 pb-32 transition-colors duration-500 font-sans antialiased">
      
      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`w-full bg-[var(--surface-sec)] border shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'border-[var(--danger)]/30' : 'border-[var(--success)]/30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
              {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        
        {/* Header Premium */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl flex items-center justify-center shadow-inner">
                <FaVideo className="text-[var(--primary)] text-lg" />
              </div>
              <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">{t.title}</h1>
            </div>
            <p className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-[0.3em]">{t.subtitle}</p>
          </div>
        </header>
        
        {/* Formulário de entrada com estilo Premium */}
        <div className="bg-[var(--surface)]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm mb-10 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <input 
              className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
              placeholder={t.namePlaceholder} 
              value={nomeExercicio} 
              onChange={(e) => setNomeExercicio(e.target.value)} 
              disabled={loading}
            />
            <div className="relative group">
              <FaYoutube className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--primary)] transition-colors text-lg" />
              <input 
                className="w-full pl-12 pr-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
                placeholder={t.urlPlaceholder} 
                value={urlVideo} 
                onChange={(e) => setUrlVideo(e.target.value)} 
                disabled={loading}
              />
            </div>
          </div>
          
          <button 
            onClick={salvarVideo} 
            disabled={loading} 
            className={`w-full mt-6 py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative z-10 ${
              loading 
                ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed' 
                : 'bg-[var(--primary)] text-white hover:brightness-110 shadow-[0_10px_30px_-10px_var(--primary)]'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                {t.processing}
              </div>
            ) : (
              <>
                <FaPlus size={12} /> {t.btnAdd}
              </>
            )}
          </button>
        </div>

        {/* Grid de Vídeos */}
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--surface)]/50 rounded-[2.5rem] border border-[var(--border)] border-dashed animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-sec)] flex items-center justify-center mb-4">
              <FaVideo className="text-2xl text-[var(--text-secondary)]/30" />
            </div>
            <p className="text-[var(--text-secondary)] font-bold text-sm tracking-wide">
              {t.emptyState}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <div 
                key={v.id} 
                className="p-5 sm:p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[1.2rem] flex flex-col justify-between hover:border-[var(--primary)]/50 hover:shadow-[0_10px_30px_-15px_var(--primary)] transition-all duration-300 group cursor-default"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FaPlayCircle size={18} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-[var(--success)]/10 px-2.5 py-1 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)] animate-pulse" />
                    <span className="text-[8px] font-black text-[var(--success)] uppercase tracking-widest">{t.statusActive}</span>
                  </div>
                </div>
                
                <h3 className="font-bold text-[var(--text-primary)] tracking-tight leading-snug line-clamp-2" title={v.exercicio_nome}>
                  {v.exercicio_nome}
                </h3>
                
                {/* Linha sutil separadora */}
                <div className="w-full h-px bg-gradient-to-r from-[var(--border)] to-transparent mt-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
