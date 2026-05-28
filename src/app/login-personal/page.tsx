'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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

    if (profileError || !profile) {
      alert("Erro ao verificar perfil. Contate o suporte.");
      await supabase.auth.signOut();
      return;
    }

    if (profile.role !== 'personal') {
      await supabase.auth.signOut(); 
      alert("Acesso negado: Esta página é exclusiva para professores.");
      return;
    }

    router.push('/dashboard');
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
          <p className="text-gray-400 font-medium text-sm">Área do Professor</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/5 outline-none transition-all placeholder:text-gray-400 text-sm font-medium" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          <div className="relative w-full">
            <input 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/5 outline-none transition-all placeholder:text-gray-400 text-sm font-medium" 
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
          <span onClick={handleResetPassword} className="text-xs font-bold text-gray-400 hover:text-gray-900 underline cursor-pointer transition">
            Esqueceu a senha?
          </span>
        </div>
        
        <button 
          onClick={handleLogin} 
          className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        >
          Entrar no sistema
        </button>
        
        <button 
          onClick={() => router.push('/login-professor-cadastro')} 
          className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-gray-600 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
        >
          Criar nova conta
        </button>
      </div>
    </main>
  );
}