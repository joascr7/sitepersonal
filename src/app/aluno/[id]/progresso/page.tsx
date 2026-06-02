'use client';
import { use } from 'react';
import DashboardPerformance from '@/components/DashboardPerformance';

export default function ProgressoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="min-h-screen bg-black p-6 md:p-10 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header alinhado ao padrão Dark Premium */}
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter">Meu Progresso</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">
            Análise de performance detalhada
          </p>
        </header>
        
        {/* Componente de Dashboard que já refatoramos */}
        <DashboardPerformance alunoId={id} />
      </div>
    </main>
  );
}