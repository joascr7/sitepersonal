'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaSignOutAlt } from 'react-icons/fa';
import InputField from '@/components/InputField';

export default function PerfilAluno({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados'); 
  const [perfil, setPerfil] = useState({ nome: '', objetivo: '', telefone: '', avatar_url: '' });
  const [novaSenha, setNovaSenha] = useState('');

  const id = use(params).id;
  const router = useRouter();

  useEffect(() => { if (id) fetchPerfil(); }, [id]);

  const fetchPerfil = async () => {
    const { data } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (data) setPerfil(data);
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
    } catch (err: any) { alert('Erro no upload: ' + err.message); } finally { setUploading(false); }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('alunos').update({ 
        nome: perfil.nome, objetivo: perfil.objetivo, telefone: perfil.telefone, avatar_url: perfil.avatar_url 
      }).eq('id', id);
      if (error) throw error;
      alert("Dados atualizados com sucesso!");
    } catch (err: any) { alert("Erro ao salvar: " + err.message); } finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (novaSenha.length < 6) return alert("Mínimo de 6 caracteres");
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      alert("Senha atualizada com sucesso!");
      setNovaSenha('');
    } catch (err: any) { alert("Erro ao atualizar senha: " + err.message); } finally { setSaving(false); }
  };

  const handleChange = (field: string) => (val: string) => setPerfil(p => ({ ...p, [field]: val }));

  if (loading) return (
    <main className="min-h-screen bg-black p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div className="w-16 h-4 bg-neutral-900 rounded-full" />
        <div className="w-24 h-8 bg-neutral-900 rounded-xl" />
      </div>

      {/* Título e Barra de Progresso Skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-8 bg-neutral-900 rounded-full" />
        <div className="w-32 h-3 bg-neutral-900 rounded-full" />
        <div className="w-full h-2 bg-neutral-900 rounded-full" />
      </div>

      {/* Cards de Exercícios Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-8 bg-neutral-900/50 rounded-[2.5rem] border border-white/5 space-y-4">
          <div className="w-full h-40 bg-neutral-900 rounded-2xl" />
          <div className="w-1/2 h-6 bg-neutral-900 rounded-full" />
        </div>
      ))}
    </main>
  );

  return (
    <main className="w-full min-h-screen bg-black text-white pt-20 px-4 pb-32">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="flex justify-between items-center py-4 mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-2xl transition-all border border-white/5">
            <span className="text-blue-500">←</span> Voltar
          </button>
          <h1 className="font-black text-sm uppercase tracking-widest text-neutral-400">Meu Perfil</h1>
          <div className="w-16" />
        </header>

        <div className="bg-neutral-900/50 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-4 text-center">
            <img src={perfil.avatar_url || `https://ui-avatars.com/api/?name=${perfil.nome}`} className="w-24 h-24 rounded-full border-4 border-black shadow-2xl object-cover" />
            <h2 className="font-black text-xl">{perfil.nome}</h2>
            <label className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-blue-500 underline underline-offset-4">
                {uploading ? 'Enviando...' : 'Trocar foto'}
                <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
            </label>
        </div>

        <div className="bg-neutral-900/50 p-2 rounded-[2rem] border border-white/5 flex gap-2">
            <button onClick={() => setActiveTab('dados')} className={`flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'dados' ? 'bg-blue-600' : 'text-neutral-500'}`}>Dados</button>
            <button onClick={() => setActiveTab('seguranca')} className={`flex-1 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'seguranca' ? 'bg-blue-600' : 'text-neutral-500'}`}>Segurança</button>
        </div>

        <div className="bg-neutral-900/50 p-8 rounded-[2.5rem] border border-white/5 min-h-[200px]">
            {activeTab === 'dados' ? (
                <div className="space-y-4 animate-in fade-in">
                    <InputField label="Nome Completo" value={perfil.nome} onChange={handleChange('nome')} />
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Telefone" value={perfil.telefone} onChange={handleChange('telefone')} />
                        <InputField label="Objetivo" value={perfil.objetivo} onChange={handleChange('objetivo')} />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in">
                    <InputField label="Nova Senha" type="password" value={novaSenha} onChange={setNovaSenha} />
                    <button onClick={handleUpdatePassword} disabled={saving} className="w-full py-4 bg-blue-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
                        {saving ? "Salvando..." : "Atualizar Senha"}
                    </button>
                </div>
            )}
        </div>

        {activeTab === 'dados' && (
            <button onClick={handleUpdate} disabled={saving} className="w-full bg-blue-600 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]">
                {saving ? "Salvando..." : "Salvar Dados"}
            </button>
        )}

        <button onClick={handleLogout} className="group w-full flex items-center justify-center gap-3 py-4 mt-8 rounded-[2rem] border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all duration-300">
          <FaSignOutAlt className="text-red-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Encerrar Sessão</span>
        </button>

        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}