'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AcessoPersonal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Verificação simples de autenticação ao carregar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login-personal');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  // Agora este botão apenas encaminha para a sua nova página "Elite"
  const handleIrParaAssinatura = () => {
    router.push('/planos');
  };

  if (loading) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6 text-center">
      <div className="max-w-md w-full bg-white p-12 rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_rgba(8,11,18,0.07)]">
        
        {/* Ícone de bloqueio minimalista */}
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
            <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </div>

        <h1 className="text-2xl font-black text-slate-950 mb-4">Acesso Limitado</h1>
        <p className="text-sm text-slate-500 mb-10 leading-relaxed">
          Seu período de teste encerrou. Para continuar utilizando a inteligência AuraFit Pro, selecione um plano e ative sua assinatura.
        </p>
        
        <button 
          onClick={handleIrParaAssinatura}
          className="w-full bg-slate-950 text-white py-5 rounded-[1rem] font-bold uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-[0.98]"
        >
          Ver Planos e Assinar
        </button>

        <button 
          onClick={() => router.push('/login-personal')}
          className="w-full mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
        >
          Voltar ao Login
        </button>
      </div>
    </main>
  );
}