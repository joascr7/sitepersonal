'use client';
import { Suspense } from 'react';
import { BibliotecaHub } from './BibliotecaHub'; // Importação nomeada

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black">Carregando Biblioteca...</div>}>
      <BibliotecaHub />
    </Suspense>
  );
}