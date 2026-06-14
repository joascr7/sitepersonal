'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaPlus, FaFolder, FaEllipsisV, FaShareSquare, FaEdit, FaTrash, 
  FaSearch, FaPlay, FaVideoSlash, FaChevronDown, FaChevronUp, 
  FaTimes, FaUpload, FaArchive, FaHeart, FaRegStar,
  FaGlobe, FaMoon, FaSun, FaCheck
} from 'react-icons/fa';
import ModalAtribuirTreino from '@/components/biblioteca/ModalAtribuirTreino';

// Extrai ID do YouTube para Thumbnail e Player Nativo
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Componente utilitário para renderizar preview de mídia
const MediaPreview = ({ url }: { url: string }) => {
  if (!url) return <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]/50"><FaVideoSlash size={24}/></div>;
  const ytId = getYouTubeId(url);
  if (ytId) return <><img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-700" alt="Preview" /><FaPlay className="absolute text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" size={24}/></>;
  if (url.match(/\.(gif|jpg|jpeg|png|webp)$/i)) return <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Preview" />;
  if (url.match(/\.(mp4|webm|mov)$/i)) return <video src={url} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-700" autoPlay loop muted playsInline />;
  return <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]/50"><FaVideoSlash size={24}/></div>;
};

// Grupos Musculares para o Select de Criação
const GRUPOS_MUSCULARES = ['Peito', 'Costas', 'Inferiores', 'Ombros', 'Braços', 'Abdômen', 'Cardio', 'Geral'];

// Inteligência de Categorização de Grupos
const autoCategorizeGrupo = (nome: string, grupoOriginal?: string): string => {
  if (grupoOriginal && grupoOriginal !== 'Geral') return grupoOriginal;
  const texto = nome.toLowerCase();
  
  if (/(peito|supino|crucifixo|peck deck|chest|peitoral)/.test(texto)) return 'Peito';
  if (/(costas|puxada|remada|barra|dorsal|pulldown|back)/.test(texto)) return 'Costas';
  if (/(perna|inferior|agachamento|leg|extensora|flexora|panturrilha|glúteo|stiff|afundo|coxa)/.test(texto)) return 'Inferiores';
  if (/(ombro|desenvolvimento|elevação|manguito|deltoide)/.test(texto)) return 'Ombros';
  if (/(braço|braco|rosca|tríceps|bíceps|francesa|testa)/.test(texto)) return 'Braços';
  if (/(abdômen|abdomen|core|prancha|isométrico|canivete)/.test(texto)) return 'Abdômen';
  if (/(esteira|bike|corrida|cardio|aeróbico)/.test(texto)) return 'Cardio';
  
  return 'Geral';
};

