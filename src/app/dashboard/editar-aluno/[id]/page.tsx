'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../../actions/aluno';
// Importe a sua action de atualização aqui quando criá-la:
// import { atualizarAlunoAction } from '../../../actions/aluno'; 
import { FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, FaCheckCircle, FaUserEdit, FaUserPlus, FaChevronDown } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar',
    titleEdit: 'Editar Aluno',
    titleNew: 'Novo Aluno',
    subtitleEdit: 'Atualize as informações do membro',
    subtitleNew: 'Preencha os dados do novo membro',
    name: 'Nome Completo', namePlaceholder: 'Nome do aluno',
    email: 'E-mail', emailPlaceholder: 'aluno@email.com',
    password: 'Senha', passwordPlaceholder: '••••••••',
    passwordEditPlaceholder: 'Deixe em branco para manter a atual',
    phone: 'WhatsApp', phonePlaceholder: '(00) 00000-0000',
    dob: 'Data de Nascimento',
    gender: 'Sexo', genderSelect: 'Selecione...',
    male: 'Masculino', female: 'Feminino', other: 'Outros',
    modality: 'Modalidade', modalitySelect: 'Selecione...',
    online: 'Online', inPerson: 'Presencial',
    dueDate: 'Vencimento',
    submitEdit: 'Salvar Alterações', submitNew: 'Confirmar Cadastro',
    processing: 'Processando...',
    errFill: 'Preencha ao menos nome e e-mail.',
    successUpdate: 'Dados do aluno atualizados.',
  },
  'pt-PT': {
    back: 'Voltar',
    titleEdit: 'Editar Aluno',
    titleNew: 'Novo Aluno',
    subtitleEdit: 'Atualize as informações do membro',
    subtitleNew: 'Preencha os dados do novo membro',
    name: 'Nome Completo', namePlaceholder: 'Nome do aluno',
    email: 'E-mail', emailPlaceholder: 'aluno@email.com',
    password: 'Palavra-passe', passwordPlaceholder: '••••••••',
    passwordEditPlaceholder: 'Deixe em branco para manter a atual',
    phone: 'WhatsApp', phonePlaceholder: '(00) 00000-0000',
    dob: 'Data de Nasc.',
    gender: 'Género', genderSelect: 'Selecione...',
    male: 'Masculino', female: 'Feminino', other: 'Outros',
    modality: 'Modalidade', modalitySelect: 'Selecione...',
    online: 'Online', inPerson: 'Presencial',
    dueDate: 'Vencimento',
    submitEdit: 'Guardar Alterações', submitNew: 'Confirmar Registo',
    processing: 'A processar...',
    errFill: 'Preencha pelo menos nome e e-mail.',
    successUpdate: 'Dados do aluno atualizados.',
  },
  'en': {
    back: 'Back',
    titleEdit: 'Edit Student',
    titleNew: 'New Student',
    subtitleEdit: 'Update member information',
    subtitleNew: 'Fill in the new member details',
    name: 'Full Name', namePlaceholder: 'Student name',
    email: 'Email', emailPlaceholder: 'student@email.com',
    password: 'Password', passwordPlaceholder: '••••••••',
    passwordEditPlaceholder: 'Leave blank to keep current',
    phone: 'WhatsApp', phonePlaceholder: '(00) 00000-0000',
    dob: 'Date of Birth',
    gender: 'Gender', genderSelect: 'Select...',
    male: 'Male', female: 'Female', other: 'Other',
    modality: 'Modality', modalitySelect: 'Select...',
    online: 'Online', inPerson: 'In-person',
    dueDate: 'Due Date',
    submitEdit: 'Save Changes', submitNew: 'Confirm Registration',
    processing: 'Processing...',
    errFill: 'Fill in at least name and email.',
    successUpdate: 'Student data updated.',
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FormSkeleton = () => (
  <div className="w-full space-y-6 animate-pulse">
    <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
    <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
      <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
      <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
    </div>
    <div className="h-14 bg-[var(--surface-sec)] rounded-[1.2rem] w-full" />
    <div className="h-16 bg-[var(--surface-sec)] rounded-[1.2rem] w-full mt-10" />
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES DE INPUT PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const InputField = ({ label, name, value, onChange, type = "text", placeholder, disabled = false }: any) => (
  <div className="flex flex-col gap-2 w-full min-w-0 group">
    <label className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 truncate transition-colors ${disabled ? 'text-[var(--text-secondary)]/50' : 'text-[var(--text-secondary)] group-focus-within:text-[var(--primary)]'}`}>
      {label}
    </label>
    <input 
      name={name} type={type} placeholder={placeholder} value={value ?? ''} onChange={onChange} disabled={disabled}
      className="block w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:font-medium box-border shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, defaultOption, disabled = false }: any) => (
  <div className="flex flex-col gap-2 w-full min-w-0 group">
    <label className={`text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 truncate transition-colors ${disabled ? 'text-[var(--text-secondary)]/50' : 'text-[var(--text-secondary)] group-focus-within:text-[var(--primary)]'}`}>
      {label}
    </label>
    <div className="relative">
      <select 
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className="block w-full px-5 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm font-bold text-[var(--text-primary)] appearance-none cursor-pointer shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
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
export default function FormularioAluno({ params }: { params?: Promise<{ id?: string }> }) {
  const resolvedParams = params ? use(params) : null;
  const isEditing = !!resolvedParams?.id;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nome: '', email: '', password: '', telefone: '', dataVencimento: '',
    dataNascimento: '', sexo: '', modalidade: ''
  });
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };
  
  const t = translations[lang] || translations['pt-BR'];

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const showToast = (type: 'success' | 'error', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

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

  useEffect(() => {
    if (isEditing && resolvedParams?.id) {
      const fetchAluno = async () => {
        setIsFetching(true);
        const { data: aluno } = await supabase.from('alunos').select('*').eq('id', resolvedParams.id).single();
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', resolvedParams.id).single();
        if (aluno) {
          setFormData({
            nome: aluno.nome || '', 
            email: profile?.email || '', 
            telefone: aluno.telefone || '', 
            dataVencimento: aluno.data_vencimento?.split('T')[0] || '',
            dataNascimento: aluno.data_nascimento?.split('T')[0] || '',
            sexo: aluno.sexo || '',
            modalidade: aluno.modalidade || '',
            password: '' // Sempre vem vazio por segurança
          });
        }
        setIsFetching(false);
      };
      fetchAluno();
    }
  }, [isEditing, resolvedParams?.id]);

  const handleSubmit = async () => {
    if (!formData.nome || !formData.email) {
      showToast('error', t.errFill);
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(formData.dataVencimento + 'T00:00:00');
    const dataLimite = new Date(dataVencimento);
    dataLimite.setDate(dataLimite.getDate() + 2);
    dataLimite.setHours(0, 0, 0, 0);

    const novoStatus = hoje > dataLimite ? 'bloqueado' : 'ativo';

    setLoading(true);
    try {
      if (isEditing && resolvedParams?.id) {
        
        // 1. Atualiza dados públicos na tabela 'alunos'
        const { error: errAluno } = await supabase.from('alunos').update({
          nome: formData.nome, 
          telefone: formData.telefone.replace(/\D/g, ''),
          data_nascimento: formData.dataNascimento,
          sexo: formData.sexo,
          modalidade: formData.modalidade,
          data_vencimento: formData.dataVencimento, 
          status_pagamento: novoStatus
        }).eq('id', resolvedParams.id);
        
        if (errAluno) throw errAluno;

        // 2. Atualiza e-mail na tabela 'profiles' (se existir no seu schema)
        const { error: errProfile } = await supabase.from('profiles').update({
          email: formData.email
        }).eq('id', resolvedParams.id);
        
        if (errProfile) throw errProfile;

        // 3. Atualiza E-mail/Senha na tabela Auth (auth.users)
        // NOTA: Para isso funcionar, você precisará de uma Server Action usando a Service Role Key.
        // if (formData.password || formData.email) {
        //   await atualizarAlunoAction(resolvedParams.id, formData.email, formData.password);
        // }

        showToast('success', t.successUpdate);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        await cadastrarAlunoAction({ 
          ...formData,
          telefone: formData.telefone.replace(/\D/g, '')
        }, session?.user.id || '');
        router.push('/dashboard');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] flex flex-col items-center px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] box-border text-[var(--text-primary)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100vw] sm:w-[350px] h-[100vw] sm:h-[350px] bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Toast Flutuante Premium */}
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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--primary)]/10 text-[var(--primary)] rounded-[1.2rem] flex items-center justify-center shadow-inner shrink-0">
              {isEditing ? <FaUserEdit size={22} /> : <FaUserPlus size={22} />}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)]">{isEditing ? t.titleEdit : t.titleNew}</h1>
              <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">{isEditing ? t.subtitleEdit : t.subtitleNew}</p>
            </div>
          </div>
        </header>
        
        {isFetching ? <FormSkeleton /> : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <InputField label={t.name} name="nome" value={formData.nome} onChange={handleInputChange} placeholder={t.namePlaceholder} />
            
            {/* E-MAIL LIBERADO PARA EDIÇÃO */}
            <InputField label={t.email} name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t.emailPlaceholder} />
            
            {/* SENHA LIBERADA PARA CRIAÇÃO E EDIÇÃO */}
            <InputField 
              label={t.password} 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              placeholder={isEditing ? t.passwordEditPlaceholder : t.passwordPlaceholder} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
            
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-10 bg-[var(--primary)] text-white py-5 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
            >
              {loading ? t.processing : isEditing ? t.submitEdit : t.submitNew}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}