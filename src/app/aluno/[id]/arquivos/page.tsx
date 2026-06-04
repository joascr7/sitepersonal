'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaFilePdf, 
  FaTrash, 
  FaCloudUploadAlt, 
  FaDownload,
  FaChevronLeft,
  FaMoon,
  FaSun,
  FaGlobe,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Documentos',
    subtitle: 'Gestão de Exames e Atestados',
    back: 'Voltar',
    selectFile: 'Selecionar PDF',
    uploading: 'Enviando...',
    loading: 'Carregando arquivos...',
    empty: 'Nenhum arquivo enviado.',
    uploadSuccess: 'Arquivo enviado com sucesso!',
    uploadError: 'Erro ao enviar: ',
    deleteConfirm: 'Tem certeza que deseja excluir este arquivo?',
    deleteError: 'Erro ao excluir arquivo.'
  },
  'pt-PT': {
    title: 'Documentos',
    subtitle: 'Gestão de Exames e Atestados',
    back: 'Voltar',
    selectFile: 'Selecionar PDF',
    uploading: 'A enviar...',
    loading: 'A carregar ficheiros...',
    empty: 'Nenhum ficheiro enviado.',
    uploadSuccess: 'Ficheiro enviado com sucesso!',
    uploadError: 'Erro ao enviar: ',
    deleteConfirm: 'Tem a certeza que deseja excluir este ficheiro?',
    deleteError: 'Erro ao excluir ficheiro.'
  },
  'en': {
    title: 'Documents',
    subtitle: 'Exams and Certificates Management',
    back: 'Back',
    selectFile: 'Select PDF',
    uploading: 'Uploading...',
    loading: 'Loading files...',
    empty: 'No files uploaded.',
    uploadSuccess: 'File uploaded successfully!',
    uploadError: 'Error uploading: ',
    deleteConfirm: 'Are you sure you want to delete this file?',
    deleteError: 'Error deleting file.'
  }
};

export default function ArquivosAluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Estados de Tema, i18n e Notificações
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
  };

  const toggleLang = () => {
    const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem('@premium_lang', nextLang);
  };

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--success': '#22C55E',
    '--danger': '#EF4444',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--success': '#16A34A',
    '--danger': '#DC2626',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const carregarArquivos = async () => {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('aluno_id', id)
      .order('created_at', { ascending: false });

    if (!error) setArquivos(data || []);
    setLoading(false);
  };

  useEffect(() => { carregarArquivos(); }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${id}/${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage.from('documentos-alunos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('documentos').insert({
        aluno_id: id,
        url: filePath,
        nome_arquivo: file.name
      });

      if (dbError) throw dbError;
      showToast(t.uploadSuccess, 'success');
      carregarArquivos();
    } catch (err: any) { 
      showToast(t.uploadError + err.message, 'error'); 
    } finally { 
      setUploading(false); 
      // Resetar o input file para permitir o upload do mesmo arquivo novamente se necessário
      e.target.value = '';
    }
  };

  const deletarArquivo = async (fileId: string, url: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await supabase.storage.from('documentos-alunos').remove([url]);
      await supabase.from('documentos').delete().eq('id', fileId);
      carregarArquivos();
    } catch (err) { 
      showToast(t.deleteError, 'error'); 
    }
  };

  return (
    <main 
      style={themeStyles} 
      className="min-h-screen w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[env(safe-area-inset-bottom)] px-4"
    >
      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
      {toast && (
        <div className="fixed top-[max(env(safe-area-inset-top,20px),20px)] left-4 right-4 z-[9999] flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`bg-[var(--surface-sec)] border shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'border-[var(--danger)]/30' : 'border-[var(--success)]/30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
              {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto pb-32">
        
        {/* ━━━━━━━━━━ HEADER COMPACTO ━━━━━━━━━━ */}
        <header className="flex justify-between items-center mb-8 pt-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface)] px-4 py-2.5 rounded-full border border-[var(--border)] active:scale-95 transition-all shadow-sm"
          >
            <FaChevronLeft size={10} /> {t.back}
          </button>
          
          <div className="flex bg-[var(--surface)] rounded-full border border-[var(--border)] p-1 shadow-sm">
            <button onClick={toggleLang} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
              <FaGlobe size={14} />
            </button>
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>
        </header>

        {/* ━━━━━━━━━━ TÍTULO ━━━━━━━━━━ */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight leading-tight">{t.title}</h1>
          <p className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-80"></span>
            {t.subtitle}
          </p>
        </div>

        {/* ━━━━━━━━━━ ÁREA DE UPLOAD ━━━━━━━━━━ */}
        <div className="relative group mb-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative bg-[var(--surface)] p-8 sm:p-10 rounded-[2.5rem] border-2 border-dashed border-[var(--border)] text-center transition-all duration-300 group-hover:border-[var(--primary)]/50 shadow-sm flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--primary)] text-3xl mb-2 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <FaCloudUploadAlt />
            </div>
            
            <label className={`cursor-pointer inline-flex items-center justify-center text-white px-8 py-4 rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest transition-all duration-300 transform active:scale-95 shadow-[0_10px_30px_-10px_var(--primary)] ${uploading ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border)] shadow-none' : 'bg-[var(--primary)] hover:bg-blue-600'}`}>
              {uploading ? t.uploading : t.selectFile}
              <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* ━━━━━━━━━━ LISTA DE ARQUIVOS ━━━━━━━━━━ */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 w-full bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)]" />
              ))}
            </div>
          ) : arquivos.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[2rem]">
              <FaFilePdf className="text-4xl text-[var(--text-secondary)]/30 mb-4" />
              <p className="text-[11px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">{t.empty}</p>
            </div>
          ) : (
            arquivos.map((arq) => (
              <div 
                key={arq.id} 
                className="flex items-center justify-between p-5 bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all duration-300 shadow-sm group"
              >
                <div className="flex items-center gap-4 overflow-hidden pr-4">
                  <div className="w-12 h-12 rounded-[1rem] bg-[var(--surface-sec)] flex items-center justify-center text-[var(--primary)] text-xl shrink-0 group-hover:bg-[var(--primary)]/10 transition-colors">
                    <FaFilePdf />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-[var(--text-primary)] text-sm truncate w-full">{arq.nome_arquivo}</span>
                    <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">Documento PDF</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      const { data } = supabase.storage.from('documentos-alunos').getPublicUrl(arq.url);
                      window.open(data.publicUrl, '_blank');
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors active:scale-90"
                    aria-label="Download"
                  >
                    <FaDownload size={14} />
                  </button>
                  <button 
                    onClick={() => deletarArquivo(arq.id, arq.url)} 
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface-sec)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors active:scale-90"
                    aria-label="Delete"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ESPAÇADOR DE SEGURANÇA (Garante que o scroll passe da navbar inferior) */}
        <div className="h-40 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}