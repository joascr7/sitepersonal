'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, 
  FaCheckCircle, FaTrash, FaUpload, FaPlus, FaSave, FaFolderOpen, FaVideo, FaSearch,
  FaArrowUp, FaArrowDown, FaPlay, FaTimes, FaListUl, FaVideoSlash
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
}

interface Subdivisao {
  id: string;
  nome: string;
  exercicios: Exercicio[];
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

// Extrator rápido de ID do YouTube para Thumbnails
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE: BUSCADOR INTELIGENTE DE EXERCÍCIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BuscadorExercicio = ({ 
  valorNome, 
  aoMudarNome, 
  aoSelecionarExercicio, 
  biblioteca, 
  placeholder,
  onBlurFallback,
  onOpenCatalog
}: any) => {
  const [mostrar, setMostrar] = useState(false);
  
  const sugestoes = biblioteca.filter((b: any) => 
    b.exercicio_nome && b.exercicio_nome.toLowerCase().includes(valorNome.toLowerCase())
  );
  const sugestoesUnicas = Array.from(new Map(sugestoes.map((item: any) => [item.exercicio_nome, item])).values()).slice(0, 6);

  return (
    <div className="flex items-start gap-3 w-full">
      <div className="relative flex-1">
        <div className="flex items-center gap-3">
           <FaSearch className="text-[var(--text-secondary)] shrink-0" size={16} />
           <input 
            className="font-black text-[var(--text-primary)] text-lg sm:text-xl w-full outline-none bg-transparent placeholder:text-[var(--text-secondary)]" 
            placeholder={placeholder} 
            value={valorNome} 
            onChange={(e) => {
              aoMudarNome(e.target.value);
              setMostrar(true);
            }} 
            onFocus={() => setMostrar(true)}
            onBlur={() => {
              setTimeout(() => {
                setMostrar(false);
                onBlurFallback(valorNome);
              }, 200);
            }} 
          />
        </div>
        
        {mostrar && valorNome.length > 0 && sugestoesUnicas.length > 0 && (
           <ul className="absolute z-[100] left-0 top-full mt-3 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[1.2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {sugestoesUnicas.map((s: any, i: number) => (
              <li 
                key={i}
                onClick={() => aoSelecionarExercicio(s.exercicio_nome, s.url_video || '')}
                className="p-4 hover:bg-[var(--surface-sec)] cursor-pointer text-[var(--text-primary)] text-sm font-bold border-b border-[var(--border)] last:border-0 transition-colors flex justify-between items-center group"
              >
                <span>{s.exercicio_nome}</span>
                {s.url_video && (
                  <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1.5 rounded-md uppercase tracking-widest shrink-0 flex items-center gap-1 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    <FaPlay size={8} /> Vídeo
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <button 
        onClick={onOpenCatalog}
        title="Abrir Catálogo de Exercícios"
        className="w-12 h-12 shrink-0 bg-[var(--surface-sec)] text-[var(--primary)] rounded-xl flex items-center justify-center hover:bg-[var(--primary)] hover:text-white border border-[var(--border)] transition-all active:scale-95 shadow-sm"
      >
        <FaListUl size={16} />
      </button>
    </div>
  )
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE: MODAL CATÁLOGO DE EXERCÍCIOS PREMIUM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ModalCatalogoExercicios({ isOpen, onClose, biblioteca, onSelect, t }: any) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');

  const bibliotecaCategorizada = useMemo(() => {
    const unicos = Array.from(new Map(biblioteca.map((item: any) => [item.exercicio_nome, item])).values());
    return unicos.map((b: any) => ({
      ...b,
      categoria: b.categoria || autoCategorize(b.exercicio_nome)
    })).sort((a, b) => a.exercicio_nome.localeCompare(b.exercicio_nome));
  }, [biblioteca]);

  const categorias = useMemo(() => {
    const cats = new Set(bibliotecaCategorizada.map(b => b.categoria));
    return ['Todos', ...Array.from(cats)].sort();
  }, [bibliotecaCategorizada]);

  const exerciciosFiltrados = useMemo(() => {
    if (categoriaAtiva === 'Todos') return bibliotecaCategorizada;
    return bibliotecaCategorizada.filter(b => b.categoria === categoriaAtiva);
  }, [bibliotecaCategorizada, categoriaAtiva]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[400] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pt-8 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] animate-in slide-in-from-bottom-full sm:zoom-in-95">
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full absolute top-3 left-1/2 -translate-x-1/2 sm:hidden" />
        <div className="flex justify-between items-center mb-6 shrink-0 mt-2 sm:mt-0">
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Catálogo</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mt-1">{exerciciosFiltrados.length} exercícios</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-90 border border-[var(--border)]">
            <FaTimes size={16} />
          </button>
        </div>
        
        {/* Filtros de Categorias */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${
                categoriaAtiva === cat 
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30' 
                  : 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de Exercícios (Redesenhada com Preview Thumbnail) */}
        <div className="overflow-y-auto flex-1 pr-2 -mr-2 space-y-3 custom-scrollbar pb-[env(safe-area-inset-bottom)]">
          {exerciciosFiltrados.map((ex: any, i: number) => {
            const ytId = ex.url_video ? getYouTubeId(ex.url_video) : null;
            
            return (
              <div key={i} className="bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] sm:rounded-[1.5rem] p-3 flex items-center gap-4 transition-colors hover:border-[var(--primary)]/50 group">
                
                {/* Visualização de Mídia Pequena */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-black rounded-[1rem] overflow-hidden relative border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary)]/50 transition-colors">
                  {ytId ? (
                    <>
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt={ex.exercicio_nome} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <FaPlay className="text-white drop-shadow-lg opacity-80" size={16} />
                      </div>
                    </>
                  ) : ex.url_video && (ex.url_video.toLowerCase().endsWith('.gif') || ex.url_video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                    <img loading="lazy" src={ex.url_video} alt="Preview" className="w-full h-full object-cover" />
                  ) : ex.url_video ? (
                    <video src={ex.url_video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[var(--text-secondary)]/40 flex flex-col items-center gap-1">
                      <FaVideoSlash size={14} />
                    </div>
                  )}
                </div>

                {/* Informações do Exercício */}
                <div className="flex flex-col flex-1 py-1">
                  <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest mb-1">{ex.categoria}</span>
                  <span className="text-sm font-black text-[var(--text-primary)] leading-tight">{ex.exercicio_nome}</span>
                </div>

                {/* Botões */}
                <div className="shrink-0 pr-2">
                  <button 
                    onClick={() => { onSelect(ex.exercicio_nome, ex.url_video || ''); onClose(); }}
                    className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2.5 bg-[var(--primary)] text-white rounded-[1rem] sm:rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <FaPlus size={12} className="sm:hidden" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NovaFichaSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-8">
      <div className="w-16 h-4 bg-[var(--surface-sec)] rounded-full" />
      <div className="w-40 h-8 bg-[var(--surface-sec)] rounded-xl" />
      <div className="w-16 h-4 bg-transparent" />
    </div>
    <div className="w-full h-14 bg-[var(--surface-sec)] rounded-[1.2rem]" />
    <div className="w-full h-16 bg-[var(--surface-sec)] rounded-[2rem]" />
    {[1, 2].map((i) => (
      <div key={i} className="p-8 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] space-y-6">
        <div className="flex justify-between"><div className="w-1/2 h-8 bg-[var(--surface-sec)] rounded-xl" /><div className="w-8 h-8 bg-[var(--surface-sec)] rounded-lg" /></div>
        <div className="w-full h-12 bg-[var(--surface-sec)] rounded-[1.2rem]" />
        <div className="w-full h-32 bg-[var(--surface-sec)] rounded-[1.2rem]" />
      </div>
    ))}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', title: 'Nova Ficha', library: 'Biblioteca de Treinos', close: 'Fechar',
    myModels: 'Meus Modelos', defaultModels: 'Treinos Padrão',
    addFromModel: '+ Adicionar de "Meus Modelos" ou "Padrão"', workoutName: 'Nome do Programa',
    exName: 'Pesquisar Exercício...', remove: 'Remover', videoUrl: 'Link do vídeo',
    uploadVideo: 'Upload de Mídia', uploading: 'Enviando...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Descanso',
    addSeries: '+ Adicionar Série', addExercise: '+ Adicionar Exercício',
    saveFinish: 'Finalizar e Salvar', saveModel: 'Salvar como Modelo', saving: 'Salvando...',
    errLimit: 'Arquivo maior que 10MB!', errName: 'Dê um nome ao programa!', errApply: 'Erro ao aplicar este modelo.',
    errUpload: 'Erro ao enviar arquivo: ', errSave: 'Erro ao salvar: ',
    successAdd: ' adicionado!', successVideo: 'Mídia vinculada: ', successSave: 'Ficha e treinos criados com sucesso!'
  },
  'pt-PT': {
    back: 'Voltar', title: 'Nova Ficha', library: 'Biblioteca de Treinos', close: 'Fechar',
    myModels: 'Os Meus Modelos', defaultModels: 'Treinos Padrão',
    addFromModel: '+ Adicionar de "Meus Modelos" ou "Padrão"', workoutName: 'Nome do Programa',
    exName: 'Pesquisar Exercício...', remove: 'Remover', videoUrl: 'Link do vídeo',
    uploadVideo: 'Upload de Mídia', uploading: 'A enviar...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.',
    addSeries: '+ Adicionar Série', addExercise: '+ Adicionar Exercício',
    saveFinish: 'Finalizar e Guardar', saveModel: 'Guardar como Modelo', saving: 'A guardar...',
    errLimit: 'Ficheiro maior que 10MB!', errName: 'Dê um nome ao programa!', errApply: 'Erro ao aplicar este modelo.',
    errUpload: 'Erro ao enviar ficheiro: ', errSave: 'Erro ao guardar: ',
    successAdd: ' adicionado!', successVideo: 'Mídia vinculada: ', successSave: 'Ficha e treinos criados com sucesso!'
  },
  'en': {
    back: 'Back', title: 'New Workout', library: 'Workout Library', close: 'Close',
    myModels: 'My Templates', defaultModels: 'Default Templates',
    addFromModel: '+ Add from "My Templates" or "Default"', workoutName: 'Program Name',
    exName: 'Search Exercise...', remove: 'Remove', videoUrl: 'Video Link',
    uploadVideo: 'Upload Media', uploading: 'Uploading...',
    series: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest',
    addSeries: '+ Add Set', addExercise: '+ Add Exercise',
    saveFinish: 'Finish and Save', saveModel: 'Save as Template', saving: 'Saving...',
    errLimit: 'File larger than 10MB!', errName: 'Give the program a name!', errApply: 'Error applying this template.',
    errUpload: 'Error uploading file: ', errSave: 'Error saving: ',
    successAdd: ' added!', successVideo: 'Media linked: ', successSave: 'Program and workouts created successfully!'
  }
};

function NovaFichaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const abaOrigem = searchParams.get('aba') || 'treinos';
  const router = useRouter();

  const [nomeFicha, setNomeFicha] = useState(''); 
  const [subdivisoes, setSubdivisoes] = useState<Subdivisao[]>([{ 
    id: Date.now().toString(), 
    nome: 'Treino A', 
    exercicios: [{ nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '', reps: '', carga: '', unidadeCarga: 'kg', intervalo: '' }] }] 
  }]);
  const [activeSubId, setActiveSubId] = useState(subdivisoes[0].id);

  const subAtivaIndex = subdivisoes.findIndex(s => s.id === activeSubId);
  const exerciciosAtivos = subdivisoes[subAtivaIndex]?.exercicios || [];

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [meusModelos, setMeusModelos] = useState<any[]>([]);
  const [treinosPadrao, setTreinosPadrao] = useState<any[]>([]);
  const [biblioteca, setBiblioteca] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [catalogoTargetIndex, setCatalogoTargetIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);

    const fetchData = async () => {
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
            if (Array.isArray(exList)) {
              exList.forEach((ex) => {
                if (ex.nome) exerciciosExtraidos.push({ exercicio_nome: ex.nome, url_video: ex.video || '' });
              });
            }
          } catch (e) {}
        });
      }

      if (bRes.data) {
        exerciciosExtraidos = [...exerciciosExtraidos, ...bRes.data];
      }

      setBiblioteca(exerciciosExtraidos);

      if (user?.id) {
        const { data: mData } = await supabase.from('modelos_personal').select('*').eq('personal_id', user.id);
        if (mData) setMeusModelos(mData);
      }
    };
    fetchData();
  }, []); 

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };
  const t = translations[lang] || translations['pt-BR'];

  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const setExercicios = (novosOuFuncao: any) => {
    setSubdivisoes(prev => {
      const copy = [...prev];
      const ativosAntes = copy[subAtivaIndex].exercicios;
      const novos = typeof novosOuFuncao === 'function' ? novosOuFuncao(ativosAntes) : novosOuFuncao;
      copy[subAtivaIndex].exercicios = novos;
      return copy;
    });
  };

  const aplicarModelo = (modelo: any, ehPadrao: boolean) => {
    try {
      const raw = ehPadrao ? modelo.exercicios_json : modelo.descricao;
      const parseado = typeof raw === 'string' ? JSON.parse(raw) : raw;
      
      if (Array.isArray(parseado) && parseado.length > 0 && parseado[0].exercicios) {
        setSubdivisoes(parseado);
        setActiveSubId(parseado[0].id);
      } else {
        const exerciciosTratados = parseado.map((ex: any) => ({
          ...ex,
          series: Array.isArray(ex.series) ? ex.series : []
        }));
        setExercicios((prev: any) => [...prev, ...exerciciosTratados]);
      }
      
      setIsModalOpen(false);
      showToast('success', `${modelo.nome_modelo || modelo.nome}${t.successAdd}`);
    } catch (e) {
      showToast('error', t.errApply);
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
      const n = [...exerciciosAtivos];
      n[exIndex].video = data.publicUrl;
      setExercicios(n);
    } catch (err: any) {
      showToast('error', t.errUpload + err.message);
    } finally {
      setUploading(false);
    }
  };

  const adicionarExercicio = () => setExercicios([...exerciciosAtivos, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '', reps: '', carga: '', unidadeCarga: 'kg', intervalo: '' }] }]);
  const removerExercicio = (index: number) => setExercicios(exerciciosAtivos.filter((_, i) => i !== index));
  
  const moverExercicio = (index: number, direcao: 'cima' | 'baixo') => {
    if (direcao === 'cima' && index === 0) return;
    if (direcao === 'baixo' && index === exerciciosAtivos.length - 1) return;
    
    const novosExercicios = [...exerciciosAtivos];
    const indexAlvo = direcao === 'cima' ? index - 1 : index + 1;
    
    const temp = novosExercicios[index];
    novosExercicios[index] = novosExercicios[indexAlvo];
    novosExercicios[indexAlvo] = temp;
    
    setExercicios(novosExercicios);
  };

  const adicionarSerie = (exIndex: number) => {
    const n = [...exerciciosAtivos];
    if (!n[exIndex].series || !Array.isArray(n[exIndex].series)) n[exIndex].series = [];
    n[exIndex].series.push({ ordem: '', reps: '', carga: '', unidadeCarga: 'kg', intervalo: '' });
    setExercicios(n);
  };
  
  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => { 
    const n = [...exerciciosAtivos]; 
    if(Array.isArray(n[exIndex].series)) {
      (n[exIndex].series[sIndex] as any)[campo] = valor; 
      setExercicios(n); 
    }
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

  const salvarFicha = async () => {
    if (!nomeFicha) throw new Error(t.errName);
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();

    const { data: maxOrdemData } = await supabase.from('fichas')
      .select('ordem').eq('aluno_id', id).order('ordem', { ascending: false }).limit(1).maybeSingle();
    const startOrdem = (maxOrdemData?.ordem || 0) + 1;

    const inserts = subdivisoes.map((sub, idx) => {
      const exerciciosLimpos = sub.exercicios.map(ex => ({
        ...ex, 
        series: Array.isArray(ex.series) ? ex.series.map(s => ({
          ordem: String(s.ordem || ''), 
          reps: String(s.reps || ''), 
          carga: String(s.carga || ''), 
          unidadeCarga: s.unidadeCarga || 'kg',
          intervalo: String(s.intervalo || '')
        })) : []
      }));

      return {
        aluno_id: id, 
        nome_treino: subdivisoes.length > 1 ? `${nomeFicha} - ${sub.nome}` : nomeFicha, 
        descricao: JSON.stringify(exerciciosLimpos), 
        ordem: startOrdem + idx, 
        personal_id: user?.id 
      };
    });

    const { error } = await supabase.from('fichas').insert(inserts);
    if (error) throw error;

    try {
      await supabase.from('user_notifications').insert([{
        user_id: id,
        titulo: 'Novo Treino Disponível! 💪',
        corpo: `O seu personal adicionou o programa "${nomeFicha}" à sua ficha.`,
        lida: false
      }]);
    } catch (notifError) {}
  };

  const salvarCombo = async () => {
    if (!nomeFicha) return showToast('error', t.errName);
    setLoading(true);
    try {
      await salvarFicha();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      await supabase.from('modelos_personal').insert({ 
        personal_id: user.id, 
        nome_modelo: nomeFicha, 
        descricao: JSON.stringify(subdivisoes) 
      });
      
      showToast('success', t.successSave);
      router.refresh();
      router.replace(`/dashboard/aluno/${id}?aba=${abaOrigem}`);
    } catch (err: any) {
      showToast('error', t.errSave + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10 animate-in fade-in duration-700">
        
        {/* Toggles */}
        <div className="flex justify-end gap-2 mb-6">
          <button onClick={toggleLang} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
            <FaGlobe size={14} />
            <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{lang.split('-')[0].toUpperCase()}</span>
          </button>
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
            {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button onClick={() => router.back()} className="self-start flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors active:scale-95">
            <FaChevronLeft size={10} /> {t.back}
          </button>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-center">{t.title}</h1>
          <div className="hidden sm:block w-16" />
        </div>

        {/* Toasts */}
        {toast && (
          <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
            {toast.type === 'success' ? <FaCheckCircle size={16} /> : toast.type === 'error' ? <FaExclamationCircle size={16} /> : <FaVideo size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
          </div>
        )}

        {/* Modal Catálogo de Exercícios (Redesenhado) */}
        <ModalCatalogoExercicios 
          isOpen={catalogoAberto} 
          onClose={() => setCatalogoAberto(false)} 
          biblioteca={biblioteca} 
          t={t}
          onSelect={(nome: string, videoUrl: string) => {
            if (catalogoTargetIndex !== null) {
              const n = [...exerciciosAtivos];
              n[catalogoTargetIndex].nome = nome;
              if (videoUrl) {
                n[catalogoTargetIndex].video = videoUrl;
                showToast('info', `${t.successVideo}${nome}!`);
              }
              setExercicios(n);
            }
          }}
        />

        {/* Modal Modelos de Treino */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[300] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-in fade-in duration-300">
            <div className="bg-[var(--surface)] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pt-8 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] animate-in slide-in-from-bottom-full sm:zoom-in-95">
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full absolute top-3 left-1/2 -translate-x-1/2 sm:hidden" />
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-[var(--border)] pb-4 mt-2 sm:mt-0">
                <h2 className="text-xl font-black text-[var(--text-primary)]">{t.library}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest bg-[var(--surface-sec)] px-3 py-1.5 rounded-lg active:scale-95">{t.close}</button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-8 custom-scrollbar pb-[env(safe-area-inset-bottom)]">
                <div>
                  <h3 className="font-black text-[var(--primary)] uppercase text-[9px] tracking-widest mb-3 flex items-center gap-2"><FaFolderOpen /> {t.myModels}</h3>
                  <div className="grid gap-2">
                    {meusModelos.map((m) => (
                      <button key={m.id} onClick={() => aplicarModelo(m, false)} className="w-full p-4 bg-[var(--surface-sec)] hover:border-[var(--primary)] border border-[var(--border)] rounded-[1.2rem] text-sm font-bold text-[var(--text-primary)] text-left transition-all active:scale-[0.98]">
                        {m.nome_modelo}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-[var(--text-secondary)] uppercase text-[9px] tracking-widest mb-3 flex items-center gap-2"><FaFolderOpen /> {t.defaultModels}</h3>
                  <div className="grid gap-2">
                    {treinosPadrao.map((m) => (
                      <button key={m.id} onClick={() => aplicarModelo(m, true)} className="w-full p-4 bg-[var(--surface-sec)] hover:border-[var(--primary)] border border-[var(--border)] rounded-[1.2rem] text-sm font-bold text-[var(--text-primary)] text-left transition-all active:scale-[0.98]">
                        {m.nome_modelo || m.nome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <button onClick={() => setIsModalOpen(true)} className="w-full mb-8 py-5 bg-[var(--surface-sec)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
          <FaFolderOpen size={14} /> {t.addFromModel}
        </button>
        
        <div className="bg-[var(--surface)] p-6 sm:p-8 border border-[var(--border)] rounded-[2rem] shadow-sm mb-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 block">{t.workoutName} (Programa Master)</label>
          <input className="w-full bg-transparent border-b-2 border-dashed border-[var(--border)] focus:border-[var(--primary)] outline-none text-3xl font-black text-[var(--text-primary)] pb-2 transition-colors placeholder:text-[var(--text-secondary)]/50" placeholder="Ex: HIPERTROFIA" value={nomeFicha} onChange={(e) => setNomeFicha(e.target.value)} />
        </div>

        {/* ━━━━━━━━━━ TABS DE SUBDIVISÃO ━━━━━━━━━━ */}
        <div className="mb-8 overflow-hidden">
          <div className="flex overflow-x-auto gap-3 pb-4 pt-2 px-1 custom-scrollbar">
            {subdivisoes.map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubId(sub.id)}
                className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
                  activeSubId === sub.id 
                    ? 'bg-[var(--primary)] text-white shadow-[0_10px_20px_-10px_var(--primary)] border border-[var(--primary)]' 
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--text-primary)]'
                }`}
              >
                {sub.nome}
              </button>
            ))}
            <button 
              onClick={() => {
                const newId = Date.now().toString();
                setSubdivisoes([...subdivisoes, { id: newId, nome: `Treino ${String.fromCharCode(65 + subdivisoes.length)}`, exercicios: [] }]);
                setActiveSubId(newId);
              }} 
              className="px-6 py-3.5 rounded-2xl bg-[var(--surface-sec)] text-[var(--text-secondary)] hover:text-[var(--primary)] border border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2"
            >
              <FaPlus size={10} /> Adicionar Dia
            </button>
          </div>
        </div>

        {/* Header da Subdivisão Ativa */}
        <div className="flex justify-between items-center mb-6 px-2">
          <input 
            type="text" 
            value={subdivisoes[subAtivaIndex]?.nome || ''}
            onChange={e => {
              setSubdivisoes(prev => prev.map(s => s.id === activeSubId ? { ...s, nome: e.target.value } : s));
            }}
            className="font-black text-xl sm:text-2xl text-[var(--text-primary)] bg-transparent border-b border-dashed border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] outline-none pb-1 transition-colors w-full max-w-[250px]"
            placeholder="Nome do Dia (Ex: Treino A)"
          />
          
          {subdivisoes.length > 1 && (
            <button 
              onClick={() => {
                if(confirm('Tem certeza que deseja excluir esta subdivisão? Todos os exercícios deste dia serão perdidos.')) {
                  const filtrado = subdivisoes.filter(s => s.id !== activeSubId);
                  setSubdivisoes(filtrado);
                  setActiveSubId(filtrado[0].id);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--danger)]/10 text-[var(--danger)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--danger)]/20 transition-all shrink-0"
            >
              <FaTrash size={10} /> Excluir Dia
            </button>
          )}
        </div>

        {/* Lista de Exercícios da Subdivisão Ativa */}
        {exerciciosAtivos.map((ex, exIndex) => (
          <div key={exIndex} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] mb-8 shadow-xl relative group transition-all duration-300">
            
            {/* Controles de Reordenação */}
            <div className="absolute top-4 left-4 sm:-left-4 sm:top-1/2 sm:-translate-y-1/2 flex flex-row sm:flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 bg-[var(--surface)] p-1 rounded-xl shadow-lg border border-[var(--border)]">
              <button 
                onClick={() => moverExercicio(exIndex, 'cima')} 
                disabled={exIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-sec)] disabled:opacity-30 transition-colors"
              >
                <FaArrowUp size={12} />
              </button>
              <button 
                onClick={() => moverExercicio(exIndex, 'baixo')} 
                disabled={exIndex === exerciciosAtivos.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-sec)] disabled:opacity-30 transition-colors"
              >
                <FaArrowDown size={12} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6 border-b border-[var(--border)] pb-4 mt-8 sm:mt-0 ml-0 sm:ml-4">
              <BuscadorExercicio 
                valorNome={ex.nome}
                aoMudarNome={(val: string) => {
                  const n = [...exerciciosAtivos];
                  n[exIndex].nome = val;
                  setExercicios(n);
                }}
                aoSelecionarExercicio={(nomeSelecionado: string, videoUrl: string) => {
                  const n = [...exerciciosAtivos];
                  n[exIndex].nome = nomeSelecionado;
                  if (videoUrl) {
                    n[exIndex].video = videoUrl;
                    showToast('info', `${t.successVideo}${nomeSelecionado}!`);
                  }
                  setExercicios(n);
                }}
                biblioteca={biblioteca}
                placeholder={t.exName}
                onBlurFallback={(nome: string) => buscarVideo(nome, exIndex)}
                onOpenCatalog={() => {
                  setCatalogoTargetIndex(exIndex);
                  setCatalogoAberto(true);
                }}
              />

              <button onClick={() => removerExercicio(exIndex)} className="self-end sm:self-auto text-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--danger)]/20 transition-colors flex items-center justify-center gap-2 shrink-0 border border-[var(--danger)]/20">
                <FaTrash size={12} /> <span className="hidden sm:inline">{t.remove}</span>
              </button>
            </div>

            <div className="mb-8 space-y-4 ml-0 sm:ml-4">
              <div className="relative">
                <input className="w-full pl-5 pr-12 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-sm font-bold outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)] focus:border-[var(--primary)] transition-colors shadow-inner" placeholder={t.videoUrl} value={ex.video} onChange={(e) => { const n = [...exerciciosAtivos]; n[exIndex].video = e.target.value; setExercicios(n); }} />
                <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:brightness-110 transition-all active:scale-95" title={t.uploadVideo}>
                  {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={14} />}
                </button>
                <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*,image/gif,image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
              </div>
            
              {ex.video && (
                <div className="w-full h-48 sm:h-64 bg-black rounded-[1.2rem] overflow-hidden border border-[var(--border)] shadow-inner flex items-center justify-center relative">
                  {(ex.video.includes('youtube.com') || ex.video.includes('youtu.be')) ? (
                    <iframe className="w-full h-full absolute inset-0" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                  ) : (ex.video.toLowerCase().endsWith('.gif') || ex.video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                    <img src={ex.video} alt="Preview do Exercício" className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <video src={ex.video} controls playsInline webkit-playsinline="true" preload="metadata" className="w-full h-full object-cover absolute inset-0" />
                  )}
                </div>
              )}

              {/* Campo de Observação Técnica */}
              <textarea 
                placeholder="Observações técnicas do personal (Ex: Focar na cadência excêntrica, bi-set, etc)..."
                rows={2}
                className="w-full p-4 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-[1.2rem] text-xs font-medium outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)] focus:border-[var(--primary)] transition-colors resize-none custom-scrollbar"
                value={ex.observacao || ''}
                onChange={(e) => { const n = [...exerciciosAtivos]; n[exIndex].observacao = e.target.value; setExercicios(n); }}
              />
            </div>

            {/* Grid Redesenhado - Apenas 4 Colunas (+ lixeira) */}
            <div className="grid grid-cols-[3.5rem_1fr_1.5fr_1fr_2.5rem] sm:grid-cols-[4.5rem_1fr_1.5fr_1fr_3rem] gap-1 sm:gap-2 text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 text-center ml-0 sm:ml-4">
              <span>{t.series}</span><span>{t.reps}</span><span>{t.load}</span><span>{t.rest}</span><span></span>
            </div>

            <div className="space-y-3 ml-0 sm:ml-4">
              {Array.isArray(ex.series) && ex.series.map((s: any, sIndex: number) => (
                <div key={sIndex} className="grid grid-cols-[3.5rem_1fr_1.5fr_1fr_2.5rem] sm:grid-cols-[4.5rem_1fr_1.5fr_1fr_3rem] gap-1 sm:gap-2 items-center">
                  
                  {/* Ordem */}
                  <input type="text" placeholder="1ª" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.ordem ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)} />
                  
                  {/* Reps */}
                  <input type="text" placeholder="Ex: 10" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s?.reps ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                  
                  {/* Carga e Select de KG/LBS Juntos */}
                  <div className="flex bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl focus-within:border-[var(--primary)] transition-colors overflow-hidden h-full items-center">
                    <input type="text" className="w-full p-2 sm:p-3 bg-transparent text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none min-w-0" value={s?.carga ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} placeholder="0" />
                    <select className="bg-transparent text-[9px] sm:text-[10px] font-black text-[var(--text-secondary)] uppercase outline-none pr-1 cursor-pointer appearance-none" value={s?.unidadeCarga ?? 'kg'} onChange={(e) => atualizarSerie(exIndex, sIndex, 'unidadeCarga', e.target.value)}>
                      <option value="kg" className="bg-[var(--surface)] text-[var(--text-primary)]">KG</option>
                      <option value="lbs" className="bg-[var(--surface)] text-[var(--text-primary)]">LBS</option>
                    </select>
                  </div>

                  {/* Intervalo / Descanso */}
                  <input type="text" placeholder="Ex: 60s" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s?.intervalo ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                  
                  {/* Lixeira de Série */}
                  <button onClick={() => { const n = [...exerciciosAtivos]; n[exIndex].series.splice(sIndex, 1); setExercicios(n); }} className="flex justify-center items-center text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/10 h-full rounded-xl transition-colors px-2 sm:px-3 shrink-0">
                    <FaTrash size={12} />
                  </button>

                </div>
              ))}
            </div>

            <button type="button" onClick={(e) => { e.preventDefault(); adicionarSerie(exIndex); }} className="mt-6 ml-0 sm:ml-4 w-[calc(100%-0px)] sm:w-[calc(100%-1rem)] py-4 border-2 border-dashed border-[var(--border)] rounded-[1.2rem] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center justify-center gap-2"> 
              <FaPlus size={10} /> {t.addSeries} 
            </button>
          </div>
        ))}
        
        <button onClick={adicionarExercicio} className="w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all mb-8 flex items-center justify-center gap-2 bg-[var(--surface)] shadow-sm"> 
          <FaPlus size={12} /> {t.addExercise} 
        </button>
        
        <div className="flex flex-col gap-4">
          <button onClick={async () => { setLoading(true); try { await salvarFicha(); router.back(); } catch(e: any) { showToast('error', e.message); } finally { setLoading(false); }}} disabled={loading} className="w-full bg-[var(--primary)] text-white p-6 rounded-[1.5rem] font-black text-[11px] sm:text-xs uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center gap-3"> 
            {loading ? t.saving : <><FaSave size={16} /> {t.saveFinish}</>} 
          </button>
          <button onClick={salvarCombo} disabled={loading} className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] p-6 rounded-[1.5rem] font-black text-[11px] sm:text-xs uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"> 
            <FaFolderOpen size={16} /> {t.saveModel} 
          </button>
        </div>

        <div className="h-40 w-full shrink-0" />
      </div>
    </main>
  );
}

export default function NovaFicha() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  const bgTheme = mounted && localStorage.getItem('@premium_theme') === 'light' ? '#F3F6FB' : '#0F1115';

  return (
    <Suspense fallback={
      <main style={{ backgroundColor: bgTheme }} className="min-h-screen transition-colors duration-500">
        <NovaFichaSkeleton />
      </main>
    }>
      <NovaFichaContent />
    </Suspense>
  );
}