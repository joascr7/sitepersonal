'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LogoutButton from './LogoutButton';
import { FaChartLine, FaWallet, FaUser, FaWhatsapp } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': { dashboard: 'Dashboard', financial: 'Financeiro', profile: 'Perfil', logout: 'Sair', whatsapp: 'WhatsApp' },
  'pt-PT': { dashboard: 'Dashboard', financial: 'Financeiro', profile: 'Perfil', logout: 'Sair', whatsapp: 'WhatsApp' },
  'en': { dashboard: 'Dashboard', financial: 'Financial', profile: 'Profile', logout: 'Logout', whatsapp: 'WhatsApp' }
};

export default function Navbar() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [telefoneAluno, setTelefoneAluno] = useState<string | null>(null);

  useEffect(() => {
    const updateSettings = () => {
      // Atualiza o Idioma
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);

      // Atualiza o Tema (Garante a sincronização instantânea)
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
    };
    
    updateSettings();
    setMounted(true);
    
    // Escuta mudanças de outras abas e da aba atual
    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);
    
    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  // Extrai o ID do aluno se o personal estiver navegando na rota de um aluno específico
  const parts = pathname.split('/');
  const isAlunoRoute = parts[1] === 'dashboard' && parts[2] === 'aluno' && parts[3];
  const alunoId = isAlunoRoute ? parts[3] : null;

  useEffect(() => {
    const fetchTelefoneAluno = async () => {
      if (!alunoId) {
        setTelefoneAluno(null);
        return;
      }

      try {
        const { data } = await supabase
          .from('alunos')
          .select('telefone')
          .eq('id', alunoId)
          .single();

        if (data?.telefone) {
          const numeroLimpo = data.telefone.replace(/\D/g, '');
          setTelefoneAluno(numeroLimpo);
        }
      } catch (error) {
        console.error("Erro ao buscar telefone do aluno:", error);
      }
    };

    fetchTelefoneAluno();
  }, [alunoId]);

  const t = translations[lang] || translations['pt-BR'];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VARIÁVEIS CSS LOCAIS (Sincroniza instantaneamente com o Dashboard)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const rotasExcluidas = [
    '/', '/login-professor', '/login-aluno', '/login-professor-cadastro', '/nova-senha', '/pagamento-pendente'
  ];
  
  if (rotasExcluidas.includes(pathname) || pathname.startsWith('/aluno')) return null;

  const navItems = [
    { name: t.dashboard, path: '/dashboard', icon: <FaChartLine /> },
    { name: t.financial, path: '/dashboard/financeiro', icon: <FaWallet /> },
  ];

  if (telefoneAluno) {
    navItems.push({
      name: t.whatsapp,
      path: `https://wa.me/55${telefoneAluno}`,
      icon: <FaWhatsapp />
    });
  }

  navItems.push({ name: t.profile, path: '/perfil', icon: <FaUser /> });

  if (!mounted) return null;

  const NavLink = ({ item, isMobile }: { item: any, isMobile: boolean }) => {
    const isActive = pathname === item.path;
    const isExternal = item.path.startsWith('http');

    if (isExternal) {
      return (
        <a 
          href={item.path} 
          target="_blank"
          rel="noopener noreferrer"
          className={isMobile 
            ? `flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group cursor-pointer text-[var(--text-secondary)]` 
            : `relative py-2 transition-all duration-300 hover:text-[var(--primary)] flex items-center gap-1.5`
          }
        >
           {isMobile ? (
             <>
               <div className="relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366]/20">
                 <span className="text-lg transition-transform group-hover:scale-110 group-hover:text-[#25D366]">
                   {item.icon}
                 </span>
               </div>
               <span className="text-[8px] font-black uppercase tracking-widest transition-all opacity-70 group-hover:opacity-100 group-hover:text-[#25D366]">
                 {item.name}
               </span>
             </>
           ) : (
             <>
               <span className="text-sm text-[#25D366]">{item.icon}</span>
               <span>{item.name}</span>
             </>
           )}
        </a>
      );
    }

    return (
      <Link 
        href={item.path} 
        className={isMobile
          ? `flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group cursor-pointer ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`
          : `relative py-2 transition-all duration-300 hover:text-[var(--primary)] flex items-center gap-1.5 ${isActive ? 'text-[var(--primary)] font-black' : ''}`
        }
      >
        {isMobile ? (
          <>
            <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-[var(--primary)]/15 scale-110' : 'group-hover:bg-[var(--surface-sec)] group-hover:scale-105'}`}>
              <span className={`text-lg transition-transform ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:scale-110 group-hover:text-[var(--primary)]'}`}>
                {item.icon}
              </span>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary)]'}`}>
              {item.name}
            </span>
          </>
        ) : (
          <>
            <span>{item.name}</span>
            {isActive && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)] animate-in fade-in zoom-in duration-300" />
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ━━━━━━━━━━ DESKTOP NAVBAR ━━━━━━━━━━ */}
      <nav 
        style={themeStyles}
        className="hidden md:flex sticky top-0 z-[100] bg-[var(--surface)]/90 backdrop-blur-2xl border-b border-[var(--border)] px-10 py-4 justify-between items-center transition-colors duration-500 shadow-sm"
      >
        <div className="flex items-center gap-4 h-10 w-auto group cursor-pointer">
          <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="font-black text-[var(--primary)]">AF</span>
          </div>
          <span className="font-black tracking-tight text-2xl text-[var(--primary)]">
            AURAFIT
          </span>
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} isMobile={false} />
          ))}
          
          <div className="pl-6 ml-2 border-l border-[var(--border)] flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors">
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      <nav 
        style={{ ...themeStyles, bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
        className="md:hidden fixed left-5 right-5 z-[100] bg-[var(--surface)]/90 backdrop-blur-3xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-colors duration-500"
      >
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} isMobile={true} />
        ))}
        
        {/* Logout Mobile */}
        <div className="flex flex-col items-center gap-1.5 text-[var(--text-secondary)] w-16 group cursor-pointer">
           <div className="relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 group-hover:bg-[var(--danger)]/10 group-hover:text-[var(--danger)] active:scale-95">
              <div className="text-lg flex items-center justify-center">
                <LogoutButton iconOnly />
              </div>
           </div>
           <span className="text-[8px] font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 group-hover:text-[var(--danger)] transition-colors">
             {t.logout}
           </span>
        </div>
      </nav>
    </>
  );
}
