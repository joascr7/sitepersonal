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

  // 2. Lógica de exclusão: 
  // Se a rota for exata ou iniciar com prefixos proibidos, não renderiza nada
  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // 3. Renderização flutuante (Fixed)
  // O container garante que a navbar flutue sobre o conteúdo sem empurrá-lo
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md">
      {pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno') ? (
        <NavbarAluno />
      ) : (
        <Navbar />
      )}
    </div>
  );
}