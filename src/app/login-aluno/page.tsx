'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginAluno() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  
  const router = useRouter();

  const handleLogin = async () => {
    setIsProcessing(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error || !data.user) {
      setMessage({ type: 'error', text: "Credenciais inválidas. Verifique seus dados." });
      setIsProcessing(false);
      return;
    }

    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('ativo')
      .eq('id', data.user.id)
      .maybeSingle();

    if (alunoError || !aluno || aluno.ativo === false) {
      await supabase.auth.signOut();
      setMessage({ 
        type: 'error', 
        text: "Sua conta está inativa ou você não possui permissão de aluno. Contate seu treinador." 
      });
      setIsProcessing(false);
      return;
    }

    window.location.href = `/aluno/${data.user.id}`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Luzes de fundo para profundidade */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black -z-10" />
      
      <div className="w-full max-w-[360px] bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
        
        <button onClick={() => router.back()} className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-[0.2em] mb-8">
          ← Voltar
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-1">AURAFIT</h1>
          <p className="text-blue-500 font-bold text-[10px] tracking-[0.2em] uppercase">Área do Aluno</p>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <input 
            className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm text-white font-medium placeholder:text-neutral-600" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          <div className="relative w-full">
            <input 
              className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm text-white font-medium placeholder:text-neutral-600" 
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
          <span onClick={() => setMessage({ type: 'success', text: "Solicite a redefinição com seu treinador." })} className="text-[10px] font-bold text-neutral-500 hover:text-blue-400 underline cursor-pointer transition">
            Esqueceu a senha?
          </span>
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
        >
          {isProcessing ? "Validando acesso..." : "Entrar no sistema"}
        </button>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="w-full mt-3 bg-white/5 hover:bg-white/10 text-neutral-400 py-4 rounded-2xl font-bold text-sm transition-all duration-300"
        >
          Não tenho conta
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-neutral-950 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-sm font-black mb-2 uppercase tracking-widest text-white">Acesso Restrito</h3>
            <p className="text-neutral-400 mb-8 leading-relaxed text-xs">
              O seu cadastro é realizado exclusivamente pelo seu Personal Trainer. Entre em contato para ativar sua jornada na AuraFit.
            </p>
            <button onClick={() => setShowModal(false)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition">
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}