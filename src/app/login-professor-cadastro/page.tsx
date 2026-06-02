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
        const { error: dbError } = await supabase
          .from('personais')
          .insert({
            id: data.user.id,
            nome: formData.nome.trim(),
            cref: formData.cref ? formData.cref.trim().toUpperCase() : null,
            email: formData.email.trim(),
            telefone: `+55${telefoneLimpo}`,
            ativo: true,
            status_pagamento: 'teste'
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
    <main className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Luzes de fundo */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[128px]" />
      
      <div className="w-full max-w-[400px] bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
        <button onClick={() => router.back()} className="text-[10px] font-bold text-neutral-500 hover:text-white uppercase tracking-[0.2em] mb-10 transition-colors">← Voltar</button>
        
        <h1 className="text-2xl font-black text-white mb-6 tracking-tight">Criar sua conta AuraFit</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-[10px] font-bold uppercase tracking-wider ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <input className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" placeholder="Nome Completo" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
          <input className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" placeholder="CREF (ex: 123456-G/SP)" value={formData.cref} onChange={(e) => setFormData({...formData, cref: e.target.value})} />
          <input className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" placeholder="(00) 00000-0000" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})} />
          <input type="email" className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" placeholder="E-mail profissional" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input type="password" className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-blue-500/50 transition-all text-sm text-white placeholder:text-neutral-600" placeholder="Senha segura" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>
        
        <button 
          onClick={handleSignUp}
          disabled={loading}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          {loading ? "Processando..." : "Finalizar Cadastro (10 dias grátis)"}
        </button>
      </div>
    </main>
  );
}