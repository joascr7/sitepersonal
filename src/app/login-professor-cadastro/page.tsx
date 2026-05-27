'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CadastroProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cref, setCref] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!nome.trim() || !email.trim() || !password || !cref.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { 
            nome: nome.trim(),
            role: 'personal'
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: dbError } = await supabase
          .from('personais')
          .insert({
            id: data.user.id,
            nome: nome.trim(),
            cref: cref.trim(),
            email: email.trim()
          });

        if (dbError) throw dbError;
      }

      alert('Cadastro realizado com sucesso! Verifique seu e-mail.');
      router.push('/login-personal');
    } catch (err: any) {
      alert('Erro ao cadastrar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm text-center">
        <button onClick={() => router.back()} className="text-sm text-gray-400 mb-8 block hover:text-gray-600 transition">
          Voltar
        </button>
        
        <h1 className="text-xl font-black text-gray-900 mb-8">Criar conta de Personal</h1>
        
        <input 
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition" 
          placeholder="Nome Completo" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
        />
        
        <input 
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition" 
          placeholder="CREF (000000-G/UF)" 
          value={cref} 
          onChange={(e) => setCref(e.target.value)} 
        />
        
        <input 
          type="email" 
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition" 
          placeholder="E-mail" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition" 
          type="password" 
          placeholder="Senha" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button 
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? "Processando..." : "Finalizar Cadastro"}
        </button>
      </div>
    </main>
  );
}