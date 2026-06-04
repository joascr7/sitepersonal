'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar'; 
import NavbarAluno from './NavbarAluno'; 

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROTEADOR ESTRUTURAL DE NAVEGAÇÃO
// Este componente gerencia a exibição condicional das barras de navegação
// garantindo que não crie camadas extras de layout (wrapper divs) 
// que possam quebrar o Safe Area ou o scroll nativo.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // 1. Rotas onde nenhuma navbar deve aparecer (Telas de Autenticação/Públicas)
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

  // 2. Lógica de exclusão baseada na rota atual
  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // 3. Renderização Condicional Limpa
  // IMPORTANTE: O posicionamento (fixed/sticky) e o Safe Area insets
  // são tratados internamente pelos componentes <NavbarAluno /> e <Navbar />.
  // O uso do Fragment (<></>) previne bugs de sobreposição de camadas de renderização.
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
