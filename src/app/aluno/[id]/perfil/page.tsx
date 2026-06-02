'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PerfilAluno({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', objetivo: '', telefone: '', avatar_url: '' });
  const [novaSenha, setNovaSenha] = useState('');

  const id = use(params).id;

  useEffect(() => { 
    if (id) fetchPerfil(); 
  }, [id]);

  const fetchPerfil = async () => {
    const { data } = await supabase.from('alunos').select('*').eq('id', id).maybeSingle();
    if (data) setPerfil(data);
    setLoading(false);
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
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const updatePerfil = async () => {
    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from('alunos')
        .update({ 
          nome: perfil.nome, 
          objetivo: perfil.objetivo, 
          telefone: perfil.telefone, 
          avatar_url: perfil.avatar_url 
        })
        .eq('id', id);

      if (dbError) throw dbError;

      if (novaSenha) {
        const { error: authError } = await supabase.auth.updateUser({ password: novaSenha });
        if (authError) throw authError;
        setNovaSenha('');
      }
      alert("Perfil atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black">CARREGANDO...</main>;

  return (
    <main className="min-h-screen bg-black p-6 md:p-12 text-white">
      <div className="max-w-xl mx-auto bg-neutral-950/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h1 className="text-2xl font-black mb-8 tracking-tighter">Configurações de Perfil</h1>
        
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-10 p-6 bg-white/5 rounded-3xl border border-white/5">
          <img src={perfil.avatar_url || `https://ui-avatars.com/api/?name=${perfil.nome}&background=2563eb&color=fff`} className="w-20 h-20 rounded-full object-cover border-4 border-white/5 shadow-xl" />
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            {uploading ? 'Enviando...' : 'Trocar Foto'}
            <input type="file" className="hidden" onChange={uploadAvatar} />
          </label>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Nome Completo" value={perfil.nome} onChange={(v: string) => setPerfil({...perfil, nome: v})} />
            <InputField label="Telefone" value={perfil.telefone} onChange={(v: string) => setPerfil({...perfil, telefone: v})} />
          </div>
          <InputField label="Objetivo do Aluno" value={perfil.objetivo} onChange={(v: string) => setPerfil({...perfil, objetivo: v})} />
          
          <div className="pt-6 border-t border-white/5">
            <h2 className="text-[10px] font-black mb-6 text-neutral-500 uppercase tracking-widest">Segurança</h2>
            <InputField label="Nova Senha (deixar vazio para manter)" type="password" value={novaSenha} onChange={(v: string) => setNovaSenha(v)} />
          </div>

          <button 
            onClick={updatePerfil} 
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:bg-neutral-800"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </main>
  );
}

function InputField({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black text-neutral-500 uppercase mb-2 px-1 tracking-widest">{label}</label>
      <input 
        type={type}
        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-neutral-700" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  );
}