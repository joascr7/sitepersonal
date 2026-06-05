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
  FaSun 
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
    successReset: 'Link de recuperação enviado ao seu e-mail!'
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
    successReset: 'Link de recuperação enviado para o seu e-mail!'
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
    successReset: 'Recovery link sent to your email!'
  }
};

export default function LoginProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const router = useRouter();

  // Estados de Tema e i18n
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    supabase.auth.signOut();
    
    // Inicialização do Tema e Idioma
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const toggleLang = () => {
    const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem('@premium_lang', nextLang);
  };

  const t = translations[lang];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
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
    '--primary-soft': '#60A5FA',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  // Lógica Original Preservada
  const handleLogin = async () => {
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
      
      {/* ━━━━━━━━━━ TOGGLES (THEME / LANG) ━━━━━━━━━━ */}
      <div className="absolute top-[max(env(safe-area-inset-top,20px),20px)] right-5 z-50 flex gap-2 animate-in fade-in duration-700">
        {/* Adicionado a classe relative neste botão */}
        <button onClick={toggleLang} className="relative w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95" aria-label="Language">
          <FaGlobe size={16} />
          <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
        </button>
        {/* Adicionado a classe relative neste botão */}
        <button onClick={toggleTheme} className="relative w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95" aria-label="Theme">
          {isDark ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>
      </div>

      {/* ━━━━━━━━━━ CARD PRINCIPAL (GLASSMORPHISM) ━━━━━━━━━━ */}
      <div className="w-full max-w-[360px] bg-[var(--surface)]/80 backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10 animate-in slide-in-from-bottom-8 zoom-in-95 duration-700">
        
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

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="relative">
            <input 
              className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all duration-300 text-base sm:text-sm text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)] placeholder:font-normal shadow-inner" 
              placeholder={t.emailPlaceholder}
              type="email"
              autoCapitalize="none"
              autoComplete="email"
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
        </div>
        
        {/* Forgot Password Link */}
        <div className="mt-4 mb-8 text-right">
          <button 
            type="button"
            onClick={handleResetPassword} 
            className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest active:scale-95 origin-right"
          >
            {t.forgotPassword}
          </button>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={handleLogin} 
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
            onClick={() => router.push('/login-professor-cadastro')} 
            className="w-full bg-[var(--surface-sec)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-4 rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-95"
          >
            {t.createAccount}
          </button>
        </div>
      </div>
    </main>
  );
}