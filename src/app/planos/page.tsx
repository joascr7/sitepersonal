'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { getPurchases } from '@/services/subscription';
import { FaApple, FaGooglePlay, FaCrown, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'AuraFit Pro',
    subtitle: 'Assine pelo app para gerenciar sua consultoria com total liberdade.',
    btnSubmit: 'Assinar via App',
    processing: 'Processando...',
    availableIn: 'Disponível em',
    errMobileOnly: 'Por favor, realize a assinatura diretamente pelo nosso aplicativo mobile.',
    errLogin: 'Faça login para continuar.',
    errNoPlan: 'Nenhum plano disponível no momento.',
    errProcess: 'Houve um erro no processo de assinatura. Tente novamente pelo App.'
  },
  'pt-PT': {
    title: 'AuraFit Pro',
    subtitle: 'Assine pela aplicação para gerir a sua consultoria com total liberdade.',
    btnSubmit: 'Assinar via App',
    processing: 'A processar...',
    availableIn: 'Disponível em',
    errMobileOnly: 'Por favor, efetue a subscrição diretamente na nossa aplicação móvel.',
    errLogin: 'Inicie sessão para continuar.',
    errNoPlan: 'Nenhum plano disponível de momento.',
    errProcess: 'Ocorreu um erro no processo de subscrição. Tente novamente pela App.'
  },
  'en': {
    title: 'AuraFit Pro',
    subtitle: 'Subscribe through the app to manage your consulting with total freedom.',
    btnSubmit: 'Subscribe via App',
    processing: 'Processing...',
    availableIn: 'Available on',
    errMobileOnly: 'Please subscribe directly through our mobile application.',
    errLogin: 'Please log in to continue.',
    errNoPlan: 'No plans available at the moment.',
    errProcess: 'There was an error in the subscription process. Please try again via the App.'
  }
};

export default function EscolherPlano() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
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

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAssinar = async () => {
    setIsProcessing(true);
    setToast(null);

    try {
      // 1. Obter instância do SDK de forma segura
      const Purchases = await getPurchases();
      if (!Purchases) {
        showToast(t.errMobileOnly, 'error');
        setIsProcessing(false);
        return;
      }

      // 2. Verificar usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast(t.errLogin, 'error');
        setIsProcessing(false);
        return;
      }

      // 3. Conectar e buscar ofertas
      await Purchases.logIn(user.id);
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current?.monthly) {
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.monthly);
        
        if (customerInfo.entitlements.active["pro_access"]) {
          router.push('/dashboard');
        }
      } else {
        showToast(t.errNoPlan, 'error');
      }
    } catch (e: any) {
      console.error("Erro na compra:", e);
      showToast(t.errProcess, 'error');
    } finally {
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
          <div className={`w-full bg-[var(--surface-sec)] border shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'border-[var(--danger)]/30' : 'border-[var(--success)]/30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
              {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Luzes de fundo Decorativas Premium */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--primary)]/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative max-w-sm w-full bg-[var(--surface)]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10 animate-in fade-in zoom-in-95 duration-500 text-center">
        
        {/* Ícone Decorativo Premium */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl flex items-center justify-center shadow-inner">
            <FaCrown className="text-3xl text-[var(--primary)]" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm font-bold text-[var(--text-secondary)] mb-10 leading-relaxed">
          {t.subtitle}
        </p>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAssinar}
          disabled={isProcessing}
          className={`w-full py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden ${
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
        </motion.button>

        <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col gap-4">
          <p className="text-[var(--text-secondary)] text-[10px] text-center font-black uppercase tracking-widest">
            {t.availableIn}
          </p>
          <div className="flex gap-4">
            <a 
              href="https://apps.apple.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[var(--surface-sec)] border border-[var(--border)] py-3 rounded-2xl text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-300 active:scale-95 group"
            >
              <FaApple className="text-xl group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-wider">App Store</span>
            </a>
            <a 
              href="https://play.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[var(--surface-sec)] border border-[var(--border)] py-3 rounded-2xl text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all duration-300 active:scale-95 group"
            >
              <FaGooglePlay className="text-xl group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-wider">Google Play</span>
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}