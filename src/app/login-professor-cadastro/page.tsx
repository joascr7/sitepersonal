'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CadastroProfessor() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cref, setCref] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Máscara fluida de telefone: (11) 99999-9999
  const formatarTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);
    
    if (limited.length <= 2) return limited ? `(${limited}` : '';
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handleSignUp = async () => {
    // Regex para validar: 000000-G/UF (ex: 123456-G/SP)
    const regexCref = /^\d{6}-[A-Z]\/[A-Z]{2}$/;
    const telefoneLimpo = telefone.replace(/\D/g, '');

    if (!nome.trim() || !email.trim() || !password || !cref.trim() || telefoneLimpo.length < 10) {
      alert('Por favor, preencha todos os campos corretamente.');
      return;
    }

    if (!regexCref.test(cref.trim().toUpperCase())) {
      alert('CREF inválido. Use o formato: 123456-G/SP');
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
          data: { nome: nome.trim(), role: 'personal' }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: dbError } = await supabase
          .from('personais')
          .insert({
            id: data.user.id,
            nome: nome.trim(),
            cref: cref.trim().toUpperCase(),
            email: email.trim(),
            telefone: `+55${telefoneLimpo}` // Salva no padrão E.164 internacional
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
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition" 
          placeholder="Nome Completo" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
        />
        
        <input 
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl outline-none uppercase focus:ring-2 focus:ring-black transition" 
          placeholder="CREF (123456-G/SP)" 
          value={cref} 
          onChange={(e) => setCref(e.target.value)} 
        />

        <input 
          type="tel"
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition" 
          placeholder="(00) 00000-0000" 
          value={telefone} 
          onChange={(e) => setTelefone(formatarTelefone(e.target.value))} 
        />
        
        <input 
          type="email" 
          className="w-full p-4 mb-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition" 
          placeholder="E-mail" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition" 
          type="password" 
          placeholder="Senha" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        
        <button 
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold transition-all hover:bg-gray-800 active:scale-[0.98] disabled:bg-gray-400"
        >
          {loading ? "Processando..." : "Finalizar Cadastro"}
        </button>
      </div>
    </main>
  );
}