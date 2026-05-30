'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

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

    // 1. Autenticação inicial
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error || !data.user) {
      setMessage({ type: 'error', text: "Credenciais inválidas. Verifique seus dados." });
      setIsProcessing(false);
      return;
    }

    // 2. Verificar se é perfil aluno e se está ATIVO
    const { data: aluno, error: alunoError } = await supabase
      .from('alunos')
      .select('ativo, id')
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

    // 3. Login autorizado: SALVA A PERSISTÊNCIA DO TIPO DE USUÁRIO
    localStorage.setItem('usuario_tipo', 'aluno');
    
    router.push(`/aluno/${data.user.id}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-[360px] bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        <button onClick={() => router.back()} className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.2em] mb-10">
          ← Voltar
        </button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1">AURAFIT</h1>
          <p className="text-blue-600 font-bold text-[10px] tracking-[0.2em] uppercase">Área do Aluno</p>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-medium" 
            placeholder="E-mail" 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          <div className="relative w-full">
            <input 
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-medium" 
              type={showPass ? "text" : "password"} 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button 
              type="button" 
              className="absolute right-4 top-3.5 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Ocultar" : "Exibir"}
            </button>
          </div>
        </div>
        
        <div className="mt-4 mb-8 text-center">
          <span onClick={() => setMessage({ type: 'success', text: "Solicite a redefinição com seu treinador." })} className="text-[10px] font-bold text-gray-400 hover:text-blue-600 underline cursor-pointer transition">
            Esqueceu a senha?
          </span>
        </div>
        
        <button 
          onClick={handleLogin} 
          disabled={isProcessing}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isProcessing ? "Validando acesso..." : "Entrar no sistema"}
        </button>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="w-full mt-3 bg-gray-50 hover:bg-gray-100 text-gray-600 py-4 rounded-xl font-bold text-sm transition-all"
        >
          Não tenho conta
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <h3 className="text-sm font-black mb-2 uppercase tracking-widest text-slate-900">Acesso Restrito</h3>
            <p className="text-gray-500 mb-8 leading-relaxed text-xs">
              O seu cadastro é realizado exclusivamente pelo seu Personal Trainer. Entre em contato para ativar sua jornada na AuraFit.
            </p>
            <button onClick={() => setShowModal(false)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition">
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}