'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Rotas onde nenhuma navbar deve aparecer
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

  // 2. Lógica de exclusão
  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // 3. Renderização simples.
  // IMPORTANTE: Removi a div "fixed top-0" daqui. 
  // O posicionamento (fixed) deve estar DENTRO do NavbarAluno e Navbar.
  // Isso evita que o ConditionalNavbar crie uma camada extra que causa o bug.
  return (
    <>
      {pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno') ? (
        <NavbarAluno />
      ) : (
        <Navbar />
      )}
    </>
  );
}