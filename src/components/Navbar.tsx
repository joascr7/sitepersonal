'use client';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import { FaChartLine, FaWallet, FaUser } from 'react-icons/fa';
import { useLogo } from '@/components/LogoProvider';

export default function Navbar() {
  const pathname = usePathname();
  const { logo, nome } = useLogo();

  // Adicionado '/pagamento-pendente' aqui para que a navbar suma nesta tela
  const rotasExcluidas = [
    '/', 
    '/login-professor', 
    '/login-aluno', 
    '/login-professor-cadastro', 
    '/nova-senha',
    '/pagamento-pendente'
  ];
  
  // A condição pathname.startsWith('/aluno') continua protegendo a área de treino dos alunos
  if (rotasExcluidas.includes(pathname) || pathname.startsWith('/aluno')) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FaChartLine /> },
    { name: 'Financeiro', path: '/dashboard/financeiro', icon: <FaWallet /> },
    { name: 'Perfil', path: '/perfil', icon: <FaUser /> },
  ];

  return (
    <>
      {/* --- DESKTOP --- */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100 px-10 py-5 justify-between items-center">
        <div className="flex items-center gap-3 h-10 w-auto overflow-visible">
          {logo && <img src={logo} className="h-full w-auto object-contain" alt="Logo" />}
          <span 
            className="font-black tracking-[0.05em] text-3xl whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #00c6ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))',
            }}
          >
            {nome}
          </span>
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {navItems.map((item) => (
            <a key={item.path} href={item.path} className={`transition-colors hover:text-gray-950 ${pathname === item.path ? 'text-gray-950 underline underline-offset-8' : ''}`}>
              {item.name}
            </a>
          ))}
          <div className="pl-6 border-l border-gray-100"><LogoutButton /></div>
        </div>
      </nav>

      {/* --- MOBILE --- */}
      <div className="md:hidden">
        <div className="fixed top-0 w-full h-16 bg-white/80 backdrop-blur-md px-6 z-40 border-b border-gray-50 flex items-center">
          <div className="flex items-center gap-2 h-8 w-auto overflow-visible">
            {logo && <img src={logo} className="h-full w-auto object-contain" alt="Logo" />}
            <span 
              className="font-black tracking-[0.05em] text-2xl whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #007bff 0%, #00c6ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {nome}
            </span>
          </div>
        </div>

        <nav className="fixed bottom-6 left-6 right-6 z-50 bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-3xl py-4 px-8 flex justify-between items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
          {navItems.map((item) => (
            <a key={item.path} href={item.path} className={`flex flex-col items-center gap-1.5 transition-all ${pathname === item.path ? 'text-gray-950' : 'text-gray-400'}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
            </a>
          ))}
          <div className="flex flex-col items-center gap-1.5 text-gray-400">
             <div className="text-lg"><LogoutButton /></div>
             <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
          </div>
        </nav>
        <div className="h-20" /> 
      </div>
    </>
  );
}