'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FaChevronLeft, FaExclamationCircle, FaCheckCircle, FaTrash, FaUpload, 
  FaPlus, FaSave, FaFolderOpen, FaVideo, FaSearch, FaArrowUp, FaArrowDown, 
  FaPlay, FaTimes, FaListUl, FaVideoSlash, FaBars, FaChevronDown, FaChevronUp, 
  FaCalendarAlt, FaStar
} from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERFACES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface Serie { ordem?: string; reps: string; carga: string; unidadeCarga?: string; intervalo: string; }
interface Exercicio { nome: string; video: string; metodo: string; tipoSerie: string; series: Serie[]; observacao?: string; favorito?: boolean; }
interface Subdivisao { id: string; nome: string; exercicios: Exercicio[]; }

interface FormularioTreinoUniversalProps {
  alunoId?: string; // Se passado, salva direto na ficha do aluno
  treinoIdEdicao?: string; // Se passado, entra no modo de Edição (UPDATE)
  isBiblioteca?: boolean; // Define se estamos operando na tabela 'modelos_personal' em vez de 'fichas'
  t: any; // Dicionário de tradução
  onSuccess?: () => void; // Ação após salvar com sucesso (ex: voltar página)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNÇÕES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const autoCategorize = (nome: string): string => {
  if (!nome) return 'Outros';
  const n = nome.toLowerCase();
  if (/(supino|crucifixo|peck deck|cross|flexão|peito|chest)/.test(n)) return 'Peito';
  if (/(puxada|remada|barra fixa|serrote|pull down|costas|lombar|back)/.test(n)) return 'Costas';
  if (/(agachamento|leg press|extensora|flexora|stiff|panturrilha|afundo|elevação pélvica|glúteo|perna|adutor|abdutor|squat)/.test(n)) return 'Pernas';
  if (/(desenvolvimento|elevação|manguito|ombro|deltoide|shoulder)/.test(n)) return 'Ombros';
  if (/(rosca|tríceps|francesa|testa|pulley|martelo|bíceps|braço|arm)/.test(n)) return 'Braços';
  if (/(abdominal|prancha|infra|supra|oblíquo|core|abdômen|abs)/.test(n)) return 'Core';
  if (/(esteira|bike|bicicleta|elíptico|corda|corrida|cardio|hiit)/.test(n)) return 'Cardio';
  return 'Outros';
};

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUB-COMPONENTES DE UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MediaPreview = ({ url }: { url: string }) => {
  const ytId = getYouTubeId(url);
  if (ytId) return <><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt="" /><div className="absolute inset-0 flex items-center justify-center"><FaPlay className="text-white drop-shadow-md" size={12} /></div></>;
  if (url && url.match(/\.(gif|jpg|jpeg|png|webp)$/i)) return <img src={url} alt="" className="w-full h-full object-cover" />;
  if (url) return <><video src={url} muted playsInline className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 flex items-center justify-center"><FaPlay className="text-white drop-shadow-md" size={12} /></div></>;
  return <FaVideoSlash size={12} className="text-[var(--text-secondary)]/30" />;
};

