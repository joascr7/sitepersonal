'use client';
import { useState, useEffect } from 'react';
import { FaBell, FaCheckDouble, FaCircle } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';

const i18n = {
  'pt-BR': { title: 'Notificações', empty: 'Nenhuma mensagem nova.', close: 'Fechar', markAll: 'Ler todas' },
  'pt-PT': { title: 'Notificações', empty: 'Nenhuma mensagem nova.', close: 'Fechar', markAll: 'Ler todas' },
  'en': { title: 'Notifications', empty: 'No new messages.', close: 'Close', markAll: 'Read all' }
};

export const NotificationBell = () => {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Se desmontou ou não tem user, aborta
      if (!user || !isMounted) return; 

      carregar();

      // O SEGREDO: Criar um nome de canal 100% único para evitar colisões no cache do Supabase
      const channelName = `notif_${user.id}_${Math.random().toString(36).substring(7)}`;

      channel = supabase.channel(channelName)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log("🔔 NOVA NOTIFICAÇÃO REALTIME:", payload);
          setNotificacoes((prev) => [payload.new, ...prev]);
        })
        .subscribe();
    };

    setupRealtime();

    return () => { 
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel); 
      }
    };
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
      .limit(10); // Aumentei para 10 para ter um histórico melhor
    setNotificacoes(data || []);
  };

  // 🔥 FUNÇÃO PARA MARCAR UMA COMO LIDA
  const marcarComoLida = async (id: string, lida: boolean) => {
    if (lida) return; // Se já está lida, não faz nada
    
    // 1. Atualiza na tela instantaneamente (Optimistic UI)
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    
    // 2. Atualiza no banco de dados em background
    await supabase.from('user_notifications').update({ lida: true }).eq('id', id);
  };

  // 🔥 FUNÇÃO PARA MARCAR TODAS COMO LIDAS
  const marcarTodasComoLidas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    await supabase.from('user_notifications').update({ lida: true }).eq('user_id', user.id).eq('lida', false);
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 relative hover:bg-[var(--surface-sec)] rounded-xl transition-all">
        <FaBell className="text-[var(--text-primary)] text-lg" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[var(--danger)] border-2 border-[var(--surface)] text-[8px] font-black text-white flex items-center justify-center rounded-full animate-pulse">
            {naoLidas}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-[1.5rem] p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
            
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[var(--text-primary)] font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                {t.title} <span className="bg-[var(--primary)] text-white px-2 py-0.5 rounded-full">{naoLidas}</span>
              </h4>
              {naoLidas > 0 && (
                <button onClick={marcarTodasComoLidas} className="text-[9px] text-[var(--text-secondary)] hover:text-[var(--primary)] uppercase font-black tracking-widest flex items-center gap-1 transition-colors">
                  <FaCheckDouble /> {t.markAll}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {notificacoes.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-[10px] font-medium italic text-center py-4">{t.empty}</p>
              ) : (
                notificacoes.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => marcarComoLida(n.id, n.lida)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      n.lida 
                        ? 'bg-transparent border-transparent opacity-60 hover:bg-[var(--surface-sec)]' 
                        : 'bg-[var(--surface-sec)] border-[var(--border)] shadow-sm hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="flex gap-2 items-start">
                      {!n.lida && <FaCircle className="text-[var(--primary)] text-[8px] mt-1 shrink-0" />}
                      <div>
                        <p className={`font-black text-[11px] leading-tight ${n.lida ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{n.titulo}</p>
                        <p className="text-[var(--text-secondary)] text-[10px] mt-1">{n.corpo}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setIsOpen(false)} className="w-full mt-4 py-2.5 bg-[var(--surface-sec)] text-[var(--primary)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all">
              {t.close}
            </button>
          </div>
        </>
      )}
    </div>
  );
};