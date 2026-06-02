'use client';

import { useRouter } from 'next/navigation';

export default function PaginaInativa() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-black p-6 text-center relative overflow-hidden">
      {/* Elemento de luz de fundo para um tom dramático */}
      <div className="absolute top-0 w-full h-[50vh] bg-blue-900/5 blur-[128px] -z-10" />
      
      <div className="w-full max-w-[340px] bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        <div className="text-4xl mb-6">🔒</div>
        
        <h1 className="text-2xl font-black text-white mb-4 tracking-tight">
          Acesso Suspenso
        </h1>
        
        <p className="text-neutral-400 text-xs leading-relaxed mb-8">
          Identificamos que seu acesso foi pausado pelo seu treinador. 
          Entre em contato para reativar sua jornada e continuar seus treinos.
        </p>

        <button 
          onClick={() => router.push('/login-aluno')}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          Voltar ao Login
        </button>
      </div>
    </main>
  );
}