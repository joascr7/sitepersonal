export default function Navbar() {
  const pathname = usePathname();
  const { logo, nome } = useLogo();

  const rotasExcluidas = [
    '/', '/login-professor', '/login-aluno', 
    '/login-professor-cadastro', '/nova-senha', '/pagamento-pendente'
  ];
  
  if (rotasExcluidas.includes(pathname) || pathname.startsWith('/aluno')) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FaChartLine /> },
    { name: 'Financeiro', path: '/dashboard/financeiro', icon: <FaWallet /> },
    { name: 'Perfil', path: '/perfil', icon: <FaUser /> },
  ];

  return (
    <>
      {/* --- DESKTOP --- */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 px-10 py-5 justify-between items-center">
        <div className="flex items-center gap-3 h-10">
          {logo && <img src={logo} className="h-full w-auto object-contain" alt="Logo" />}
          <span className="font-black tracking-[0.05em] text-2xl text-white">{nome}</span>
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
          {navItems.map((item) => (
            <a key={item.path} href={item.path} className={`transition-all duration-300 hover:text-white ${pathname === item.path ? 'text-white underline underline-offset-8' : ''}`}>
              {item.name}
            </a>
          ))}
          <div className="pl-6 border-l border-white/10"><LogoutButton /></div>
        </div>
      </nav>

      {/* --- MOBILE --- */}
      <div className="md:hidden">
        {/* Barra superior fixa (sem o h-24 embaixo dela) */}
        <div className="fixed top-0 w-full h-16 bg-neutral-950/80 backdrop-blur-md px-6 z-40 border-b border-white/5 flex items-center">
          <span className="font-black tracking-[0.05em] text-xl text-white">{nome}</span>
        </div>

        {/* Barra inferior fixa */}
        <nav className="fixed bottom-6 left-6 right-6 z-50 bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] py-4 px-8 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => (
            <a key={item.path} href={item.path} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${pathname === item.path ? 'text-blue-500 scale-110' : 'text-neutral-500'}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.name}</span>
            </a>
          ))}
          <div className="flex flex-col items-center gap-1.5 text-neutral-500">
             <div className="text-lg"><LogoutButton /></div>
             <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
          </div>
        </nav>
      </div>
    </>
  );
}