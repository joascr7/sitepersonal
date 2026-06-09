'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaTimes, FaSearch, FaPlay, FaVideoSlash, FaCheck } from 'react-icons/fa';

// Identifica a categoria pelo nome
const autoCategorize = (nome: string): string => {
  const n = nome.toLowerCase();
  if (/(supino|crucifixo|peck deck|peito)/.test(n)) return 'Peito';
  if (/(puxada|remada|barra|costas)/.test(n)) return 'Costas';
  if (/(agachamento|leg|extensora|flexora|panturrilha|perna)/.test(n)) return 'Pernas';
  if (/(desenvolvimento|elevação|ombro)/.test(n)) return 'Ombros';
  if (/(rosca|tríceps|bíceps)/.test(n)) return 'Braços';
  if (/(abdominal|core)/.test(n)) return 'Core';
  return 'Geral';
};

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Componente para renderizar qualquer tipo de mídia (YouTube, Vídeo, GIF, Imagem)
const MediaPreview = ({ url }: { url: string }) => {
  if (!url) return <FaVideoSlash className="text-white/20" size={14}/>;
  const ytId = getYouTubeId(url);
  if (ytId) return <><img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover" /><FaPlay className="absolute text-white" size={10}/></>;
  if (url.match(/\.(gif|jpg|jpeg|png|webp)$/i)) return <img src={url} className="w-full h-full object-cover" />;
  if (url.match(/\.(mp4|webm|mov)$/i)) return <video src={url} className="w-full h-full object-cover" autoPlay loop muted playsInline />;
  return <FaVideoSlash className="text-white/20" size={14}/>;
};

export default function ModalCatalogo({ isOpen, onClose, onSelect }: any) {
  const [busca, setBusca] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<any[]>([]);
  const [catAtiva, setCatAtiva] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
  }, []);

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    if (!isOpen) return;
    const carregar = async () => {
      setLoading(true);
      // Puxa agora da SUA biblioteca global centralizada, igual na página de catálogos
      const { data, error } = await supabase.from('exercicios').select('*');
      
      let temp: any[] = [];
      
      if (data && !error) {
         data.forEach((e: any) => temp.push({ 
           nome: e.nome, 
           video: e.media_url || '', 
           grupo: e.categoria || autoCategorize(e.nome) 
         }));
      }

      // Remover duplicatas e ordenar
      const unicos = Array.from(new Map(temp.map(i => [i.nome.toLowerCase().trim(), i])).values());
      setItems(unicos.sort((a,b) => a.nome.localeCompare(b.nome)));
      setLoading(false);
    };
    carregar();
  }, [isOpen]);

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(items.map(i => i.grupo))).sort()], [items]);

  const filtrados = items.filter(i => 
    (catAtiva === 'Todos' || i.grupo === catAtiva) && 
    i.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const toggle = (item: any) => {
    if (selecionados.some(s => s.nome === item.nome)) setSelecionados(selecionados.filter(s => s.nome !== item.nome));
    else setSelecionados([...selecionados, item]);
  };

  if (!isOpen) return null;

  return (
    <div style={themeStyles} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in duration-300">
      
      {/* Container Fullscreen no Mobile e Centralizado no PC */}
      <div className="bg-[var(--surface)] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-[var(--border)] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 text-[var(--text-primary)]">
        
        {/* CABEÇALHO */}
        <div className="p-5 sm:p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-sec)]/50 pt-[max(env(safe-area-inset-top,1.25rem),1.25rem)] shrink-0">
          <div>
            <h3 className="font-black text-xl tracking-tight">Catálogo de Exercícios</h3>
            <p className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest mt-1">
              {selecionados.length} selecionados
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 shadow-sm">
            <FaTimes size={16}/>
          </button>
        </div>

        {/* BUSCA */}
        <div className="p-5 bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14}/>
            <input 
              className="w-full bg-[var(--surface-sec)] border border-[var(--border)] py-4 pl-12 pr-4 rounded-[1.2rem] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-secondary)]/70 shadow-inner" 
              placeholder="Qual exercício você procura?" 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
            />
          </div>
        </div>

        {/* CHIPS DE CATEGORIA */}
        <div className="flex gap-2.5 p-4 overflow-x-auto custom-scrollbar border-b border-[var(--border)] bg-[var(--surface-sec)]/30 shrink-0">
          {categorias.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCatAtiva(cat)} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                catAtiva === cat 
                  ? 'bg-[var(--primary)] text-white border-transparent shadow-lg shadow-[var(--primary)]/20' 
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--primary)]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LISTAGEM DE EXERCÍCIOS (GRID PREMIUM) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-[var(--surface)]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
          ) : filtrados.length > 0 ? (
            filtrados.map((item, idx) => {
              const isSel = selecionados.some(s => s.nome === item.nome);
              return (
                <div 
                  key={idx} 
                  onClick={() => toggle(item)} 
                  className={`p-3 rounded-[1.5rem] border flex items-center gap-4 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                    isSel 
                      ? 'bg-[var(--primary)]/5 border-[var(--primary)] shadow-sm' 
                      : 'bg-[var(--surface-sec)] border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-sec)]/80'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-1 transition-colors ${
                    isSel ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}>
                    {isSel && <FaCheck size={10}/>}
                  </div>
                  
                  {/* Aspect-Video Thumbnail para Visualização Limpa */}
                  <div className="w-24 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-[var(--border)] flex items-center justify-center relative shadow-inner">
                    <MediaPreview url={item.video} />
                  </div>
                  
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm font-black text-[var(--text-primary)] truncate leading-tight mb-1">{item.nome}</span>
                    <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest px-2 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded-md inline-block w-max">
                      {item.grupo}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-[var(--border)] rounded-[2rem] bg-[var(--surface-sec)]/50">
              <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">
                Nenhum exercício encontrado.
              </p>
            </div>
          )}
        </div>

        {/* RODAPÉ DE AÇÃO FIXO */}
        {selecionados.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-[var(--border)] bg-[var(--surface)] shrink-0 pb-[max(env(safe-area-inset-bottom,1.25rem),1.25rem)]">
            <button 
              onClick={() => { onSelect(selecionados); setSelecionados([]); onClose(); }} 
              className="w-full py-4 sm:py-5 bg-[var(--primary)] text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 active:scale-95 transition-transform"
            >
              Adicionar {selecionados.length} {selecionados.length === 1 ? 'Exercício' : 'Exercícios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
