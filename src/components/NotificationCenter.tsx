'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaBell, FaTimes, FaCheck, FaTrash, FaDumbbell, 
  FaWallet, FaBullhorn, FaCog, FaCheckDouble, FaSearch 
} from 'react-icons/fa';

interface NotificationItem {
  id: string;
  titulo: string;
  corpo: string;
  tipo: 'treino' | 'financeiro' | 'geral' | 'sistema';
  media_url?: string;
  tipo_midia?: 'imagem' | 'gif' | 'video' | 'thumb';
  deep_link?: string;
  lida: boolean;
  criada_em: string;
}

export default function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notificacoes, setNotificacoes] = useState<NotificationItem[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'treino' | 'financeiro' | 'geral'>('todas');
  const [busca, setBusca] = useState('');
  const [contadorNaoLidas, setContadorNaoLidas] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar som de notificação discreto padrão de sistemas mobile
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
    audioRef.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const carregarNotificacoes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications_central')
        .select('*')
        .eq('user_id', user.id)
        .order('criada_em', { ascending: false });

      if (data) {
        setNotificacoes(data as NotificationItem[]);
        calcularBadges(data as NotificationItem[]);
      }
    };

    carregarNotificacoes();
    escutarEventosGlobais();
  }, [isOpen]);

  // Escuta o canal Realtime do Supabase para injetar novas notificações instantaneamente na tela
  useEffect(() => {
    let canalRealtime: any;

    const inicializarRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      canalRealtime = supabase
        .channel(`notificacoes_reais_${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications_central', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const novaNotif = payload.new as NotificationItem;
            setNotificacoes(prev => [novaNotif, ...prev]);
            setContadorNaoLidas(prev => prev + 1);
            
            // Toca efeito sonoro sutil se o app estiver aberto em foco
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          }
        )
        .subscribe();
    };

    inicializarRealtime();
    return () => {
      if (canalRealtime) supabase.removeChannel(canalRealtime);
    };
  }, []);

  const escutarEventosGlobais = () => {
    window.addEventListener('atualizar_badges_global', () => {
      // Recarrega o estado atualizado do banco
      setFiltro('todas');
    });
  };

  const calcularBadges = (lista: NotificationItem[]) => {
    const naoLidas = lista.filter(n => !n.lida).length;
    setContadorNaoLidas(naoLidas);
  };

  const marcarComoLida = async (id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setContadorNaoLidas(prev => Math.max(0, prev - 1));
    await supabase.from('notifications_central').update({ lida: true }).eq('id', id);
  };

  const marcarTodasComoLidas = async () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setContadorNaoLidas(0);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('notifications_central').update({ lida: true }).eq('user_id', user.id).eq('lida', false);
    }
  };

  const deletarNotificacao = async (id: string) => {
    const item = notificacoes.find(n => n.id === id);
    setNotificacoes(prev => prev.filter(n => n.id !== id));
    if (item && !item.lida) {
      setContadorNaoLidas(prev => Math.max(0, prev - 1));
    }
    await supabase.from('notifications_central').delete().eq('id', id);
  };

  const limparTudo = async () => {
    setNotificacoes([]);
    setContadorNaoLidas(0);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('notifications_central').delete().eq('user_id', user.id);
    }
  };

  // Filtragem combinada por Categoria e Campo de Busca por Texto
  const notificacoesFiltradas = notificacoes.filter(n => {
    const matchesFiltro = filtro === 'todas' || n.tipo === filtro;
    const matchesBusca = n.titulo.toLowerCase().includes(busca.toLowerCase()) || n.corpo.toLowerCase().includes(busca.toLowerCase());
    return matchesFiltro && matchesBusca;
  });

  const getIconeCategoria = (tipo: string) => {
    switch (tipo) {
      case 'treino': return <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shadow-inner"><FaDumbbell size={16} /></div>;
      case 'financeiro': return <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shadow-inner"><FaWallet size={16} /></div>;
      case 'sistema': return <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shadow-inner"><FaCog size={16} /></div>;
      default: return <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center shadow-inner"><FaBullhorn size={16} /></div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Área de fechamento por clique externo no fundo */}
      <div className="flex-grow h-full" onClick={onClose} />

      {/* Painel Lateral da Central Lateral (Mobile Completo / Desktop Lateral) */}
      <div className="w-full max-w-md h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho com Safe Area Padding para Mobile (iOS Notch / Android Status Bar) */}
        <div className="pt-[calc(env(safe-area-inset-top)+1.5rem)] px-6 pb-4 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaBell className="text-[var(--text-primary)]" size={22} />
                {contadorNaoLidas > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[var(--primary)] text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md border-2 border-[var(--surface)]">
                    {contadorNaoLidas}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black tracking-tighter text-[var(--text-primary)]">Notificações</h2>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2.5 bg-[var(--surface-sec)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-full transition-all active:scale-95"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* Input de Busca Avançada */}
          <div className="relative mb-4 group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/50 group-focus-within:text-[var(--primary)] transition-colors" size={12} />
            <input 
              type="text" 
              placeholder="Buscar nas notificações..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] shadow-inner placeholder:text-[var(--text-secondary)]/40 placeholder:font-normal"
            />
          </div>

          {/* Filtros de Categoria (Estilo Pill Premium) */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
            {(['todas', 'treino', 'financeiro', 'geral'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 active:scale-95 ${
                  filtro === cat 
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' 
                    : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Ações Rápidas de Massa */}
        {notificacoes.length > 0 && (
          <div className="px-6 py-2 bg-[var(--surface-sec)]/50 border-b border-[var(--border)] flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] shrink-0">
            <button onClick={marcarTodasComoLidas} className="hover:text-[var(--primary)] flex items-center gap-1.5 py-1 transition-colors">
              <FaCheckDouble size={10} /> Marcar tudo como lido
            </button>
            <button onClick={limparTudo} className="hover:text-[var(--danger)] flex items-center gap-1.5 py-1 transition-colors">
              <FaTrash size={10} /> Limpar histórico
            </button>
          </div>
        )}

        {/* Listagem de Notificações com Rolagem Otimizada */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
          {notificacoesFiltradas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center pb-20 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-[var(--surface-sec)] text-[var(--text-secondary)]/30 rounded-full flex items-center justify-center mb-4 border border-[var(--border)] shadow-inner">
                <FaBell size={24} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Histórico Vazio</p>
              <p className="text-[11px] text-[var(--text-secondary)]/60 font-medium mt-1 max-w-[220px]">Você não possui novas notificações nesta categoria.</p>
            </div>
          ) : (
            notificacoesFiltradas.map((item) => (
              <div 
                key={item.id} 
                onClick={() => marcarComoLida(item.id)}
                className={`p-4 rounded-2xl border transition-all duration-300 relative group flex gap-4 cursor-pointer ${
                  !item.lida 
                    ? 'bg-[var(--surface-sec)] border-[var(--primary)]/20 shadow-md shadow-[var(--primary)]/[0.02]' 
                    : 'bg-[var(--surface)] border-[var(--border)] opacity-70 hover:opacity-100'
                }`}
              >
                {/* Indicador visual de linha não lida */}
                {!item.lida && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--primary)] rounded-r-full" />
                )}

                {/* Ícone com base na Categoria */}
                <div className="shrink-0 mt-0.5">
                  {getIconeCategoria(item.tipo)}
                </div>

                {/* Bloco de Texto */}
                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-black tracking-tight text-[var(--text-primary)] truncate">
                      {item.titulo}
                    </h4>
                    <span className="text-[9px] font-bold text-[var(--text-secondary)]/50 shrink-0 whitespace-nowrap pt-0.5">
                      {new Date(item.criada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    {item.corpo}
                  </p>

                  {/* Renderização Inteligente de Mídias Anexadas (Imagens / GIFs / Vídeos) */}
                  {item.media_url && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-[var(--border)] max-h-36 bg-black/20 shadow-inner relative group/media">
                      {item.tipo_midia === 'video' ? (
                        <video src={item.media_url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.media_url} alt="Media Anexa" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                  )}

                  {/* Deep Link Actuator CTA */}
                  {item.deep_link && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        marcarComoLida(item.id);
                        window.location.href = item.deep_link!;
                      }}
                      className="mt-3 px-3 py-1.5 bg-[var(--primary)] text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-all hover:brightness-110 active:scale-95 block shadow-md shadow-[var(--primary)]/10"
                    >
                      Visualizar
                    </button>
                  )}
                </div>

                {/* Ações Individuais ao passar o mouse */}
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 justify-center">
                  {!item.lida && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); marcarComoLida(item.id); }}
                      className="p-1.5 text-[var(--success)] bg-[var(--success)]/10 hover:bg-[var(--success)]/20 rounded-lg transition-colors"
                      title="Marcar como lida"
                    >
                      <FaCheck size={10} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deletarNotificacao(item.id); }}
                    className="p-1.5 text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Rodapé com Margem de Área de Segurança (iOS Home Indicator) */}
        <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] text-center text-[9px] font-bold text-[var(--text-secondary)]/40 shrink-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          Segurança criptografada ponta a ponta • AuraFit Core Engine
        </div>

      </div>
    </div>
  );
}