'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROTEADOR ESTRUTURAL DE NAVEGAÇÃO
// Gerencia a exibição condicional das barras de navegação sem criar 
// wrappers que quebrem o Safe Area mobile.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Rotas onde nenhuma navbar deve aparecer (Autenticação/Públicas)
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

  // 2. Lógica de exclusão baseada na rota
  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // 3. Renderização Condicional Limpa (Fragmentos evitam bugs de CSS/Z-Index)
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
