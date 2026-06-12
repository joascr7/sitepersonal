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
  FaLock
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES DE INPUT PREMIUM (In-line para garantir o design correto)
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
        className={`block w-full max-w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none transition-all text-[14px] font-bold box-border appearance-none m-0 ${
          disabled 
            ? 'text-[var(--text-secondary)] opacity-60 cursor-not-allowed shadow-inner' 
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
        className="block w-full max-w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-[14px] font-bold text-[var(--text-primary)] appearance-none cursor-pointer box-border m-0"
      >
        <option value="" disabled className="text-[var(--text-secondary)]">{defaultOption}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--surface)] text-[var(--text-primary)]">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
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
    uploadError: 'Erro no upload: '
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
    uploadError: 'Erro no envio: '
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
    uploadError: 'Upload error: '
  }
};

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
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    
    setMounted(true);
    if (id) fetchPerfil();
  }, [id]);

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
    window.dispatchEvent(new Event('storage'));
  };

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const t = translations[lang];

  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#1A1D24',
    '--surface-sec': '#222731',
    '--primary': '#3B82F6',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F9FAFB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#F8FAFC',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
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
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] active:scale-95 transition-all shadow-sm hover:bg-[var(--surface-sec)]"
          >
            <FaChevronLeft className="text-[var(--text-primary)]" size={14} />
          </button>
          
          <h1 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)] hidden sm:block">{t.title}</h1>
          
          <div className="flex gap-2">
            <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
              <FaGlobe size={14} />
              <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
            </button>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>
        </header>

        {/* CARD DO AVATAR */}
        <div className="bg-[var(--surface)]/90 backdrop-blur-md p-8 rounded-[2.5rem] border border-[var(--border)] flex flex-col items-center gap-5 text-center shadow-sm relative overflow-hidden group">
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
        <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
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
                className={`w-full py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
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

        {/* BOTAO DE SALVAR DADOS (Exibido apenas na aba Dados) */}
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
    </main>
  );
}
