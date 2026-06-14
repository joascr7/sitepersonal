'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaHome, FaUser, FaDumbbell, FaCommentDots, FaWhatsapp, 
  FaLock, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': { 
    home: 'Início', workouts: 'Treinos', feedback: 'Feedback', profile: 'Perfil', contact: 'Contato',
    lockedToast: 'Assinatura vencida! Regularize para acessar os treinos.'
  },
  'pt-PT': { 
    home: 'Início', workouts: 'Treinos', feedback: 'Feedback', profile: 'Perfil', contact: 'Contacto',
    lockedToast: 'Assinatura vencida! Regularize para aceder aos treinos.'
  },
  'en': { 
    home: 'Home', workouts: 'Workouts', feedback: 'Feedback', profile: 'Profile', contact: 'Contact',
    lockedToast: 'Subscription expired! Please settle to access workouts.'
  }
};

export default function NavbarAluno() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  const [telefonePersonal, setTelefonePersonal] = useState<string | null>(null);
  const [isVencido, setIsVencido] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => { 
    setToast({ type, text }); 
    setTimeout(() => setToast(null), 4000); 
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEMA, IDIOMA E "EDGE-TO-EDGE" (CELULAR TELA CHEIA COMO BET365)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      const isDarkTheme = savedTheme === 'dark';
      setIsDark(isDarkTheme);
      
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);

      // CORREÇÃO DEFINITIVA DO ESPAÇO BRANCO NO TOPO E RODAPÉ (EDGE-TO-EDGE)
      const bgColor = isDarkTheme ? '#0F1115' : '#F3F6FB';
      
      // 1. Força a cor do Theme Color (Barra do relógio)
      let metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.setAttribute("name", "theme-color");
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute("content", bgColor);

      // 2. Injeta o viewport-fit=cover para o app preencher até o final da tela do iPhone
      let metaViewport = document.querySelector("meta[name='viewport']");
      if (!metaViewport) {
        metaViewport = document.createElement("meta");
        metaViewport.setAttribute("name", "viewport");
        document.head.appendChild(metaViewport);
      }
      metaViewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover");

      // 3. Força a raiz do HTML/BODY a ter a cor do tema via JS
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundColor = bgColor;
    };

    updateSettings();
    setMounted(true);

    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);
    
    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  const t = translations[lang] || translations['pt-BR'];
  const parts = pathname.split('/');
  const alunoId = parts[2];

  // Estilos Locais da Navbar
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': 'rgba(21, 26, 34, 0.9)', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': 'rgba(255, 255, 255, 0.95)', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BUSCA DE DADOS (VENCIMENTO + WHATSAPP)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const fetchDadosNavbar = async () => {
      if (!alunoId) return;

      try {
        const { data: alunoData } = await supabase
          .from('alunos')
          .select('personal_id, status_pagamento, data_vencimento')
          .eq('id', alunoId)
          .single();

        if (alunoData) {
          let vencido = alunoData.status_pagamento === 'bloqueado';
          if (alunoData.data_vencimento) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const venc = new Date(alunoData.data_vencimento + 'T00:00:00');
            if (hoje > venc) vencido = true;
          }
          setIsVencido(vencido);

          if (alunoData.personal_id) {
            const { data: personalData } = await supabase
              .from('personais')
              .select('telefone, nome')
              .eq('id', alunoData.personal_id)
              .single();

            if (personalData?.telefone) {
              const numeroLimpo = personalData.telefone.replace(/\D/g, '');
              const numeroFinal = (numeroLimpo.length <= 11 && !numeroLimpo.startsWith('55')) ? `55${numeroLimpo}` : numeroLimpo;
              const personalNome = personalData.nome?.split(' ')[0] || 'Personal';
              const mensagem = encodeURIComponent(`Olá ${personalNome}, gostaria de tirar uma dúvida!`);
              setTelefonePersonal(`${numeroFinal}?text=${mensagem}`);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados da navbar:", error);
      }
    };

    fetchDadosNavbar();
  }, [alunoId]);

  if (pathname === '/pagamento-pendente' || !mounted) return null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MONTAGEM DOS LINKS (BLOQUEIA TREINOS SE VENCIDO)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const navLinks = [
    { name: t.home, path: alunoId ? `/aluno/${alunoId}` : '#', icon: <FaHome /> },
    { 
      name: t.workouts, 
      path: isVencido || !alunoId ? '#' : `/aluno/${alunoId}/treinos`, 
      icon: isVencido ? <FaLock className="text-[var(--danger)]" /> : <FaDumbbell />,
      isLocked: isVencido
    },
    { name: t.feedback, path: alunoId ? `/aluno/${alunoId}/feedback` : '#', icon: <FaCommentDots /> },
  ];

  if (telefonePersonal) {
    navLinks.push({
      name: t.contact,
      path: `https://wa.me/${telefonePersonal}`,
      icon: <FaWhatsapp />
    });
  }

  navLinks.push({ name: t.profile, path: alunoId ? `/aluno/${alunoId}/perfil` : '#', icon: <FaUser /> });

  return (
    <>
      {/* ━━━━━━━━━━ INJEÇÃO GLOBAL EXTREMA PARA REMOVER ESPAÇOS BRANCOS ━━━━━━━━━━ */}
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body {
            background-color: ${isDark ? '#0F1115' : '#F3F6FB'} !important;
            margin: 0;
            padding: 0;
            overscroll-behavior: none; /* Previne o efeito "borracha" do iOS */
          }
          /* Aplica a cor em qualquer elemento base do Next.js que tentar ficar branco */
          #__next, div[data-overlay-container] {
            background-color: ${isDark ? '#0F1115' : '#F3F6FB'} !important;
          }
        `
      }} />

      {/* TOAST FLUTUANTE DE BLOQUEIO */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[999999] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{toast.text}</span>
        </div>
      )}

      {/* ━━━━━━━━━━ DESKTOP NAVBAR ━━━━━━━━━━ */}
      <nav 
        style={themeStyles}
        className="hidden md:flex sticky top-0 z-[100] bg-[var(--surface)] backdrop-blur-2xl border-b border-[var(--border)] px-10 py-4 justify-between items-center shadow-sm"
      >
        <div className="flex items-center gap-4 h-10 w-auto group cursor-pointer" onClick={() => router.push(`/aluno/${alunoId}`)}>
          <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
            <span className="font-black text-[var(--primary)]">AF</span>
          </div>
          <span className="font-black tracking-tight text-2xl text-[var(--primary)]">
            AURAFIT
          </span>
        </div>
        
        <div className="flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.path && !link.isLocked;
            const isExternal = link.path.startsWith('http');
            
            return (
              <a 
                key={link.name} 
                href={link.path} 
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : ''}
                onClick={(e) => {
                  if (link.isLocked) {
                    e.preventDefault();
                    showToast('error', t.lockedToast);
                  }
                }}
                className={`relative py-2 hover:text-[var(--primary)] flex items-center gap-1.5 transition-none ${
                  isActive ? 'text-[var(--primary)] font-black' : ''
                }`}
              >
                {isExternal && <span className="text-sm text-[#25D366]">{link.icon}</span>}
                {!isExternal && <span className={`text-sm ${link.isLocked ? 'text-[var(--danger)]' : ''}`}>{link.icon}</span>}
                <span className={link.isLocked ? 'text-[var(--danger)]/80' : ''}>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-full shadow-[0_0_8px_var(--primary)]" />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ━━━━━━━━━━ MOBILE BOTTOM NAVIGATION ━━━━━━━━━━ */}
      <nav 
        style={{ ...themeStyles, bottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}
        className="md:hidden fixed left-5 right-5 z-[100] bg-[var(--surface)] backdrop-blur-3xl border border-[var(--border)] rounded-[2rem] py-3 px-6 flex justify-between items-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.path && !link.isLocked;
          const isExternal = link.path.startsWith('http');

          return (
            <a 
              key={link.name} 
              href={link.path} 
              target={isExternal ? '_blank' : '_self'}
              rel={isExternal ? 'noopener noreferrer' : ''}
              onClick={(e) => {
                if (link.isLocked) {
                  e.preventDefault();
                  showToast('error', t.lockedToast);
                } else if (!isExternal) {
                  e.preventDefault();
                  router.push(link.path);
                }
              }}
              className={`flex flex-col items-center gap-1.5 w-16 group cursor-pointer transition-none ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <div className={`relative flex items-center justify-center w-12 h-8 rounded-full ${
                isActive ? 'bg-[var(--primary)]/15 scale-110' : 'group-hover:bg-[var(--surface-sec)] group-hover:scale-105'
              } ${isExternal ? 'bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366]/20' : ''} ${link.isLocked ? 'bg-[var(--danger)]/5 text-[var(--danger)] group-hover:bg-[var(--danger)]/10' : ''}`}>
                <span className={`text-lg ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:scale-110 group-hover:text-[var(--primary)]'} ${isExternal ? 'group-hover:text-[#25D366]' : ''}`}>
                  {link.icon}
                </span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest ${
                isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 group-hover:text-[var(--primary)]'
              } ${isExternal ? 'group-hover:text-[#25D366]' : ''} ${link.isLocked ? 'group-hover:text-[var(--danger)]' : ''}`}>
                {link.name}
              </span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
