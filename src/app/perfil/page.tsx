'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCamera, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Meu Perfil',
    loading: 'CARREGANDO...',
    saving: 'Salvando...',
    nameLabel: 'Nome Completo',
    crefLabel: 'CREF (Bloqueado)',
    phoneLabel: 'Telefone',
    emailLabel: 'E-mail',
    btnSave: 'SALVAR DADOS',
    newPassLabel: 'Nova Senha',
    passPlaceholder: 'Mínimo 6 caracteres',
    btnUpdatePass: 'ATUALIZAR SENHA',
    errPhotoSize: 'A imagem é muito grande. Máximo 2MB.',
    errAuth: 'Não autenticado.',
    errNameReq: 'Nome é obrigatório.',
    errPassLength: 'A senha deve ter pelo menos 6 caracteres.',
    successPhoto: 'Foto atualizada com sucesso!',
    successData: 'Dados atualizados com sucesso!',
    successPass: 'Senha atualizada com sucesso!',
    errGeneral: 'Erro: '
  },
  'pt-PT': {
    title: 'O Meu Perfil',
    loading: 'A CARREGAR...',
    saving: 'A guardar...',
    nameLabel: 'Nome Completo',
    crefLabel: 'Cédula (Bloqueada)',
    phoneLabel: 'Telefone',
    emailLabel: 'E-mail',
    btnSave: 'GUARDAR DADOS',
    newPassLabel: 'Nova Palavra-passe',
    passPlaceholder: 'Mínimo 6 caracteres',
    btnUpdatePass: 'ATUALIZAR PALAVRA-PASSE',
    errPhotoSize: 'A imagem é muito grande. Máximo de 2MB.',
    errAuth: 'Não autenticado.',
    errNameReq: 'O Nome é obrigatório.',
    errPassLength: 'A palavra-passe deve ter pelo menos 6 caracteres.',
    successPhoto: 'Fotografia atualizada com sucesso!',
    successData: 'Dados atualizados com sucesso!',
    successPass: 'Palavra-passe atualizada com sucesso!',
    errGeneral: 'Erro: '
  },
  'en': {
    title: 'My Profile',
    loading: 'LOADING...',
    saving: 'Saving...',
    nameLabel: 'Full Name',
    crefLabel: 'License (Locked)',
    phoneLabel: 'Phone',
    emailLabel: 'E-mail',
    btnSave: 'SAVE DATA',
    newPassLabel: 'New Password',
    passPlaceholder: 'Minimum 6 characters',
    btnUpdatePass: 'UPDATE PASSWORD',
    errPhotoSize: 'Image is too large. Max 2MB.',
    errAuth: 'Not authenticated.',
    errNameReq: 'Name is required.',
    errPassLength: 'Password must be at least 6 characters.',
    successPhoto: 'Photo updated successfully!',
    successData: 'Data updated successfully!',
    successPass: 'Password updated successfully!',
    errGeneral: 'Error: '
  }
};

export default function Perfil() {
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

  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          email: data.email || '' 
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

    if (file.size > 2 * 1024 * 1024) {
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
      await supabase.from('personais').update({ avatar_url: publicUrl }).eq('id', user.id);
      
      setAvatarUrl(publicUrl);
      showToast(t.successPhoto, 'success');
    } catch (err: any) { 
      showToast(t.errGeneral + err.message, 'error'); 
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('personais')
        .update({ 
          nome: formData.nome.trim(), 
          telefone: formData.telefone.trim() 
        })
        .eq('id', user.id);
        
      if (error) {
        showToast(t.errGeneral + error.message, 'error');
      } else {
        showToast(t.successData, 'success');
      }
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      showToast(t.errPassLength, 'error');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(t.errGeneral + error.message, 'error');
    } else { 
      showToast(t.successPass, 'success'); 
      setNewPassword(''); 
    }
    setLoading(false);
  };

  if (fetching || !mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1115] font-black text-[#3B82F6] tracking-widest text-sm uppercase animate-pulse">
      {mounted ? t.loading : 'CARREGANDO...'}
    </div>
  );

  return (
    // Removido o pt-20 já que o Header superior não existe mais. pb-32 garante que a navbar flutuante não cubra o conteúdo final
    <main style={themeStyles} className="w-full min-h-screen bg-[var(--bg)] flex flex-col items-center px-4 py-8 pb-32 box-border text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased">
      
      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex justify-center animate-in slide-in-from-top-4 fade-in duration-300 w-[90%] max-w-sm">
          <div className={`w-full bg-[var(--surface-sec)] border shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'border-[var(--danger)]/30' : 'border-[var(--success)]/30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
              {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-[var(--surface)]/90 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-8 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Glow Decorativo Premium */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none" />

        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] text-center tracking-tight relative z-10">
          {t.title}
        </h1>
        
        {/* Foto de Perfil */}
        <div className="flex justify-center relative z-10">
            <label className="cursor-pointer group relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[var(--surface-sec)] flex items-center justify-center border-[4px] border-[var(--border)] shadow-xl transition-all duration-300 group-hover:border-[var(--primary)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <span className="font-black text-[var(--text-secondary)] text-xl">PT</span>
                  )}
              </div>
              
              {/* Overlay de Câmera (Hover) */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                <FaCamera className="text-white text-2xl drop-shadow-md" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
            </label>
        </div>

        {/* Dados Pessoais */}
        <form onSubmit={handleUpdate} className="space-y-4 relative z-10">
          <Input label={t.nameLabel} value={formData.nome} onChange={handleChange('nome')} disabled={loading} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label={t.crefLabel} value={formData.cref} disabled className="opacity-60 cursor-not-allowed" />
            <Input label={t.phoneLabel} value={formData.telefone} onChange={handleChange('telefone')} disabled={loading} />
          </div>
          
          <Input label={t.emailLabel} value={formData.email} disabled className="opacity-60 cursor-not-allowed" />
          
          <button 
            disabled={loading} 
            className={`w-full py-4 rounded-[1.2rem] font-black uppercase tracking-widest text-xs transition-all duration-300 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] cursor-not-allowed' 
                : 'bg-[var(--primary)] text-white hover:brightness-110 shadow-[0_10px_30px_-10px_var(--primary)]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                {t.saving}
              </>
            ) : t.btnSave}
          </button>
        </form>

        <hr className="border-[var(--border)] relative z-10" />

        {/* Troca de Senha */}
        <div className="space-y-4 relative z-10">
          <Input 
            label={t.newPassLabel} 
            type="password" 
            value={newPassword} 
            onChange={setNewPassword} 
            placeholder={t.passPlaceholder} 
            disabled={loading}
          />
          <button 
            onClick={handleUpdatePassword} 
            disabled={loading} 
            className="w-full bg-[var(--surface-sec)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] py-4 rounded-[1.2rem] font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
          >
            {t.btnUpdatePass}
          </button>
        </div>
      </div>
    </main>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE INPUT INTERNO APRIMORADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Input({ label, value, onChange, disabled, type = "text", className = "", ...props }: any) {
  return (
    <div>
      <label className="block text-[9px] font-black uppercase text-[var(--text-secondary)] mb-1.5 tracking-widest pl-1">
        {label}
      </label>
      <input 
        type={type}
        disabled={disabled}
        className={`w-full p-4 bg-[var(--surface-sec)] rounded-[1.2rem] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all duration-300 text-sm font-bold text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal shadow-inner ${className}`}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}
