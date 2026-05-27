'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; // A sua navbar de Personal
import NavbarAluno from './NavbarAluno'; // Crie este arquivo com os links do aluno

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Rotas onde NENHUMA navbar deve aparecer
  const rotasSemNavbar = ['/', '/login-personal', '/login-aluno', '/login-professor-cadastro'];
  if (rotasSemNavbar.includes(pathname)) return null;

  // 2. Lógica de roteamento: 
  // Se a URL começa com "/aluno", mostra a barra do aluno
  if (pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno-view')) {
    return <NavbarAluno />;
  }

  // 3. Caso contrário, assume que é o Personal
  return <Navbar />;
}