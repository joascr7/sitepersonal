'use client';

import { useRouter } from 'next/navigation';

export default function PaginaInativa() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 text-center">
      <div className="w-full max-w-[340px] bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        <div className="text-4xl mb-6">🔒</div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
          Acesso Suspenso
        </h1>
        
        <p className="text-slate-500 text-xs leading-relaxed mb-8">
          Identificamos que seu acesso foi pausado pelo seu treinador. 
          Entre em contato para reativar sua jornada e continuar seus treinos.
        </p>

        <button 
          onClick={() => router.push('/login-aluno')}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]"
        >
          Voltar ao Login
        </button>
      </div>
    </main>
  );
}