'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, 
  FaCheckCircle, FaTrash, FaUpload, FaPlus, FaSave, FaFolderOpen, FaVideo, FaSearch,
  FaArrowUp, FaArrowDown, FaPlay, FaTimes, FaListUl, FaVideoSlash, FaBars,
  FaChevronDown, FaChevronUp, FaDownload, FaStar
} from 'react-icons/fa';

interface Serie {
  ordem?: string;
  reps: string;
  carga: string;
  unidadeCarga?: string;
  intervalo: string;
}

interface Exercicio {
  nome: string;
  video: string;
  metodo: string;
  tipoSerie: string;
  series: Serie[];
  observacao?: string;
  favorito?: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SISTEMA INTELIGENTE DE CATEGORIZAÇÃO
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
// COMPONENTE: BUSCADOR INTELIGENTE DE EXERCÍCIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BuscadorExercicio = ({ valorNome, aoMudarNome, aoSelecionarExercicio, biblioteca, placeholder, onBlurFallback, onOpenCatalog }: any) => {
  const [mostrar, setMostrar] = useState(false);
  
  const sugestoes = biblioteca.filter((b: any) => 
    b.exercicio_nome && b.exercicio_nome.toLowerCase().includes(valorNome.toLowerCase())
  );
  const sugestoesUnicas = Array.from(new Map(sugestoes.map((item: any) => [item.exercicio_nome, item])).values()).slice(0, 6);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1">
        <div className="flex items-center gap-3 bg-[var(--surface-sec)] px-4 py-3 rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] transition-all">
           <FaSearch className="text-[var(--text-secondary)] shrink-0" size={14} />
           <input 
            className="font-bold text-[var(--text-primary)] text-sm w-full outline-none bg-transparent placeholder:text-[var(--text-secondary)]/60" 
            placeholder={placeholder} 
            value={valorNome} 
            onChange={(e) => { aoMudarNome(e.target.value); setMostrar(true); }} 
            onFocus={() => setMostrar(true)}
            onBlur={() => { setTimeout(() => { setMostrar(false); onBlurFallback(valorNome); }, 200); }} 
          />
        </div>
        
