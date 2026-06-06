'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../actions/aluno';
import { FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, FaCheckCircle, FaChevronDown } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    title: 'Adicionar Aluno',
    subtitle: 'Preencha os dados do novo membro',
    access: 'Acesso',
    profile: 'Perfil',
    email: 'E-mail',
    emailPlaceholder: 'aluno@email.com',
    password: 'Senha',
    passwordPlaceholder: '••••••••',
    name: 'Nome Completo',
    namePlaceholder: 'Nome do aluno',
    phone: 'WhatsApp',
    phonePlaceholder: '(00) 00000-0000',
    dob: 'Data de Nascimento',
    gender: 'Sexo',
    genderSelect: 'Selecione...',
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outros',
    modality: 'Modalidade',
    modalitySelect: 'Selecione...',
    online: 'Online',
    inPerson: 'Presencial',
    dueDate: 'Vencimento',
    submit: 'Confirmar Cadastro',
    loading: 'Cadastrando...',
    errSession: 'Sessão expirada.',
    errDefault: 'Erro ao cadastrar',
  },
  'pt-PT': {
    back: 'Voltar',
    title: 'Adicionar Aluno',
    subtitle: 'Preencha os dados do novo membro',
    access: 'Acesso',
    profile: 'Perfil',
    email: 'E-mail',
    emailPlaceholder: 'aluno@email.com',
    password: 'Palavra-passe',
    passwordPlaceholder: '••••••••',
    name: 'Nome Completo',
    namePlaceholder: 'Nome do aluno',
    phone: 'WhatsApp',
    phonePlaceholder: '(00) 00000-0000',
    dob: 'Data de Nasc.',
    gender: 'Género',
    genderSelect: 'Selecione...',
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outros',
    modality: 'Modalidade',
    modalitySelect: 'Selecione...',
    online: 'Online',
    inPerson: 'Presencial',
    dueDate: 'Vencimento',
    submit: 'Confirmar Registo',
    loading: 'A registar...',
    errSession: 'Sessão expirada.',
    errDefault: 'Erro ao registar',
  },
  'en': {
    back: 'Back',
    title: 'Add Student',
    subtitle: 'Fill in the new member details',
    access: 'Access',
    profile: 'Profile',
    email: 'Email',
    emailPlaceholder: 'student@email.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    name: 'Full Name',
    namePlaceholder: 'Student name',
    phone: 'WhatsApp',
    phonePlaceholder: '(00) 00000-0000',
    dob: 'Date of Birth',
    gender: 'Gender',
    genderSelect: 'Select...',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    modality: 'Modality',
    modalitySelect: 'Select...',
    online: 'Online',
    inPerson: 'In-person',
    dueDate: 'Due Date',
    submit: 'Confirm Registration',
    loading: 'Registering...',
    errSession: 'Session expired.',
    errDefault: 'Error registering',
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES DE INPUT PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const InputField = ({ label, name, value, onChange, type = "text", placeholder, autoComplete }: any) => (
  <div className="flex flex-col gap-2 w-full min-w-0 group">
    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 truncate group-focus-within:text-[var(--primary)] transition-colors">
      {label}
    </label>
    <input 
      name={name}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="block w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:font-medium box-border shadow-inner"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, defaultOption }: any) => (
  <div className="flex flex-col gap-2 w-full min-w-0 group">
    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 truncate group-focus-within:text-[var(--primary)] transition-colors">
      {label}
    </label>
    <div className="relative">
      <select 
        name={name}
        value={value}
        onChange={onChange}
        className="block w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] appearance-none cursor-pointer shadow-inner"
      >
        <option value="" disabled className="text-[var(--text-secondary)]">{defaultOption}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--surface)] text-[var(--text-primary)]">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[var(--text-secondary)]">
        <FaChevronDown size={12} />
      </div>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PÁGINA PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function AdicionarAluno() {
  const [formData, setFormData] = useState({
    nome: '', 
    email: '', 
    password: '', 
    telefone: '', 
    dataNascimento: '', 
    sexo: '', 
    modalidade: '', 
    dataVencimento: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
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

  const t = translations[lang] || translations['pt-BR'];

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const formatarTelefone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'telefone' ? formatarTelefone(value) : value
    }));
  };

  const handleAddAluno = async () => {
    if (!formData.nome.trim() || !formData.email.trim() || !formData.password) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t.errSession);

      const result = await cadastrarAlunoAction({
        ...formData,
        telefone: formData.telefone.replace(/\D/g, '') // Envia apenas os números
      }, session.user.id);

      if (result.error) throw new Error(result.error);
      router.push('/dashboard');
    } catch (err: any) {
      showToast('error', err.message || t.errDefault);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] flex flex-col items-center px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] box-border text-[var(--text-primary)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Elementos de Profundidade (Orbs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[350px] h-[100vw] sm:h-[350px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Toast Flutuante */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* Toggles Superiores */}
      <div className="w-full max-w-lg flex justify-end gap-2 mb-6 relative z-10">
        <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
          <FaGlobe size={14} />
          <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
        </button>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
          {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>
      </div>
      
      <div className="w-full max-w-lg bg-[var(--surface)]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-2xl box-border relative z-10 animate-in slide-in-from-bottom-8 duration-700">
        
        <header className="mb-10 flex flex-col gap-4">
          <button 
            onClick={() => router.back()} 
            className="self-start flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-[0.2em] active:scale-95"
          >
            <FaChevronLeft size={10} /> {t.back}
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)]">{t.title}</h1>
            <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">{t.subtitle}</p>
          </div>
        </header>
        
        <div className="space-y-8">
          
          {/* SESSÃO: ACESSO */}
          <section className="space-y-4">
            <h2 className="text-[9px] font-black uppercase text-[var(--primary)] tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> {t.access}
            </h2>
            <InputField label={t.email} name="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} placeholder={t.emailPlaceholder} />
            <InputField label={t.password} name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleInputChange} placeholder={t.passwordPlaceholder} />
          </section>

          <div className="h-px w-full bg-[var(--border)]" />

          {/* SESSÃO: PERFIL */}
          <section className="space-y-4">
            <h2 className="text-[9px] font-black uppercase text-[var(--primary)] tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span> {t.profile}
            </h2>
            
            <InputField label={t.name} name="nome" autoComplete="name" value={formData.nome} onChange={handleInputChange} placeholder={t.namePlaceholder} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label={t.phone} name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} placeholder={t.phonePlaceholder} />
              <InputField label={t.dob} name="dataNascimento" type="date" value={formData.dataNascimento} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField 
                label={t.gender} 
                name="sexo" 
                value={formData.sexo} 
                onChange={handleInputChange} 
                defaultOption={t.genderSelect}
                options={[
                  { value: 'masculino', label: t.male },
                  { value: 'feminino', label: t.female },
                  { value: 'outros', label: t.other }
                ]} 
              />
              <SelectField 
                label={t.modality} 
                name="modalidade" 
                value={formData.modalidade} 
                onChange={handleInputChange} 
                defaultOption={t.modalitySelect}
                options={[
                  { value: 'online', label: t.online },
                  { value: 'presencial', label: t.inPerson }
                ]} 
              />
            </div>
            
            <InputField label={t.dueDate} name="dataVencimento" type="date" value={formData.dataVencimento} onChange={handleInputChange} />
          </section>
        </div>

        <button 
          onClick={handleAddAluno}
          disabled={loading || !formData.nome.trim() || !formData.email.trim() || !formData.password}
          className="w-full mt-10 bg-[var(--primary)] text-white py-5 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
        >
          {loading ? t.loading : t.submit}
        </button>

      </div>
    </main>
  );
}