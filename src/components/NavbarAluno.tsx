'use client';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import { FaHome, FaUser } from 'react-icons/fa';
import { useLogo } from '@/components/LogoProvider';

export default function NavbarAluno() {
  const pathname = usePathname();
  const { logo, nome } = useLogo();
  
  if (pathname === '/pagamento-pendente') return null;

  const parts = pathname.split('/');
  const alunoId = parts[2];

  const navLinks = [
    { name: 'Início', path: alunoId ? `/aluno/${alunoId}` : '#', icon: <FaHome /> },
    { name: 'Perfil', path: alunoId ? `/aluno/${alunoId}/perfil` : '#', icon: <FaUser /> },
  ];

  return (
    <>
      {/* --- DESKTOP --- */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 px-10 py-5 justify-between items-center transition-all">
        <div className="flex items-center gap-3 h-10 w-auto">
          {logo && <img src={logo} className="h-full w-auto object-contain" alt="Logo" />}
          <span 
            className="font-black tracking-[0.05em] text-3xl whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #00c6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 0px 8px rgba(0, 198, 255, 0.4))',
            }}
          >
            {nome}
          </span>
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
          {navLinks.map((link) => (
            <a key={link.name} href={link.path} className={`transition-all duration-300 hover:text-white ${pathname === link.path ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] underline underline-offset-8' : ''}`}>
              {link.name}
            </a>
          ))}
          <div className="pl-6 border-l border-white/10"><LogoutButton /></div>
        </div>
      </nav>

      {/* --- MOBILE --- */}
      <div className="md:hidden">
        <div className="fixed top-0 w-full h-16 bg-neutral-950/80 backdrop-blur-md px-6 z-40 border-b border-white/5 flex items-center">
          <span className="font-black tracking-[0.05em] text-xl" style={{
              background: 'linear-gradient(135deg, #007bff 0%, #00c6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            {nome}
          </span>
        </div>

        <nav className="fixed bottom-6 left-6 right-6 z-50 bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] py-4 px-8 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {navLinks.map((link) => (
            <a key={link.name} href={link.path} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${pathname === link.path ? 'text-blue-500 scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-neutral-500'}`}>
              <span className="text-lg">{link.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{link.name}</span>
            </a>
          ))}
          <div className="flex flex-col items-center gap-1.5 text-neutral-500">
             <div className="text-lg"><LogoutButton /></div>
             <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
          </div>
        </nav>
        <div className="h-24" /> 
      </div>
    </>
  );
}