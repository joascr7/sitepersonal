'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Perfil() {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
        if (data) setFullName(data.full_name || '');
      }
      setFetching(false);
    };
    getProfile();
  }, []);

  const updateProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ 
        id: user.id, 
        full_name: fullName 
      });
      if (error) alert('Erro ao atualizar perfil.');
      else alert('Perfil atualizado com sucesso!');
    }
    setLoading(false);
  };

  if (fetching) return <main className="flex justify-center p-20 text-gray-400">Carregando...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-black text-gray-900 mb-8">Meu Perfil</h1>
        
        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Seu nome completo"
        />
        
        <button 
          onClick={updateProfile}
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </main>
  );
}