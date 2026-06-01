'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Rotas que não devem exibir nenhuma barra de navegação
  // Adicionamos /planos e /pagamento aqui para que fiquem focadas no checkout
  const rotasSemNavbar = [
    '/', 
    '/login-personal', 
    '/login-aluno', 
    '/login-professor-cadastro', 
    '/nova-senha',
    '/login-admin',
    '/planos',      // Nova página Elite
    '/pagamento',   // Nova página de Checkout
    '/acesso-personal' // Página de bloqueio
  ];

  // 2. Se a rota estiver na lista de exclusão OU começar com /admin, não renderiza nada.
  if (rotasSemNavbar.includes(pathname) || pathname.startsWith('/admin')) {
    return null;
  }

  // 3. Lógica de roteamento para Aluno
  // Mantemos o padrão atual para os seus alunos
  if (pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno-view')) {
    return <NavbarAluno />;
  }

  // 4. Caso padrão (Personal logado no sistema)
  return <Navbar />;
}