        {mostrar && valorNome.length > 0 && sugestoesUnicas.length > 0 && (
           <ul className="absolute z-[100] left-0 top-full mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[1.2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {sugestoesUnicas.map((s: any, i: number) => (
              <li 
                key={i}
                onClick={() => aoSelecionarExercicio(s.exercicio_nome, s.url_video || '')}
                className="p-4 hover:bg-[var(--surface-sec)] cursor-pointer text-[var(--text-primary)] text-sm font-bold border-b border-[var(--border)] last:border-0 transition-colors flex justify-between items-center group"
              >
                <span>{s.exercicio_nome}</span>
                {s.url_video && (
                  <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-md uppercase tracking-widest shrink-0 flex items-center gap-1 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    <FaPlay size={8} /> Vídeo
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <button type="button" onClick={onOpenCatalog} title="Abrir Catálogo de Exercícios" className="w-11 h-11 shrink-0 bg-[var(--surface-sec)] text-[var(--primary)] rounded-xl flex items-center justify-center hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] transition-all active:scale-95 shadow-sm">
        <FaListUl size={14} />
      </button>
    </div>
  )
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE: MODAL CATÁLOGO DE EXERCÍCIOS (SELEÇÃO MÚLTIPLA)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ModalCatalogoExercicios({ isOpen, onClose, biblioteca, onSelectMultiple, t }: any) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');
  const [filtroOrigem, setFiltroOrigem] = useState<'todos' | 'favoritos' | 'app'>('todos');
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<any[]>([]);

  const bibliotecaCategorizada = useMemo(() => {
    const unicos = Array.from(new Map(biblioteca.map((item: any) => [item.exercicio_nome, item])).values());
    return unicos.map((b: any) => ({ ...b, categoria: b.categoria || autoCategorize(b.exercicio_nome), favorito: b.favorito || false })).sort((a, b) => a.exercicio_nome.localeCompare(b.exercicio_nome));
  }, [biblioteca]);

  const categorias = useMemo(() => {
    const cats = new Set(bibliotecaCategorizada.map(b => b.categoria));
    return ['Todos', ...Array.from(cats)].sort();
  }, [bibliotecaCategorizada]);

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
            const ytId = ex.url_video ? getYouTubeId(ex.url_video) : null;
            const isSelected = selecionados.some(s => s.exercicio_nome === ex.exercicio_nome);
            
            return (
              <div key={i} onClick={() => toggleSelect(ex)} className={`border rounded-[1.2rem] p-3 flex items-center gap-4 transition-all cursor-pointer group ${isSelected ? 'bg-[var(--primary)]/5 border-[var(--primary)]' : 'bg-[var(--surface-sec)] border-[var(--border)] hover:border-[var(--primary)]/50'}`}>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border)] bg-[var(--surface)] group-hover:border-[var(--primary)]/50'}`}>{isSelected && <FaCheckCircle size={12} />}</div>
                <div className="w-14 h-14 shrink-0 bg-black rounded-[0.8rem] overflow-hidden relative border border-[var(--border)] flex items-center justify-center">
                  {ytId ? (<><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt="" /><div className="absolute inset-0 flex items-center justify-center"><FaPlay className="text-white drop-shadow-md" size={12} /></div></>) : ex.url_video && (ex.url_video.toLowerCase().endsWith('.gif') || ex.url_video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (<img src={ex.url_video} alt="" className="w-full h-full object-cover" />) : ex.url_video ? (<video src={ex.url_video} autoPlay loop muted playsInline className="w-full h-full object-cover" />) : (<FaVideoSlash size={12} className="text-[var(--text-secondary)]/30" />)}
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DashboardSkeleton = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-10">
      <div className="w-16 h-4 bg-[var(--surface-sec)] rounded-full" />
      <div className="w-48 h-8 bg-[var(--surface-sec)] rounded-xl" />
      <div className="w-24 h-4 bg-[var(--surface-sec)] rounded-full" />
    </div>
    <div className="w-full h-12 bg-[var(--surface-sec)] rounded-2xl mb-10" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-8 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] space-y-6">
        <div className="flex justify-between"><div className="w-1/2 h-8 bg-[var(--surface-sec)] rounded-xl" /><div className="w-8 h-8 bg-[var(--surface-sec)] rounded-lg" /></div>
        <div className="w-full h-12 bg-[var(--surface-sec)] rounded-2xl" />
        <div className="w-full h-12 bg-[var(--surface-sec)] rounded-2xl" />
        <div className="w-full h-32 bg-[var(--surface-sec)] rounded-2xl" />
      </div>
    ))}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', title: 'Editar Ficha', deleteWorkout: 'Excluir',
    workoutName: 'Nome do Treino', exName: 'Nome do Exercício', delete: 'Excluir',
    videoUrl: 'URL da Mídia', uploadBtn: 'Upload de Vídeo/GIF', uploading: 'Enviando...',
    obs: 'Observação técnica...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.',
    addSeries: '+ Adicionar Série', save: 'Salvar Alterações', addExercise: 'Adicionar Exercício',
    errLimit: 'Limite de 10MB excedido!', errDefault: 'Erro: ', successSave: 'Ficha atualizada com sucesso!',
    confirmDelete: 'Tem certeza que deseja excluir esta ficha?', successVideo: 'Mídia vinculada: '
  },
  'pt-PT': {
    back: 'Voltar', title: 'Editar Ficha', deleteWorkout: 'Eliminar',
    workoutName: 'Nome do Treino', exName: 'Nome do Exercício', delete: 'Eliminar',
    videoUrl: 'URL da Multimédia', uploadBtn: 'Upload de Vídeo/GIF', uploading: 'A enviar...',
    obs: 'Observação técnica...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.',
    addSeries: '+ Adicionar Série', save: 'Guardar Alterações', addExercise: 'Adicionar Exercício',
    errLimit: 'Limite de 10MB excedido!', errDefault: 'Erro: ', successSave: 'Ficha atualizada com sucesso!',
    confirmDelete: 'Tem certeza que deseja eliminar esta ficha?', successVideo: 'Multimédia vinculada: '
  },
  'en': {
    back: 'Back', title: 'Edit Workout', deleteWorkout: 'Delete',
    workoutName: 'Workout Name', exName: 'Exercise Name', delete: 'Delete',
    videoUrl: 'Media URL', uploadBtn: 'Upload Video/GIF', uploading: 'Uploading...',
    obs: 'Technical observation...',
    series: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest',
    addSeries: '+ Add Set', save: 'Save Changes', addExercise: 'Add Exercise',
    errLimit: '10MB limit exceeded!', errDefault: 'Error: ', successSave: 'Workout updated successfully!',
    confirmDelete: 'Are you sure you want to delete this workout?', successVideo: 'Media linked: '
  }
};

