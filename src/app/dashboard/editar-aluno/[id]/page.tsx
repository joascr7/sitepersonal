'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../../actions/aluno';

const InputField = ({ label, name, value, onChange, type = "text", placeholder }: any) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] px-1">
      {label}
    </label>
    <input 
      name={name} type={type} placeholder={placeholder} value={value ?? ''} onChange={onChange}
      className="block w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold text-white placeholder:text-neutral-700"
    />
  </div>
);

export default function FormularioAluno({ params }: { params?: Promise<{ id?: string }> }) {
  const resolvedParams = params ? use(params) : null;
  const isEditing = !!resolvedParams?.id;
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nome: '', objetivo: '', email: '', password: '', telefone: '', dataVencimento: '', linkPagamento: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (isEditing && resolvedParams?.id) {
      const fetchAluno = async () => {
        const { data: aluno } = await supabase.from('alunos').select('*').eq('id', resolvedParams.id).single();
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', resolvedParams.id).single();
        if (aluno) {
          setFormData({
            nome: aluno.nome || '',
            email: profile?.email || '',
            objetivo: aluno.objetivo || '',
            telefone: aluno.telefone || '',
            dataVencimento: aluno.data_vencimento?.split('T')[0] || '',
            linkPagamento: aluno.link_pagamento || '',
            password: ''
          });
        }
      };
      fetchAluno();
    }
  }, [isEditing, resolvedParams?.id]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.email) {
      showStatus('error', 'Preencha ao menos nome e e-mail.');
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(formData.dataVencimento + 'T00:00:00');
    const dataLimite = new Date(dataVencimento);
    dataLimite.setDate(dataLimite.getDate() + 2);
    dataLimite.setHours(0, 0, 0, 0);

    const novoStatus = hoje > dataLimite ? 'bloqueado' : 'ativo';

    setLoading(true);
    try {
      if (isEditing && resolvedParams?.id) {
        const { error } = await supabase.from('alunos').update({
          nome: formData.nome,
          objetivo: formData.objetivo,
          telefone: formData.telefone,
          data_vencimento: formData.dataVencimento,
          link_pagamento: formData.linkPagamento,
          status_pagamento: novoStatus
        }).eq('id', resolvedParams.id);
        
        if (error) throw error;
        showStatus('success', 'Dados e status atualizados.');
      } else {
        // Lógica de cadastro (Action original)
        const { data: { session } } = await supabase.auth.getSession();
        await cadastrarAlunoAction({ ...formData }, session?.user.id || '');
        router.push('/dashboard');
      }
    } catch (err: any) {
      showStatus('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // PT-20: Reserva o topo para o Header AuraFit
    // PB-32: Reserva a base para a Navbar inferior fixa
    <main className="w-full min-h-screen bg-black flex flex-col items-center px-4 pt-20 pb-32">
      
      {/* Toast de status */}
      {statusMsg && (
        <div className={`fixed top-24 right-6 p-4 rounded-2xl shadow-2xl z-[100] text-[10px] font-black uppercase tracking-widest ${statusMsg.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="w-full max-w-lg bg-neutral-950/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tighter">{isEditing ? "Editar Aluno" : "Novo Aluno"}</h1>
        </header>
        
        <div className="space-y-6">
          <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={(e: any) => setFormData({...formData, nome: e.target.value})} />
          <InputField label="E-mail" name="email" type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
          {!isEditing && <InputField label="Senha Inicial" name="password" type="password" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="WhatsApp" name="telefone" value={formData.telefone} onChange={(e: any) => setFormData({...formData, telefone: e.target.value})} />
            <InputField label="Vencimento" name="dataVencimento" type="date" value={formData.dataVencimento} onChange={(e: any) => setFormData({...formData, dataVencimento: e.target.value})} />
          </div>
          
          <InputField label="Objetivo" name="objetivo" value={formData.objetivo} onChange={(e: any) => setFormData({...formData, objetivo: e.target.value})} />
          <InputField label="Link de Pagamento" name="linkPagamento" type="url" value={formData.linkPagamento} onChange={(e: any) => setFormData({...formData, linkPagamento: e.target.value})} />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-10 bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Processando..." : isEditing ? "Salvar Alterações" : "Confirmar Cadastro"}
        </button>

        {/* ESPAÇADOR DE SEGURANÇA: Garante scroll livre no final da página */}
        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}