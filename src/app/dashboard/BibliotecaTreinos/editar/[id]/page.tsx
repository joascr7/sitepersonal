'use client';
import { useParams } from 'next/navigation';
import FormularioModelo from '@/components/biblioteca/FormularioModelo';

export default function EditarModeloPage() {
  const params = useParams();
  // Passa o ID pela URL para o formulário saber que é uma edição
  return <FormularioModelo modeloIdEdit={params?.id as string} />;
}