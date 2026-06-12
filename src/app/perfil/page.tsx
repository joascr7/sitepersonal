'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FaCamera, FaCheckCircle, FaExclamationCircle, 
  FaChevronLeft, FaGlobe, FaMoon, FaSun, FaTimes, FaCheck 
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Meu Perfil',
    loading: 'CARREGANDO...',
    saving: 'Salvando...',
    nameLabel: 'Nome Completo',
    crefLabel: 'CREF',
    phoneLabel: 'Telefone',
    emailLabel: 'E-mail',
    btnSave: 'Salvar Dados',
    newPassLabel: 'Nova Senha',
    passPlaceholder: 'Mínimo 6 caracteres',
    btnUpdatePass: 'Atualizar Senha',
    errPhotoSize: 'A imagem é muito grande. Máximo 5MB.',
    errAuth: 'Não autenticado.',
    errNameReq: 'Nome é obrigatório.',
    errPassLength: 'A senha deve ter pelo menos 6 caracteres.',
    successPhoto: 'Foto atualizada com sucesso!',
    successData: 'Dados atualizados com sucesso!',
    successPass: 'Senha atualizada com sucesso!',
    errGeneral: 'Erro: ',
    selectLanguage: 'Selecione o Idioma',
    selectTheme: 'Aparência',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  },
  'pt-PT': {
    title: 'O Meu Perfil',
    loading: 'A CARREGAR...',
    saving: 'A guardar...',
    nameLabel: 'Nome Completo',
    crefLabel: 'Cédula',
    phoneLabel: 'Telefone',
    emailLabel: 'E-mail',
    btnSave: 'Guardar Dados',
    newPassLabel: 'Nova Palavra-passe',
    passPlaceholder: 'Mínimo 6 caracteres',
    btnUpdatePass: 'Atualizar Palavra-passe',
    errPhotoSize: 'A imagem é muito grande. Máximo de 5MB.',
    errAuth: 'Não autenticado.',
    errNameReq: 'O Nome é obrigatório.',
    errPassLength: 'A palavra-passe deve ter pelo menos 6 caracteres.',
    successPhoto: 'Fotografia atualizada com sucesso!',
    successData: 'Dados atualizados com sucesso!',
    successPass: 'Palavra-passe atualizada com sucesso!',
    errGeneral: 'Erro: ',
    selectLanguage: 'Selecione o Idioma',
    selectTheme: 'Aparência',
    themeLight: 'Modo Claro',
    themeDark: 'Modo Escuro'
  },
  'en': {
    title: 'My Profile',
    loading: 'LOADING...',
    saving: 'Saving...',
    nameLabel: 'Full Name',
    crefLabel: 'License',
    phoneLabel: 'Phone',
    emailLabel: 'E-mail',
    btnSave: 'Save Data',
    newPassLabel: 'New Password',
    passPlaceholder: 'Minimum 6 characters',
    btnUpdatePass: 'Update Password',
    errPhotoSize: 'Image is too large. Max 5MB.',
    errAuth: 'Not authenticated.',
    errNameReq: 'Name is required.',
    errPassLength: 'Password must be at least 6 characters.',
    successPhoto: 'Photo updated successfully!',
    successData: 'Data updated successfully!',
    successPass: 'Password updated successfully!',
    errGeneral: 'Error: ',
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

export default function Perfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    nome: '', 
    cref: '', 
    telefone: '', 
    email: '' 
  });
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados de Tema, i18n e Modais Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang && translations[savedLang]) setLang(savedLang);
    };

    updateSettings();
    setMounted(true);

    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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

  // Configuração das Variáveis CSS Globais (Glassmorphism)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': 'rgba(26, 29, 36, 0.8)',
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

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('personais')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({ 
          nome: data.nome || '', 
          cref: data.cref || '', 
          telefone: data.telefone || '', 
          email: data.email || user.email || '' 
        });
        setAvatarUrl(data.avatar_url);
      }
    } catch (err) { 
      console.error('Erro ao carregar perfil:', err); 
    } finally { 
      setFetching(false); 
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(t.errPhotoSize, 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t.errAuth);

      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('perfil')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('perfil').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.from('personais')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
      showToast(t.successPhoto, 'success');
    } catch (err: unknown) { 
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(t.errGeneral + errorMessage, 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast(t.errNameReq, 'error');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (formData.email.trim() !== user.email) {
          const { error: authError } = await supabase.auth.updateUser({ email: formData.email.trim() });
          if (authError) throw authError;
        }

        const { error } = await supabase.from('personais')
          .update({ 
            nome: formData.nome.trim(), 
            telefone: formData.telefone.trim(),
            cref: formData.cref.trim(),
            email: formData.email.trim()
          })
          .eq('id', user.id);
          
        if (error) throw error;
        showToast(t.successData, 'success');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(t.errGeneral + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      showToast(t.errPassLength, 'error');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      showToast(t.successPass, 'success'); 
      setNewPassword(''); 
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      showToast(t.errGeneral + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] font-black text-[#3B82F6] tracking-widest text-sm uppercase animate-pulse">
      {mounted ? t.loading : 'CARREGANDO...'}
    </div>
  );

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] flex flex-col items-center px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] box-border text-[var(--text-primary)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
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

      <div className="w-full max-w-md space-y-6 relative z-10 box-border">
        
        {/* CABEÇALHO PREMIUM UNIFICADO */}
        <header className="flex justify-between items-center mb-6 pt-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] active:scale-95 transition-all shadow-sm hover:bg-[var(--surface-sec)]"
          >
            <FaChevronLeft className="text-[var(--text-primary)]" size={14} />
          </button>
          
          <h1 className="font-black text-xs uppercase tracking-widest text-[var(--text-primary)] hidden sm:block">
            {t.title}
          </h1>
          
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
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>
        </header>

        {/* CARD PRINCIPAL */}
        <div className="bg-[var(--surface)] backdrop-blur-2xl p-6 sm:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl shadow-[var(--border)] relative overflow-hidden">
          
          <h1 className="text-3xl font-black text-[var(--text-primary)] text-center tracking-tight mb-8 sm:hidden">
            {t.title}
          </h1>

          {/* Foto de Perfil */}
          <div className="flex justify-center relative group mb-8">
            <label className="cursor-pointer relative rounded-[2rem] border-4 border-[var(--bg)] shadow-xl overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/30 block">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-[var(--surface-sec)] flex items-center justify-center">
                  {avatarUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                    </>
                  ) : (
                    <span className="font-black text-[var(--text-secondary)] text-xl">
                      {getInitials(formData.nome)}
                    </span>
                  )}
              </div>
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                <FaCamera className="text-white text-2xl drop-shadow-md" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
            </label>
          </div>

          {/* Dados Pessoais */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input label={t.nameLabel} value={formData.nome} onChange={handleChange('nome')} disabled={loading} />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label={t.crefLabel} value={formData.cref} onChange={handleChange('cref')} disabled={loading} />
              <Input label={t.phoneLabel} value={formData.telefone} onChange={handleChange('telefone')} disabled={loading} />
            </div>
            
            <Input label={t.emailLabel} value={formData.email} onChange={handleChange('email')} disabled={loading} type="email" />
            
            <button 
              type="submit"
              disabled={loading} 
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : t.btnSave}
            </button>
          </form>

          <div className="h-px w-full bg-gradient-to-r from-[var(--border)] to-transparent my-6" />

          {/* Troca de Senha */}
          <div className="space-y-4">
            <Input 
              label={t.newPassLabel} 
              type="password" 
              value={newPassword} 
              onChange={setNewPassword} 
              placeholder={t.passPlaceholder} 
              disabled={loading}
            />
            <button 
              type="button"
              onClick={handleUpdatePassword} 
              disabled={loading || newPassword.length < 6} 
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98] ${
                loading || newPassword.length < 6
                  ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed shadow-inner'
                  : 'bg-[var(--surface)] border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 shadow-sm'
              }`}
            >
              {t.btnUpdatePass}
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━ MODAIS DE CONFIGURAÇÃO (Fundo Escuro) ━━━━━━━━━━ */}
      {(isLangModalOpen || isThemeModalOpen) && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setIsLangModalOpen(false); setIsThemeModalOpen(false); }} 
          />
          
          <div style={themeStyles} className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
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
            
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}
    </main>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE INPUT INTERNO APRIMORADO (Premium SaaS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function Input({ label, value, onChange, disabled, type = "text", className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-0 group">
      <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 truncate group-focus-within:text-[var(--primary)] transition-colors">
        {label}
      </label>
      <div className="w-full min-w-0">
        <input 
          type={type}
          disabled={disabled}
          className={`block w-full max-w-full px-4 py-3.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl outline-none transition-all text-[14px] font-bold box-border appearance-none m-0 ${
            disabled 
              ? 'text-[var(--text-secondary)] opacity-60 cursor-not-allowed shadow-inner' 
              : 'text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:font-medium focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/10'
          } ${className}`}
          value={value} 
          onChange={(e) => onChange && onChange(e.target.value)}
          {...props}
        />
      </div>
    </div>
  );
}
