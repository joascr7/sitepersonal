'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CadastroProfessor() {
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', cref: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const router = useRouter();

  const formatarTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);
    if (limited.length <= 2) return limited ? `(${limited}` : '';
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handleSignUp = async () => {
    const telefoneLimpo = formData.telefone.replace(/\D/g, '');
    const regexCref = /^\d{6}-[A-Z]\/[A-Z]{2}$/;

    if (!formData.nome.trim() || !formData.email.trim() || formData.password.length < 6 || telefoneLimpo.length < 10) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios corretamente.' });
      return;
    }

    if (formData.cref && !regexCref.test(formData.cref.trim().toUpperCase())) {
      setMessage({ type: 'error', text: 'Formato de CREF inválido. Use: 123456-G/UF' });
      return;
    }

    setLoading(true);
    setMessage(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: { data: { nome: formData.nome.trim(), role: 'personal' } }
      });

      if (authError) throw authError;

      if (data.user) {
        // Inserção com lógica de 10 dias grátis aplicada automaticamente pelo banco
        const { error: dbError } = await supabase
          .from('personais')
          .insert({
            id: data.user.id,
            nome: formData.nome.trim(),
            cref: formData.cref ? formData.cref.trim().toUpperCase() : null,
            email: formData.email.trim(),
            telefone: `+55${telefoneLimpo}`,
            ativo: true, // Libera acesso imediato para o teste
            status_pagamento: 'teste' // Marca como em período de teste
          });

        if (dbError) throw dbError;
      }

      setMessage({ type: 'success', text: 'Cadastro realizado! Seu período de 10 dias grátis foi liberado.' });
      setTimeout(() => router.push('/login-personal'), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao processar cadastro.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
      <div className="w-full max-w-[360px] bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <button onClick={() => router.back()} className="text-[10px] font-bold text-gray-400 hover:text-slate-900 uppercase tracking-[0.2em] mb-10">← Voltar</button>
        
        <h1 className="text-xl font-black text-slate-900 mb-6">Criar sua conta AuraFit</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <input className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm" placeholder="Nome Completo" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          <input className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm" placeholder="CREF (Opcional: 123456-G/SP)" value={formData.cref} onChange={(e) => setFormData({...formData, cref: e.target.value})} />
          <input className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm" placeholder="(00) 00000-0000" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})} />
          <input type="email" className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm" placeholder="E-mail profissional" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" className="w-full p-4 border border-gray-100 rounded-xl outline-none focus:border-slate-900 transition-all text-sm" placeholder="Senha segura" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>
        
        <button 
          onClick={handleSignUp}
          disabled={loading}
          className="w-full mt-8 bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Processando..." : "Finalizar Cadastro (10 dias grátis)"}
        </button>
      </div>
    </main>
  );
}