// Inteligência de Categorização de Modalidade
const autoCategorizeModalidade = (nome: string, modOriginal?: string): string => {
  if (modOriginal) return modOriginal;
  const n = nome.toLowerCase();
  if (/(isométrico|anti-rotação|afundo|funcional|prancha)/.test(n)) return 'Funcional';
  if (/(esteira|bike|corrida)/.test(n)) return 'Cardio';
  if (/(alongamento|mobilidade)/.test(n)) return 'Mobilidade';
  return 'Musculação';
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    routines: 'Rotinas', exercises: 'Exercícios', titleRotinas: 'Biblioteca de Treinos', titleEx: 'Catálogo de Exercícios',
    newRoutine: 'Criar Nova Rotina', active: 'Ativos', archived: 'Arquivados', noModel: 'Nenhum modelo encontrado.',
    hideDetails: 'Ocultar detalhes', tapToSee: 'Toque para ver a ficha', edit: 'Editar', assign: 'Atribuir', 
    unarchive: 'Desarquivar', archive: 'Arquivar Modelo', deletePermanent: 'Excluir Permanente',
    newExercise: 'Criar exercício', searchEx: 'Buscar qualquer exercício...', global: 'Global', myVideos: 'Meus Vídeos', 
    favorites: 'Favoritos', muscleGroups: 'Grupos musculares', categories: 'Categorias', clear: 'Limpar', 
    noExFound: 'Nenhum exercício encontrado com estes filtros.', seriesLabel: 'Séries',
    confirmDelete: 'Excluir este modelo permanentemente?', errFileLarge: 'Arquivo muito grande! Máximo de 15MB.',
    errUpload: 'Erro no upload: ', nameRequired: 'Dê um nome ao exercício!', errCreate: 'Erro ao criar exercício: ',
    newExTitle: 'Novo Exercício', exNameLabel: 'Nome do Exercício *', exGroupLabel: 'Grupo Muscular',
    exCatLabel: 'Categoria', exMediaLabel: 'Mídia (URL YouTube, Arquivo ou GIF)',
    saving: 'Salvando...', createExBtn: 'Criar Exercício no Catálogo',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro'
  },
  'pt-PT': {
    routines: 'Rotinas', exercises: 'Exercícios', titleRotinas: 'Biblioteca de Treinos', titleEx: 'Catálogo de Exercícios',
    newRoutine: 'Criar Nova Rotina', active: 'Ativos', archived: 'Arquivados', noModel: 'Nenhum modelo encontrado.',
    hideDetails: 'Ocultar detalhes', tapToSee: 'Toque para ver a ficha', edit: 'Editar', assign: 'Atribuir', 
    unarchive: 'Desarquivar', archive: 'Arquivar Modelo', deletePermanent: 'Excluir Permanente',
    newExercise: 'Criar exercício', searchEx: 'Procurar qualquer exercício...', global: 'Global', myVideos: 'Meus Vídeos', 
    favorites: 'Favoritos', muscleGroups: 'Grupos musculares', categories: 'Categorias', clear: 'Limpar', 
    noExFound: 'Nenhum exercício encontrado com estes filtros.', seriesLabel: 'Séries',
    confirmDelete: 'Excluir este modelo permanentemente?', errFileLarge: 'Ficheiro muito grande! Máximo de 15MB.',
    errUpload: 'Erro no upload: ', nameRequired: 'Dê um nome ao exercício!', errCreate: 'Erro ao criar exercício: ',
    newExTitle: 'Novo Exercício', exNameLabel: 'Nome do Exercício *', exGroupLabel: 'Grupo Muscular',
    exCatLabel: 'Categoria', exMediaLabel: 'Mídia (URL YouTube, Ficheiro ou GIF)',
    saving: 'A guardar...', createExBtn: 'Criar Exercício no Catálogo',
    selectLanguage: 'Selecione o Idioma', selectTheme: 'Aparência', themeLight: 'Modo Claro', themeDark: 'Modo Escuro'
  },
  'en': {
    routines: 'Routines', exercises: 'Exercises', titleRotinas: 'Workout Library', titleEx: 'Exercise Catalog',
    newRoutine: 'Create New Routine', active: 'Active', archived: 'Archived', noModel: 'No templates found.',
    hideDetails: 'Hide details', tapToSee: 'Tap to view', edit: 'Edit', assign: 'Assign', 
    unarchive: 'Unarchive', archive: 'Archive Template', deletePermanent: 'Delete Permanently',
    newExercise: 'Create exercise', searchEx: 'Search any exercise...', global: 'Global', myVideos: 'My Videos', 
    favorites: 'Favorites', muscleGroups: 'Muscle Groups', categories: 'Categories', clear: 'Clear', 
    noExFound: 'No exercises found with these filters.', seriesLabel: 'Sets',
    confirmDelete: 'Permanently delete this template?', errFileLarge: 'File too large! Maximum 15MB.',
    errUpload: 'Upload error: ', nameRequired: 'Give the exercise a name!', errCreate: 'Error creating exercise: ',
    newExTitle: 'New Exercise', exNameLabel: 'Exercise Name *', exGroupLabel: 'Muscle Group',
    exCatLabel: 'Category', exMediaLabel: 'Media (YouTube URL, File or GIF)',
    saving: 'Saving...', createExBtn: 'Create Exercise in Catalog',
    selectLanguage: 'Select Language', selectTheme: 'Appearance', themeLight: 'Light Mode', themeDark: 'Dark Mode'
  }
};

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