const BuscadorExercicio = ({ valorNome, aoMudarNome, aoSelecionarExercicio, biblioteca, placeholder, onBlurFallback, onOpenCatalog }: any) => {
  const [mostrar, setMostrar] = useState(false);
  const sugestoes = biblioteca.filter((b: any) => b.exercicio_nome && b.exercicio_nome.toLowerCase().includes(valorNome.toLowerCase()));
  const sugestoesUnicas = Array.from(new Map(sugestoes.map((item: any) => [item.exercicio_nome, item])).values()).slice(0, 6);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1">
        <div className="flex items-center gap-3 bg-[var(--surface-sec)] px-4 py-3 rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] transition-all">
           <FaSearch className="text-[var(--text-secondary)] shrink-0" size={14} />
           <input className="font-bold text-[var(--text-primary)] text-sm w-full outline-none bg-transparent placeholder:text-[var(--text-secondary)]/60" placeholder={placeholder} value={valorNome} onChange={(e) => { aoMudarNome(e.target.value); setMostrar(true); }} onFocus={() => setMostrar(true)} onBlur={() => { setTimeout(() => { setMostrar(false); onBlurFallback(valorNome); }, 200); }} />
        </div>
        {mostrar && valorNome.length > 0 && sugestoesUnicas.length > 0 && (
           <ul className="absolute z-[100] left-0 top-full mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[1.2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {sugestoesUnicas.map((s: any, i: number) => (
              <li key={i} onClick={() => aoSelecionarExercicio(s.exercicio_nome, s.url_video || '')} className="p-4 hover:bg-[var(--surface-sec)] cursor-pointer text-[var(--text-primary)] text-sm font-bold border-b border-[var(--border)] last:border-0 transition-colors flex justify-between items-center group">
                <span>{s.exercicio_nome}</span>
                {s.url_video && <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-md uppercase tracking-widest shrink-0 flex items-center gap-1 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors"><FaPlay size={8} /> Vídeo</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onClick={onOpenCatalog} title="Abrir Catálogo de Exercícios" className="w-11 h-11 shrink-0 bg-[var(--surface-sec)] text-[var(--primary)] rounded-xl flex items-center justify-center hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] transition-all active:scale-95 shadow-sm"><FaListUl size={14} /></button>
    </div>
  )
};

function ModalCatalogoExercicios({ isOpen, onClose, biblioteca, onSelectMultiple, setVideoAberto, t }: any) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');
  const [filtroOrigem, setFiltroOrigem] = useState<'todos' | 'favoritos' | 'app'>('todos');
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<any[]>([]);

  const bibliotecaCategorizada = useMemo(() => {
    const unicos = Array.from(new Map(biblioteca.map((item: any) => [item.exercicio_nome, item])).values());
    return unicos.map((b: any) => ({ ...b, categoria: b.categoria || autoCategorize(b.exercicio_nome), favorito: b.favorito || false })).sort((a, b) => a.exercicio_nome.localeCompare(b.exercicio_nome));
  }, [biblioteca]);

  const categorias = useMemo(() => { const cats = new Set(bibliotecaCategorizada.map(b => b.categoria)); return ['Todos', ...Array.from(cats)].sort(); }, [bibliotecaCategorizada]);

  const exerciciosFiltrados = useMemo(() => {
    let filtrado = bibliotecaCategorizada.filter(b => {
      const matchCat = categoriaAtiva === 'Todos' || b.categoria === categoriaAtiva;
      const matchOrigem = filtroOrigem === 'todos' ? true : filtroOrigem === 'favoritos' ? b.favorito : !b.custom;
      return matchCat && matchOrigem;
    });
    if (busca.trim() !== '') filtrado = filtrado.filter(b => b.exercicio_nome.toLowerCase().includes(busca.toLowerCase()));
    return filtrado;
  }, [bibliotecaCategorizada, categoriaAtiva, filtroOrigem, busca]);

  const toggleSelect = (ex: any) => {
    if (selecionados.some(s => s.exercicio_nome === ex.exercicio_nome)) setSelecionados(selecionados.filter(s => s.exercicio_nome !== ex.exercicio_nome));
    else setSelecionados([...selecionados, ex]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] w-full max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pt-8 sm:p-8 h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl border border-[var(--border)] animate-in slide-in-from-bottom-full sm:zoom-in-95 relative overflow-hidden">
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full absolute top-3 left-1/2 -translate-x-1/2 sm:hidden" />
        <div className="flex justify-between items-center mb-4 shrink-0 mt-2 sm:mt-0">
          <div><h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Biblioteca de Exercícios</h2><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mt-0.5">{exerciciosFiltrados.length} disponíveis</p></div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors border border-[var(--border)]"><FaTimes size={14} /></button>
        </div>
        <div className="relative mb-4 shrink-0">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input className="w-full bg-[var(--surface-sec)] border border-[var(--border)] py-3 pl-12 pr-4 rounded-[1.2rem] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all" placeholder="Buscar exercício..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex bg-[var(--surface-sec)] p-1 rounded-xl mb-4 shrink-0 border border-[var(--border)]">
          <button type="button" onClick={() => setFiltroOrigem('todos')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${filtroOrigem === 'todos' ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)]'}`}>Todos</button>
          <button type="button" onClick={() => setFiltroOrigem('favoritos')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 ${filtroOrigem === 'favoritos' ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)]'}`}><FaStar size={10}/> Favoritos</button>
          <button type="button" onClick={() => setFiltroOrigem('app')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${filtroOrigem === 'app' ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)]'}`}>Do App</button>
        </div>
        <div className="flex flex-wrap gap-2 pb-3 mb-2 shrink-0">
          {categorias.map(cat => (
            <button key={cat} type="button" onClick={() => setCategoriaAtiva(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${categoriaAtiva === cat ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--border)]'}`}>{cat}</button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 custom-scrollbar pb-24">
          {exerciciosFiltrados.map((ex: any, i: number) => {
            const isSelected = selecionados.some(s => s.exercicio_nome === ex.exercicio_nome);
            return (
              <div key={i} onClick={() => toggleSelect(ex)} className={`border rounded-[1.2rem] p-3 flex items-center gap-4 transition-all cursor-pointer group ${isSelected ? 'bg-[var(--primary)]/5 border-[var(--primary)]' : 'bg-[var(--surface-sec)] border-[var(--border)] hover:border-[var(--primary)]/50'}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border)] bg-[var(--surface)] group-hover:border-[var(--primary)]/50'}`}>{isSelected && <FaCheckCircle size={12} />}</div>
                <div className="w-14 h-14 shrink-0 bg-black rounded-[0.8rem] overflow-hidden relative border border-[var(--border)] flex items-center justify-center" onClick={(e) => { e.stopPropagation(); if (ex.url_video) setVideoAberto(ex.url_video); }}>
                  <MediaPreview url={ex.url_video} />
                </div>
                <div className="flex flex-col flex-1 min-w-0"><span className="text-[8px] font-black text-[var(--primary)] uppercase tracking-widest mb-0.5">{ex.categoria}</span><span className="text-sm font-black text-[var(--text-primary)] truncate leading-tight">{ex.exercicio_nome}</span></div>
              </div>
            );
          })}
        </div>
        {selecionados.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-[var(--surface)] border-t border-[var(--border)] backdrop-blur-md flex items-center justify-between animate-in slide-in-from-bottom-full duration-300 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
            <div className="text-xs font-bold text-[var(--text-secondary)]"><span className="text-[var(--primary)] font-black text-lg mr-1">{selecionados.length}</span> selecionados</div>
            <button type="button" onClick={() => { onSelectMultiple(selecionados); setSelecionados([]); setBusca(''); onClose(); }} className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all">Adicionar exercícios</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalModelosTreino({ isOpen, onClose, meusModelos, treinosPadrao, onApply, setVideoAberto, t }: any) {
  const [activeTab, setActiveTab] = useState<'meus' | 'padrao'>('meus');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseModelExercises = (modelo: any, ehPadrao: boolean) => {
    try {
      const raw = ehPadrao ? modelo.exercicios_json : modelo.descricao;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(data) && data.length > 0 && data[0].exercicios) return data.flatMap((d: any) => d.exercicios.map((e: any) => ({ ...e, rotinaDia: d.nome })));
      if (data.subdivisoes) return data.subdivisoes.flatMap((d: any) => d.exercicios.map((e: any) => ({ ...e, rotinaDia: d.nome })));
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };

  const listaAtual = activeTab === 'meus' ? meusModelos : treinosPadrao;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pt-8 sm:p-8 h-[85vh] sm:h-[80vh] flex flex-col shadow-2xl border border-[var(--border)] animate-in slide-in-from-bottom-full sm:zoom-in-95 relative overflow-hidden">
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full absolute top-3 left-1/2 -translate-x-1/2 sm:hidden" />
        <div className="flex justify-between items-center mb-6 shrink-0 mt-2 sm:mt-0">
          <div><h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Modelos de Treino</h2><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mt-0.5">Explore e aplique rotinas prontas</p></div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors border border-[var(--border)]"><FaTimes size={14} /></button>
        </div>
        <div className="flex bg-[var(--surface-sec)] p-1 rounded-xl mb-5 shrink-0 border border-[var(--border)]">
          <button type="button" onClick={() => { setActiveTab('meus'); setExpandedId(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'meus' ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)]'}`}>{t.myModels}</button>
          <button type="button" onClick={() => { setActiveTab('padrao'); setExpandedId(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'padrao' ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)]'}`}>{t.defaultModels}</button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1 space-y-3 custom-scrollbar pb-[env(safe-area-inset-bottom)]">
          {listaAtual.map((m: any) => {
            const isExpanded = expandedId === m.id;
            const exerciciosDoModelo = parseModelExercises(m, activeTab === 'padrao');
            return (
              <div key={m.id} className="bg-[var(--surface-sec)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
                <div onClick={() => setExpandedId(isExpanded ? null : m.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none">
                  <div className="flex flex-col min-w-0"><strong className="text-sm font-black text-[var(--text-primary)] truncate">{m.nome_modelo || m.nome}</strong><span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase mt-0.5 tracking-wider text-[var(--primary)]">{exerciciosDoModelo.length} Exercícios</span></div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onApply(m, activeTab === 'padrao'); onClose(); }} className="px-4 py-2 bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all">Aplicar</button>
                    <div className={`text-[var(--text-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><FaChevronDown size={12} /></div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-4 bg-[var(--surface)]/60 border-t border-[var(--border)] space-y-2.5 animate-in fade-in duration-200">
                    {exerciciosDoModelo.map((ex: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                        <div className="w-11 h-11 bg-black rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-[var(--border)] cursor-pointer" onClick={() => { if(ex.video) setVideoAberto(ex.video) }}>
                          <MediaPreview url={ex.video} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1"><span className="text-xs font-black text-[var(--text-primary)] truncate">{ex.nome}</span><span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{ex.rotinaDia ? `Dia: ${ex.rotinaDia}` : autoCategorize(ex.nome)}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE PRINCIPAL UNIFICADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function FormularioTreinoUniversal({ alunoId, treinoIdEdicao, isBiblioteca, t, onSuccess }: FormularioTreinoUniversalProps) {
  const router = useRouter();

  const [tipoCriacao, setTipoCriacao] = useState<'treino' | 'pasta' | null>(treinoIdEdicao ? 'treino' : null); // Se está editando, assume já a view de edição
  const [tipoTreinoForm, setTipoTreinoForm] = useState('Musculação');
  const [objetivoForm, setObjetivoForm] = useState('Hipertrofia');
  const [dificuldadeForm, setDificuldadeForm] = useState('Intermediário');
  const [dataInicio, setDataInicio] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const [nomeFicha, setNomeFicha] = useState(''); 
  const [subdivisoes, setSubdivisoes] = useState<Subdivisao[]>([{ 
    id: Date.now().toString(), nome: 'Treino A', 
    exercicios: [{ nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }] }] 
  }]);
  
  const [activeSubId, setActiveSubId] = useState(subdivisoes[0].id);
  const subAtivaIndex = subdivisoes.findIndex(s => s.id === activeSubId) !== -1 ? subdivisoes.findIndex(s => s.id === activeSubId) : 0;
  const exerciciosAtivos = subdivisoes[subAtivaIndex]?.exercicios || [];

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  
  const [meusModelos, setMeusModelos] = useState<any[]>([]);
  const [treinosPadrao, setTreinosPadrao] = useState<any[]>([]);
  const [biblioteca, setBiblioteca] = useState<any[]>([]);
  
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [modelosAberto, setModelosAberto] = useState(false);
  const [catalogoTargetIndex, setCatalogoTargetIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [expandedExIndex, setExpandedExIndex] = useState<number | null>(0);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BUSCA DE DADOS INICIAL E EDIÇÃO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const carregarDadosEssenciais = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [pRes, bRes] = await Promise.all([
        supabase.from('treinos_padrao').select('*'), 
        supabase.from('videos_biblioteca').select('*')
      ]);
      
      let exerciciosExtraidos: any[] = [];
      if (pRes.data) {
        setTreinosPadrao(pRes.data);
        pRes.data.forEach((treino) => {
          try {
            const raw = treino.exercicios_json || treino.descricao;
            const exList = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (exList?.subdivisoes) exList.subdivisoes.forEach((s: any) => s.exercicios?.forEach((ex: any) => { if (ex.nome) exerciciosExtraidos.push({ exercicio_nome: ex.nome, url_video: ex.video || '' }); }));
            else if (Array.isArray(exList)) exList.forEach((ex: any) => { if (ex.nome) exerciciosExtraidos.push({ exercicio_nome: ex.nome, url_video: ex.video || '' }); });
          } catch (e) {}
        });
      }
      if (bRes.data) exerciciosExtraidos = [...exerciciosExtraidos, ...bRes.data];
      setBiblioteca(exerciciosExtraidos);

      if (user?.id) {
        const { data: mData } = await supabase.from('modelos_personal').select('*').eq('personal_id', user.id);
        if (mData) setMeusModelos(mData);
      }

      // SE ESTIVER EM MODO EDIÇÃO, CARREGA A FICHA/MODELO EXISTENTE
      if (treinoIdEdicao) {
        const tabela = isBiblioteca ? 'modelos_personal' : 'fichas';
        const { data: fichaEdicao } = await supabase.from(tabela).select('*').eq('id', treinoIdEdicao).maybeSingle();
        
        if (fichaEdicao) {
          setNomeFicha(fichaEdicao.nome_treino || fichaEdicao.nome_modelo || '');
          setTipoTreinoForm(fichaEdicao.tipo_treino || 'Musculação');
          setObjetivoForm(fichaEdicao.objetivo || 'Hipertrofia');
          setDificuldadeForm(fichaEdicao.dificuldade || 'Intermediário');
          setDataInicio(fichaEdicao.data_inicio || '');
          setDataVencimento(fichaEdicao.data_vencimento || '');
          
          try {
            const parsed = typeof fichaEdicao.descricao === 'string' ? JSON.parse(fichaEdicao.descricao) : fichaEdicao.descricao;
            if (parsed.subdivisoes) {
              setSubdivisoes(parsed.subdivisoes);
              setActiveSubId(parsed.subdivisoes[0].id);
              setTipoCriacao('pasta');
            } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].exercicios) {
              setSubdivisoes(parsed);
              setActiveSubId(parsed[0].id);
              setTipoCriacao('pasta');
            } else {
              // É uma ficha simples de dia único
              setSubdivisoes([{ id: '1', nome: 'Treino A', exercicios: Array.isArray(parsed) ? parsed : [] }]);
              setActiveSubId('1');
              setTipoCriacao('treino');
            }
          } catch (e) {
             console.error("Erro ao carregar exercícios para edição");
          }
        }
      }
    };
    carregarDadosEssenciais();
  }, [treinoIdEdicao, isBiblioteca]); 

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FUNÇÕES DE MANIPULAÇÃO DE EXERCÍCIOS E SÉRIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const setExercicios = (novosOuFuncao: any) => {
    setSubdivisoes(prev => {
      const copy = [...prev];
      const currentIndex = copy.findIndex(s => s.id === activeSubId);
      if (currentIndex === -1) return prev;
      const ativosAntes = copy[currentIndex].exercicios;
      const novos = typeof novosOuFuncao === 'function' ? novosOuFuncao(ativosAntes) : novosOuFuncao;
      copy[currentIndex].exercicios = novos;
      return copy;
    });
  };

  const aplicarModelo = (modelo: any, ehPadrao: boolean) => {
    try {
      const raw = ehPadrao ? modelo.exercicios_json : modelo.descricao;
      const parseado = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parseado?.subdivisoes) {
        setSubdivisoes(parseado.subdivisoes);
        setActiveSubId(parseado.subdivisoes[0].id);
      } else if (Array.isArray(parseado) && parseado.length > 0 && parseado[0].exercicios) {
        setSubdivisoes(parseado);
        setActiveSubId(parseado[0].id);
      } else {
        const exerciciosTratados = parseado.map((ex: any) => ({ ...ex, series: Array.isArray(ex.series) ? ex.series : [] }));
        setExercicios((prev: any) => [...prev, ...exerciciosTratados]);
      }
      setTipoCriacao('pasta'); 
      showToast('success', `${modelo.nome_modelo || modelo.nome}${t.successAdd}`);
    } catch (e) { showToast('error', t.errApply); }
  };

  const uploadVideo = async (exIndex: number, file: File) => {
    if (file.size > 15 * 1024 * 1024) return showToast('error', t.errLimit);
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `exercicios/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
      const n = [...exerciciosAtivos];
      n[exIndex].video = data.publicUrl;
      setExercicios(n);
    } catch (err: any) { showToast('error', t.errUpload + err.message); } finally { setUploading(false); }
  };

  const adicionarExercicio = () => {
    setExercicios((prev: Exercicio[]) => [...prev, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }] }]);
    setExpandedExIndex(exerciciosAtivos.length); 
  };
  
  const removerExercicio = (index: number) => { setExercicios((prev: Exercicio[]) => prev.filter((_, i) => i !== index)); setExpandedExIndex(null); };
  
  const moverExercicio = (index: number, direcao: 'cima' | 'baixo') => {
    setSubdivisoes(prev => prev.map(sub => {
      if (sub.id !== activeSubId) return sub;
      const arr = [...sub.exercicios];
      const alvo = direcao === 'cima' ? index - 1 : index + 1;
      if (alvo < 0 || alvo >= arr.length) return sub;
      [arr[index], arr[alvo]] = [arr[alvo], arr[index]];
      setExpandedExIndex(alvo);
      return { ...sub, exercicios: arr };
    }));
  };

  const adicionarSerie = (exIndex: number) => {
    const n = [...exerciciosAtivos];
    if (!n[exIndex].series || !Array.isArray(n[exIndex].series)) n[exIndex].series = [];
    const proximaOrdem = `${n[exIndex].series.length + 1}ª`;
    n[exIndex].series.push({ ordem: proximaOrdem, reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' });
    setExercicios(n);
  };
  
  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => { 
    const n = [...exerciciosAtivos]; 
    if(Array.isArray(n[exIndex].series)) { (n[exIndex].series[sIndex] as any)[campo] = valor; setExercicios(n); }
  };
  
  const buscarVideo = (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const videoEncontrado = biblioteca.find(v => v.exercicio_nome?.toLowerCase().trim() === nomeExercicio.toLowerCase().trim());
    if (videoEncontrado) {
      const n = [...exerciciosAtivos];
      n[index].video = videoEncontrado.url_video;
      setExercicios(n);
      showToast('info', `${t.successVideo}${nomeExercicio}!`);
    }
  };

  const handleSelectMultipleExercises = (items: any[]) => {
    const novosExercicios = items.map(item => ({
      nome: item.exercicio_nome, video: item.url_video || '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }]
    }));
    if (exerciciosAtivos.length === 1 && !exerciciosAtivos[0].nome) setExercicios(novosExercicios);
    else setExercicios((prev: Exercicio[]) => [...prev, ...novosExercicios]);
    setExpandedExIndex(exerciciosAtivos.length);
    showToast('success', `${items.length} exercícios adicionados!`);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LÓGICA UNIVERSAL DE SALVAMENTO DE DADOS NO SUPABASE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const executarSalvamento = async (salvarCopiaNaBiblioteca = false) => {
    if (!nomeFicha) return showToast('error', t.errName);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Limpeza de exercícios vazios antes de salvar
      const subLimpas = subdivisoes.map(sub => ({
        ...sub,
        exercicios: sub.exercicios.filter(ex => ex.nome && ex.nome.trim() !== '').map(ex => ({
          ...ex,
          series: Array.isArray(ex.series) ? ex.series.map(s => ({
            ordem: String(s.ordem || ''), reps: String(s.reps || ''), carga: String(s.carga || ''), unidadeCarga: s.unidadeCarga || 'kg', intervalo: String(s.intervalo || '')
          })) : []
        }))
      }));

      // Determina o Payload do JSON
      const jsonDescricao = tipoCriacao === 'pasta' || isBiblioteca ? subLimpas : subLimpas[0].exercicios;

      if (alunoId && !isBiblioteca) {
        // MODO ALUNO: Salva na tabela FICHAS
        if (treinoIdEdicao) {
          // UPDATE
          await supabase.from('fichas').update({
            nome_treino: nomeFicha, descricao: JSON.stringify(jsonDescricao),
            tipo_treino: tipoTreinoForm, objetivo: objetivoForm, dificuldade: dificuldadeForm,
            data_inicio: dataInicio || null, data_vencimento: dataVencimento || null
          }).eq('id', treinoIdEdicao);
        } else {
          // INSERT 
          const { data: maxOrdemData } = await supabase.from('fichas').select('ordem').eq('aluno_id', alunoId).order('ordem', { ascending: false }).limit(1).maybeSingle();
          const startOrdem = (maxOrdemData?.ordem || 0) + 1;
          
          const inserts = subLimpas.map((sub, idx) => ({
            aluno_id: alunoId, personal_id: user?.id,
            nome_treino: subLimpas.length > 1 ? `${nomeFicha} - ${sub.nome}` : nomeFicha,
            descricao: JSON.stringify(subLimpas.length > 1 ? sub.exercicios : jsonDescricao),
            ordem: startOrdem + idx, ativo: true,
            tipo_treino: tipoTreinoForm, objetivo: objetivoForm, dificuldade: dificuldadeForm,
            data_inicio: dataInicio || null, data_vencimento: dataVencimento || null
          }));
          await supabase.from('fichas').insert(inserts);

          // Notificação de Novo Treino
          await supabase.from('user_notifications').insert([{ user_id: alunoId, titulo: 'Novo Treino Disponível! 💪', corpo: `O seu personal adicionou o programa "${nomeFicha}".`, lida: false }]).catch(()=>{});
        }

        // Se marcou para salvar como modelo extra
        if (salvarCopiaNaBiblioteca) {
          await supabase.from('modelos_personal').insert({
            personal_id: user?.id, nome_modelo: nomeFicha,
            descricao: JSON.stringify({ subdivisoes: subLimpas, tipo_treino: tipoTreinoForm, objetivo: objetivoForm, dificuldade: dificuldadeForm })
          });
        }
      } else {
        // MODO BIBLIOTECA: Salva na tabela MODELOS_PERSONAL
        const payloadModelo = {
          personal_id: user?.id, nome_modelo: nomeFicha,
          descricao: JSON.stringify({ subdivisoes: subLimpas, tipo_treino: tipoTreinoForm, objetivo: objetivoForm, dificuldade: dificuldadeForm })
        };
        if (treinoIdEdicao) await supabase.from('modelos_personal').update(payloadModelo).eq('id', treinoIdEdicao);
        else await supabase.from('modelos_personal').insert([payloadModelo]);
      }

      showToast('success', t.successSave || "Salvo com sucesso!");
      if (onSuccess) onSuccess(); else router.back();

    } catch (err: any) { showToast('error', t.errSave + err.message); } finally { setLoading(false); }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDERIZAÇÃO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="w-full relative z-10 animate-in fade-in duration-500 pb-10">
      
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : toast.type === 'error' ? <FaExclamationCircle size={16} /> : <FaVideo size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* PLAYER DE VÍDEO NATIVO */}
      {videoAberto && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button onClick={() => setVideoAberto(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaTimes size={20}/></button>
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {getYouTubeId(videoAberto) ? (
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeId(videoAberto)}?autoplay=1`} allow="autoplay; fullscreen" />
            ) : videoAberto.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
              <img src={videoAberto} className="w-full h-full object-contain" />
            ) : (
              <video src={videoAberto} controls autoPlay playsInline className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      <ModalCatalogoExercicios isOpen={catalogoAberto} onClose={() => setCatalogoAberto(false)} biblioteca={biblioteca} t={t} onSelectMultiple={handleSelectMultipleExercises} setVideoAberto={setVideoAberto} />
      <ModalModelosTreino isOpen={modelosAberto} onClose={() => setModelosAberto(false)} meusModelos={meusModelos} treinosPadrao={treinosPadrao} onApply={aplicarModelo} setVideoAberto={setVideoAberto} t={t} />

      {/* TELA DE SELEÇÃO INICIAL (APENAS SE NÃO ESTIVER EDITANDO E NÃO TIVER ESCOLHIDO) */}
      {!tipoCriacao && !treinoIdEdicao && (
        <div className="bg-[var(--surface)] rounded-[2rem] p-6 sm:p-8 border border-[var(--border)] shadow-xl animate-in zoom-in-95 duration-300">
           <div className="text-center mb-6"><h2 className="font-black text-xl tracking-tight text-[var(--text-primary)]">O que você deseja fazer?</h2><p className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">Escolha o formato de prescrição ideal</p></div>
           <div className="space-y-4">
             <button type="button" onClick={() => setTipoCriacao('pasta')} className="w-full py-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 font-black flex items-center justify-center gap-3 transition-all text-sm text-[var(--text-primary)] shadow-sm"><FaFolderOpen className="text-[var(--primary)]" size={16} /> Adicionar nova pasta (Rotinas A, B, C...)</button>
             {!isBiblioteca && <button type="button" onClick={() => setTipoCriacao('treino')} className="w-full py-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 font-black flex items-center justify-center gap-3 transition-all text-sm text-[var(--text-primary)] shadow-sm"><FaPlus className="text-[var(--primary)]" size={14} /> Adicionar treino simples em dia único</button>}
           </div>
        </div>
      )}

      {/* FORMULÁRIO COMPLETO */}
      {tipoCriacao && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-400">
          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border)] shadow-xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-3">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 rounded-md">Configurações Gerais</span>
              {!treinoIdEdicao && <button type="button" onClick={() => setTipoCriacao(null)} className="text-[9px] font-black uppercase tracking-widest text-[var(--danger)] bg-[var(--danger)]/5 px-2.5 py-1 rounded-md hover:bg-[var(--danger)]/10">Trocar Estrutura</button>}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">{tipoCriacao === 'pasta' || isBiblioteca ? 'Nome do Programa Master' : t.workoutName}</label>
                <input className={`w-full bg-[var(--surface-sec)] px-4 py-3.5 rounded-xl font-bold text-base outline-none border transition-colors ${!nomeFicha ? 'border-red-500/40 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--primary)]'}`} placeholder={tipoCriacao === 'pasta' ? 'Ex: HIPERTROFIA EVOLUTIVA' : 'Ex: Treino de Força'} value={nomeFicha} onChange={(e) => setNomeFicha(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Tipo</label><select value={tipoTreinoForm} onChange={e => setTipoTreinoForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none mt-1"><option>Musculação</option><option>Aeróbico</option><option>Funcional</option><option>Crossfit</option></select></div>
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Objetivo</label><select value={objetivoForm} onChange={e => setObjetivoForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none mt-1"><option>Hipertrofia</option><option>Emagrecimento</option><option>Força / Potência</option><option>Condicionamento</option></select></div>
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Dificuldade</label><select value={dificuldadeForm} onChange={e => setDificuldadeForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none mt-1"><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></div>
              </div>

              {alunoId && !isBiblioteca && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-dashed border-[var(--border)] pt-4 mt-2">
                  <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1 mb-1"><FaCalendarAlt/> Início</label><input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" /></div>
                  <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1 mb-1"><FaCalendarAlt/> Vencimento</label><input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--danger)]" /></div>
                </div>
              )}
            </div>
          </div>

          {(tipoCriacao === 'pasta' || isBiblioteca) && (
            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar shrink-0">
              {subdivisoes.map((sub) => (
                <button key={sub.id} type="button" onClick={() => { setActiveSubId(sub.id); setExpandedExIndex(0); }} className={`px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${activeSubId === sub.id ? 'bg-[var(--primary)] text-white shadow-[0_8px_16px_-6px_var(--primary)]' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'}`}>{sub.nome}</button>
              ))}
              <button type="button" onClick={() => { const newId = Date.now().toString(); const proximaLetra = String.fromCharCode(65 + subdivisoes.length); setSubdivisoes([...subdivisoes, { id: newId, nome: `Treino ${proximaLetra}`, exercicios: [] }]); setActiveSubId(newId); setExpandedExIndex(0); }} className="px-5 py-3 rounded-xl bg-[var(--surface-sec)] font-black text-[11px] uppercase border border-dashed border-[var(--border)] hover:border-[var(--primary)]/60 text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center gap-1.5 transition-colors"><FaPlus size={10}/> Adicionar Dia</button>
            </div>
          )}

          <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(tipoCriacao === 'pasta' || isBiblioteca) ? (
                <input type="text" value={subdivisoes[subAtivaIndex]?.nome || ''} onChange={e => setSubdivisoes(prev => prev.map(s => s.id === activeSubId ? { ...s, nome: e.target.value } : s))} className="font-black text-lg bg-transparent border-b border-dashed border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] outline-none pb-0.5 w-full max-w-[200px] text-[var(--text-primary)]" placeholder="Nome do Dia" />
              ) : (<h3 className="font-black text-lg text-[var(--text-primary)]">Exercícios do Treino</h3>)}
            </div>
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-end">
              <button type="button" onClick={() => setModelosAberto(true)} className="px-3 py-2 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaFolderOpen size={10}/> Modelos</button>
              <button type="button" onClick={() => setCatalogoAberto(true)} className="px-3 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaListUl size={10}/> Catálogo</button>
              <button type="button" onClick={adicionarExercicio} className="px-3 py-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaPlus size={10}/> {t.addExercise}</button>
              {(tipoCriacao === 'pasta' || isBiblioteca) && subdivisoes.length > 1 && (<button type="button" onClick={() => { if(confirm('Excluir este dia completo de treino?')) { const f = subdivisoes.filter(s => s.id !== activeSubId); setSubdivisoes(f); setActiveSubId(f[0].id); setExpandedExIndex(0); } }} className="px-3 py-2 bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all">Excluir Dia</button>)}
            </div>
          </div>

          {/* LISTA DE EXERCÍCIOS ACORDEÃO */}
          <div className="space-y-3.5">
            {exerciciosAtivos.map((ex, exIndex) => {
              const isExpanded = expandedExIndex === exIndex;
              return (
                <div key={exIndex} className="bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] overflow-hidden shadow-md transition-all duration-200">
                  <div className={`p-4 flex items-center justify-between gap-3 select-none cursor-pointer ${isExpanded ? 'bg-[var(--surface-sec)]/40 border-b border-[var(--border)]' : 'hover:bg-[var(--surface-sec)]/20'}`} onClick={() => setExpandedExIndex(isExpanded ? null : exIndex)}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-[var(--text-secondary)]/40 shrink-0 py-1"><FaBars size={14} /></div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[var(--border)] bg-black flex items-center justify-center relative cursor-pointer" onClick={(e) => { e.stopPropagation(); if (ex.video) setVideoAberto(ex.video); }}>
                        <MediaPreview url={ex.video} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-[var(--text-primary)] truncate">{ex.nome || <span className="text-[var(--text-secondary)]/40 font-medium italic">Selecione ou digite...</span>}</span>
                        {ex.nome && <span className="text-[8px] font-black uppercase tracking-wider text-[var(--primary)] mt-0.5 bg-[var(--primary)]/5 px-1.5 py-0.5 rounded width-max self-start">{autoCategorize(ex.nome)} • {ex.series?.length || 0} {t.series}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-1 opacity-60 sm:opacity-100">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverExercicio(exIndex, 'cima'); }} disabled={exIndex === 0} className="p-1.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded border border-[var(--border)] disabled:opacity-20"><FaArrowUp size={10} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverExercicio(exIndex, 'baixo'); }} disabled={exIndex === exerciciosAtivos.length - 1} className="p-1.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded border border-[var(--border)] disabled:opacity-20"><FaArrowDown size={10} /></button>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); if(confirm('Remover este exercício?')) removerExercicio(exIndex); }} className="p-1.5 bg-[var(--danger)]/5 text-[var(--danger)] rounded border border-[var(--danger)]/10 hover:bg-[var(--danger)]/10" title="Excluir"><FaTrash size={10} /></button>
                      <div className="text-[var(--text-secondary)] px-1">{isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 bg-[var(--surface)] space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 gap-4">
                        <BuscadorExercicio valorNome={ex.nome} aoMudarNome={(val: string) => { setExercicios((prev: any) => { const n = [...prev]; n[exIndex].nome = val; return n; }); }} aoSelecionarExercicio={(nomeSel: string, url: string) => { setExercicios((prev: any) => { const n = [...prev]; n[exIndex].nome = nomeSel; if (url) n[exIndex].video = url; return n; }); }} biblioteca={biblioteca} placeholder="Nome do exercício..." onBlurFallback={(nome: string) => buscarVideo(nome, exIndex)} onOpenCatalog={() => setCatalogoAberto(true)} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider">URL do Vídeo / GIF Execução</label>
                          <div className="relative mt-1">
                            <input className="w-full pl-3 pr-10 py-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[var(--primary)] shadow-inner" placeholder="Link da mídia (Opcional)" value={ex.video || ''} onChange={(e) => { setExercicios((prev: any) => { const n = [...prev]; n[exIndex].video = e.target.value; return n; }); }} />
                            <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center hover:brightness-110 active:scale-95" title="Fazer Upload">{uploading ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={10} />}</button>
                            <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*,image/gif,image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Orientação Específica</label>
                          <textarea rows={1} className="w-full bg-[var(--surface-sec)] text-xs p-3 rounded-xl border border-[var(--border)] mt-1 outline-none text-[var(--text-primary)] focus:border-[var(--primary)] resize-none custom-scrollbar" placeholder="Ex: Manter cotovelos alinhados..." value={ex.observacao || ''} onChange={(e) => { setExercicios((prev: any) => { const n = [...prev]; n[exIndex].observacao = e.target.value; return n; }); }} />
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)] pt-4">
                        <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_2.5rem] gap-1 sm:gap-2 text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 text-center px-1">
                          <span>{t.series} (Editável)</span><span>{t.reps}</span><span>{t.load}</span><span>{t.rest}</span><span></span>
                        </div>
                        
                        <div className="space-y-2">
                          {Array.isArray(ex.series) && ex.series.map((s: any, sIndex: number) => (
                            <div key={sIndex} className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_2.5rem] gap-1 sm:gap-2 items-center">
                              <input type="text" className="w-full py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-black text-center text-[var(--primary)] outline-none focus:border-[var(--primary)]" value={s.ordem || ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)} placeholder={`${sIndex + 1}ª`} />
                              <input type="text" className="w-full py-2.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" value={s.reps || ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} placeholder="10" />
                              
                              <div className="flex bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl focus-within:border-[var(--primary)] overflow-hidden h-[34px] items-center">
                                <input type="text" className="w-full p-1 bg-transparent text-xs font-bold text-center text-[var(--text-primary)] outline-none min-w-0" value={s.carga || ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} placeholder="0" />
                                <select className="bg-transparent text-[8px] font-black text-[var(--text-secondary)] uppercase outline-none pr-1 cursor-pointer appearance-none" value={s.unidadeCarga || 'kg'} onChange={(e) => atualizarSerie(exIndex, sIndex, 'unidadeCarga', e.target.value)}>
                                  <option value="kg" className="bg-[var(--surface)] text-[var(--text-primary)]">kg</option>
                                  <option value="lbs" className="bg-[var(--surface)] text-[var(--text-primary)]">lbs</option>
                                </select>
                              </div>

                              <input type="text" className="w-full py-2.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" value={s.intervalo || ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} placeholder="60s" />
                              
                              <button type="button" onClick={() => { setExercicios((prev: any) => { const n = [...prev]; n[exIndex].series.splice(sIndex, 1); return n; }); }} className="w-full h-[34px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/5 rounded-xl transition-all border border-[var(--border)]"><FaTrash size={10} /></button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button type="button" onClick={() => adicionarSerie(exIndex)} className="flex-1 py-2.5 border border-dashed border-[var(--primary)] text-[var(--primary)] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-1"><FaPlus size={8}/> Adicionar Série</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-[var(--border)] mt-8">
            {alunoId && !isBiblioteca && (
              <button type="button" onClick={() => executarSalvamento(true)} disabled={loading} className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-[var(--primary)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm">
                <FaFolderOpen size={14} /> Salvar e Enviar p/ Biblioteca
              </button>
            )}
            <button type="button" onClick={() => executarSalvamento(false)} disabled={loading} className={`w-full bg-[var(--primary)] text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.99] shadow-xl shadow-[var(--primary)]/20 flex items-center justify-center gap-2 ${(!alunoId || isBiblioteca) ? 'sm:col-span-2' : ''}`}>
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FaSave size={14} /> {treinoIdEdicao ? 'Salvar Edição' : 'Finalizar e Salvar'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}