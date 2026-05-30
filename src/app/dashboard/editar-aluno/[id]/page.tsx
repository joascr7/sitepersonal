'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { cadastrarAlunoAction } from '../../../actions/aluno';

const InputField = ({ label, name, value, onChange, type = "text", placeholder }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>
    <input 
      name={name} type={type} placeholder={placeholder} value={value ?? ''} onChange={onChange}
      className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm font-medium"
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
        // Busca na tabela alunos
        const { data: aluno, error } = await supabase.from('alunos').select('*').eq('id', resolvedParams.id).single();
        
        // Busca o email na tabela profiles (assumindo que o ID do perfil é o mesmo do aluno)
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', resolvedParams.id).single();

        if (aluno) {
          setFormData({
            nome: aluno.nome || '',
            email: profile?.email || '', // Pega da tabela profiles
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

  // 1. Configuração de datas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVencimento = new Date(formData.dataVencimento + 'T00:00:00');
  
  // 2. Calcula a data limite (vencimento + 2 dias)
  const dataLimite = new Date(dataVencimento);
  dataLimite.setDate(dataLimite.getDate() + 2);
  dataLimite.setHours(0, 0, 0, 0);

  // 3. Lógica de Status:
  // - Bloqueado apenas se hoje for MAIOR que o limite de 2 dias.
  // - Caso contrário, mantemos 'ativo'.
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
        status_pagamento: novoStatus // <--- Agora respeita a tolerância
      }).eq('id', resolvedParams.id);
      
      if (error) throw error;
      showStatus('success', 'Dados e status atualizados.');
    }
  } catch (err: any) {
    showStatus('error', err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col items-center p-6 md:p-12">
      {statusMsg && (
        <div className={`fixed top-6 right-6 p-4 rounded-2xl shadow-2xl z-[100] text-[10px] font-black uppercase tracking-widest ${statusMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">{isEditing ? "Editar Aluno" : "Novo Aluno"}</h1>
        </header>
        
        <div className="space-y-5">
          <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={(e: any) => setFormData({...formData, nome: e.target.value})} />
          <InputField label="E-mail" name="email" type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
          {!isEditing && <InputField label="Senha Inicial" name="password" type="password" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="WhatsApp" name="telefone" value={formData.telefone} onChange={(e: any) => setFormData({...formData, telefone: e.target.value})} />
            <InputField label="Data de Vencimento" name="dataVencimento" type="date" value={formData.dataVencimento} onChange={(e: any) => setFormData({...formData, dataVencimento: e.target.value})} />
          </div>
          <InputField label="Objetivo" name="objetivo" value={formData.objetivo} onChange={(e: any) => setFormData({...formData, objetivo: e.target.value})} />
          <InputField label="Link de Pagamento" name="linkPagamento" type="url" value={formData.linkPagamento} onChange={(e: any) => setFormData({...formData, linkPagamento: e.target.value})} />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-10 bg-slate-900 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Processando..." : isEditing ? "Salvar Alterações" : "Confirmar Cadastro"}
        </button>
      </div>
    </main>
  );
}