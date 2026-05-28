'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Defina aqui as rotas que não devem exibir nenhuma barra de navegação
  const rotasSemNavbar = [
    '/', 
    '/login-personal', 
    '/login-aluno', 
    '/login-professor-cadastro', 
    '/nova-senha'
  ];

  // Se a rota atual estiver na lista de exclusão, não renderiza nada
  if (rotasSemNavbar.includes(pathname)) {
    return null;
  }

  // 2. Lógica de roteamento: 
  // Se for uma rota de aluno, renderiza a Navbar do Aluno
  if (pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno-view')) {
    return <NavbarAluno />;
  }

  // 3. Caso contrário, renderiza a Navbar do Personal
  // Esta Navbar já deve conter internamente o seu LogoutButton (apenas uma vez)
  return <Navbar />;
}