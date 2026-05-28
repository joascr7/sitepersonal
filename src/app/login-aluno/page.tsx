'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginAluno() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle(); 

    if (profileError || !profile || profile.role === 'personal') {
      await supabase.auth.signOut();
      alert("Acesso negado: Esta página é exclusiva para alunos.");
      return;
    }

    router.push(`/aluno/${data.user.id}`);
    router.refresh();
  };

  const handleResetPassword = async () => {
    const emailReset = prompt("Digite seu e-mail para receber o link de recuperação:");
    if (emailReset) {
      const { error } = await supabase.auth.resetPasswordForEmail(emailReset, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });
      if (error) alert(error.message);
      else alert('Link de recuperação enviado para seu e-mail!');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-[360px] bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)]">
        
        <button onClick={() => router.back()} className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em] mb-10">
          ← Voltar
        </button>
        
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tighter mb-1">AURAFIT</h1>
          <p className="text-blue-600 font-bold text-xs tracking-widest uppercase">Área do Aluno</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 text-sm font-medium" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          <div className="relative w-full">
            <input 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 text-sm font-medium" 
              type={showPass ? "text" : "password"} 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button" 
              className="absolute right-4 top-3.5 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Ocultar" : "Exibir"}
            </button>
          </div>
        </div>
        
        <div className="mt-4 mb-8 text-center">
          <span onClick={handleResetPassword} className="text-xs font-bold text-gray-400 hover:text-blue-600 underline cursor-pointer transition">
            Esqueceu a senha?
          </span>
        </div>
        
        <button 
          onClick={handleLogin} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        >
          Entrar no sistema
        </button>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-gray-600 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        >
          Não tenho conta
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black mb-4 text-gray-900">Acesso exclusivo</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-sm">
              O seu cadastro deve ser realizado diretamente pelo seu personal trainer. Entre em contato com ele para solicitar o seu acesso.
            </p>
            <button 
              onClick={() => setShowModal(false)} 
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}