function EditarFichaContent() {
  const params = useParams();
  const id = params?.id as string;
  const treinoId = (params?.treinoId || params?.treinoid) as string;
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [biblioteca, setBiblioteca] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const [expandedExIndex, setExpandedExIndex] = useState<number | null>(0);
  const [catalogoAberto, setCatalogoAberto] = useState(false);

  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };
  
  const t = translations[lang] || translations['pt-BR'];
  const showToast = (type: 'success' | 'error' | 'info', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    if (!treinoId) return;
    const carregarDados = async () => {
      setLoading(true);
      
      const [fichaRes, pRes, bibRes] = await Promise.all([
        supabase.from('fichas').select('*').eq('id', treinoId).maybeSingle(),
        supabase.from('treinos_padrao').select('*'),
        supabase.from('videos_biblioteca').select('*')
      ]);

      if (fichaRes.data) {
        setNome(fichaRes.data.nome_treino || '');
        try {
          const parsed = typeof fichaRes.data.descricao === 'string' ? JSON.parse(fichaRes.data.descricao) : fichaRes.data.descricao;
          setExercicios(Array.isArray(parsed) ? parsed : []);
        } catch (e) { setExercicios([]); }
      }
      
      let exerciciosExtraidos: any[] = [];
      
      if (pRes.data) {
        pRes.data.forEach((treino) => {
          try {
            const raw = treino.exercicios_json || treino.descricao;
            const exList = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(exList)) {
              exList.forEach((ex) => {
                if (ex.nome) exerciciosExtraidos.push({ exercicio_nome: ex.nome, url_video: ex.video || '' });
              });
            }
          } catch (e) {}
        });
      }
      
      if (bibRes.data) {
        exerciciosExtraidos = [...exerciciosExtraidos, ...bibRes.data];
      }
      
      setBiblioteca(exerciciosExtraidos);
      setLoading(false);
    };
    carregarDados();
  }, [treinoId]);

  const handleSelectMultipleExercises = (items: any[]) => {
    const novosExercicios = items.map(item => ({
      nome: item.exercicio_nome,
      video: item.url_video || '',
      metodo: 'Normal',
      tipoSerie: 'Repetições e carga',
      observacao: '',
      series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }]
    }));
    
    if (exercicios.length === 1 && !exercicios[0].nome) {
      setExercicios(novosExercicios);
    } else {
      setExercicios((prev) => [...prev, ...novosExercicios]);
    }
    setExpandedExIndex(exercicios.length);
    showToast('success', `${items.length} exercícios adicionados com sucesso!`);
  };

  const adicionarExercicio = () => {
    setExercicios(prev => [...prev, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }] }]);
    setExpandedExIndex(exercicios.length); 
  };

  const removerExercicio = (index: number) => {
    setExercicios(prev => prev.filter((_, i) => i !== index));
    setExpandedExIndex(null);
  };

  const moverExercicio = (index: number, direcao: 'cima' | 'baixo') => {
    if (direcao === 'cima' && index === 0) return;
    if (direcao === 'baixo' && index === exercicios.length - 1) return;
    
    const novosExercicios = [...exercicios];
    const indexAlvo = direcao === 'cima' ? index - 1 : index + 1;
    
    const temp = novosExercicios[index];
    novosExercicios[index] = novosExercicios[indexAlvo];
    novosExercicios[indexAlvo] = temp;
    
    setExercicios(novosExercicios);
    setExpandedExIndex(indexAlvo);
  };

  const adicionarSerie = (exIndex: number) => {
    setExercicios(prev => {
      const n = [...prev];
      if (!n[exIndex].series || !Array.isArray(n[exIndex].series)) n[exIndex].series = [];
      const proximaOrdem = `${n[exIndex].series.length + 1}ª`;
      n[exIndex].series.push({ ordem: proximaOrdem, reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' });
      return n;
    });
  };

  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => {
    setExercicios(prev => {
      const novos = [...prev];
      if (Array.isArray(novos[exIndex].series)) {
        (novos[exIndex].series[sIndex] as any)[campo] = valor;
      }
      return novos;
    });
  };

  const buscarVideo = (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const videoEncontrado = biblioteca.find(v => v.exercicio_nome?.toLowerCase().trim() === nomeExercicio.toLowerCase().trim());
    if (videoEncontrado) {
      setExercicios(prev => {
        const n = [...prev];
        n[index].video = videoEncontrado.url_video;
        return n;
      });
      showToast('info', `${t.successVideo}${nomeExercicio}!`);
    }
  };

  const uploadVideo = async (exIndex: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) return showToast('error', t.errLimit);
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `exercicios/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
      setExercicios(prev => {
        const n = [...prev];
        n[exIndex].video = data.publicUrl;
        return n;
      });
    } catch (err: any) { 
      showToast('error', t.errDefault + err.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const atualizarFicha = async () => {
    setLoading(true);
    
    // Filtra exercícios vazios
    const exerciciosValidos = exercicios.filter(ex => ex.nome && ex.nome.trim() !== '');

    const exerciciosLimpos = exerciciosValidos.map(ex => ({
      ...ex,
      series: Array.isArray(ex.series) ? ex.series.map(s => ({
        ordem: String(s.ordem || ""), 
        reps: String(s.reps || ""), 
        carga: String(s.carga || ""), 
        unidadeCarga: s.unidadeCarga || 'kg',
        intervalo: String(s.intervalo || "")
      })) : []
    }));

    const { error } = await supabase.from('fichas').update({ nome_treino: nome, descricao: JSON.stringify(exerciciosLimpos) }).eq('id', treinoId);
    if (error) {
      showToast('error', t.errDefault + error.message);
      setLoading(false);
    } else {
      router.push(`/dashboard/aluno/${id}?aba=treinos`);
    }
  };

  const excluirFicha = async () => {
    if (!window.confirm(t.confirmDelete)) return;
    setLoading(true);
    const { error } = await supabase.from('fichas').update({ ativo: false }).eq('id', treinoId);
    if (!error) router.push(`/dashboard/aluno/${id}`);
    else showToast('error', t.errDefault + error.message);
    setLoading(false);
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-x-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : toast.type === 'error' ? <FaExclamationCircle size={16} /> : <FaVideo size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      <ModalCatalogoExercicios 
        isOpen={catalogoAberto} 
        onClose={() => setCatalogoAberto(false)} 
        biblioteca={biblioteca} 
        t={t}
        onSelectMultiple={handleSelectMultipleExercises}
      />

      {loading ? <DashboardSkeleton /> : (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-700 relative z-10">
          
          <div className="flex items-center justify-between mb-6">
            <button type="button" onClick={() => router.back()} className="w-10 h-10 bg-[var(--surface)] rounded-full flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] active:scale-95 transition-all shadow-sm">
              <FaChevronLeft size={12} />
            </button>
            <h1 className="text-lg font-black tracking-tight">{t.title}</h1>
            <div className="flex gap-2">
              <button type="button" onClick={toggleLang} className="w-8 h-8 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] text-[10px] font-black border border-[var(--border)] uppercase">{lang.split('-')[0]}</button>
              <button type="button" onClick={toggleTheme} className="w-8 h-8 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center justify-center">{isDark ? <FaSun size={12} /> : <FaMoon size={12} />}</button>
            </div>
          </div>

          {/* Nome da Ficha & Ações */}
          <div className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-xl mb-6 relative">
            <div className="flex justify-between items-start mb-4">
              <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider">{t.workoutName}</label>
              <button onClick={excluirFicha} className="flex items-center gap-1.5 text-[var(--danger)] font-black text-[9px] uppercase tracking-widest hover:brightness-110 active:scale-95 bg-[var(--danger)]/10 px-3 py-1.5 rounded-lg border border-[var(--danger)]/20">
                <FaTrash size={10} /> <span className="hidden sm:inline">{t.deleteWorkout}</span>
              </button>
            </div>
            
            <input 
              className="w-full text-2xl sm:text-3xl font-black bg-transparent border-b-2 border-dashed border-[var(--border)] pb-2 outline-none placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--primary)] transition-colors text-[var(--text-primary)]" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              placeholder={t.workoutName} 
            />
            
            <div className="flex flex-wrap gap-1.5 justify-end mt-6">
              <button type="button" onClick={() => setCatalogoAberto(true)} className="px-3 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaListUl size={10}/> Catálogo</button>
              <button type="button" onClick={adicionarExercicio} className="px-3 py-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaPlus size={10}/> {t.addExercise}</button>
            </div>
          </div>

          {/* ACORDEÃO DE EXERCÍCIOS */}
          <div className="space-y-3.5">
            {exercicios.map((ex, exIndex) => {
              const isExpanded = expandedExIndex === exIndex;
              
              return (
                <div key={exIndex} className="bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] overflow-hidden shadow-md transition-all duration-200">
                  
                  {/* Cabeçalho Compacto */}
                  <div 
                    className={`p-4 flex items-center justify-between gap-3 select-none cursor-pointer ${isExpanded ? 'bg-[var(--surface-sec)]/40 border-b border-[var(--border)]' : 'hover:bg-[var(--surface-sec)]/20'}`}
                    onClick={() => setExpandedExIndex(isExpanded ? null : exIndex)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-[var(--text-secondary)]/40 shrink-0 py-1">
                        <FaBars size={14} />
                      </div>
                      
                      <div className="w-4 h-4 rounded border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center shrink-0">
                        {ex.nome && <div className="w-2 h-2 rounded-sm bg-[var(--success)]" />}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-[var(--text-primary)] truncate">
                          {ex.nome || <span className="text-[var(--text-secondary)]/40 font-medium italic">Selecione ou digite o exercício...</span>}
                        </span>
                        {ex.nome && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-[var(--primary)] mt-0.5 bg-[var(--primary)]/5 px-1.5 py-0.5 rounded width-max self-start">
                            {autoCategorize(ex.nome)} • {ex.series?.length || 0} {t.series}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controles Header */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-1 opacity-60 sm:opacity-100">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverExercicio(exIndex, 'cima'); }} disabled={exIndex === 0} className="p-1.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded border border-[var(--border)] disabled:opacity-20"><FaArrowUp size={10} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverExercicio(exIndex, 'baixo'); }} disabled={exIndex === exercicios.length - 1} className="p-1.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded border border-[var(--border)] disabled:opacity-20"><FaArrowDown size={10} /></button>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); if(confirm('Remover este exercício?')) removerExercicio(exIndex); }} className="p-1.5 bg-[var(--danger)]/5 text-[var(--danger)] rounded border border-[var(--danger)]/10 hover:bg-[var(--danger)]/10" title="Excluir"><FaTrash size={10} /></button>
                      <div className="text-[var(--text-secondary)] px-1">{isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}</div>
                    </div>
                  </div>

                  {/* Corpo Expandido */}
                  {isExpanded && (
                    <div className="p-5 bg-[var(--surface)] space-y-4 animate-in fade-in duration-200">
                      
                      <div className="grid grid-cols-1 gap-4">
                        <BuscadorExercicio 
                          valorNome={ex.nome} 
                          aoMudarNome={(val: string) => { setExercicios(prev => { const n = [...prev]; n[exIndex].nome = val; return n; }); }} 
                          aoSelecionarExercicio={(nomeSel: string, url: string) => { 
                            setExercicios(prev => { 
                              const n = [...prev]; 
                              n[exIndex].nome = nomeSel; 
                              if (url) n[exIndex].video = url; 
                              return n; 
                            }); 
                          }} 
                          biblioteca={biblioteca} 
                          placeholder="Nome do exercício..." 
                          onBlurFallback={(nome: string) => buscarVideo(nome, exIndex)} 
                          onOpenCatalog={() => setCatalogoAberto(true)} 
                        />
                      </div>

                      {/* Preview da Mídia */}
                      {ex.video && (
                        <div className="w-full h-44 sm:h-56 bg-black rounded-xl overflow-hidden border border-[var(--border)] relative shadow-inner">
                          {(ex.video.includes('youtube.com') || ex.video.includes('youtu.be')) ? (
                            <iframe className="w-full h-full absolute inset-0" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                          ) : (ex.video.toLowerCase().endsWith('.gif') || ex.video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                            <img src={ex.video} alt="" className="w-full h-full object-cover absolute inset-0" />
                          ) : (
                            <video src={ex.video} controls playsInline webkit-playsinline="true" className="w-full h-full object-cover absolute inset-0" />
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider">URL do Vídeo / GIF Execução</label>
                          <div className="relative mt-1">
                            <input className="w-full pl-3 pr-10 py-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[var(--primary)] shadow-inner" placeholder="Link da mídia (Opcional)" value={ex.video} onChange={(e) => { setExercicios(prev => { const n = [...prev]; n[exIndex].video = e.target.value; return n; }); }} />
                            <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center hover:brightness-110 active:scale-95" title={t.uploadBtn}>
                              {uploading ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={10} />}
                            </button>
                            <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*,image/gif,image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Orientação Específica do Exercício</label>
                          <textarea rows={1} className="w-full bg-[var(--surface-sec)] text-xs p-3 rounded-xl border border-[var(--border)] mt-1 outline-none text-[var(--text-primary)] focus:border-[var(--primary)] resize-none custom-scrollbar" placeholder="Ex: Manter cotovelos alinhados..." value={ex.observacao || ''} onChange={(e) => { setExercicios(prev => { const n = [...prev]; n[exIndex].observacao = e.target.value; return n; }); }} />
                        </div>
                      </div>

                      {/* Tabela de Séries Otimizada */}
                      <div className="border-t border-[var(--border)] pt-4">
                        <div className="grid grid-cols-[3rem_1fr_1.2fr_1fr_2.5rem] gap-1 sm:gap-2 text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 text-center px-1">
                          <span>{t.series}</span><span>{t.reps}</span><span>{t.load}</span><span>{t.rest}</span><span></span>
                        </div>
                        
                        <div className="space-y-2">
                          {Array.isArray(ex.series) && ex.series.map((s: any, sIndex: number) => (
                            <div key={sIndex} className="grid grid-cols-[3rem_1fr_1.2fr_1fr_2.5rem] gap-1 sm:gap-2 items-center">
                              <input type="text" className="w-full py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-black text-center text-[var(--text-primary)] outline-none" value={s.ordem ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)} placeholder={`${sIndex + 1}ª`} />
                              <input type="text" className="w-full py-2.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" value={s?.reps ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} placeholder="10" />
                              
                              <div className="flex bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl focus-within:border-[var(--primary)] overflow-hidden h-[34px] items-center">
                                <input type="text" className="w-full p-1 bg-transparent text-xs font-bold text-center text-[var(--text-primary)] outline-none min-w-0" value={s?.carga ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} placeholder="0" />
                                <select className="bg-transparent text-[8px] font-black text-[var(--text-secondary)] uppercase outline-none pr-1 cursor-pointer appearance-none" value={s?.unidadeCarga ?? 'kg'} onChange={(e) => atualizarSerie(exIndex, sIndex, 'unidadeCarga', e.target.value)}>
                                  <option value="kg" className="bg-[var(--surface)] text-[var(--text-primary)]">kg</option>
                                  <option value="lbs" className="bg-[var(--surface)] text-[var(--text-primary)]">lbs</option>
                                </select>
                              </div>

                              <input type="text" className="w-full py-2.5 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" value={s?.intervalo ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} placeholder="60s" />
                              
                              <button type="button" onClick={() => { setExercicios(prev => { const n = [...prev]; n[exIndex].series.splice(sIndex, 1); return n; }); }} className="w-full h-[34px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/5 rounded-xl transition-all border border-[var(--border)]"><FaTrash size={10} /></button>
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

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button type="button" onClick={adicionarExercicio} className="py-4 bg-[var(--surface)] border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm">
              <FaPlus size={10} /> + Digitar Manual
            </button>
            <button type="button" onClick={() => setCatalogoAberto(true)} className="py-4 bg-[var(--primary)]/5 border-2 border-dashed border-[var(--primary)]/30 text-[var(--primary)] rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105">
              <FaListUl size={10} /> + Abrir Catálogo
            </button>
          </div>

          <button onClick={atualizarFicha} className="w-full mt-8 bg-[var(--primary)] text-white py-5 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-3"> 
            <FaSave size={16} /> {t.save}
          </button>
          
        </div>
      )}
    </main>
  );
}

export default function EditarFicha() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  const bgTheme = mounted && localStorage.getItem('@premium_theme') === 'light' ? '#F3F6FB' : '#0F1115';

  return (
    <Suspense fallback={
      <main style={{ backgroundColor: bgTheme }} className="min-h-screen transition-colors duration-500">
        <DashboardSkeleton />
      </main>
    }>
      <EditarFichaContent />
    </Suspense>
  );
}