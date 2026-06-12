'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaSignOutAlt, 
  FaChevronLeft, 
  FaMoon, 
  FaSun, 
  FaGlobe, 
  FaCamera, 
  FaUserShield, 
  FaUserEdit,
  FaCheckCircle,
  FaExclamationCircle,
  FaChevronDown,
  FaLock,
  FaCheck,
  FaTimes
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES DE INPUT PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const InputField = ({ label, name, value, onChange, type = "text", placeholder, autoComplete, disabled = false, icon: Icon }: any) => (
  <div className="flex flex-col gap-1.5 w-full min-w-0 group">
    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 truncate group-focus-within:text-[var(--primary)] transition-colors flex items-center gap-1.5">
      {Icon && <Icon size={10} />}
      {label}
    </label>
    <div className="w-full min-w-0 relative">
      <input 
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full max-w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none transition-all text-sm font-bold box-border appearance-none m-0 shadow-inner ${
          disabled 
            ? 'text-[var(--text-secondary)] opacity-60 cursor-not-allowed' 
            : 'text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:font-medium focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10'
        }`}
      />
    </div>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, defaultOption }: any) => (
  <div className="flex flex-col gap-1.5 w-full min-w-0 group">
    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 truncate group-focus-within:text-[var(--primary)] transition-colors">
      {label}
    </label>
    <div className="relative w-full min-w-0">
      <select 
        name={name}
        value={value}
        onChange={onChange}
        className="block w-full max-w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-sm font-bold text-[var(--text-primary)] appearance-none cursor-pointer box-border m-0 shadow-inner"
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
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    title: 'Meu Perfil',
    changePhoto: 'Trocar foto',
    uploading: 'Enviando...',
    tabData: 'Dados',
    tabSecurity: 'Segurança',
    name: 'Nome Completo',
    phone: 'Telefone',
    dob: 'Data de Nascimento',
    gender: 'Sexo',
    genderSelect: 'Selecione...',
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outros',
    modality: 'Modalidade',
    online: 'Online',
    inPerson: 'Presencial',
    dueDate: 'Data de Vencimento',
    newPassword: 'Nova Senha',
    saveData: 'Salvar Dados',
    savePassword: 'Atualizar Senha',
    saving: 'Salvando...',
    logout: 'Encerrar Sessão',
    successData: 'Dados atualizados com sucesso!',
    errorData: 'Erro ao salvar: ',
    successPass: 'Senha atualizada com sucesso!',
    errorPass: 'Erro ao atualizar senha: ',
    passLength: 'Mínimo de 6 caracteres',
    uploadError: 'Erro no upload: ',
    selectLanguage: 'Selecione o Idioma',
    selectTheme: 'Aparência',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  },
  'pt-PT': {
    back: 'Voltar',
    title: 'O Meu Perfil',
    changePhoto: 'Mudar fotografia',
    uploading: 'A enviar...',
    tabData: 'Dados',
    tabSecurity: 'Segurança',
    name: 'Nome Completo',
    phone: 'Telefone',
    dob: 'Data de Nasc.',
    gender: 'Género',
    genderSelect: 'Selecione...',
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outros',
    modality: 'Modalidade',
    online: 'Online',
    inPerson: 'Presencial',
    dueDate: 'Vencimento',
    newPassword: 'Nova Palavra-passe',
    saveData: 'Guardar Dados',
    savePassword: 'Atualizar Palavra-passe',
    saving: 'A guardar...',
    logout: 'Terminar Sessão',
    successData: 'Dados atualizados com sucesso!',
    errorData: 'Erro ao guardar: ',
    successPass: 'Palavra-passe atualizada com sucesso!',
    errorPass: 'Erro ao atualizar palavra-passe: ',
    passLength: 'Mínimo de 6 caracteres',
    uploadError: 'Erro no envio: ',
    selectLanguage: 'Selecione o Idioma',
    selectTheme: 'Aparência',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  },
  'en': {
    back: 'Back',
    title: 'My Profile',
    changePhoto: 'Change photo',
    uploading: 'Uploading...',
    tabData: 'Details',
    tabSecurity: 'Security',
    name: 'Full Name',
    phone: 'Phone',
    dob: 'Date of Birth',
    gender: 'Gender',
    genderSelect: 'Select...',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    modality: 'Modality',
    online: 'Online',
    inPerson: 'In-person',
    dueDate: 'Due Date',
    newPassword: 'New Password',
    saveData: 'Save Details',
    savePassword: 'Update Password',
    saving: 'Saving...',
    logout: 'Sign Out',
    successData: 'Details updated successfully!',
    errorData: 'Error saving: ',
    successPass: 'Password updated successfully!',
    errorPass: 'Error updating password: ',
    passLength: 'Minimum 6 characters',
    uploadError: 'Upload error: ',
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

export default function PerfilAluno({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados'); 
  
  const [perfil, setPerfil] = useState({ 
    nome: '',   
    telefone: '', 
    avatar_url: '',
    data_nascimento: '',
    sexo: '',
    modalidade: '',
    data_vencimento: ''
  });
  const [novaSenha, setNovaSenha] = useState('');

  const id = use(params).id;
  const router = useRouter();

  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Estados dos Modais Premium
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);
    if (id) fetchPerfil();

    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, [id]);

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

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const t = translations[lang] || translations['pt-BR'];

  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': 'rgba(26, 29, 36, 0.8)', // Translúcido para Glassmorphism
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F9FAFB',
    '--surface': 'rgba(255, 255, 255, 0.85)',
    '--surface-sec': '#F8FAFC',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;

  const fetchPerfil = async () => {
    const { data } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (data) {
      setPerfil({
        nome: data.nome || '',
        telefone: data.telefone || '',
        avatar_url: data.avatar_url || '',
        data_nascimento: data.data_nascimento || '',
        sexo: data.sexo || '',
        modalidade: data.modalidade || '',
        data_vencimento: data.data_vencimento || ''
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setPerfil(p => ({ ...p, avatar_url: data.publicUrl }));
    } catch (err: any) { 
      showToast(t.uploadError + err.message, 'error'); 
    } finally { 
      setUploading(false); 
      e.target.value = '';
    }
  };

  const formatarTelefone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (field: string) => (e: any) => {
    let val = e?.target?.value !== undefined ? e.target.value : e;
    if (field === 'telefone') val = formatarTelefone(val);
    setPerfil(p => ({ ...p, [field]: val }));
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('alunos').update({ 
        nome: perfil.nome, 
        telefone: perfil.telefone.replace(/\D/g, ''),
        avatar_url: perfil.avatar_url,
        data_nascimento: perfil.data_nascimento,
        sexo: perfil.sexo
      }).eq('id', id);
      if (error) throw error;
      showToast(t.successData, 'success');
    } catch (err: any) { 
      showToast(t.errorData + err.message, 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleUpdatePassword = async () => {
    if (novaSenha.length < 6) return showToast(t.passLength, 'error');
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      showToast(t.successPass, 'success');
      setNovaSenha('');
    } catch (err: any) { 
      showToast(t.errorPass + err.message, 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const formatModalidade = (mod: string) => {
    if (mod === 'online') return t.online;
    if (mod === 'presencial') return t.inPerson;
    return mod;
  };

  const formatVencimento = (dataStr: string) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (!mounted || loading) return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 space-y-8 animate-pulse pt-[max(env(safe-area-inset-top),2rem)]">
      <div className="flex justify-between items-center mb-10">
        <div className="w-12 h-12 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-20 h-10 bg-[var(--surface-sec)] rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="w-28 h-28 bg-[var(--surface-sec)] rounded-full" />
        <div className="w-48 h-6 bg-[var(--surface-sec)] rounded-full" />
      </div>
      <div className="w-full h-14 bg-[var(--surface-sec)] rounded-[2rem]" />
      <div className="w-full h-64 bg-[var(--surface)] rounded-[2.5rem]" />
    </main>
  );

  return (
    <main 
      style={themeStyles} 
      className="min-h-[100dvh] w-full bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased pt-[max(env(safe-area-inset-top),1.5rem)] pb-[calc(env(safe-area-inset-bottom)+7rem)] px-4 relative overflow-hidden"
    >
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[350px] h-[100vw] sm:h-[350px] bg-[var(--primary-soft)]/5 rounded-full blur-[100px] pointer-events-none" />

      {toast && (
        <div className="fixed top-[max(env(safe-area-inset-top,20px),20px)] left-4 right-4 z-[9999] flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`bg-[var(--surface-sec)] border shadow-2xl rounded-xl px-5 py-4 flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'border-[var(--danger)]/30' : 'border-[var(--success)]/30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
              {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        
        {/* CABEÇALHO PREMIUM */}
        <header className="flex justify-between items-center mb-6 pt-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] active:scale-95 transition-all shadow-sm hover:bg-[var(--surface-sec)]"
          >
            <FaChevronLeft className="text-[var(--text-primary)]" size={14} />
          </button>
          
          <h1 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)] hidden sm:block">{t.title}</h1>
          
          {/* ━━━━━━━━━━ CONTROLES UNIFICADOS (PILL UI) ━━━━━━━━━━ */}
          <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1">
            <button 
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95"
            >
              <FaGlobe size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang.split('-')[0]}</span>
            </button>
            
            <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />
            
            <button 
              onClick={() => setIsThemeModalOpen(true)} 
              className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95"
            >
              {isDark ? <FaMoon size={14} /> : <FaSun size={14} />}
            </button>
          </div>
        </header>

        {/* CARD DO AVATAR */}
        <div className="bg-[var(--surface)] backdrop-blur-2xl p-8 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center gap-5 text-center shadow-lg shadow-[var(--border)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[var(--primary)]/10" />

          <div className="relative">
            <div className="w-28 h-28 rounded-[2rem] border-4 border-[var(--bg)] shadow-xl overflow-hidden relative group-hover:border-[var(--primary)]/20 transition-all duration-300">
              <img 
                src={perfil.avatar_url || `https://ui-avatars.com/api/?name=${perfil.nome || 'User'}&background=random&color=fff`} 
                className="w-full h-full object-cover" 
                alt="Avatar"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FaCamera className="text-white text-2xl" />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="font-black text-[var(--text-primary)] text-2xl tracking-tight leading-tight mb-3">{perfil.nome || 'Usuário'}</h2>
            <label className={`cursor-pointer inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all active:scale-95 ${uploading ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)]' : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 shadow-sm'}`}>
              {uploading ? t.uploading : t.changePhoto}
              <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* ABAS (Segmented Control Premium) */}
        <div className="bg-[var(--surface-sec)] p-1.5 rounded-[1.2rem] border border-[var(--border)] flex shadow-inner backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('dados')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'dados' 
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaUserEdit size={14} /> <span className="hidden sm:inline">{t.tabData}</span><span className="sm:hidden">Dados</span>
          </button>
          <button 
            onClick={() => setActiveTab('seguranca')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'seguranca' 
                ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaUserShield size={14} /> <span className="hidden sm:inline">{t.tabSecurity}</span><span className="sm:hidden">Senha</span>
          </button>
        </div>

        {/* FORMULÁRIOS */}
        <div className="bg-[var(--surface)] backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-lg shadow-[var(--border)]">
          {activeTab === 'dados' ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
              
              <InputField label={t.name} value={perfil.nome} onChange={handleChange('nome')} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <InputField label={t.phone} type="tel" value={perfil.telefone} onChange={handleChange('telefone')} />
                <InputField label={t.dob} type="date" value={perfil.data_nascimento} onChange={handleChange('data_nascimento')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <SelectField 
                  label={t.gender}
                  name="sexo"
                  value={perfil.sexo} 
                  onChange={handleChange('sexo')} 
                  defaultOption={t.genderSelect}
                  options={[
                    { value: 'masculino', label: t.male },
                    { value: 'feminino', label: t.female },
                    { value: 'outros', label: t.other }
                  ]} 
                />
              </div>

              {/* DIVISOR DE SEÇÃO */}
              <div className="h-px w-full bg-gradient-to-r from-[var(--border)] to-transparent my-4" />

              {/* CAMPOS BLOQUEADOS (Segurança de Contrato) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <InputField 
                  label={t.modality} 
                  value={formatModalidade(perfil.modalidade)} 
                  disabled={true} 
                  icon={FaLock} 
                />
                <InputField 
                  label={t.dueDate} 
                  value={formatVencimento(perfil.data_vencimento)} 
                  disabled={true} 
                  icon={FaLock} 
                />
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-2">
                 <InputField 
                   label={t.newPassword} 
                   type="password" 
                   value={novaSenha} 
                   onChange={(e: any) => setNovaSenha(e?.target?.value !== undefined ? e.target.value : e)} 
                 />
                 <p className="text-[10px] text-[var(--text-secondary)] font-bold pl-2">{t.passLength}</p>
              </div>
              <button 
                onClick={handleUpdatePassword} 
                disabled={saving || novaSenha.length < 6} 
                className={`w-full py-4 rounded-[1.2rem] text-[12px] font-black uppercase tracking-widest transition-all ${
                  saving || novaSenha.length < 6
                    ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed shadow-inner'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)] active:scale-95'
                }`}
              >
                {saving ? t.saving : t.savePassword}
              </button>
            </div>
          )}
        </div>

        {/* BOTAO DE SALVAR DADOS */}
        {activeTab === 'dados' && (
          <button 
            onClick={handleUpdate} 
            disabled={saving} 
            className={`w-full py-5 rounded-[1.2rem] font-black text-[12px] uppercase tracking-widest transition-all transform active:scale-[0.98] ${
              saving 
                ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)]'
            }`}
          >
            {saving ? (
               <div className="flex items-center justify-center gap-2">
                 <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                 {t.saving}
               </div>
            ) : t.saveData}
          </button>
        )}

        {/* LOGOUT (Premium Danger) */}
        <button 
          onClick={handleLogout} 
          className="group w-full flex items-center justify-center gap-3 py-5 mt-4 rounded-[1.2rem] border border-[var(--danger)]/20 bg-[var(--danger)]/5 hover:bg-[var(--danger)]/10 transition-all duration-300 active:scale-[0.98]"
        >
          <FaSignOutAlt className="text-[var(--danger)] text-lg group-hover:-translate-x-1 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--danger)]">{t.logout}</span>
        </button>

      </div>

      {/* ━━━━━━━━━━ MODAIS DE CONFIGURAÇÃO (Fundo Escuro) ━━━━━━━━━━ */}
      {(isLangModalOpen || isThemeModalOpen) && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-5">
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
            
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}

    </main>
  );
}
