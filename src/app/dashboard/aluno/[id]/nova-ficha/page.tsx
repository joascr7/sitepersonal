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
    addFromModel: '+ Adicionar de "Meus Modelos" ou "Padrão"', workoutName: 'Nome do Treino',
    exName: 'Nome do Exercício', remove: 'Remover', videoUrl: 'Link do vídeo',
    uploadVideo: 'Upload de Vídeo', uploading: 'Enviando...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.', planned: 'Planej.',
    addSeries: '+ Adicionar Série', addExercise: '+ Adicionar Exercício',
    saveFinish: 'Finalizar e Salvar', saveModel: 'Salvar como Modelo', saving: 'Salvando...',
    errLimit: 'Arquivo maior que 10MB!', errName: 'Dê um nome ao treino!', errApply: 'Erro ao aplicar este modelo.',
    errUpload: 'Erro ao enviar vídeo: ', errSave: 'Erro ao salvar: ',
    successAdd: ' adicionado!', successVideo: 'Vídeo encontrado para ', successSave: 'Salvo para o aluno e como modelo!'
  },
  'pt-PT': {
    back: 'Voltar', title: 'Nova Ficha', library: 'Biblioteca de Treinos', close: 'Fechar',
    myModels: 'Os Meus Modelos', defaultModels: 'Treinos Padrão',
    addFromModel: '+ Adicionar de "Meus Modelos" ou "Padrão"', workoutName: 'Nome do Treino',
    exName: 'Nome do Exercício', remove: 'Remover', videoUrl: 'Link do vídeo',
    uploadVideo: 'Upload de Vídeo', uploading: 'A enviar...',
    series: 'Série', reps: 'Reps', load: 'Carga', rest: 'Desc.', planned: 'Planej.',
    addSeries: '+ Adicionar Série', addExercise: '+ Adicionar Exercício',
    saveFinish: 'Finalizar e Guardar', saveModel: 'Guardar como Modelo', saving: 'A guardar...',
    errLimit: 'Ficheiro maior que 10MB!', errName: 'Dê um nome ao treino!', errApply: 'Erro ao aplicar este modelo.',
    errUpload: 'Erro ao enviar vídeo: ', errSave: 'Erro ao guardar: ',
    successAdd: ' adicionado!', successVideo: 'Vídeo encontrado para ', successSave: 'Guardado para o aluno e como modelo!'
  },
  'en': {
    back: 'Back', title: 'New Workout', library: 'Workout Library', close: 'Close',
    myModels: 'My Templates', defaultModels: 'Default Templates',
    addFromModel: '+ Add from "My Templates" or "Default"', workoutName: 'Workout Name',
    exName: 'Exercise Name', remove: 'Remove', videoUrl: 'Video Link',
    uploadVideo: 'Upload Video', uploading: 'Uploading...',
    series: 'Set', reps: 'Reps', load: 'Load', rest: 'Rest', planned: 'Target',
    addSeries: '+ Add Set', addExercise: '+ Add Exercise',
    saveFinish: 'Finish and Save', saveModel: 'Save as Template', saving: 'Saving...',
    errLimit: 'File larger than 10MB!', errName: 'Give the workout a name!', errApply: 'Error applying this template.',
    errUpload: 'Error uploading video: ', errSave: 'Error saving: ',
    successAdd: ' added!', successVideo: 'Video found for ', successSave: 'Saved for student and as template!'
  }
};

function NovaFichaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const abaOrigem = searchParams.get('aba') || 'treinos';
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [meusModelos, setMeusModelos] = useState<any[]>([]);
  const [treinosPadrao, setTreinosPadrao] = useState<any[]>([]);
  const [biblioteca, setBiblioteca] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const [exercicios, setExercicios] = useState<Exercicio[]>([{ 
    nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga',
    series: [{ ordem: '', reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] 
  }]);

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

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [pRes, bRes] = await Promise.all([
        supabase.from('treinos_padrao').select('*'),
        supabase.from('videos_biblioteca').select('*')
      ]);
      
      if (pRes.data) setTreinosPadrao(pRes.data);
      if (bRes.data) setBiblioteca(bRes.data);

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

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, text: msg });
    setTimeout(() => setToast(null), 4000);
  };

  const aplicarModelo = (modelo: any, ehPadrao: boolean) => {
    try {
      const raw = ehPadrao ? modelo.exercicios_json : modelo.descricao;
      const novosExercicios = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setExercicios(prev => [...prev, ...novosExercicios]);
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
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `exercicios/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
      const n = [...exercicios];
      n[exIndex].video = data.publicUrl;
      setExercicios(n);
    } catch (err: any) {
      showToast('error', t.errUpload + err.message);
    } finally {
      setUploading(false);
    }
  };

  const adicionarExercicio = () => setExercicios([...exercicios, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', series: [{ ordem: '', reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] }]);
  const removerExercicio = (index: number) => setExercicios(exercicios.filter((_, i) => i !== index));
  
  const adicionarSerie = (exIndex: number) => {
    const n = [...exercicios];
    if (!n[exIndex].series || !Array.isArray(n[exIndex].series)) n[exIndex].series = [];
    n[exIndex].series.push({ ordem: '', reps: '', carga: '', intervalo: '', CargaPlanejada: '' });
    setExercicios(n);
  };
  
  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => { 
    const n = [...exercicios]; 
    n[exIndex].series[sIndex][campo] = valor; 
    setExercicios(n); 
  };
  
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

  const salvarFicha = async () => {
    if (!nome) throw new Error(t.errName);
    setLoading(true);
    const exerciciosLimpos = exercicios.map(ex => ({
      ...ex, 
      series: ex.series.map(s => ({
        ordem: s.ordem || '', reps: s.reps || '', carga: Number(s.carga) || 0, CargaPlanejada: Number(s.CargaPlanejada) || 0, intervalo: Number(s.intervalo) || 0
      }))
    }));
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('fichas').insert([{ 
      aluno_id: id, nome_treino: nome, descricao: JSON.stringify(exerciciosLimpos), ordem: 1, personal_id: user?.id 
    }]);
    if (error) throw error;
  };

  const salvarCombo = async () => {
    if (!nome) return showToast('error', t.errName);
    setLoading(true);
    try {
      await salvarFicha();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await supabase.from('modelos_personal').insert({ personal_id: user.id, nome_modelo: nome, descricao: JSON.stringify(exercicios) });
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

        {/* Toasts Premium */}
        {toast && (
          <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
            {toast.type === 'success' ? <FaCheckCircle size={16} /> : toast.type === 'error' ? <FaExclamationCircle size={16} /> : <FaVideo size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
          </div>
        )}

        {/* Modal Premium */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[300] flex items-center justify-center p-5 animate-in fade-in duration-300">
            <div className="bg-[var(--surface)] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-[var(--border)] flex flex-col max-h-[85vh] animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6 shrink-0 border-b border-[var(--border)] pb-4">
                <h2 className="text-xl font-black text-[var(--text-primary)]">{t.library}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest bg-[var(--surface-sec)] px-3 py-1.5 rounded-lg active:scale-95">{t.close}</button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-8 custom-scrollbar">
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
        
        <input className="w-full p-6 sm:p-8 mb-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--text-secondary)] font-black text-2xl text-[var(--text-primary)] shadow-sm" placeholder={t.workoutName} value={nome} onChange={(e) => setNome(e.target.value)} />

        {/* Lista de Exercícios Premium */}
        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] mb-8 shadow-xl">
            
            {/* NOVO CAMPO: BUSCA DE EXERCÍCIOS AUTOCOMPLETE */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-[var(--border)] pb-4">
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
              <button onClick={() => removerExercicio(exIndex)} className="self-end sm:self-auto text-[var(--danger)] bg-[var(--danger)]/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--danger)]/20 transition-colors flex items-center gap-2 shrink-0">
                <FaTrash size={12} /> {t.remove}
              </button>
            </div>

            <div className="mb-8 space-y-4">
              <div className="relative group">
                <input className="w-full pl-5 pr-12 py-4 bg-[var(--surface-sec)] border border-[var(--border)] rounded-[1.2rem] text-sm font-bold outline-none placeholder:text-[var(--text-secondary)] text-[var(--text-primary)] focus:border-[var(--primary)] transition-colors shadow-inner" placeholder={t.videoUrl} value={ex.video} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
                <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:brightness-110 transition-all active:scale-95" title={t.uploadVideo}>
                  {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={14} />}
                </button>
                <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
              </div>
            
              {ex.video && (ex.video.includes('youtube') || ex.video.includes('youtu.be')) && (
                <div className="w-full h-48 sm:h-64 bg-[var(--surface-sec)] rounded-[1.2rem] overflow-hidden border border-[var(--border)] shadow-inner">
                  <iframe className="w-full h-full" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
            </div>

            {/* Cabeçalho de Séries Mobile Friendly */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 text-center">
              <span>{t.series}</span><span>{t.reps}</span><span>{t.load}</span><span>{t.rest}</span><span>{t.planned}</span>
            </div>

            <div className="space-y-3">
              {ex.series?.map((s: any, sIndex: number) => (
                <div key={sIndex} className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
                  <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s.ordem ?? sIndex + 1} onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)} />
                  <input type="text" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s?.reps ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                  <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s?.carga ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                  <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s?.intervalo ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                  <div className="flex items-center gap-1 sm:gap-2">
                    <input type="number" className="w-full py-3 sm:p-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs sm:text-sm font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors" value={s?.CargaPlanejada ?? ''} onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} />
                    <button onClick={() => { const n = [...exercicios]; n[exIndex].series.splice(sIndex, 1); setExercicios(n); }} className="flex justify-center items-center text-[var(--text-secondary)] hover:text-[var(--danger)] bg-[var(--surface-sec)] hover:bg-[var(--danger)]/10 h-full rounded-xl transition-colors px-2 sm:px-3">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={(e) => { e.preventDefault(); adicionarSerie(exIndex); }} className="mt-6 w-full py-4 border-2 border-dashed border-[var(--border)] rounded-[1.2rem] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center justify-center gap-2"> 
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
