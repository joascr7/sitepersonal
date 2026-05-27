'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PerfilAluno({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', objetivo: '', telefone: '', avatar_url: '' });

  const resolvedParams = use(params);
  const id = resolvedParams.id;

  useEffect(() => {
    if (id) fetchPerfil();
  }, [id]);

  const fetchPerfil = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('alunos')
      .select('nome, objetivo, telefone, avatar_url')
      .eq('id', id)
      .maybeSingle();
      
    if (data) setPerfil(data);
    setLoading(false);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setPerfil({ ...perfil, avatar_url: publicUrlData.publicUrl });
      alert('Imagem enviada! Clique em Salvar Alterações.');
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const updatePerfil = async () => {
    const { error } = await supabase
      .from('alunos')
      .update({
        nome: perfil.nome,
        objetivo: perfil.objetivo,
        telefone: perfil.telefone,
        avatar_url: perfil.avatar_url
      })
      .eq('id', id);

    if (error) alert("Erro ao atualizar: " + error.message);
    else alert("Perfil atualizado com sucesso!");
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando perfil...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-black text-gray-900 mb-10 tracking-tight">Meu Perfil</h1>
        
        <div className="flex flex-col items-center mb-10">
          <img 
            src={perfil.avatar_url || 'https://via.placeholder.com/150'} 
            alt="Avatar" 
            className="w-32 h-32 rounded-full object-cover mb-6 border-4 border-gray-50 shadow-inner"
          />
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition">
            {uploading ? 'Enviando...' : 'Alterar Foto'}
            <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
            <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" value={perfil.nome} onChange={(e) => setPerfil({...perfil, nome: e.target.value})} />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Objetivo</label>
            <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" value={perfil.objetivo} onChange={(e) => setPerfil({...perfil, objetivo: e.target.value})} />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Telefone / WhatsApp</label>
            <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" value={perfil.telefone} onChange={(e) => setPerfil({...perfil, telefone: e.target.value})} />
          </div>

          <button 
            onClick={updatePerfil} 
            className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm mt-6"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </main>
  );
}