'use client';
import { usePathname } from 'next/navigation';
import { FaHome, FaUser, FaDumbbell, FaCommentDots } from 'react-icons/fa';
import { useLogo } from '@/components/LogoProvider';

export default function NavbarAluno() {
  const pathname = usePathname();
  const { logo, nome } = useLogo();
  
  if (pathname === '/pagamento-pendente') return null;

  const parts = pathname.split('/');
  const alunoId = parts[2];

  const navLinks = [
    { name: 'Início', path: alunoId ? `/aluno/${alunoId}` : '#', icon: <FaHome /> },
    { name: 'Treinos', path: alunoId ? `/aluno/${alunoId}/treinos` : '#', icon: <FaDumbbell /> },
    { name: 'Feedback', path: alunoId ? `/aluno/${alunoId}/feedback` : '#', icon: <FaCommentDots /> },
    { name: 'Perfil', path: alunoId ? `/aluno/${alunoId}/perfil` : '#', icon: <FaUser /> },
  ];

  return (
    <>
      {/* --- DESKTOP --- */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 px-10 py-5 justify-between items-center transition-all">
        <div className="flex items-center gap-3 h-10">
          {logo && <img src={logo} className="h-full w-auto" alt="Logo" />}
          <span className="font-black text-2xl text-blue-500">{nome}</span>
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
          {navLinks.map((link) => (
            <a key={link.name} href={link.path} className={`transition-all hover:text-white ${pathname === link.path ? 'text-blue-500' : ''}`}>
              {link.name}
            </a>
          ))}
        </div>
      </nav>

      {/* --- MOBILE (Barra Inferior Premium) --- */}
      <div className="md:hidden">
        <nav className="fixed bottom-4 left-4 right-4 z-50 bg-neutral-900/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-2xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <a key={link.name} href={link.path} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-blue-500 scale-105' : 'text-neutral-500'}`}>
                <span className="text-lg">{link.icon}</span>
                <span className="text-[7px] font-black uppercase tracking-widest">{link.name}</span>
              </a>
            );
          })}
        </nav>
        <div className="h-24" /> 
      </div>
    </>
  );
}