export function BibliotecaHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaInicial = searchParams.get('aba') || 'rotinas';
  
  const [aba, setAba] = useState<'rotinas' | 'exercicios'>(abaInicial as any);
  const [loading, setLoading] = useState(true);
  const [personalId, setPersonalId] = useState('');
  
  // ━━━━━━━━━ ESTADOS: ROTINAS E ARQUIVAMENTO ━━━━━━━━━
  const [rotinas, setRotinas] = useState<any[]>([]);
  const [statusRotina, setStatusRotina] = useState<'ativos' | 'arquivados'>('ativos');
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [rotinaExpandida, setRotinaExpandida] = useState<string | null>(null);
  const [modeloParaAtribuir, setModeloParaAtribuir] = useState<any>(null);

  // ━━━━━━━━━ ESTADOS: EXERCÍCIOS E PLAYER IN-APP ━━━━━━━━━
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [buscaExercicio, setBuscaExercicio] = useState('');
  const [filtroExercicio, setFiltroExercicio] = useState<'favoritos' | 'app' | 'seus'>('app');
  const [filtroGrupo, setFiltroGrupo] = useState('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [videoAberto, setVideoAberto] = useState<string | null>(null);

  const [modalCriarExercicio, setModalCriarExercicio] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [novoExercicio, setNovoExercicio] = useState({ nome: '', video: '', grupo: 'Peito', modalidade: 'Musculação' });

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    const updateSettings = () => {
      const savedTheme = localStorage.getItem('@premium_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
      const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
      if (savedLang) setLang(savedLang);
    };

    updateSettings();
    window.addEventListener('storage', updateSettings);
    window.addEventListener('config-updated', updateSettings);

    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setPersonalId(user.id);

      const { data: rotinasData } = await supabase
        .from('modelos_personal')
        .select('*')
        .eq('personal_id', user.id)
        .order('created_at', { ascending: false });
      if (rotinasData) setRotinas(rotinasData);

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
                    grupo: autoCategorizeGrupo(ex.nome, ex.musculo_alvo),
                    categoria: autoCategorizeModalidade(ex.nome, ex.tipo_treino)
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
            grupo: autoCategorizeGrupo(b.exercicio_nome, b.musculo_alvo),
            categoria: autoCategorizeModalidade(b.exercicio_nome, b.tipo_treino)
          });
        });
      }

      const listaLimpa = Array.from(new Map(unificados.map(item => [item.nome.toLowerCase().trim(), item])).values());
      listaLimpa.sort((a, b) => a.nome.localeCompare(b.nome));
      setExercicios(listaLimpa);
      setLoading(false);
    };
    
    fetchData();

    return () => {
      window.removeEventListener('storage', updateSettings);
      window.removeEventListener('config-updated', updateSettings);
    };
  }, []);

  const handleSelectLanguage = (newLang: string) => {
    setLang(newLang as any);
    localStorage.setItem('@premium_lang', newLang);
    window.dispatchEvent(new Event('config-updated'));
    setIsLangModalOpen(false);
  };

  const handleSelectTheme = (theme: 'dark' | 'light') => {
    const newIsDark = theme === 'dark';
    setIsDark(newIsDark);
    localStorage.setItem('@premium_theme', newIsDark ? 'dark' : 'light');
    window.dispatchEvent(new Event('config-updated'));
    setIsThemeModalOpen(false);
  };

  const t = translations[lang] || translations['pt-BR'];

  // Configuração Dinâmica do Tema Premium (Glassmorphism atualizado)
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': 'rgba(21, 26, 34, 0.8)', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--primary-soft': '#60A5FA', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.08)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': 'rgba(255, 255, 255, 0.85)', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--primary-soft': '#60A5FA', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.08)',
  } as React.CSSProperties;


  // ━━━━━━━━━ FUNÇÕES DE AÇÃO ━━━━━━━━━
  const deletarModelo = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await supabase.from('modelos_personal').delete().eq('id', id);
    setRotinas(prev => prev.filter(r => r.id !== id));
  };

  const toggleArquivar = async (rotina: any) => {
    const novoStatus = !rotina.arquivado;
    await supabase.from('modelos_personal').update({ arquivado: novoStatus }).eq('id', rotina.id);
    setRotinas(prev => prev.map(r => r.id === rotina.id ? { ...r, arquivado: novoStatus } : r));
    setMenuAberto(null);
  };

  const toggleFavorito = async (id: string) => {
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, favorito: !e.favorito } : e));
  };

  const uploadVideoLocal = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) return alert(t.errFileLarge);
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const fileName = `exercicios/${Date.now()}_${Math.random().toString(36).substring(5)}.${ext}`;
      const { error } = await supabase.storage.from('videos').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
      setNovoExercicio(prev => ({ ...prev, video: data.publicUrl }));
    } catch (err: any) { alert(t.errUpload + err.message); } finally { setUploading(false); }
  };

  const salvarExercicioBanco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoExercicio.nome) return alert(t.nameRequired);
    setUploading(true);
    try {
      const payload = { personal_id: personalId, exercicio_nome: novoExercicio.nome, url_video: novoExercicio.video, musculo_alvo: novoExercicio.grupo, tipo_treino: novoExercicio.modalidade, favorito: false };
      const { data, error } = await supabase.from('videos_biblioteca').insert([payload]).select().single();
      if (error) throw error;
      
      setExercicios(prev => [...prev, { 
        id: data.id, 
        nome: data.exercicio_nome, 
        video: data.url_video, 
        origem: 'seus', 
        favorito: false, 
        grupo: autoCategorizeGrupo(data.exercicio_nome, data.musculo_alvo),
        categoria: autoCategorizeModalidade(data.exercicio_nome, data.tipo_treino)
      }].sort((a, b) => a.nome.localeCompare(b.nome)));
      
      setModalCriarExercicio(false);
      setNovoExercicio({ nome: '', video: '', grupo: 'Peito', modalidade: 'Musculação' });
    } catch (err: any) { alert(t.errCreate + err.message); } finally { setUploading(false); }
  };

  // ━━━━━━━━━ FILTROS MEMOIZADOS E LISTAS DROPDOWN ━━━━━━━━━
  const listaGrupos = useMemo(() => ['Todos', ...Array.from(new Set(exercicios.map(e => e.grupo))).sort()], [exercicios]);
  const listaCategorias = useMemo(() => ['Todas', ...Array.from(new Set(exercicios.map(e => e.categoria))).sort()], [exercicios]);

  const exerciciosFiltrados = useMemo(() => {
    return exercicios.filter(ex => {
      const bateBusca = ex.nome.toLowerCase().includes(buscaExercicio.toLowerCase());
      const bateGrupo = filtroGrupo === 'Todos' || ex.grupo === filtroGrupo;
      const bateCat = filtroCategoria === 'Todas' || ex.categoria === filtroCategoria;
      
      let bateOrigem = true;
      if (filtroExercicio === 'favoritos') bateOrigem = ex.favorito;
      if (filtroExercicio === 'seus') bateOrigem = ex.origem === 'seus';
      
      return bateBusca && bateGrupo && bateCat && bateOrigem;
    });
  }, [exercicios, buscaExercicio, filtroExercicio, filtroGrupo, filtroCategoria]);

  const rotinasFiltradas = useMemo(() => {
    return rotinas.filter(r => statusRotina === 'arquivados' ? r.arquivado : !r.arquivado);
  }, [rotinas, statusRotina]);

  const renderEstruturaRotina = (rotina: any) => {
    try {
      const parsed = typeof rotina.descricao === 'string' ? JSON.parse(rotina.descricao) : rotina.descricao;
      if (!parsed || !parsed.subdivisoes) return <p className="text-xs text-[var(--text-secondary)] italic">Sem exercícios detalhados</p>;
      return parsed.subdivisoes.map((sub: any, idx: number) => (
        <div key={idx} className="mb-5">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-lg inline-block mb-3 shadow-sm">{sub.nome}</h4>
          <div className="space-y-2">
            {sub.exercicios?.map((ex: any, i: number) => {
              const ytId = getYouTubeId(ex.video);
              const totalSeriesCount = Array.isArray(ex.series) ? ex.series.length : (Number(ex.series) || Number(ex.serie) || 1);

              return (
                <div key={i} className="flex items-center gap-3 bg-[var(--surface)] p-2.5 rounded-2xl border border-[var(--border)] shadow-sm">
                  <div className="w-14 h-12 bg-black rounded-xl overflow-hidden relative shrink-0 border border-[var(--border)] flex items-center justify-center cursor-pointer" onClick={() => setVideoAberto(ex.video)}>
                    {ytId ? (
                      <><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80" alt="Thumb" /><FaPlay className="absolute text-white drop-shadow-md" size={10} /></>
                    ) : ex.video && (ex.video.toLowerCase().endsWith('.gif') || ex.video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                      <img src={ex.video} className="w-full h-full object-cover" alt="Thumb" />
                    ) : ex.video ? (
                      <><video src={ex.video} className="w-full h-full object-cover opacity-80" /><FaPlay className="absolute text-white drop-shadow-md" size={10} /></>
                    ) : <FaVideoSlash className="text-[var(--text-secondary)]/40" size={12} />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{ex.nome}</span>
                    <span className="text-[9px] uppercase font-black text-[var(--text-secondary)] mt-0.5">{totalSeriesCount} {t.seriesLabel}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ));
    } catch(e) { return null; }
  };

  return (
    <div style={themeStyles} className="min-h-[100dvh] bg-[var(--bg)] pb-24 text-[var(--text-primary)] font-sans antialiased transition-colors duration-500 relative">
      
      {/* CABEÇALHO GLOBAL */}
      <div className="bg-[var(--bg)]/90 backdrop-blur-xl pt-[max(env(safe-area-inset-top,2rem),2rem)] px-5 pb-4 sticky top-0 z-40 border-b border-[var(--border)] shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-2xl font-black tracking-tight">{aba === 'rotinas' ? t.titleRotinas : t.titleEx}</h1>
          
          {/* PILL UI */}
          <div className="flex items-center bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-full shadow-sm p-1">
            <button onClick={() => setIsLangModalOpen(true)} className="flex items-center justify-center gap-1.5 px-3 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95">
              <FaGlobe size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang.split('-')[0]}</span>
            </button>
            <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5" />
            <button onClick={() => setIsThemeModalOpen(true)} className="flex items-center justify-center w-10 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-95">
              {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>
          </div>
        </div>

        <div className="flex bg-[var(--surface-sec)] p-1.5 rounded-[1rem] border border-[var(--border)] shadow-inner">
          <button onClick={() => { setAba('rotinas'); }} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${aba === 'rotinas' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{t.routines}</button>
          <button onClick={() => { setAba('exercicios'); }} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${aba === 'exercicios' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{t.exercises}</button>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto mt-2">
        
        {/* ABA ROTINAS */}
        {aba === 'rotinas' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <button onClick={() => router.push('/dashboard/BibliotecaTreinos/novo')} className="w-full py-5 border-2 border-dashed border-[var(--primary)] text-[var(--primary)] rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--primary)]/10 transition-all active:scale-[0.98]">
              <FaPlus size={14}/> {t.newRoutine}
            </button>

            <div className="flex gap-2 mb-4 bg-[var(--surface-sec)] p-1 rounded-xl border border-[var(--border)] w-max shadow-inner">
              <button onClick={() => setStatusRotina('ativos')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusRotina === 'ativos' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>{t.active}</button>
              <button onClick={() => setStatusRotina('arquivados')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusRotina === 'arquivados' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>{t.archived}</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {rotinasFiltradas.length === 0 && <p className="text-center text-[var(--text-secondary)] text-sm py-10 font-bold">{t.noModel}</p>}
                
                {rotinasFiltradas.map(rotina => {
                  const isExpanded = rotinaExpandida === rotina.id;
                  return (
                    <div key={rotina.id} className={`bg-[var(--surface)] rounded-[1.5rem] border overflow-hidden shadow-sm transition-colors ${rotina.arquivado ? 'border-[var(--border)] opacity-70 grayscale' : 'border-[var(--border)] hover:border-[var(--primary)]/40'}`}>
                      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setRotinaExpandida(isExpanded ? null : rotina.id)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-colors shadow-inner border border-[var(--border)] ${isExpanded ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-sec)] text-[var(--primary)]'}`}><FaFolder size={22}/></div>
                          <div>
                            <span className="font-black text-[var(--text-primary)] text-sm flex items-center gap-2">{rotina.nome_modelo} {rotina.arquivado && <FaArchive className="text-[var(--text-secondary)]" size={10}/>}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">{isExpanded ? t.hideDetails : t.tapToSee}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === rotina.id ? null : rotina.id); }} className="p-3 text-[var(--text-secondary)] hover:text-[var(--primary)] active:scale-90 transition-colors"><FaEllipsisV /></button>
                          <div className="text-[var(--text-secondary)] px-2">{isExpanded ? <FaChevronUp size={14}/> : <FaChevronDown size={14}/>}</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-sec)]/30 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="mb-5">{renderEstruturaRotina(rotina)}</div>
                          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
                            <button onClick={() => router.push(`/dashboard/BibliotecaTreinos/editar/${rotina.id}`)} className="flex-1 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:border-[var(--primary)] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"><FaEdit/> {t.edit}</button>
                            {!rotina.arquivado && <button onClick={() => setModeloParaAtribuir(rotina)} className="flex-1 py-4 bg-[var(--primary)] text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all hover:brightness-110"><FaShareSquare size={14}/> {t.assign}</button>}
                          </div>
                        </div>
                      )}

                      {menuAberto === rotina.id && (
                        <>
                          <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setMenuAberto(null)} />
                          <div className="absolute top-16 right-5 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-56 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => toggleArquivar(rotina)} className="w-full text-left px-5 py-4 text-xs font-black text-[var(--text-primary)] hover:bg-[var(--surface-sec)] flex items-center gap-3 border-b border-[var(--border)] transition-colors"><FaArchive className="text-[var(--text-secondary)]" size={14}/> {rotina.arquivado ? t.unarchive : t.archive}</button>
                            <button onClick={() => deletarModelo(rotina.id)} className="w-full text-left px-5 py-4 text-xs font-black text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-3 transition-colors"><FaTrash size={14}/> {t.deletePermanent}</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA EXERCÍCIOS */}
        {aba === 'exercicios' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            <button onClick={() => setModalCriarExercicio(true)} className="w-full py-4 rounded-[1.2rem] border border-[var(--primary)] text-[var(--primary)] font-black text-xs uppercase tracking-widest bg-transparent flex justify-center items-center gap-2 hover:bg-[var(--primary)]/10 transition-all active:scale-[0.98]">
              <FaPlus size={14}/> {t.newExercise}
            </button>

            <div className="relative">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14} />
              <input 
                type="text" 
                placeholder={t.searchEx}
                value={buscaExercicio} 
                onChange={(e) => setBuscaExercicio(e.target.value)} 
                className="w-full bg-[var(--surface)] border border-[var(--border)] py-4 pl-12 pr-5 rounded-[1.2rem] text-sm font-bold outline-none focus:border-[var(--primary)] shadow-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 transition-colors" 
              />
            </div>

            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
              <button onClick={() => setFiltroExercicio('app')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filtroExercicio === 'app' ? 'bg-[var(--primary)] text-white border-transparent shadow-md' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>{t.global}</button>
              <button onClick={() => setFiltroExercicio('seus')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filtroExercicio === 'seus' ? 'bg-[var(--primary)] text-white border-transparent shadow-md' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>{t.myVideos}</button>
              <button onClick={() => setFiltroExercicio('favoritos')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-1.5 ${filtroExercicio === 'favoritos' ? 'bg-[var(--primary)] text-white border-transparent shadow-md' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>{t.favorites}</button>
            </div>

            <div className="flex items-center gap-3 pt-2 pb-2">
              <div className="relative flex-1">
                <select value={filtroGrupo} onChange={e => setFiltroGrupo(e.target.value)} className="w-full appearance-none bg-transparent text-[var(--primary)] font-bold text-xs outline-none cursor-pointer pr-6">
                  {listaGrupos.map(g => <option key={g} value={g} className="bg-[var(--surface)]">{g === 'Todos' ? t.muscleGroups : g}</option>)}
                </select>
                <FaChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none" size={10}/>
              </div>

              <div className="relative flex-1">
                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full appearance-none bg-transparent text-[var(--primary)] font-bold text-xs outline-none cursor-pointer pr-6">
                  {listaCategorias.map(c => <option key={c} value={c} className="bg-[var(--surface)]">{c === 'Todas' ? t.categories : c}</option>)}
                </select>
                <FaChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none" size={10}/>
              </div>

              <button onClick={() => { setBuscaExercicio(''); setFiltroGrupo('Todos'); setFiltroCategoria('Todas'); }} className="text-[var(--primary)] text-xs font-bold pr-2 active:scale-95">{t.clear}</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {loading ? (
                <div className="col-span-full flex justify-center py-10"><div className="w-8 h-8 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
              ) : exerciciosFiltrados.length > 0 ? (
                exerciciosFiltrados.map((ex) => (
                  <div key={ex.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl hover:border-[var(--primary)]/40 transition-all flex flex-col group relative">
                    
                    <div className="w-full aspect-video bg-black relative shrink-0 cursor-pointer overflow-hidden border-b border-[var(--border)]" onClick={() => setVideoAberto(ex.video)}>
                      <MediaPreview url={ex.video} />
                      
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorito(ex.id); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg z-10">
                        {ex.favorito ? <FaHeart className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" size={16} /> : <FaRegStar className="opacity-80 hover:opacity-100 transition-opacity" size={16} />}
                      </button>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-[var(--text-primary)] text-base tracking-tight leading-tight line-clamp-2">{ex.nome}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="px-2.5 py-1 bg-[var(--surface-sec)] border border-[var(--border)] rounded-md text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest shadow-inner">
                            {ex.grupo}
                          </span>
                          <span className="px-2.5 py-1 bg-[var(--surface-sec)] border border-[var(--border)] rounded-md text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest shadow-inner">
                            {ex.categoria || 'Musculação'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-[var(--border)] rounded-[2rem] bg-[var(--surface-sec)]/30">
                  <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">{t.noExFound}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* PLAYER DE VÍDEO FULLSCREEN NATIVO */}
      {videoAberto && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button onClick={() => setVideoAberto(null)} className="absolute top-[max(env(safe-area-inset-top,1.5rem),1.5rem)] right-5 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-xl z-50">
            <FaTimes size={20}/>
          </button>
          <div className="w-full max-w-4xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/10">
            {getYouTubeId(videoAberto) ? (
              <iframe className="w-full h-full absolute inset-0" src={`https://www.youtube.com/embed/${getYouTubeId(videoAberto)}?autoplay=1&rel=0&modestbranding=1`} allow="autoplay; fullscreen" />
            ) : videoAberto.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
              <img src={videoAberto} className="w-full h-full object-contain absolute inset-0" alt="Preview Execução" />
            ) : (
              <video src={videoAberto} controls autoPlay playsInline className="w-full h-full object-contain absolute inset-0" />
            )}
          </div>
        </div>
      )}

      {/* MODAL CRIAR EXERCÍCIO */}
      {modalCriarExercicio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-5 animate-in fade-in duration-300">
          <form onSubmit={salvarExercicioBanco} className="bg-[var(--surface)] w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 border border-[var(--border)] shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{t.newExTitle}</h2>
              <button type="button" onClick={() => setModalCriarExercicio(false)} className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] active:scale-95 transition-all"><FaTimes size={16}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">{t.exNameLabel}</label>
                <input required autoFocus value={novoExercicio.nome} onChange={e => setNovoExercicio({...novoExercicio, nome: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] shadow-inner" placeholder="Ex: Supino Reto com Halteres" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">{t.exGroupLabel}</label>
                  <select value={novoExercicio.grupo} onChange={e => setNovoExercicio({...novoExercicio, grupo: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] appearance-none shadow-inner cursor-pointer">
                    {GRUPOS_MUSCULARES.map(c => <option key={c} value={c} className="bg-[var(--surface)]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">{t.exCatLabel}</label>
                  <select value={novoExercicio.modalidade} onChange={e => setNovoExercicio({...novoExercicio, modalidade: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] appearance-none shadow-inner cursor-pointer">
                    <option className="bg-[var(--surface)]">Musculação</option>
                    <option className="bg-[var(--surface)]">Funcional</option>
                    <option className="bg-[var(--surface)]">Cardio</option>
                    <option className="bg-[var(--surface)]">Mobilidade</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">{t.exMediaLabel}</label>
                <div className="relative">
                  <input value={novoExercicio.video} onChange={e => setNovoExercicio({...novoExercicio, video: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 pr-14 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] shadow-inner placeholder:text-[var(--text-secondary)]/50" placeholder="Cole o link ou faça upload..." />
                  <button type="button" onClick={() => document.getElementById('upload-novo-ex')?.click()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all">
                    {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={14}/>}
                  </button>
                  <input type="file" id="upload-novo-ex" className="hidden" accept="video/*,image/gif,image/jpeg,image/webp" onChange={e => e.target.files && uploadVideoLocal(e.target.files[0])} />
                </div>
                {novoExercicio.video && (
                  <div className="mt-3 w-full aspect-video bg-black rounded-xl overflow-hidden border border-[var(--border)]">
                    <MediaPreview url={novoExercicio.video} />
                  </div>
                )}
              </div>
            </div>
            
            <button type="submit" disabled={uploading} className="w-full py-4 sm:py-5 mt-8 bg-[var(--primary)] text-white rounded-[1.2rem] font-black uppercase tracking-widest text-[10px] flex justify-center items-center shadow-xl shadow-[var(--primary)]/20 active:scale-95 transition-all disabled:opacity-50">
              {uploading ? t.saving : t.createExBtn}
            </button>
          </form>
        </div>
      )}

      {/* Modal para Atribuir Rotina ao Aluno */}
      {modeloParaAtribuir && <ModalAtribuirTreino isOpen={!!modeloParaAtribuir} onClose={() => setModeloParaAtribuir(null)} modelo={modeloParaAtribuir} personalId={personalId} />}

      {/* ━━━━━━━━━━ MODAIS DE CONFIGURAÇÃO (Fundo Escuro) ━━━━━━━━━━ */}
      {(isLangModalOpen || isThemeModalOpen) && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => { setIsLangModalOpen(false); setIsThemeModalOpen(false); }} 
          />
          
          <div className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            
            {/* ━━ CONTEÚDO: IDIOMAS ━━ */}
            {isLangModalOpen && (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                    {t.selectLanguage}
                  </h3>
                  <button 
                    onClick={() => setIsLangModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {languages.map((language) => {
                    const isActive = lang === language.code;
                    return (
                      <button
                        key={language.code}
                        onClick={() => handleSelectLanguage(language.code)}
                        className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                          isActive 
                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{language.flag}</span>
                          <span className={`font-bold text-sm ${isActive ? 'text-[var(--primary)]' : ''}`}>
                            {language.name}
                          </span>
                        </div>
                        {isActive && <FaCheck className="text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ━━ CONTEÚDO: TEMA ━━ */}
            {isThemeModalOpen && (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-black text-lg tracking-tight text-[var(--text-primary)]">
                    {t.selectTheme}
                  </h3>
                  <button 
                    onClick={() => setIsThemeModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-95"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {/* Botão Claro */}
                  <button
                    onClick={() => handleSelectTheme('light')}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      !isDark 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                        <FaSun size={16} />
                      </div>
                      <span className={`font-bold text-sm ${!isDark ? 'text-[var(--primary)]' : ''}`}>
                        {t.themeLight}
                      </span>
                    </div>
                    {!isDark && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                  
                  {/* Botão Escuro */}
                  <button
                    onClick={() => handleSelectTheme('dark')}
                    className={`w-full flex items-center justify-between p-4 rounded-[1.2rem] border transition-all active:scale-[0.98] ${
                      isDark 
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                        <FaMoon size={16} />
                      </div>
                      <span className={`font-bold text-sm ${isDark ? 'text-[var(--primary)]' : ''}`}>
                        {t.themeDark}
                      </span>
                    </div>
                    {isDark && <FaCheck className="text-[var(--primary)]" />}
                  </button>
                </div>
              </>
            )}
            
            <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-6 sm:hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
