'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  const handleLogin = async () => {
    setIsProcessing(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error || !data.user) {
      setMessage({ type: 'error', text: "E-mail ou senha incorretos." });
      setIsProcessing(false);
      return;
    }

    if (email.trim().toLowerCase() === 'contatojoasvieira6@gmail.com') {
      window.location.href = '/dashboard'; 
      return;
    }

    const { data: personal, error: profileError } = await supabase
      .from('personais')
      .select('id, ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !personal) {
      await supabase.auth.signOut();
      setMessage({ type: 'error', text: "Acesso restrito: Você não possui permissão de professor." });
      setIsProcessing(false);
      return;
    }

    if (personal.ativo === false) {
      await supabase.auth.signOut();
      setMessage({ type: 'error', text: "Sua conta está inativa. Entre em contato com o suporte." });
      setIsProcessing(false);
      return;
    }

    window.location.href = '/dashboard';
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: "Informe seu e-mail para recuperar a senha." });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    if (error) setMessage({ type: 'error', text: error.message });
    else setMessage({ type: 'success', text: "Link de recuperação enviado ao seu e-mail!" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Luz de fundo decorativa */}
      <div className="absolute w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[150px] -z-10" />
      
      <div className="w-full max-w-[360px] bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
        <button onClick={() => router.back()} className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-[0.2em] mb-10">
          ← Voltar
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-1">AURAFIT</h1>
          <p className="text-blue-500 font-bold text-[10px] tracking-[0.2em] uppercase">Área do Professor</p>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-4">
          <input 
            className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white font-medium placeholder:text-neutral-600" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          <div className="relative w-full">
            <input 
              className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white font-medium placeholder:text-neutral-600" 
              type={showPass ? "text" : "password"} 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button" 
              className="absolute right-5 top-4.5 text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-widest"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Ocultar" : "Exibir"}
            </button>
          </div>
        </div>
        
        <div className="mt-4 mb-8 text-center">
          <span onClick={handleResetPassword} className="text-[10px] font-bold text-neutral-500 hover:text-blue-400 underline cursor-pointer transition">
            Esqueceu a senha?
          </span>
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          {isProcessing ? "Validando acesso..." : "Entrar no sistema"}
        </button>
        
        <button 
          onClick={() => router.push('/login-professor-cadastro')} 
          className="w-full mt-3 bg-white/5 hover:bg-white/10 text-neutral-400 py-4 rounded-2xl font-bold text-sm transition-all"
        >
          Criar nova conta
        </button>
      </div>
    </main>
  );
}