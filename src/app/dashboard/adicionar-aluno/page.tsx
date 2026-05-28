'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../actions/aluno';

export default function AdicionarAluno() {
  const [formData, setFormData] = useState({
    nome: '', objetivo: '', email: '', password: '', telefone: '', dataVencimento: '', linkPagamento: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const formatarTelefone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'telefone' ? formatarTelefone(value) : value
    }));
  };

  const handleAddAluno = async () => {
    if (!formData.nome.trim() || !formData.email.trim() || !formData.password) {
      return; // Em um SaaS Premium, usaríamos um Toast componente aqui em vez de alert
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const result = await cadastrarAlunoAction({
        ...formData,
        telefone: formData.telefone.replace(/\D/g, '')
      }, session.user.id);

      if (result.error) throw new Error(result.error);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-1">{label}</label>
      <input 
        {...props} 
        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/5 transition-all placeholder:text-gray-400 font-medium text-sm"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
        <header className="mb-10">
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Adicionar Aluno</h1>
          <p className="text-gray-500 text-sm mt-1">Preencha as informações do novo aluno.</p>
        </header>
        
        <div className="space-y-8">
          {/* Seção Acesso */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Acesso</h2>
            <InputField label="E-mail" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="exemplo@email.com" />
            <InputField label="Senha" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
          </section>

          <div className="h-px bg-gray-100" />

          {/* Seção Perfil */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Perfil</h2>
            <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome do aluno" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="WhatsApp" name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
              <InputField label="Vencimento" name="dataVencimento" type="date" value={formData.dataVencimento} onChange={handleInputChange} />
            </div>
            <InputField label="Objetivo" name="objetivo" value={formData.objetivo} onChange={handleInputChange} placeholder="Hipertrofia, emagrecimento..." />
            <InputField label="Link de Pagamento" name="linkPagamento" value={formData.linkPagamento} onChange={handleInputChange} placeholder="https://..." />
          </section>
        </div>

        <button 
          onClick={handleAddAluno}
          disabled={loading}
          className="w-full mt-10 bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Cadastrando..." : "Confirmar Cadastro"}
        </button>
      </div>
    </main>
  );
}