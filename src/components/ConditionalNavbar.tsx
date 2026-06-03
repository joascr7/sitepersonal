'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

export default function ConditionalNavbar() {
  const pathname = usePathname();

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

  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // Envolvemos as navs em um container fixo no topo.
  // z-50 garante que ela fique acima de qualquer elemento da página.
  return (
    <div className="fixed top-0 left-0 w-full z-50">
      {pathname.startsWith('/aluno') || pathname.startsWith('/dashboard/aluno') ? (
        <NavbarAluno />
      ) : (
        <Navbar />
      )}
    </div>
  );
}