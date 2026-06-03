'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Definição de rotas exatas que não exibem nav
  const rotasExclusao = [
    '/', 
    '/login-personal', 
    '/login-aluno', 
    '/login-professor-cadastro', 
    '/nova-senha',
    '/login-admin',
    '/planos',
    '/acesso-personal'
  ];

  // 2. Lógica de bloqueio: 
  // - Rotas de exclusão exata
  // - Qualquer coisa dentro de /admin
  // - O início do processo de pagamento
  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // 3. Lógica de roteamento para Aluno
  // Agora pega qualquer rota que comece com /aluno ou /dashboard/aluno
  if (pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno')) {
    return <NavbarAluno />;
  }

  // 4. Caso padrão (Personal)
  return <Navbar />;
}