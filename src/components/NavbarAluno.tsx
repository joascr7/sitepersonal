'use client';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import { FaHome, FaUser } from 'react-icons/fa';
import { useLogo } from '@/components/LogoProvider';

export default function NavbarAluno() {
  const pathname = usePathname();
  const { logo, nome } = useLogo();
  
  const parts = pathname.split('/');
  const alunoId = parts[2];

  const navLinks = [
    { name: 'Início', path: `/aluno/${alunoId}`, icon: <FaHome /> },
    { name: 'Perfil', path: `/aluno/${alunoId}/perfil`, icon: <FaUser /> },
  ];

  return (
    <>
      {/* --- DESKTOP: Barra Superior --- */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-10 py-5 justify-between items-center transition-all">
        {/* Aumentei a altura para h-10 e largura para w-40 para dar mais destaque */}
        <div className="w-40 h-10 flex items-center">
          {logo ? (
            <img src={logo} className="h-full w-full object-contain" alt={nome} />
          ) : (
            <span className="font-black text-gray-950 tracking-tighter text-xl">{nome}</span>
          )}
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.path} 
              className={`transition-all hover:text-gray-950 ${pathname === link.path ? 'text-gray-950 underline underline-offset-8' : ''}`}
            >
              {link.name}
            </a>
          ))}
          <div className="pl-6 border-l border-gray-100">
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* --- MOBILE: Barra Superior (Logo) + Inferior (Navegação) --- */}
      <div className="md:hidden">
        {/* Topo Mobile com Logo - Aumentei a altura de h-6 para h-8 */}
        <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md px-6 py-4 z-40 border-b border-gray-50">
          <div className="w-32 h-8 flex items-center">
            {logo ? (
              <img src={logo} className="h-full w-full object-contain" alt={nome} />
            ) : (
              <span className="font-black text-gray-950 tracking-tighter text-lg">{nome}</span>
            )}
          </div>
        </div>

        {/* Barra Inferior Flutuante */}
        <nav className="fixed bottom-6 left-6 right-6 z-50 bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-3xl py-4 px-8 flex justify-between items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.path} 
              className={`flex flex-col items-center gap-1.5 transition-all ${pathname === link.path ? 'text-gray-950' : 'text-gray-400'}`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{link.name}</span>
            </a>
          ))}
          
          <div className="flex flex-col items-center gap-1.5 text-gray-400">
             <div className="text-lg"><LogoutButton /></div>
             <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
          </div>
        </nav>
        
        {/* Spacers para o conteúdo não ser cortado */}
        <div className="h-24" /> {/* Topo mais alto para acomodar a logo maior */}
        <div className="h-24" /> {/* Base */}
      </div>
    </>
  );
}