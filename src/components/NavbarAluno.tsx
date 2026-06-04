'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaHome, FaUser, FaDumbbell, FaCommentDots } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    home: 'Início',
    workouts: 'Treinos',
    feedback: 'Feedback',
    profile: 'Perfil'
  },
  'pt-PT': {
    home: 'Início',
    workouts: 'Treinos',
    feedback: 'Feedback',
    profile: 'Perfil'
  },
  'en': {
    home: 'Home',
    workouts: 'Workouts',
    feedback: 'Feedback',
    profile: 'Profile'
  }
};

export default function NavbarAluno() {
  const pathname = usePathname();

  // Estado apenas para idioma. O tema agora é 100% gerido pelo CSS Global.
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const updateLang = () => {
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateLang();
    setMounted(true);

    window.addEventListener('storage', updateLang);
    return () => window.removeEventListener('storage', updateLang);
  }, []);

  const t = translations[lang] || translations['pt-BR'];
  
  // Lógica Original de Ocultação
  if (pathname === '/pagamento-pendente') return null;

  // Lógica Original de Extração do ID
  const parts = pathname.split('/');
  const alunoId = parts[2];

  const navLinks = [
    { name: t.home, path: alunoId ? `/aluno/${alunoId}` : '#', icon: <FaHome /> },
    { name: t.workouts, path: alunoId ? `/aluno/${alunoId}/treinos` : '#', icon: <FaDumbbell /> },
    { name: t.feedback, path: alunoId ? `/aluno/${alunoId}/feedback` : '#', icon: <FaCommentDots /> },
    { name: t.profile, path: alunoId ? `/aluno/${alunoId}/perfil` : '#', icon: <FaUser /> },
  ];

  if (!mounted) return null;

  return (
    <>
      {/* ━━━━━━━━━━ DESKTOP NAVBAR ━━━━━━━━━━ */}
      <nav 
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
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <a 
                key={link.name} 
                href={link.path} 
                className={`relative py-2 transition-all duration-300 hover:text-[var(--primary)] ${
                  isActive ? 'text-[var(--primary)] font-black' : ''
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)] animate-in fade-in zoom-in duration-300" />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      {/* Removemos o Header superior do Mobile. Agora apenas a Bottom Bar é exibida. */}
      <nav 
        style={{ bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
        className="md:hidden fixed left-5 right-5 z-[100] bg-[var(--surface)]/90 backdrop-blur-3xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-colors duration-500"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          return (
            <a 
              key={link.name} 
              href={link.path} 
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group cursor-pointer ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                isActive ? 'bg-[var(--primary)]/15 scale-110' : 'group-hover:bg-[var(--surface-sec)] group-hover:scale-105'
              }`}>
                <span className={`text-lg transition-transform ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:scale-110 group-hover:text-[var(--primary)]'}`}>
                  {link.icon}
                </span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary)]'
              }`}>
                {link.name}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
