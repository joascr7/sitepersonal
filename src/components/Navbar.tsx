'use client';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function Navbar() {
  const pathname = usePathname();

  // Rotas onde a navbar não deve aparecer
  const rotasExcluidas = ['/', '/login-professor', '/login-aluno', '/login-professor-cadastro', '/nova-senha'];
  
  if (rotasExcluidas.includes(pathname) || pathname.startsWith('/aluno')) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="font-black text-gray-900 tracking-tighter text-xl">
        PT MANAGER
      </div>
      
      <div className="flex gap-6 items-center text-sm font-bold text-gray-600">
        <a 
          href="/dashboard" 
          className={`transition-colors ${pathname === '/dashboard' ? 'text-gray-900' : 'hover:text-gray-900'}`}
        >
          Dashboard
        </a>
        <a 
          href="/dashboard/financeiro" 
          className={`transition-colors ${pathname === '/dashboard/financeiro' ? 'text-gray-900' : 'hover:text-gray-900'}`}
        >
          Financeiro
        </a>
        <div className="pl-4 border-l border-gray-200">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}