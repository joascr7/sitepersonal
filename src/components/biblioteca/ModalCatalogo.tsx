'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaTimes, FaSearch, FaPlay, FaVideoSlash, FaChevronDown, 
  FaCheck, FaStar, FaRegStar, FaChevronLeft, FaPlus, FaChevronRight 
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTELIGÊNCIA DE CATEGORIZAÇÃO (Impede que exercícios fiquem de fora)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const normalizeCategory = (nome: string, grupoOriginal?: string): string => {
  const texto = `${nome} ${grupoOriginal || ''}`.toLowerCase();
  if (/(peito|supino|crucifixo|peck deck|chest|peitoral)/.test(texto)) return 'Peito';
  if (/(costas|puxada|remada|barra|dorsal|pulldown|back)/.test(texto)) return 'Costas';
  if (/(perna|inferior|agachamento|leg|extensora|flexora|panturrilha|glúteo|stiff|afundo|coxa)/.test(texto)) return 'Inferiores';
  if (/(ombro|desenvolvimento|elevação|manguito|deltoide)/.test(texto)) return 'Ombros';
  if (/(braço|braco|rosca|tríceps|bíceps|francesa|testa)/.test(texto)) return 'Braços';
  if (/(abdômen|abdomen|core|prancha|isométrico|canivete)/.test(texto)) return 'Abdômen';
  if (/(esteira|bike|corrida|cardio|aeróbico)/.test(texto)) return 'Cardio';
  return 'Geral';
};

const normalizeModalidade = (nome: string, modOriginal?: string): string => {
  if (modOriginal) return modOriginal;
  const n = nome.toLowerCase();
  if (/(isométrico|anti-rotação|afundo|funcional|prancha)/.test(n)) return 'Funcional';
  if (/(esteira|bike|corrida)/.test(n)) return 'Cardio';
  if (/(alongamento|mobilidade)/.test(n)) return 'Mobilidade';
  return 'Musculação';
};

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Componente para renderizar a Thumbnail (Miniatura) do vídeo
const MediaPreview = ({ url }: { url: string }) => {
  if (!url) return <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-sec)]"><FaVideoSlash className="text-[var(--text-secondary)] opacity-50" size={20}/></div>;
  const ytId = getYouTubeId(url);
  if (ytId) return <><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-90" /><FaPlay className="absolute text-white/80 drop-shadow-md" size={16}/></>;
  if (url.match(/\.(gif|jpg|jpeg|png|webp)$/i)) return <img src={url} className="w-full h-full object-cover" />;
  if (url.match(/\.(mp4|webm|mov)$/i)) return <><video src={url} className="w-full h-full object-cover opacity-90" /><FaPlay className="absolute text-white/80 drop-shadow-md" size={16}/></>;
  return <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-sec)]"><FaVideoSlash className="text-[var(--text-secondary)] opacity-50" size={20}/></div>;
};

