'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  FaChevronLeft, FaGlobe, FaMoon, FaSun, FaExclamationCircle, 
  FaCheckCircle, FaTrash, FaUpload, FaPlus, FaSave, FaFolderOpen, FaVideo, FaSearch
} from 'react-icons/fa';

interface Serie {
  ordem?: string;
  reps: string;
  carga: number | string;
  CargaPlanejada: number | string;
  intervalo: number | string;
}

interface Exercicio {
  nome: string;
  video: string;
  metodo: string;
  tipoSerie: string;
  series: Serie[];
  observacao?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTE: BUSCADOR INTELIGENTE DE EXERCÍCIOS (AUTOCOMPLETE)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BuscadorExercicio = ({ 
  valorNome, 
  aoMudarNome, 
  aoSelecionarExercicio, 
  biblioteca, 
  placeholder,
  onBlurFallback
}: any) => {
  const [mostrar, setMostrar] = useState(false);
  
  // Filtra as sugestões e remove duplicatas com o mesmo nome
  const sugestoes = biblioteca.filter((b: any) => 
    b.exercicio_nome && b.exercicio_nome.toLowerCase().includes(valorNome.toLowerCase())
  );
  const sugestoesUnicas = Array.from(new Map(sugestoes.map((item: any) => [item.exercicio_nome, item])).values()).slice(0, 6);

  return (
    <div className="relative w-full">
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
              onBlurFallback(valorNome); // Mantém a busca original caso não clique na sugestão
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
              className="p-4 hover:bg-[var(--surface-sec)] cursor-pointer text-[var(--text-primary)] text-sm font-bold border-b border-[var(--border)] last:border-0 transition-colors flex justify-between items-center"
            >
              <span>{s.exercicio_nome}</span>
              {s.url_video && (
                <span className="text-[8px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-md uppercase tracking-widest shrink-0">
                  C/ Vídeo
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN (UX PREMIUM)
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
// SKELETON SCREEN (UX PREMIUM) - DEFINIDO NO MESMO FICHEIRO
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
    back: 'Voltar', title: 'Editar Ficha', deleteWorkout: 'Excluir Ficha',
    workoutName: 'Nome do Treino', exName: 'Nome do Exercício', delete: 'Excluir',
    videoUrl: 'URL da Mídia', uploadBtn: 'Upload de Vídeo/GIF', uploading: 'Enviando...',
    obs: 'Observação técnica...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.', planned: 'Planej.',
    addSeries: '+ Adicionar Série', save: 'Salvar Alterações',
    errLimit: 'Limite de 10MB excedido!', errDefault: 'Erro: ', successSave: 'Ficha atualizada com sucesso!',
    confirmDelete: 'Tem certeza que deseja excluir esta ficha?', successVideo: 'Mídia encontrada para '
  },
  'pt-PT': {
    back: 'Voltar', title: 'Editar Ficha', deleteWorkout: 'Eliminar Ficha',
    workoutName: 'Nome do Treino', exName: 'Nome do Exercício', delete: 'Eliminar',
    videoUrl: 'URL da Multimédia', uploadBtn: 'Upload de Vídeo/GIF', uploading: 'A enviar...',
    obs: 'Observação técnica...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.', planned: 'Planej.',
    addSeries: '+ Adicionar Série', save: 'Guardar Alterações',
    errLimit: 'Limite de 10MB excedido!', errDefault: 'Erro: ', successSave: 'Ficha atualizada com sucesso!',
    confirmDelete: 'Tem certeza que deseja eliminar esta ficha?', successVideo: 'Multimédia encontrada para '
  },
  'en': {
    back: 'Back', title: 'Edit Workout', deleteWorkout: 'Delete Workout',
    workoutName: 'Workout Name', exName: 'Exercise Name', delete: 'Delete',
    videoUrl: 'Media URL', uploadBtn: 'Upload Video/GIF', uploading: 'Uploading...',
    obs: 'Technical observation...',
    series: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest', planned: 'Target',
    addSeries: '+ Add Set', save: 'Save Changes',
    errLimit: '10MB limit exceeded!', errDefault: 'Error: ', successSave: 'Workout updated successfully!',
    confirmDelete: 'Are you sure you want to delete this workout?', successVideo: 'Media found for '
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

  // Estados UI Premium
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

  // Configuração Dinâmica do Tema Premium
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

  const buscarVideo = (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const videoEncontrado = biblioteca.find(v => v.exercicio_nome?.toLowerCase().trim() === nomeExercicio.toLowerCase().trim());
    if (videoEncontrado) {
      const n = [...exercicios];
      n[index].video = videoEncontrado.url_video;
      setExercicios(n);
      showToast('info', `${t.successVideo}${nomeExercicio}!`);
    }
  };

  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string | number) => {
    setExercicios(prev => {
      const novos = [...prev];
      if (Array.isArray(novos[exIndex].series)) {
        novos[exIndex].series[sIndex] = { ...novos[exIndex].series[sIndex], [campo]: valor };
      }
      return novos;
    });
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
      const n = [...exercicios];
      n[exIndex].video = data.publicUrl;
      setExercicios(n);
    } catch (err: any) { 
      showToast('error', t.errDefault + err.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const atualizarFicha = async () => {
    setLoading(true);
    
    const exerciciosLimpos = exercicios.map(ex => ({
      ...ex,
      series: Array.isArray(ex.series) ? ex.series.map(s => ({
        ordem: String(s.ordem || ""), reps: String(s.reps || ""), carga: Number(s.carga) || 0, CargaPlanejada: Number(s.CargaPlanejada) || 0, intervalo: Number(s.intervalo) || 0
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
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[120vw] sm:w-[400px] h-[120vw] sm:h-[400px] bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Toast Flutuante Premium */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : toast.type === 'error' ? <FaExclamationCircle size={16} /> : <FaVideo size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {loading ? <DashboardSkeleton /> : (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-700 relative z-10">
          
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
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors active:scale-95">
              <FaChevronLeft size={10} /> {t.back}
            </button>
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter">{t.title}</h1>
            <button onClick={excluirFicha} className="flex items-center gap-1 text-[var(--danger)] font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 bg-[var(--danger)]/10 px-3 py-1.5 rounded-lg">
              <FaTrash size={10} /> <span className="hidden sm:inline">{t.deleteWorkout}</span>
            </button>
          </div>

          <input 
            className="w-full text-3xl sm:text-4xl font-black bg-transparent border-b border-[var(--border)] pb-4 mb-10 outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] transition-colors text-[var(--text-primary)]" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            placeholder={t.workoutName} 
          />

          {exercicios.map((ex, exIndex) => (
            <div key={exIndex} className="bg-[var(--surface)]/90 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] mb-8 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                
                {/* O BUSCADOR DE EXERCÍCIOS INJETADO AQUI */}
                <BuscadorExercicio 
                  valorNome={ex.nome}
                  aoMudarNome={(val: string) => {
                    const n = [...exercicios];
                    n[exIndex].nome = val;
                    setExercicios(n);
                  }}
                  aoSelecionarExercicio={(nomeSelecionado: string, videoUrl: string) => {
                    const n = [...exercicios];
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
                />

                <button onClick={() => { const n = exercicios.filter((_, i) => i !== exIndex); setExercicios(n); }} className="self-end sm:self-auto text-[var(--danger)] bg-[var(--danger)]/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--danger)]/20 transition-colors flex items-center gap-2 shrink-0">
                  <FaTrash size={12} /> {t.delete}
                </button>
              </div>
              
              <div className="mb-8 space-y-3">
                <div className="relative group">
                  <input className="w-full pl-5 pr-12 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-sm font-bold outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)] focus:border-[var(--primary)] transition-colors shadow-inner" placeholder={t.videoUrl} value={ex.video || ''} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
                  <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:brightness-110 transition-all active:scale-95" title={t.uploadBtn}>
                    {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={14} />}
                  </button>
                  
                  {/* MUDANÇA: Upload agora aceita videos, gifs e imagens normais */}
                  <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*,image/gif,image/jpeg,image/png" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
                </div>
                
                {/* PREVIEW INTELIGENTE DE MÍDIA */}
                {ex.video && (
                  <div className="w-full h-48 sm:h-64 bg-[var(--surface-sec)] rounded-[1.2rem] overflow-hidden border border-[var(--border)] shadow-inner mb-4 mt-2 flex items-center justify-center">
                    {(ex.video.includes('youtube.com') || ex.video.includes('youtu.be')) ? (
                      <iframe className="w-full h-full" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                    ) : (ex.video.toLowerCase().endsWith('.gif') || ex.video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                      <img src={ex.video} alt="Preview do Exercício" className="w-full h-full object-cover" />
                    ) : (
                      <video src={ex.video} controls className="w-full h-full object-cover bg-black" />
                    )}
                  </div>
                )}

                <input className="w-full p-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-xs font-medium outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)] focus:border-[var(--primary)] transition-colors" placeholder={t.obs} value={ex.observacao || ''} onChange={(e) => { const n = [...exercicios]; n[exIndex].observacao = e.target.value; setExercicios(n); }} />
              </div>

              {/* Grid Headers */}
              <div className="grid grid-cols-6 gap-2 text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 px-1 text-center">
                <span>{t.series}</span><span>{t.reps}</span><span>{t.load}</span><span>{t.rest}</span><span>{t.planned}</span><span></span>
              </div>

              {/* Grid Inputs - Agora protegido com Array.isArray para evitar crashes */}
              <div className="space-y-3">
                {Array.isArray(ex.series) && ex.series.map((s, sIndex) => (
                  <div key={sIndex} className="grid grid-cols-6 gap-1 sm:gap-2 items-center">
                    <input type="text" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-center font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.ordem ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)} />
                    <input type="text" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-center font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.reps ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                    <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-center font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.carga ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                    <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-center font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.intervalo ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                    <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-center font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.CargaPlanejada ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} />
                    <button onClick={() => { const n = [...exercicios]; n[exIndex].series.splice(sIndex, 1); setExercicios(n); }} className="flex justify-center items-center text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/10 h-full rounded-xl transition-colors">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                
                {/* Botão de + Adicionar Série dentro do exercício */}
                <button 
                  onClick={() => { 
                    const n = [...exercicios]; 
                    if(!n[exIndex].series || !Array.isArray(n[exIndex].series)) n[exIndex].series = [];
                    n[exIndex].series.push({ordem: '', reps: '', carga: '', intervalo: '', CargaPlanejada: ''}); 
                    setExercicios(n); 
                  }} 
                  className="w-full mt-6 py-4 border-2 border-dashed border-[var(--border)] rounded-[1.2rem] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center justify-center gap-2"
                >
                   <FaPlus size={10} /> {t.addSeries}
                </button>
              </div>
            </div>
          ))}

          {/* Botão Adicionar Exercicio */}
          <button 
            onClick={() => setExercicios([...exercicios, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', series: [{ ordem: '', reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] }])} 
            className="w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all mb-8 flex items-center justify-center gap-2 bg-[var(--surface)] shadow-sm"
          > 
            <FaPlus size={12} /> + Adicionar Exercício
          </button>

          <button onClick={atualizarFicha} className="w-full bg-[var(--primary)] text-white py-6 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-3"> 
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
        <NovaFichaSkeleton />
      </main>
    }>
      <EditarFichaContent />
    </Suspense>
  );
}