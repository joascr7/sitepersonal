// src/app/admin/page.tsx
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Sempre que alguém entrar em /admin, ele é mandado para o financeiro
  // Mas a URL que o usuário vê é muito mais simples.
  redirect('/admin/financeiro?aba=gestao');
}