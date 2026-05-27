'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function NovaSenha() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });
    
    if (error) {
      alert('Erro ao atualizar: ' + error.message);
      setLoading(false);
    } else {
      alert('Senha alterada com sucesso!');
      router.push('/');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm text-center">
        <h1 className="text-xl font-black text-gray-900 mb-2">Redefinir senha</h1>
        <p className="text-gray-500 text-sm mb-8">Digite sua nova senha de acesso.</p>
        
        <input 
          type="password" 
          className="w-full p-4 mb-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition" 
          placeholder="Nova senha" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button 
          onClick={handleUpdatePassword} 
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? "Atualizando..." : "Atualizar Senha"}
        </button>
      </div>
    </main>
  );
}