export default function ModalCatalogo({ isOpen, onClose, onSelect }: any) {
  const [busca, setBusca] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros idênticos ao layout da Imagem 3
  const [filtroOrigem, setFiltroOrigem] = useState<'favoritos' | 'app' | 'seus'>('app');
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
  }, []);

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)', '--danger': '#EF4444'
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)', '--danger': '#DC2626'
  } as React.CSSProperties;

  // Busca robusta em ambas as tabelas (Restaura os exercícios que sumiram)
  useEffect(() => {
    if (!isOpen) return;
    const carregar = async () => {
      setLoading(true);
      const [pRes, bRes] = await Promise.all([
        supabase.from('treinos_padrao').select('*'),
        supabase.from('videos_biblioteca').select('*')
      ]);

      let unificados: any[] = [];

      if (pRes.data) {
        pRes.data.forEach((treino) => {
          try {
            const raw = treino.exercicios_json || treino.descricao;
            const exList = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const processarLista = (lista: any[]) => {
              lista.forEach((ex) => {
                if (ex.nome) {
                  unificados.push({
                    id: `${treino.id}-${ex.nome}`,
                    nome: ex.nome,
                    video: ex.video || '',
                    origem: 'app',
                    favorito: false,
                    grupo: normalizeCategory(ex.nome, ex.musculo_alvo),
                    categoria: normalizeModalidade(ex.nome, ex.tipo_treino)
                  });
                }
              });
            };
            if (exList && exList.subdivisoes) exList.subdivisoes.forEach((s: any) => processarLista(s.exercicios || []));
            else if (Array.isArray(exList)) processarLista(exList);
          } catch (e) {}
        });
      }

      if (bRes.data) {
        bRes.data.forEach((b: any) => {
          unificados.push({
            id: b.id || `vid-${b.exercicio_nome}`,
            nome: b.exercicio_nome,
            video: b.url_video || '',
            origem: 'seus',
            favorito: b.favorito || false,
            grupo: normalizeCategory(b.exercicio_nome, b.musculo_alvo),
            categoria: normalizeModalidade(b.exercicio_nome, b.tipo_treino)
          });
        });
      }

      // Remove duplicatas mantendo o mais recente
      const listaLimpa = Array.from(new Map(unificados.map(item => [item.nome.toLowerCase().trim(), item])).values());
      listaLimpa.sort((a, b) => a.nome.localeCompare(b.nome));
      setItems(listaLimpa);
      setLoading(false);
    };
    carregar();
  }, [isOpen]);

  const listaGrupos = useMemo(() => ['Todos', ...Array.from(new Set(items.map(e => e.grupo))).sort()], [items]);
  const listaCategorias = useMemo(() => ['Todas', ...Array.from(new Set(items.map(e => e.categoria))).sort()], [items]);

  const filtrados = useMemo(() => {
    return items.filter(ex => {
      const bateBusca = ex.nome.toLowerCase().includes(busca.toLowerCase());
      const bateGrupo = filtroGrupo === 'Todos' || ex.grupo === filtroGrupo;
      const bateCat = filtroCategoria === 'Todas' || ex.categoria === filtroCategoria;
      let bateOrigem = true;
      if (filtroOrigem === 'favoritos') bateOrigem = ex.favorito;
      if (filtroOrigem === 'seus') bateOrigem = ex.origem === 'seus';
      if (filtroOrigem === 'app') bateOrigem = ex.origem === 'app';
      return bateBusca && bateGrupo && bateCat && bateOrigem;
    });
  }, [items, busca, filtroOrigem, filtroGrupo, filtroCategoria]);

  const toggleSelecao = (item: any) => {
    if (selecionados.some(s => s.nome === item.nome)) {
      setSelecionados(selecionados.filter(s => s.nome !== item.nome));
    } else {
      setSelecionados([...selecionados, item]);
    }
  };

  const toggleFavorito = (nome: string) => {
    setItems(prev => prev.map(e => e.nome === nome ? { ...e, favorito: !e.favorito } : e));
  };

  if (!isOpen) return null;

  return (
    <div style={themeStyles} className="fixed inset-0 bg-[var(--bg)] z-[99999] flex flex-col animate-in slide-in-from-bottom-full duration-300 antialiased font-sans">
      
      {/* ━━━━━━━━━━ HEADER MODAL ━━━━━━━━━━ */}
      <div className="pt-[max(env(safe-area-inset-top,1rem),1rem)] pb-4 px-5 bg-[var(--bg)] shadow-sm shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-full active:scale-95 transition-all">
            <FaChevronLeft size={16}/>
          </button>
          <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Biblioteca de exercícios</h2>
        </div>
      </div>

      {/* ━━━━━━━━━━ ÁREA DE CONTROLES E BUSCA ━━━━━━━━━━ */}
      <div className="bg-[var(--surface)] p-5 shrink-0 border-b border-[var(--border)] space-y-4">
        
        {/* Botão Superior (Opcional - Layout da imagem) */}
        <button className="w-full py-4 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-black text-sm flex justify-center items-center gap-2 hover:bg-[var(--primary)]/10 transition-all active:scale-[0.98]">
          <FaPlus size={14}/> Criar exercício
        </button>

        {/* Input de Busca */}
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14} />
          <input 
            type="text" 
            placeholder="Buscar exercícios..." 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)} 
            className="w-full bg-[var(--surface-sec)] border border-[var(--border)] py-4 pl-11 pr-4 rounded-xl text-sm font-bold outline-none focus:border-[var(--primary)] shadow-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 transition-colors" 
          />
        </div>

        {/* Chips de Origem (Favoritos | App | Seus) */}
        <div className="flex gap-2 w-full">
          <button onClick={() => setFiltroOrigem('favoritos')} className={`flex-1 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${filtroOrigem === 'favoritos' ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>Favoritos</button>
          <button onClick={() => setFiltroOrigem('app')} className={`flex-1 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${filtroOrigem === 'app' ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>Exercícios do app</button>
          <button onClick={() => setFiltroOrigem('seus')} className={`flex-1 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${filtroOrigem === 'seus' ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>Seus exercícios</button>
        </div>

        {/* Dropdowns (Grupos | Categorias | Limpar) */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} className="w-full appearance-none bg-transparent text-[var(--primary)] font-bold text-xs outline-none cursor-pointer pr-6">
              {listaGrupos.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Grupos musculares' : g}</option>)}
            </select>
            <FaChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none" size={10}/>
          </div>
          <div className="relative flex-1">
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full appearance-none bg-transparent text-[var(--primary)] font-bold text-xs outline-none cursor-pointer pr-6">
              {listaCategorias.map(c => <option key={c} value={c}>{c === 'Todas' ? 'Categorias' : c}</option>)}
            </select>
            <FaChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none" size={10}/>
          </div>
          <button onClick={() => { setBusca(''); setFiltroGrupo('Todos'); setFiltroCategoria('Todas'); }} className="text-[var(--primary)] text-xs font-bold pr-2">Limpar</button>
        </div>
      </div>

      {/* ━━━━━━━━━━ LISTA ROLÁVEL (OS CARDS DO SEU PRINT) ━━━━━━━━━━ */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar pb-[calc(max(env(safe-area-inset-bottom,1.5rem),1.5rem)+5rem)]">
        {loading ? (
           <div className="py-10 text-center text-sm font-bold text-[var(--text-secondary)] animate-pulse">Carregando catálogo...</div>
        ) : filtrados.length > 0 ? (
          filtrados.map((ex) => {
            const isSel = selecionados.some(s => s.nome === ex.nome);
            
            return (
              <div key={ex.id} className={`bg-[var(--surface)] border ${isSel ? 'border-[var(--primary)] shadow-md shadow-[var(--primary)]/10' : 'border-[var(--border)]'} rounded-2xl shadow-sm flex flex-col relative transition-all overflow-hidden`}>
                
                {/* Ícone de Favorito Topo Direito */}
                <button onClick={() => toggleFavorito(ex.nome)} className="absolute top-4 right-4 p-2 hover:scale-110 transition-transform z-10">
                  {ex.favorito ? <FaStar className="text-yellow-500" size={18} /> : <FaRegStar className="text-[var(--text-primary)]" size={18} />}
                </button>

                {/* Conteúdo Superior do Card */}
                <div className="flex items-start gap-4 p-4 pb-0">
                  {/* Imagem Larga 16:9 */}
                  <div className="w-[120px] aspect-video bg-[var(--surface-sec)] rounded-xl overflow-hidden relative shrink-0 border border-[var(--border)] group">
                    <MediaPreview url={ex.video} />
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1 pt-1 pr-8">
                    <h3 className="font-black text-[15px] text-[var(--text-primary)] leading-tight">{ex.nome}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <span className="px-2.5 py-1 bg-[var(--surface-sec)] border border-[var(--border)] rounded-md text-[9px] font-bold text-[var(--text-secondary)] uppercase">{ex.grupo}</span>
                      <span className="px-2.5 py-1 bg-[var(--surface-sec)] border border-[var(--border)] rounded-md text-[9px] font-bold text-[var(--text-secondary)] uppercase">{ex.categoria || 'Musculação'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Botão Fixo Interno no Rodapé do Card */}
                <button 
                  onClick={() => toggleSelecao(ex)} 
                  className={`p-3.5 border-t border-[var(--border)] mt-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors w-full ${isSel ? 'text-[var(--danger)] hover:bg-[var(--danger)]/5' : 'text-[var(--primary)] hover:bg-[var(--primary)]/5'}`}
                >
                  {isSel ? <><FaTimes size={12}/> Remover do treino</> : <><FaPlus size={12}/> Adicionar ao treino</>}
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-[var(--border)] rounded-[1.5rem] bg-[var(--surface-sec)]/30">
            <p className="text-[var(--text-secondary)] font-bold text-xs">Nenhum exercício encontrado com estes filtros.</p>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━ RODAPÉ FLUTUANTE (Exercícios Adicionados N >) ━━━━━━━━━━ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 sm:p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] flex justify-between items-center z-50 pb-[max(env(safe-area-inset-bottom,1rem),1rem)]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">Exercícios adicionados</span>
          <span className="w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--surface-sec)] flex items-center justify-center text-xs font-black text-[var(--text-secondary)]">
            {selecionados.length}
          </span>
        </div>
        <button 
          onClick={() => { onSelect(selecionados); setSelecionados([]); onClose(); }}
          disabled={selecionados.length === 0}
          className="w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/30 disabled:opacity-50 disabled:grayscale active:scale-90 transition-transform"
        >
          <FaChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}