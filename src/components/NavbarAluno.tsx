'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaHome, FaUser, FaDumbbell, FaCommentDots, FaWhatsapp } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': { home: 'Início', workouts: 'Treinos', feedback: 'Feedback', profile: 'Perfil', contact: 'Contato' },
  'pt-PT': { home: 'Início', workouts: 'Treinos', feedback: 'Feedback', profile: 'Perfil', contact: 'Contacto' },
  'en': { home: 'Home', workouts: 'Workouts', feedback: 'Feedback', profile: 'Profile', contact: 'Contact' }
};

export default function NavbarAluno() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);
  const [telefonePersonal, setTelefonePersonal] = useState<string | null>(null);

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
  
  const parts = pathname.split('/');
  const alunoId = parts[2];

  // Efeito para buscar o telefone do personal no banco de dados
  useEffect(() => {
    const fetchTelefonePersonal = async () => {
      if (!alunoId) return;

      try {
        const { data: alunoData } = await supabase
          .from('alunos')
          .select('personal_id')
          .eq('id', alunoId)
          .single();

        if (alunoData?.personal_id) {
          const { data: personalData } = await supabase
            .from('personais')
            .select('telefone')
            .eq('id', alunoData.personal_id)
            .single();

          if (personalData?.telefone) {
            // Remove parênteses, espaços ou traços para a URL do WhatsApp
            const numeroLimpo = personalData.telefone.replace(/\D/g, '');
            setTelefonePersonal(numeroLimpo);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar telefone do personal:", error);
      }
    };

    fetchTelefonePersonal();
  }, [alunoId]);

  if (pathname === '/pagamento-pendente') return null;

  // Montagem dinâmica dos links
  const navLinks = [
    { name: t.home, path: alunoId ? `/aluno/${alunoId}` : '#', icon: <FaHome /> },
    { name: t.workouts, path: alunoId ? `/aluno/${alunoId}/treinos` : '#', icon: <FaDumbbell /> },
    { name: t.feedback, path: alunoId ? `/aluno/${alunoId}/feedback` : '#', icon: <FaCommentDots /> },
  ];

  // Adiciona o WhatsApp apenas se o telefone foi encontrado
  if (telefonePersonal) {
    navLinks.push({
      name: t.contact,
      path: `https://wa.me/55${telefonePersonal}`,
      icon: <FaWhatsapp />
    });
  }

  // Adiciona o Perfil por último
  navLinks.push({ name: t.profile, path: alunoId ? `/aluno/${alunoId}/perfil` : '#', icon: <FaUser /> });

  if (!mounted) return null;

  return (
    <>
      {/* ━━━━━━━━━━ DESKTOP NAVBAR (OCULTA NO MOBILE) ━━━━━━━━━━ */}
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
            const isExternal = link.path.startsWith('http');
            
            return (
              <a 
                key={link.name} 
                href={link.path} 
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : ''}
                className={`relative py-2 transition-all duration-300 hover:text-[var(--primary)] flex items-center gap-1.5 ${
                  isActive ? 'text-[var(--primary)] font-black' : ''
                }`}
              >
                {isExternal && <span className="text-sm text-[#25D366]">{link.icon}</span>}
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)] animate-in fade-in zoom-in duration-300" />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      <nav 
        style={{ bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
        className="md:hidden fixed left-5 right-5 z-[100] bg-[var(--surface)]/90 backdrop-blur-3xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-colors duration-500"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.path;
          const isExternal = link.path.startsWith('http');

          return (
            <a 
              key={link.name} 
              href={link.path} 
              target={isExternal ? '_blank' : '_self'}
              rel={isExternal ? 'noopener noreferrer' : ''}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group cursor-pointer ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                isActive ? 'bg-[var(--primary)]/15 scale-110' : 'group-hover:bg-[var(--surface-sec)] group-hover:scale-105'
              } ${isExternal ? 'bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366]/20' : ''}`}>
                <span className={`text-lg transition-transform ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:scale-110 group-hover:text-[var(--primary)]'} ${isExternal ? 'group-hover:text-[#25D366]' : ''}`}>
                  {link.icon}
                </span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary)]'
              } ${isExternal ? 'group-hover:text-[#25D366]' : ''}`}>
                {link.name}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
