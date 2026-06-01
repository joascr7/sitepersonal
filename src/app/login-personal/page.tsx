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

  // LIMPEZA: Ao carregar a página de login, descartamos qualquer sessão corrompida.
  // Isso resolve o erro 'refresh_token_not_found' que ocorre ao tentar recuperar sessões inválidas.
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  const handleLogin = async () => {
    setIsProcessing(true);
    setMessage(null);

    // 1. Autenticação
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error || !data.user) {
      setMessage({ type: 'error', text: "E-mail ou senha incorretos." });
      setIsProcessing(false);
      return;
    }

    // 2. Lógica de Administrador
    if (email.trim().toLowerCase() === 'contatojoasvieira6@gmail.com') {
      window.location.href = '/dashboard'; 
      return;
    }

    // 3. Verifica perfil na tabela 'personais'
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

    // 4. Sucesso - Redirecionamento forçado
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
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-[360px] bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <button onClick={() => router.back()} className="text-[10px] font-bold text-gray-400 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] mb-10">
          ← Voltar
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">AURAFIT</h1>
          <p className="text-slate-500 font-bold text-[10px] tracking-[0.2em] uppercase">Área do Professor</p>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm font-medium" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          <div className="relative w-full">
            <input 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm font-medium" 
              type={showPass ? "text" : "password"} 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button" 
              className="absolute right-4 top-3.5 text-[10px] font-black text-gray-400 hover:text-slate-900 uppercase tracking-widest"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Ocultar" : "Exibir"}
            </button>
          </div>
        </div>
        
        <div className="mt-4 mb-8 text-center">
          <span onClick={handleResetPassword} className="text-[10px] font-bold text-gray-400 hover:text-blue-600 underline cursor-pointer transition">
            Esqueceu a senha?
          </span>
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={isProcessing}
          className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isProcessing ? "Validando acesso..." : "Entrar no sistema"}
        </button>
        
        <button 
          onClick={() => router.push('/login-professor-cadastro')} 
          className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-slate-600 py-4 rounded-xl font-bold text-sm transition-all"
        >
          Criar nova conta
        </button>
      </div>
    </main>
  );
}