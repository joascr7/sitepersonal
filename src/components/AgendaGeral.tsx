'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    title: 'Próximos Agendamentos',
    empty: 'Nenhum agendamento futuro.',
    today: 'Hoje',
  },
  'pt-PT': {
    title: 'Próximas Marcações',
    empty: 'Nenhuma marcação futura.',
    today: 'Hoje',
  },
  'en': {
    title: 'Upcoming Appointments',
    empty: 'No upcoming appointments.',
    today: 'Today',
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN (UX PREMIUM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AgendaSkeleton = () => (
  <div className="w-full animate-pulse">
    <div className="h-6 w-48 bg-[var(--surface-sec)] rounded-lg mb-6" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-[var(--surface-sec)] rounded-[1.2rem] border border-[var(--border)]" />
      ))}
    </div>
  </div>
);

export default function AgendaGeral() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para idioma
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sincroniza o idioma salvo globalmente
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    setMounted(true);

    // Escuta mudanças de idioma feitas em outras partes do app
    const handleStorageChange = () => {
      const updatedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (updatedLang) setLang(updatedLang);
    };
    window.addEventListener('storage', handleStorageChange);

    // Lógica Original Intacta
    const fetchAgenda = async () => {
      const hoje = new Date().toISOString(); 
      const { data } = await supabase
        .from('agendamentos')
        .select('*, alunos(nome)')
        .gte('data_hora', hoje)
        .order('data_hora', { ascending: true });
        
      setAgendamentos(data || []);
      setLoading(false);
    };
    fetchAgenda();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = translations[lang] || translations['pt-BR'];

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col h-full">
      {loading ? (
        <AgendaSkeleton />
      ) : (
        <>
          <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] mb-6 tracking-tight flex items-center gap-2">
            <FaCalendarAlt className="text-[var(--primary)]" /> {t.title}
          </h2>
          
          {agendamentos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8 border-2 border-dashed border-[var(--border)] rounded-[1.5rem] bg-[var(--surface-sec)]/50">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] text-center">
                {t.empty}
              </p>
            </div>
          ) : (
            <div className="space-y-3 custom-scrollbar overflow-y-auto pr-1 max-h-[400px]">
              {agendamentos.map((ag) => {
                const dataAula = new Date(ag.data_hora);
                const hoje = new Date();
                const isHoje = dataAula.toDateString() === hoje.toDateString();

                return (
                  <div 
                    key={ag.id} 
                    className={`p-4 sm:p-5 rounded-[1.2rem] flex justify-between items-center border transition-all shadow-sm hover:-translate-y-0.5 ${
                      isHoje 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30' 
                        : 'bg-[var(--surface-sec)] border-[var(--border)] hover:border-[var(--primary)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      {/* Ícone de status */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isHoje ? 'bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]' : 'bg-[var(--text-secondary)]'}`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 truncate">
                        <span className={`font-black text-sm sm:text-base truncate ${isHoje ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                          {ag.alunos?.nome}
                        </span>
                        
                        {isHoje && (
                          <span className="w-fit text-[8px] bg-[var(--primary)] text-white px-2 py-0.5 rounded-md uppercase font-black tracking-widest shadow-sm">
                            {t.today}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                      <FaClock size={10} className={isHoje ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'} />
                      <span className={`text-xs sm:text-sm font-black ${isHoje ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {dataAula.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}