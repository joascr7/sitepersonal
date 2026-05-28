'use client';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function NavbarAluno() {
  const pathname = usePathname();
  const parts = pathname.split('/');
  const alunoId = parts[2];

  return (
    <>
      {/* --- DESKTOP: Barra Superior --- */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 justify-between items-center shadow-sm">
        <div className="font-black text-gray-900 tracking-tighter text-xl">AURAFIT</div>
        
        <div className="flex gap-6 items-center text-sm font-bold text-gray-600">
          <a href={alunoId ? `/aluno/${alunoId}` : '#'} className="hover:text-gray-900 transition-colors">Início</a>
          <a href={`/aluno/${alunoId}/perfil`} className="hover:text-gray-900 transition-colors">Perfil</a>
          <div className="pl-4 border-l border-gray-200">
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* --- MOBILE: Barra Inferior (App Style) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <a href={alunoId ? `/aluno/${alunoId}` : '#'} className="flex flex-col items-center gap-1 text-[10px] font-black uppercase text-gray-900">
          Início
        </a>
        <a href={`/aluno/${alunoId}/perfil`} className="flex flex-col items-center gap-1 text-[10px] font-black uppercase text-gray-400">
          Perfil
        </a>
        <div className="flex flex-col items-center">
          <LogoutButton />
        </div>
      </nav>
    </>
  );
}