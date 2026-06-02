'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PaginaAntecipar() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState<any>(null);

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login-aluno'); return; }

      const { data, error } = await supabase
        .from('alunos')
        .select(`status_pagamento, personais(chave_pix, valor_mensalidade)`)
        .eq('id', session.user.id)
        .single();

      if (!error && data) setPersonal(data.personais);
      setLoading(false);
    };
    carregarDados();
  }, [router]);

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black">CARREGANDO...</main>;

  return (
    <main className="min-h-screen bg-black p-6 flex flex-col items-center justify-center text-white">
      <div className="max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-neutral-950/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black tracking-tighter">Renovação de Plano</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Status: Assinatura Pendente</p>
          </div>

          <div className="space-y-6 text-center">
            <div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Valor da Mensalidade</p>
              <p className="text-4xl font-black text-white">
                R$ {parseFloat(personal?.valor_mensalidade || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Chave PIX</p>
              <code className="text-blue-400 text-xs font-bold break-all">
                {personal?.chave_pix || "Não configurada"}
              </code>
            </div>

            <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-relaxed">
                Realize o PIX e envie o comprovante ao seu treinador para liberação imediata do seu acesso.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={async () => {
            const { data } = await supabase.auth.getSession();
            data?.session?.user.id ? router.push(`/aluno/${data.session.user.id}`) : router.push('/');
          }} 
          className="w-full mt-8 text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors"
        >
          Voltar para Perfil
        </button>
      </div>
    </main>
  );
}