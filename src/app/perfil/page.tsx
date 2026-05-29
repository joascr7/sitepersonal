'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
      alert('A imagem é muito grande. Máximo 2MB.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('perfil')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('perfil').getPublicUrl(filePath);
      await supabase.from('personais').update({ avatar_url: publicUrl }).eq('id', user.id);
      
      setAvatarUrl(publicUrl);
      alert('Foto atualizada com sucesso!');
    } catch (err: any) { alert('Erro ao atualizar foto: ' + err.message); } 
    finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return alert('Nome é obrigatório');

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('personais')
        .update({ 
            nome: formData.nome.trim(), 
            telefone: formData.telefone.trim() 
        })
        .eq('id', user.id);
        
      if (error) alert('Falha ao atualizar dados: ' + error.message);
      else alert('Dados atualizados com sucesso!');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert('Erro: ' + error.message);
    else { alert('Senha atualizada com sucesso!'); setNewPassword(''); }
    setLoading(false);
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center font-black text-gray-300 tracking-widest">
      CARREGANDO...
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100 space-y-8">
        <h1 className="text-2xl font-black text-gray-900">Meu Perfil</h1>
        
        {/* Foto de Perfil */}
        <div className="flex justify-center">
            <label className="cursor-pointer">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-md transition hover:ring-2 ring-black">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="font-black text-gray-400">PT</span>}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
        </div>

        {/* Dados Pessoais */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Nome Completo" value={formData.nome} onChange={handleChange('nome')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CREF (Bloqueado)" value={formData.cref} disabled className="bg-gray-100 cursor-not-allowed opacity-60" />
            <Input label="Telefone" value={formData.telefone} onChange={handleChange('telefone')} />
          </div>
          <Input label="E-mail" value={formData.email} disabled className="bg-gray-100 cursor-not-allowed opacity-60" />
          <button disabled={loading} className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition">
            {loading ? 'Salvando...' : 'SALVAR DADOS'}
          </button>
        </form>

        <hr className="border-gray-100" />

        {/* Troca de Senha */}
        <div className="space-y-4">
          <Input label="Nova Senha" type="password" value={newPassword} onChange={setNewPassword} placeholder="Mínimo 6 caracteres" />
          <button onClick={handleUpdatePassword} disabled={loading} className="w-full border-2 border-black py-4 rounded-2xl font-bold hover:bg-gray-50 transition">
            ATUALIZAR SENHA
          </button>
        </div>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, disabled, type = "text", className = "", ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-wider">{label}</label>
      <input 
        type={type}
        disabled={disabled}
        className={`w-full p-4 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black outline-none transition ${className}`}
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}