'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // EFEITO DE PERSISTÊNCIA: Se já escolheu antes, pula a tela!
  useEffect(() => {
    const tipoSalvo = localStorage.getItem('usuario_tipo');
    if (tipoSalvo) {
      router.push(tipoSalvo === 'aluno' ? '/login-aluno' : '/login-personal');
    }
  }, [router]);

  const handleNavigation = (path: string, tipo: 'aluno' | 'personal') => {
    setIsNavigating(path);
    // SALVA A ESCOLHA ANTES DE NAVEGAR
    localStorage.setItem('usuario_tipo', tipo);
    router.push(path);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-6">
      <div className="w-full max-w-[340px] flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Branding */}
        <div className="mb-12 text-center">
          <h1 
            className="text-4xl font-black tracking-tighter mb-2"
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #00c6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AURAFIT
          </h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase">
            Acesso ao Ecossistema
          </p>
        </div>
        
        {/* Ações com Feedback Visual */}
        <div className="w-full space-y-3">
          <button 
            onClick={() => handleNavigation('/login-aluno', 'aluno')} 
            disabled={!!isNavigating}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {isNavigating === '/login-aluno' ? "Autenticando..." : "Entrar como Aluno"}
          </button>
          
          <button 
            onClick={() => handleNavigation('/login-personal', 'personal')} 
            disabled={!!isNavigating}
            className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-slate-300 hover:text-slate-900 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {isNavigating === '/login-personal' ? "Redirecionando..." : "Entrar como Personal"}
          </button>
        </div>

        {/* Rodapé minimalista */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="h-px w-10 bg-slate-100" />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">
              Plataforma de Alta Performance
            </p>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Desenvolvido por {' '}
              <a 
                href="https://www.instagram.com/joas.vieira7" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-blue-500 transition-colors"
              >
                JOÁS VIEIRA
              </a>
            </p>
          </div>
        </div>
        
      </div>
    </main>
  );
}