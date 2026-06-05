'use client';
import { useEffect, useState } from 'react';
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

  // Estados UI Premium para consistência de Tema
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    setMounted(true);

    const handleThemeChange = () => {
      const updatedTheme = localStorage.getItem('@premium_theme');
      if (updatedTheme) setIsDark(updatedTheme === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

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

  // Se não estiver montado no cliente, evita disparar layout shifts
  if (!mounted) return null;

  // 2. Lógica de exclusão baseada na rota
  if (
    rotasExclusao.includes(pathname) || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/pagamento') 
  ) {
    return null;
  }

  // 3. CORREÇÃO CRÍTICA DO BUG DE ROTAS:
  // Se a rota inicia com /dashboard, o usuário obrigatoriamente é o PERSONAL.
  // Se inicia com /aluno (e não passou pelo dashboard), o usuário é o ALUNO.
  const isPersonalRoute = pathname.startsWith('/dashboard');
  const isAlunoRoute = pathname.startsWith('/aluno');

  return (
    <>
      {isPersonalRoute ? (
        <Navbar />
      ) : isAlunoRoute ? (
        <NavbarAluno />
      ) : (
        <Navbar />
      )}
    </>
  );
}