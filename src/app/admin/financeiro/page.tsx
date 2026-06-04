'use client';
import { useState, useEffect } from 'react';
import ControleFinanceiroPainel from '@/components/ControleFinanceiroPainel';

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-[100dvh] bg-[var(--bg)] transition-colors duration-500">
      {/* Container principal que centraliza e dá respiro ao painel */}
      <div className="max-w-7xl mx-auto px-5 py-10 sm:py-16 animate-in fade-in duration-700">
        <ControleFinanceiroPainel />
      </div>
    </main>
  );
}