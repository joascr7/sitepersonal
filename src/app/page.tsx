'use client';
import { useRouter } from 'next/navigation';

export default function page() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm p-10 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">
            EVOFIT
          </h1>
          <p className="text-gray-500 font-medium text-sm">Selecione seu perfil de acesso</p>
        </div>
        
        <button 
          onClick={() => router.push('/login-aluno')} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm mb-4 flex items-center justify-center gap-2"
        >
          Acesso Aluno
        </button>
        
        <button 
          onClick={() => router.push('/login-personal')} 
          className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm"
        >
          Sou Personal Trainer
        </button>

        <p className="mt-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Plataforma de alta performance
        </p>
      </div>
    </main>
  );
}