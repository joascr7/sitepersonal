'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Page() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const tipoSalvo = localStorage.getItem('usuario_tipo');
      if (tipoSalvo) {
        router.push(tipoSalvo === 'aluno' ? '/login-aluno' : '/login-personal');
      }
    };
    checkSessionAndRedirect();
  }, [router]);

  const handleNavigation = (path: string, tipo: 'aluno' | 'personal') => {
    setIsNavigating(path);
    localStorage.setItem('usuario_tipo', tipo);
    router.push(path);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-6 relative overflow-hidden">
      {/* Elementos de fundo para profundidade premium */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />

      {/* Card principal com Glassmorphism */}
      <div className="w-full max-w-[340px] flex flex-col items-center p-8 bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] z-10">
        
        {/* Branding */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tighter mb-2 text-white drop-shadow-2xl">
            AURA<span className="text-blue-500">FIT</span>
          </h1>
          <div className="w-16 h-1 bg-blue-500/50 mx-auto rounded-full mt-2" />
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.4em] uppercase mt-6">
            Plataforma de Alta Performance
          </p>
        </div>
        
        {/* Ações */}
        <div className="w-full space-y-4">
          <button 
            onClick={() => handleNavigation('/login-aluno', 'aluno')} 
            disabled={!!isNavigating}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.97] shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            {isNavigating === '/login-aluno' ? "Autenticando..." : "Entrar como Aluno"}
          </button>
          
          <button 
            onClick={() => handleNavigation('/login-personal', 'personal')} 
            disabled={!!isNavigating}
            className="w-full bg-white/5 border border-white/10 text-white/70 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-[0.97]"
          >
            {isNavigating === '/login-personal' ? "Redirecionando..." : "Painel do Personal"}
          </button>
        </div>

        {/* Rodapé */}
        <div className="mt-16 text-center">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">
            Acesso ao Ecossistema
          </p>
          <a 
            href="https://www.instagram.com/joas.vieira7" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[8px] font-bold text-slate-500 hover:text-blue-400 uppercase tracking-[0.2em] transition-colors"
          >
            Desenvolvido por Joás Vieira
          </a>
        </div>
      </div>
    </main>
  );
}