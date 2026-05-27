'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PerfilAluno({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', objetivo: '', telefone: '', avatar_url: '' });
  const [novaSenha, setNovaSenha] = useState('');

  const id = use(params).id;

  useEffect(() => { id && fetchPerfil(); }, [id]);

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

      // Upload
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      // URL Pública
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
      // 1. Atualiza Dados Pessoais
      const { error: dbError } = await supabase.from('alunos').update(perfil).eq('id', id);
      if (dbError) throw dbError;

      // 2. Troca Senha (Se preenchida)
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

  if (loading) return <main className="p-10 text-center animate-pulse">Carregando...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black mb-8 tracking-tighter">Configurações de Perfil</h1>
        
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-10 p-4 bg-gray-50 rounded-2xl">
          <img src={perfil.avatar_url || 'https://ui-avatars.com/api/?name=' + perfil.nome} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm" />
          <label className="cursor-pointer bg-white border border-gray-200 px-6 py-3 rounded-xl text-xs font-bold hover:border-gray-900 transition">
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
          
          <div className="pt-6 border-t border-gray-100">
            <h2 className="text-sm font-black mb-4 text-gray-900">Segurança</h2>
            <InputField label="Nova Senha (deixar vazio para manter)" type="password" value={novaSenha} onChange={(v: string) => setNovaSenha(v)} />
          </div>

          <button 
            onClick={updatePerfil} 
            disabled={saving}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:bg-gray-400"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </main>
  );
}

// Componente helper para organização
function InputField({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 px-1">{label}</label>
      <input 
        type={type}
        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-gray-200 transition" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  );
}