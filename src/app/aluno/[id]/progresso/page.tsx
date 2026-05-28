'use client';
import { use } from 'react';
import DashboardPerformance from '@/components/DashboardPerformance';

export default function ProgressoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <h1 className="text-2xl font-black mb-6">Progresso do Aluno</h1>
      {/* Aqui estamos passando o id para o componente */}
      <DashboardPerformance alunoId={id} />
    </main>
  );
}