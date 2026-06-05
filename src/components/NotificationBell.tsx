import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';

// Dicionário interno para o Sininho
const i18n = {
  'pt-BR': { title: 'Notificações', empty: 'Nenhuma mensagem nova.', close: 'Fechar' },
  'pt-PT': { title: 'Notificações', empty: 'Nenhuma mensagem nova.', close: 'Fechar' },
  'en': { title: 'Notifications', empty: 'No new messages.', close: 'Close' }
};

export const NotificationBell = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');

 useEffect(() => {
  const setupRealtime = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    carregar(); // Carrega inicial

    // Canal com filtro aplicado
    const channel = supabase.channel('realtime_notif')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}` // <--- ISSO É OBRIGATÓRIO
      }, (payload) => {
        setNotificacoes((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  setupRealtime();
}, []);

  const t = i18n[lang];

  const carregar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(5);
    setNotificacoes(data || []);
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 relative hover:bg-[var(--surface-sec)] rounded-xl transition-all">
        <FaBell className="text-[var(--text-primary)] text-lg" />
        {notificacoes.some(n => !n.lida) && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full animate-pulse" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-[1.5rem] p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-[var(--text-primary)] font-black text-[10px] uppercase tracking-widest mb-4 flex justify-between">
              {t.title} <span>{notificacoes.length}</span>
            </h4>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {notificacoes.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-[10px] font-medium italic">{t.empty}</p>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} className="pb-3 border-b border-[var(--border)] last:border-0">
                    <p className="text-[var(--text-primary)] font-black text-[11px] leading-tight">{n.titulo}</p>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-1">{n.corpo}</p>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="w-full mt-5 py-2 bg-[var(--surface-sec)] text-[var(--primary)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all">{t.close}</button>
          </div>
        </>
      )}
    </div>
  );
};