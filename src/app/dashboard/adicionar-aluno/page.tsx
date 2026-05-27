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

  // Máscara profissional de telefone
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
      alert('Campos obrigatórios: Nome, E-mail e Senha.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const result = await cadastrarAlunoAction({
        ...formData,
        telefone: formData.telefone.replace(/\D/g, '') // Limpa para salvar padrão E.164
      }, session.user.id);

      if (result.error) throw new Error(result.error);

      alert('Aluno cadastrado com sucesso!');
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, ...props }: any) => (
    <div className="w-full">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{label}</label>
      <input 
        {...props} 
        className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition-all placeholder:text-gray-300"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tighter">Novo Aluno</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Ex: João Silva" />
          </div>
          
          <InputField label="E-mail de Acesso" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="joao@email.com" />
          <InputField label="Senha Inicial" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
          
          <InputField label="WhatsApp" name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
          <InputField label="Data de Vencimento" name="dataVencimento" type="date" value={formData.dataVencimento} onChange={handleInputChange} />
          
          <div className="col-span-2">
            <InputField label="Objetivo" name="objetivo" value={formData.objetivo} onChange={handleInputChange} placeholder="Ex: Hipertrofia, Emagrecimento..." />
            <div className="mt-4">
              <InputField label="Link de Pagamento (URL)" name="linkPagamento" value={formData.linkPagamento} onChange={handleInputChange} placeholder="https://pay.exemplo.com/..." />
            </div>
          </div>
        </div>

        <button 
          onClick={handleAddAluno}
          disabled={loading}
          className="w-full mt-10 bg-gray-900 hover:bg-black text-white p-5 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
        >
          {loading ? "Processando..." : "Confirmar Cadastro"}
        </button>
      </div>
    </main>
  );
}