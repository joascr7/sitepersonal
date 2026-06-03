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
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Luz de foco para destacar a ação central */}
      <div className="absolute w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[150px]" />
      
      <div className="bg-neutral-950/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-sm text-center z-10">
        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Redefinir senha</h1>
        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-8">Digite sua nova senha de acesso.</p>
        
        <input 
          type="password" 
          className="w-full px-5 py-4 mb-8 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-700" 
          placeholder="Nova senha" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button 
          onClick={handleUpdatePassword} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:bg-neutral-800 disabled:shadow-none"
        >
          {loading ? "Atualizando..." : "Atualizar Senha"}
        </button>
      </div>

      {/* Espaçador para garantir que o teclado mobile não oculte o botão */}
      <div className="h-10 w-full shrink-0" aria-hidden="true" />
    </main>
  );
}