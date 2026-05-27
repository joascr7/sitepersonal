'use client';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function NavbarAluno() {
  const pathname = usePathname();
  const parts = pathname.split('/');
  const alunoId = parts[2]; 

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="font-black text-gray-900 tracking-tighter text-xl">EVOFIT</div>
      
      <div className="flex gap-6 items-center text-sm font-bold text-gray-600">
        <a 
          href={alunoId ? `/aluno/${alunoId}` : '#'} 
          className="hover:text-gray-900 transition-colors"
        >
          Inicio
        </a>
        <a 
          href={`/aluno/${alunoId}/perfil`} 
          className="hover:text-gray-900 transition-colors"
        >
          Perfil
        </a>
        <div className="pl-4 border-l border-gray-200">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}