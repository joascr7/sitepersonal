'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../actions/aluno';

const InputField = ({ label, name, value, onChange, type = "text", placeholder, autoComplete }: any) => (
  <div className="flex flex-col gap-2 w-full min-w-0">
    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1 truncate">
      {label}
    </label>
    <input 
      name={name}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="block w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold text-white placeholder:text-neutral-700 box-border"
    />
  </div>
);

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
    if (!formData.nome.trim() || !formData.email.trim() || !formData.password) return;

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
      alert(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    // pt-20: compensa o Header superior (AuraFit), pb-32: compensa a Navbar inferior
    <main className="w-full min-h-screen bg-black flex flex-col items-center px-4 pt-20 pb-32 box-border text-white">
      
      <div className="w-full max-w-lg bg-neutral-950/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl box-border">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tighter">Adicionar Aluno</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Preencha os dados do novo membro</p>
        </header>
        
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Acesso</h2>
            <InputField label="E-mail" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} placeholder="aluno@email.com" />
            <InputField label="Senha" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
          </section>

          <div className="h-px bg-white/5" />

          <section className="space-y-4">
            <h2 className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Perfil</h2>
            <InputField label="Nome Completo" name="nome" autoComplete="name" value={formData.nome} onChange={handleInputChange} placeholder="Nome do aluno" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="WhatsApp" name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
              <InputField label="Vencimento" name="dataVencimento" type="date" value={formData.dataVencimento} onChange={handleInputChange} />
            </div>
            
            <InputField label="Objetivo" name="objetivo" value={formData.objetivo} onChange={handleInputChange} placeholder="Ex: Hipertrofia" />
            <InputField label="Link de Pagamento" name="linkPagamento" type="url" value={formData.linkPagamento} onChange={handleInputChange} placeholder="https://..." />
          </section>
        </div>

        <button 
          onClick={handleAddAluno}
          disabled={loading}
          className="w-full mt-10 bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Cadastrando..." : "Confirmar Cadastro"}
        </button>

        {/* ESPAÇADOR DE SEGURANÇA: Garante que o scroll ultrapasse a Navbar inferior */}
        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}