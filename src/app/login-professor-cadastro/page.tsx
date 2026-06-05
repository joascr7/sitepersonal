'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import TermosModal from '@/components/TermosModal'; // <-- IMPORTADO O MODAL AQUI

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    title: 'Criar sua conta AuraFit',
    namePlaceholder: 'Nome Completo',
    crefPlaceholder: 'CREF (ex: 123456-G/SP)',
    phonePlaceholder: '(00) 00000-0000',
    emailPlaceholder: 'E-mail profissional',
    passwordPlaceholder: 'Senha segura',
    btnSubmit: 'Finalizar Cadastro (10 dias grátis)',
    processing: 'Processando...',
    errFields: 'Preencha os campos obrigatórios corretamente.',
    errCref: 'Formato de CREF inválido. Use: 123456-G/UF',
    success: 'Cadastro realizado! Seu período de 10 dias grátis foi liberado.',
    errGeneral: 'Erro ao processar cadastro: '
  },
  'pt-PT': {
    back: 'Voltar',
    title: 'Criar a sua conta AuraFit',
    namePlaceholder: 'Nome Completo',
    crefPlaceholder: 'Cédula (Opcional)',
    phonePlaceholder: '(00) 00000-0000',
    emailPlaceholder: 'E-mail profissional',
    passwordPlaceholder: 'Palavra-passe segura',
    btnSubmit: 'Finalizar Registo (10 dias grátis)',
    processing: 'A processar...',
    errFields: 'Preencha os campos obrigatórios corretamente.',
    errCref: 'Formato de Cédula inválido.',
    success: 'Registo efetuado! O seu período de 10 dias grátis foi ativado.',
    errGeneral: 'Erro ao processar registo: '
  },
  'en': {
    back: 'Back',
    title: 'Create your AuraFit account',
    namePlaceholder: 'Full Name',
    crefPlaceholder: 'License / ID (Optional)',
    phonePlaceholder: '(00) 00000-0000',
    emailPlaceholder: 'Professional E-mail',
    passwordPlaceholder: 'Secure password',
    btnSubmit: 'Complete Sign Up (10 days free)',
    processing: 'Processing...',
    errFields: 'Please fill in the required fields correctly.',
    errCref: 'Invalid License format.',
    success: 'Registration complete! Your 10-day free trial is now active.',
    errGeneral: 'Error processing registration: '
  }
};

export default function CadastroProfessor() {
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', cref: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const router = useRouter();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ESTADOS DOS TERMOS DE USO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

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

  const formatarTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);
    if (limited.length <= 2) return limited ? `(${limited}` : '';
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handleSignUp = async () => {
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    const regexCref = /^\d{6}-[A-Z]\/[A-Z]{2}$/;

    if (!formData.nome.trim() || !formData.email.trim() || formData.password.length < 6 || telefoneLimpo.length < 10) {
      setMessage({ type: 'error', text: t.errFields });
      return;
    }

    if (formData.cref && !regexCref.test(formData.cref.trim().toUpperCase())) {
      setMessage({ type: 'error', text: t.errCref });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: { data: { nome: formData.nome.trim(), role: 'personal' } }
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: dbError } = await supabase
          .from('personais')
          .insert({
            id: data.user.id,
            nome: formData.nome.trim(),
            cref: formData.cref ? formData.cref.trim().toUpperCase() : null,
            email: formData.email.trim(),
            telefone: `+55${telefoneLimpo}`,
            ativo: true,
            status_pagamento: 'teste',
            // SALVANDO O ACEITE DOS TERMOS NO BANCO DE DADOS AQUI:
            termos_aceitos: true,
            data_aceite_termos: new Date().toISOString()
          });

        if (dbError) throw dbError;
      }

      setMessage({ type: 'success', text: t.success });
      setTimeout(() => router.push('/login-personal'), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.errGeneral });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center animate-pulse" />
  );

  return (
    <main style={themeStyles} className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 relative overflow-hidden transition-colors duration-500 font-sans antialiased">
      
      {/* Luzes de fundo Decorativas Premium */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--primary)]/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-[var(--surface)]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Botão Voltar */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] uppercase tracking-widest mb-10 transition-colors active:scale-95 w-fit"
        >
          <FaArrowLeft size={10} /> {t.back}
        </button>
        
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-8 tracking-tight leading-tight">
          {t.title}
        </h1>
        
        {/* Mensagens de Feedback Premium */}
        {message && (
          <div className={`mb-8 p-4 rounded-[1.2rem] flex items-start gap-3 border backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300 ${
            message.type === 'error' 
              ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' 
              : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
          }`}>
            <div className="mt-0.5 shrink-0">
              {message.type === 'error' ? <FaExclamationCircle size={16} /> : <FaCheckCircle size={16} />}
            </div>
            <p className="text-xs font-bold leading-relaxed">{message.text}</p>
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-4">
          <input 
            className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
            placeholder={t.namePlaceholder} 
            value={formData.nome} 
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            disabled={loading}
          />
          <input 
            className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
            placeholder={t.crefPlaceholder} 
            value={formData.cref} 
            onChange={(e) => setFormData({...formData, cref: e.target.value})}
            disabled={loading}
          />
          <input 
            className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
            placeholder={t.phonePlaceholder} 
            value={formData.telefone} 
            onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})}
            disabled={loading}
          />
          <input 
            type="email" 
            className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
            placeholder={t.emailPlaceholder} 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            disabled={loading}
          />
          <input 
            type="password" 
            className="w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner disabled:opacity-50" 
            placeholder={t.passwordPlaceholder} 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            disabled={loading}
          />
        </div>

        {/* CHECKBOX DOS TERMOS DE USO */}
        <div className="flex items-start gap-3 mt-8 mb-2">
          <input 
            type="checkbox" 
            id="termos"
            checked={aceitouTermos} 
            onChange={(e) => setAceitouTermos(e.target.checked)}
            disabled={loading}
            className="mt-1 w-5 h-5 accent-[var(--primary)] rounded cursor-pointer shrink-0"
          />
          <label htmlFor="termos" className="text-xs text-[var(--text-secondary)] leading-relaxed cursor-pointer font-medium">
            Declaro que li e concordo expressamente com os <button type="button" onClick={(e) => { e.preventDefault(); setModalAberto(true); }} className="text-[var(--primary)] hover:brightness-125 transition-all font-bold underline">Termos de Uso e Isenção de Responsabilidade</button>.
          </label>
        </div>
        
        {/* Botão de Submit bloqueado caso os termos não sejam aceitos */}
        <button 
          onClick={handleSignUp}
          disabled={loading || !aceitouTermos}
          className={`w-full mt-6 py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden ${
            loading || !aceitouTermos
              ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed opacity-70' 
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

      {/* COMPONENTE DO MODAL SENDO RENDERIZADO AQUI */}
      <TermosModal isOpen={modalAberto} onClose={() => setModalAberto(false)} />

    </main>
  );
}