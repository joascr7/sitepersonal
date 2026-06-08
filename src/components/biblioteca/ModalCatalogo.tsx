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
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Componente para renderizar qualquer tipo de mídia (YouTube, Vídeo, GIF, Imagem)
const MediaPreview = ({ url }: { url: string }) => {
  const ytId = getYouTubeId(url);
  if (ytId) return <><img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover" /><FaPlay className="absolute text-white" size={10}/></>;
  if (url.match(/\.(gif|jpg|jpeg|png|webp)$/i)) return <img src={url} className="w-full h-full object-cover" />;
  if (url.match(/\.(mp4|webm|mov)$/i)) return <video src={url} className="w-full h-full object-cover" muted playsInline />;
  return <FaVideoSlash className="text-white/20" size={14}/>;
};

export default function ModalCatalogo({ isOpen, onClose, onSelect }: any) {
  const [busca, setBusca] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<any[]>([]);
  const [catAtiva, setCatAtiva] = useState('Todos');

  useEffect(() => {
    if (!isOpen) return;
    const carregar = async () => {
      const [pRes, bRes] = await Promise.all([
        supabase.from('treinos_padrao').select('*'),
        supabase.from('videos_biblioteca').select('*')
      ]);
      let temp: any[] = [];
      
      const extrair = (arr: any[]) => arr.forEach(e => e.nome && temp.push({ 
        nome: e.nome, 
        video: e.video || '', 
        grupo: autoCategorize(e.nome) 
      }));

      if (pRes.data) pRes.data.forEach(t => {
        const raw = t.exercicios_json || t.descricao;
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (p?.subdivisoes) p.subdivisoes.forEach((s: any) => extrair(s.exercicios || []));
        else if (Array.isArray(p)) extrair(p);
      });
      if (bRes.data) bRes.data.forEach((b: any) => temp.push({ nome: b.exercicio_nome, video: b.url_video || '', grupo: b.musculo_alvo || 'Geral' }));

      const unicos = Array.from(new Map(temp.map(i => [i.nome.toLowerCase().trim(), i])).values());
      setItems(unicos.sort((a,b) => a.nome.localeCompare(b.nome)));
    };
    carregar();
  }, [isOpen]);

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(items.map(i => i.grupo)))], [items]);

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-[var(--surface)] w-full max-w-2xl rounded-t-[2rem] sm:rounded-2xl border border-[var(--border)] h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-sec)]">
          <div>
            <h3 className="font-black text-lg">Catálogo de Exercícios</h3>
            <p className="text-[10px] text-[var(--primary)] font-bold uppercase">{selecionados.length} selecionados</p>
          </div>
          <button onClick={onClose} className="p-2 bg-[var(--surface)] rounded-full text-[var(--text-secondary)] hover:text-red-500"><FaTimes size={16}/></button>
        </div>

        <div className="p-4 bg-[var(--surface-sec)]/50 border-b border-[var(--border)]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={12}/>
            <input className="w-full bg-[var(--surface)] border border-[var(--border)] py-3.5 pl-11 pr-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" placeholder="Buscar exercício..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 p-3 overflow-x-auto custom-scrollbar border-b border-[var(--border)]">
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCatAtiva(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${catAtiva === cat ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:bg-[var(--surface-sec)]/80'}`}>{cat}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filtrados.map((item, idx) => {
            const isSel = selecionados.some(s => s.nome === item.nome);
            return (
              <div key={idx} onClick={() => toggle(item)} className={`p-3 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98] ${isSel ? 'bg-[var(--primary)]/10 border-[var(--primary)]' : 'bg-[var(--surface-sec)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isSel ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border)]'}`}>{isSel && <FaCheck size={10}/>}</div>
                
                <div className="w-16 h-12 bg-black rounded-lg overflow-hidden shrink-0 border border-[var(--border)] flex items-center justify-center relative">
                  <MediaPreview url={item.video} />
                </div>
                
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black truncate">{item.nome}</span>
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">{item.grupo}</span>
                </div>
              </div>
            );
          })}
        </div>

        {selecionados.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-sec)]">
            <button onClick={() => { onSelect(selecionados); setSelecionados([]); onClose(); }} className="w-full py-4 bg-[var(--primary)] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 active:scale-95">Adicionar {selecionados.length} Exercícios</button>
          </div>
        )}
      </div>
    </div>
  );
}