'use client';
import { use } from 'react';
import DashboardPerformance from '@/components/DashboardPerformance';

export default function ProgressoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    // pt-20: compensa o Header superior (AuraFit), pb-32: reserva o espaço da Navbar inferior
    <main className="w-full min-h-screen bg-black text-white pt-20 px-4 pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* Header alinhado ao padrão Dark Premium */}
        <header className="mb-10 px-2">
          <h1 className="text-4xl font-black tracking-tighter">Meu Progresso</h1>
          <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">
            Análise de performance detalhada
          </p>
        </header>
        
        {/* Componente de Dashboard que já refatoramos */}
        <DashboardPerformance alunoId={id} />

        {/* ESPAÇADOR DE SEGURANÇA: Garante scroll livre no final da página */}
        <div className="h-20 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}