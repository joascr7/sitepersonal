'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Lista de e-mails autorizados (Adicione quantos precisar)
  const ADMIN_EMAILS = ['contatojoasvieira6@gmail.com', 'admin@aurafit.com'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // 1. Autenticação no Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      alert("Credenciais inválidas.");
      setIsProcessing(false);
      return;
    }

    // 2. Verificação direta por E-mail (Sem consulta a tabelas externas)
    if (data.user && ADMIN_EMAILS.includes(data.user.email?.toLowerCase() || '')) {
      router.push('/admin/financeiro');
    } else {
      alert("Acesso negado: Você não possui privilégios administrativos.");
      await supabase.auth.signOut();
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">AURAFIT</h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em]">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1A1A1A] p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="space-y-4 mb-8">
            <input 
              type="email" 
              placeholder="E-mail administrador" 
              className="w-full bg-[#262626] text-white px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium" 
              onChange={e => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Senha de segurança" 
              className="w-full bg-[#262626] text-white px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium" 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          <button 
            disabled={isProcessing}
            className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {isProcessing ? "Validando..." : "Entrar no Sistema"}
          </button>
        </form>

        <p className="text-center mt-8 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
          Ambiente restrito e monitorado
        </p>
      </div>
    </main>
  );
}