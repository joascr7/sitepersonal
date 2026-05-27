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

    if (profileError || !profile) {
      alert("Erro ao verificar perfil.");
      await supabase.auth.signOut();
      return;
    }

    if (profile.role === 'personal') {
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
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm text-center">
        <button onClick={() => router.back()} className="text-sm text-gray-400 mb-8 block hover:text-gray-600 transition">
          Voltar
        </button>
        
        <h1 className="text-xl font-black text-gray-900 mb-1">EVOFIT</h1>
        <h2 className="text-blue-600 font-bold mb-8">Área do Aluno</h2>
        
        <input 
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
          placeholder="E-mail" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <div className="relative w-full mb-2">
          <input 
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
            type={showPass ? "text" : "password"} 
            placeholder="Senha" 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="button" 
            className="absolute right-4 top-4 text-gray-400 font-bold text-sm"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? "Ocultar" : "Exibir"}
          </button>
        </div>
        
        <p className="text-sm mb-8 mt-2 text-gray-500">
          Esqueceu a senha? 
          <span onClick={handleResetPassword} className="font-bold underline cursor-pointer ml-1 text-blue-600">Recuperar</span>
        </p>
        
        <button 
          onClick={handleLogin} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold mb-4 transition-all active:scale-[0.98] shadow-sm"
        >
          Entrar
        </button>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 py-4 rounded-xl font-bold transition-all active:scale-[0.98]"
        >
          Não tenho uma conta
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center border border-gray-100">
            <h3 className="text-lg font-black mb-4 text-gray-900">Acesso exclusivo</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              O seu cadastro deve ser realizado diretamente pelo seu personal trainer. Entre em contato com ele para solicitar o seu acesso.
            </p>
            <button 
              onClick={() => setShowModal(false)} 
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}