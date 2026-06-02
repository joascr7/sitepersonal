'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const ADMIN_EMAILS = ['contatojoasvieira6@gmail.com', 'admin@aurafit.com'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      alert("Credenciais inválidas.");
      setIsProcessing(false);
      return;
    }

    if (data.user && ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '')) {
      router.push('/admin/financeiro');
    } else {
      alert("Acesso negado: Você não possui privilégios administrativos.");
      await supabase.auth.signOut();
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Elementos de background para atmosfera de controle */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,58,138,0.15),_transparent_70%)]" />

      <div className="w-full max-w-[400px] z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">AURAFIT</h1>
          <p className="text-blue-500 font-bold text-[10px] uppercase tracking-[0.3em]">Painel Administrativo — Nível Root</p>
        </div>

        <form onSubmit={handleLogin} className="bg-neutral-950 p-8 rounded-[2rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="space-y-4 mb-8">
            <input 
              type="email" 
              placeholder="E-mail administrador" 
              className="w-full bg-white/5 border border-white/5 text-white px-5 py-4 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm font-medium placeholder:text-neutral-700" 
              onChange={e => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Senha de segurança" 
              className="w-full bg-white/5 border border-white/5 text-white px-5 py-4 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm font-medium placeholder:text-neutral-700" 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          <button 
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {isProcessing ? "Validando..." : "Autenticar Acesso"}
          </button>
        </form>

        <p className="text-center mt-8 text-[9px] text-neutral-600 font-bold uppercase tracking-[0.3em]">
          Ambiente restrito — Protocolo 2026-A
        </p>
      </div>
    </main>
  );
}