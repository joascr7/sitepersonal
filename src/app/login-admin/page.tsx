'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaShieldAlt, FaExclamationCircle } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'AURAFIT',
    subtitle: 'Painel Administrativo — Nível Root',
    emailPlaceholder: 'E-mail administrador',
    passwordPlaceholder: 'Senha de segurança',
    btnSubmit: 'Autenticar Acesso',
    processing: 'Validando...',
    errCredentials: 'Credenciais inválidas.',
    errDenied: 'Acesso negado: Você não possui privilégios administrativos.',
    footer: 'Ambiente restrito — Protocolo 2026-A'
  },
  'pt-PT': {
    title: 'AURAFIT',
    subtitle: 'Painel Administrativo — Nível Root',
    emailPlaceholder: 'E-mail administrador',
    passwordPlaceholder: 'Palavra-passe de segurança',
    btnSubmit: 'Autenticar Acesso',
    processing: 'A validar...',
    errCredentials: 'Credenciais inválidas.',
    errDenied: 'Acesso negado: Não possui privilégios administrativos.',
    footer: 'Ambiente restrito — Protocolo 2026-A'
  },
  'en': {
    title: 'AURAFIT',
    subtitle: 'Administrative Panel — Root Level',
    emailPlaceholder: 'Admin E-mail',
    passwordPlaceholder: 'Security password',
    btnSubmit: 'Authenticate Access',
    processing: 'Validating...',
    errCredentials: 'Invalid credentials.',
    errDenied: 'Access denied: You do not have administrative privileges.',
    footer: 'Restricted environment — Protocol 2026-A'
  }
};

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);
  const router = useRouter();

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
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const ADMIN_EMAILS = ['contatojoasvieira6@gmail.com', 'admin@aurafit.com'];

  const showToast = (message: string) => {
    setToast({ message, type: 'error' });
    setTimeout(() => setToast(null), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setToast(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      showToast(t.errCredentials);
      setIsProcessing(false);
      return;
    }

    if (data.user && ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '')) {
      router.push('/admin/financeiro');
    } else {
      showToast(t.errDenied);
      await supabase.auth.signOut();
      setIsProcessing(false);
    }
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center animate-pulse" />
  );

  return (
    <main style={themeStyles} className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 relative overflow-hidden transition-colors duration-500 font-sans antialiased">
      
      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[var(--surface-sec)] border border-[var(--danger)]/30 shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl w-full">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--danger)]/10 text-[var(--danger)]">
              <FaExclamationCircle />
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Elementos de background para atmosfera de controle (Adaptados ao Tema) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header do Login */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <FaShieldAlt className="text-3xl text-[var(--primary)]" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter mb-2">{t.title}</h1>
          <p className="text-[var(--primary)] font-bold text-[10px] uppercase tracking-[0.3em]">{t.subtitle}</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="bg-[var(--surface)]/90 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          <div className="space-y-4 mb-8">
            <input 
              type="email" 
              placeholder={t.emailPlaceholder} 
              className="w-full bg-[var(--surface-sec)] border border-[var(--border)] text-[var(--text-primary)] px-5 py-4 rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-sm font-bold placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner" 
              onChange={e => setEmail(e.target.value)} 
              disabled={isProcessing}
            />
            <input 
              type="password" 
              placeholder={t.passwordPlaceholder} 
              className="w-full bg-[var(--surface-sec)] border border-[var(--border)] text-[var(--text-primary)] px-5 py-4 rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-sm font-bold placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner" 
              onChange={e => setPassword(e.target.value)} 
              disabled={isProcessing}
            />
          </div>
          
          <button 
            disabled={isProcessing}
            className={`w-full py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden ${
              isProcessing 
                ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed' 
                : 'bg-[var(--primary)] text-white hover:brightness-110 shadow-[0_10px_30px_-10px_var(--primary)]'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                {t.processing}
              </div>
            ) : (
              t.btnSubmit
            )}
          </button>
        </form>

        <p className="text-center mt-10 text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em]">
          {t.footer}
        </p>
      </div>
    </main>
  );
}