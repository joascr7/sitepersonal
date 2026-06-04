'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaExclamationCircle, FaLock } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Redefinir senha',
    subtitle: 'Digite sua nova senha de acesso.',
    placeholder: 'Nova senha',
    btnSubmit: 'Atualizar Senha',
    processing: 'Atualizando...',
    errLength: 'A senha deve ter pelo menos 6 caracteres.',
    errGeneral: 'Erro ao atualizar: ',
    success: 'Senha alterada com sucesso!'
  },
  'pt-PT': {
    title: 'Repor palavra-passe',
    subtitle: 'Introduza a sua nova palavra-passe de acesso.',
    placeholder: 'Nova palavra-passe',
    btnSubmit: 'Atualizar Palavra-passe',
    processing: 'A atualizar...',
    errLength: 'A palavra-passe deve ter pelo menos 6 caracteres.',
    errGeneral: 'Erro ao atualizar: ',
    success: 'Palavra-passe alterada com sucesso!'
  },
  'en': {
    title: 'Reset Password',
    subtitle: 'Enter your new access password.',
    placeholder: 'New password',
    btnSubmit: 'Update Password',
    processing: 'Updating...',
    errLength: 'Password must be at least 6 characters.',
    errGeneral: 'Error updating: ',
    success: 'Password changed successfully!'
  }
};

export default function NovaSenha() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
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

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      showToast(t.errLength, 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    
    if (error) {
      showToast(t.errGeneral + error.message, 'error');
      setLoading(false);
    } else {
      showToast(t.success, 'success');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center animate-pulse" />
  );

  return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 font-sans antialiased">
      
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

      {/* Luz de foco para destacar a ação central */}
      <div className="absolute w-[400px] h-[400px] bg-[var(--primary)]/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="bg-[var(--surface)]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm w-full max-w-sm text-center z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Ícone Decorativo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl flex items-center justify-center shadow-inner">
            <FaLock className="text-2xl text-[var(--primary)]" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
          {t.title}
        </h1>
        <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest mb-8">
          {t.subtitle}
        </p>
        
        <input 
          type="password" 
          className="w-full px-5 py-4 mb-8 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
          placeholder={t.placeholder} 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          disabled={loading}
        />
        
        <button 
          onClick={handleUpdatePassword} 
          disabled={loading}
          className={`w-full py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden ${
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
            t.btnSubmit
          )}
        </button>
      </div>

      {/* Espaçador para garantir que o teclado mobile não oculte o botão */}
      <div className="h-10 w-full shrink-0" aria-hidden="true" />
    </main>
  );
}
