'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaChevronLeft, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaGlobe, 
  FaMoon, 
  FaSun,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    appTitle: 'AURAFIT',
    subtitle: 'Área do Professor',
    emailPlaceholder: 'E-mail',
    passwordPlaceholder: 'Senha',
    show: 'Exibir',
    hide: 'Ocultar',
    forgotPassword: 'Esqueceu a senha?',
    loginBtn: 'Entrar no sistema',
    validating: 'Validando acesso...',
    createAccount: 'Criar nova conta',
    errorIncorrect: 'E-mail ou senha incorretos.',
    errorRestricted: 'Acesso restrito: Você não possui permissão de professor.',
    errorInactive: 'Sua conta está inativa. Entre em contato com o suporte.',
    errorNoEmail: 'Informe seu e-mail para recuperar a senha.',
    successReset: 'Link de recuperação enviado ao seu e-mail!',
    selectLanguage: 'Selecione o Idioma',
    selectTheme: 'Aparência',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  },
  'pt-PT': {
    back: 'Voltar',
    appTitle: 'AURAFIT',
    subtitle: 'Área do Professor',
    emailPlaceholder: 'E-mail',
    passwordPlaceholder: 'Palavra-passe',
    show: 'Mostrar',
    hide: 'Ocultar',
    forgotPassword: 'Esqueceu a palavra-passe?',
    loginBtn: 'Entrar no sistema',
    validating: 'A validar acesso...',
    createAccount: 'Criar nova conta',
    errorIncorrect: 'E-mail ou palavra-passe incorretos.',
    errorRestricted: 'Acesso restrito: Não tem permissão de professor.',
    errorInactive: 'A sua conta está inativa. Contacte o suporte.',
    errorNoEmail: 'Informe o seu e-mail para recuperar a palavra-passe.',
    successReset: 'Link de recuperação enviado para o seu e-mail!',
    selectLanguage: 'Selecione o Idioma',
    selectTheme: 'Aparência',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  },
  'en': {
    back: 'Back',
    appTitle: 'AURAFIT',
    subtitle: 'Trainer Portal',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    show: 'Show',
    hide: 'Hide',
    forgotPassword: 'Forgot password?',
    loginBtn: 'Sign In',
    validating: 'Validating access...',
    createAccount: 'Create new account',
    errorIncorrect: 'Incorrect email or password.',
    errorRestricted: 'Restricted access: You do not have trainer permissions.',
    errorInactive: 'Your account is inactive. Please contact support.',
    errorNoEmail: 'Enter your email to recover your password.',
    successReset: 'Recovery link sent to your email!',
    selectLanguage: 'Select Language',
    selectTheme: 'Appearance',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode'
  }
};

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export default function LoginProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const router = useRouter();

  // Estados de Tema, i18n e Modais
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.signOut();
    
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);

    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  // Handlers dos Modais Premium
  const handleSelectLanguage = (newLang: string) => {
    setLang(newLang as any);
    localStorage.setItem('@premium_lang', newLang);
    window.dispatchEvent(new Event('config-updated'));
    setIsLangModalOpen(false);
  };

  const handleSelectTheme = (theme: 'dark' | 'light') => {
    const newIsDark = theme === 'dark';
    setIsDark(newIsDark);
    localStorage.setItem('@premium_theme', newIsDark ? 'dark' : 'light');
    window.dispatchEvent(new Event('config-updated'));
    setIsThemeModalOpen(false);
  };

  const t = translations[lang] || translations['pt-BR'];

  // Configuração das Variáveis CSS Globais (Design System com Glassmorphism)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': 'rgba(21, 26, 34, 0.65)',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': 'rgba(255, 255, 255, 0.7)',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;

  // Lógica Original Preservada
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsProcessing(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error || !data.user) {
      setMessage({ type: 'error', text: t.errorIncorrect });
      setIsProcessing(false);
      return;
    }

    if (email.trim().toLowerCase() === 'contatojoasvieira6@gmail.com') {
      window.location.href = '/dashboard'; 
      return;
    }

    const { data: personal, error: profileError } = await supabase
      .from('personais')
      .select('id, ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !personal) {
      await supabase.auth.signOut();
      setMessage({ type: 'error', text: t.errorRestricted });
      setIsProcessing(false);
      return;
    }

    if (personal.ativo === false) {
      await supabase.auth.signOut();
      setMessage({ type: 'error', text: t.errorInactive });
      setIsProcessing(false);
      return;
    }

    window.location.href = '/dashboard';
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: t.errorNoEmail });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: t.successReset });
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main 
      style={themeStyles} 
      className="min-h-[100dvh] flex items-center justify-center bg-[var(--bg)] text-[var(--text-primary)] px-5 relative overflow-hidden font-sans transition-colors duration-500 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* ━━━━━━━━━━ ELEMENTOS DE PROFUNDIDADE (BLUR ORBS) ━━━━━━━━━━ */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[450px] h-[120vw] sm:h-[450px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-700" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[350px] h-[100vw] sm:h-[350px] bg-[var(--primary-soft)]/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-700" />
      
      {/* ━━━━━━━━━━ CONTROLES UNIFICADOS (PILL UI) ━━━━━━━━━━ */}
      <div className="absolute top-[max(env(safe-area-inset-top,24px),24px)] right-5 z-40 animate-in fade-in duration-700">
        <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1">
          <button 
            onClick={() => setIsLangModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all active:scale-95"
          >
            <FaGlobe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{lang.split('-')[0]}</span>
          </button>
          
          <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
          
          <button 
            onClick={() => setIsThemeModalOpen(true)} 
            className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 transition-all active:scale-95"
          >
            {isDark ? <FaMoon size={14} /> : <FaSun size={14} />}
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━ CARD PRINCIPAL (GLASSMORPHISM PREMIUM) ━━━━━━━━━━ */}
      <div className="w-full max-w-[380px] bg-[var(--surface)] backdrop-blur-3xl p-8 sm:p-10 rounded-[3rem] border border-[var(--border)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] z-10 animate-in slide-in-from-bottom-8 zoom-in-95 duration-700">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-[0.2em] mb-8 active:scale-95 origin-left"
        >
          <FaChevronLeft size={10} /> {t.back}
        </button>
        
        {/* Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-[var(--text-primary)] mb-1">
            {t.appTitle.replace('FIT', '')}<span className="text-[var(--primary)]">FIT</span>
          </h1>
          <p className="text-[var(--primary)] font-bold text-[10px] tracking-[0.2em] uppercase">{t.subtitle}</p>
        </div>
        
        {/* Notification Toast (In-Card) */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border animate-in slide-in-from-top-2 fade-in ${
            message.type === 'error' 
              ? 'bg-[var(--danger)]/5 text-[var(--danger)] border-[var(--danger)]/20' 
              : 'bg-[var(--success)]/5 text-[var(--success)] border-[var(--success)]/20'
          }`}>
            <div className="shrink-0 mt-0.5">
              {message.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* ━━━━━━━━━━ FORMULÁRIO (Permite tecla Enter) ━━━━━━━━━━ */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input 
              className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-base sm:text-sm text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)] placeholder:font-normal shadow-inner" 
              placeholder={t.emailPlaceholder}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="relative w-full group">
            <input 
              className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-base sm:text-sm text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)] placeholder:font-normal shadow-inner pr-12" 
              type={showPass ? "text" : "password"} 
              placeholder={t.passwordPlaceholder}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button" 
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors active:scale-90"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? t.hide : t.show}
            >
              {showPass ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
          
          <div className="mt-4 mb-8 text-right block">
            <button 
              type="button"
              onClick={handleResetPassword} 
              className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest active:scale-95 origin-right mt-2"
            >
              {t.forgotPassword}
            </button>
          </div>
          
          {/* Actions */}
          <div className="space-y-3 pt-4">
            <button 
              type="submit" 
              disabled={isProcessing || !email || !password}
              className={`w-full py-4 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98] ${
                isProcessing || !email || !password
                  ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed'
                  : 'bg-[var(--primary)] text-white shadow-[0_10px_30px_-10px_var(--primary)] hover:bg-blue-600'
              }`}
            >
              {isProcessing ? t.validating : t.loginBtn}
            </button>
            
            <button 
              type="button"
              onClick={() => router.push('/login-professor-cadastro')} 
              className="w-full bg-[var(--surface-sec)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-4 rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-95"
            >
              {t.createAccount}
            </button>
          </div>
        </form>
      </div>

      {/* ━━━━━━━━━━ MODAIS DE CONFIGURAÇÃO (Fundo Escuro) ━━━━━━━━━━ */}
      {(isLangModalOpen || isThemeModalOpen) && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setIsLangModalOpen(false); setIsThemeModalOpen(false); }} 
          />
          
          <div className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            {/* ━━ CONTEÚDO: IDIOMAS ━━ */}
            {isLangModalOpen && (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                    {t.selectLanguage}
                  </h3>
                  <button 
                    onClick={() => setIsLangModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {languages.map((language) => {
                    const isActive = lang === language.code;
                    return (
                      <button
                        key={language.code}
                        onClick={() => handleSelectLanguage(language.code)}
                        className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                          isActive 
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{language.flag}</span>
                          <span className={`font-bold text-sm ${isActive ? 'text-[var(--primary)]' : ''}`}>
                            {language.name}
                          </span>
                        </div>
                        {isActive && <FaCheck className="text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ━━ CONTEÚDO: TEMA ━━ */}
            {isThemeModalOpen && (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                    {t.selectTheme}
                  </h3>
                  <button 
                    onClick={() => setIsThemeModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Botão Claro */}
                  <button
                    onClick={() => handleSelectTheme('light')}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      !isDark 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                        <FaSun size={16} />
                      </div>
                      <span className={`font-bold text-sm ${!isDark ? 'text-[var(--primary)]' : ''}`}>
                        {t.themeLight}
                      </span>
                    </div>
                    {!isDark && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                  
                  {/* Botão Escuro */}
                  <button
                    onClick={() => handleSelectTheme('dark')}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      isDark 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                        <FaMoon size={16} />
                      </div>
                      <span className={`font-bold text-sm ${isDark ? 'text-[var(--primary)]' : ''}`}>
                        {t.themeDark}
                      </span>
                    </div>
                    {isDark && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                </div>
              </>
            )}
            
            {/* Indicador de Swipe Mobile (Trancinho) */}
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}
    </main>
  );
}
