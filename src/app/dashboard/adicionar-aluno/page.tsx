'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../actions/aluno';

export default function AdicionarAluno() {
  const [nome, setNome] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [linkPagamento, setLinkPagamento] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  const handleAddAluno = async () => {
    const nomeTrimmed = nome.trim();
    const emailTrimmed = email.trim();

    if (!nomeTrimmed || !emailTrimmed || !password) {
      alert('Por favor, preencha Nome, E-mail e Senha.');
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
      alert('Por favor, insira um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Você precisa estar logado como Personal.');
        router.push('/login-personal');
        return;
      }

      const result = await cadastrarAlunoAction({
        nome: nomeTrimmed, 
        objetivo, 
        email: emailTrimmed, 
        password, 
        telefone, 
        dataVencimento, 
        linkPagamento
      }, session.user.id);

      if (result.error) {
        alert('Erro no servidor: ' + result.error);
      } else {
        alert('Aluno criado com sucesso!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      alert('Erro inesperado ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <button 
          onClick={() => router.back()} 
          className="text-sm font-bold text-gray-400 hover:text-gray-900 transition mb-8"
        >
          ← Voltar
        </button>

        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tighter">Adicionar Aluno</h1>
        
        <div className="space-y-4">
          <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="Objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
          <input type="email" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="Senha Inicial" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="WhatsApp (telefone)" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Data de Vencimento</label>
            <input type="date" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
          </div>

          <input className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="Link de Pagamento" value={linkPagamento} onChange={(e) => setLinkPagamento(e.target.value)} />
          
          <button 
            onClick={handleAddAluno}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-2xl font-black transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400 mt-6"
          >
            {loading ? "Processando..." : "Salvar Aluno"}
          </button>
        </div>
      </div>
    </main>
  );
}