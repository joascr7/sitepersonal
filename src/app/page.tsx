'use client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-6">
      <div className="w-full max-w-[340px] flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)]">
        
        {/* Branding com efeito Premium */}
        <div className="mb-12 text-center">
          <h1 
            className="text-4xl font-black tracking-tighter mb-2"
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #00c6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))',
            }}
          >
            AURAFIT
          </h1>
          <p className="text-gray-400 font-medium text-xs tracking-widest uppercase">
            Selecione seu perfil
          </p>
        </div>
        
        {/* Ações */}
        <div className="w-full space-y-3">
          <button 
            onClick={() => router.push('/login-aluno')} 
            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-semibold text-sm transition-all duration-300 active:scale-[0.98] shadow-md shadow-gray-200"
          >
            Acesso Aluno
          </button>
          
          <button 
            onClick={() => router.push('/login-personal')} 
            className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-700 py-4 rounded-2xl font-semibold text-sm transition-all duration-300 active:scale-[0.98]"
          >
            Acesso Personal
          </button>
        </div>

        {/* Rodapé minimalista */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <div className="h-px w-10 bg-gray-100" />
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.25em]">
            Plataforma de Alta Performance
          </p>
        </div>
        
      </div>
    </main>
  );
}