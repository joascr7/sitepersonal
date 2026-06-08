'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { 
  FaChevronLeft, FaMoon, FaSun, FaExclamationCircle, 
  FaCheckCircle, FaTrash, FaUpload, FaPlus, FaSave, FaVideo, FaSearch,
  FaArrowUp, FaArrowDown, FaPlay, FaTimes, FaListUl, FaVideoSlash, FaBars,
  FaChevronDown, FaChevronUp, FaCalendarAlt
} from 'react-icons/fa';

// Importação correta puxando do seu componente global
import ModalCatalogo from '@/components/biblioteca/ModalCatalogo';

interface Serie { ordem?: string; reps: string; carga: string; unidadeCarga?: string; intervalo: string; }
interface Exercicio { nome: string; video: string; metodo: string; tipoSerie: string; series: Serie[]; observacao?: string; favorito?: boolean; }

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

const DashboardSkeleton = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-pulse pt-8 px-5">
    <div className="flex justify-between items-center mb-10"><div className="w-16 h-4 bg-[var(--surface-sec)] rounded-full" /><div className="w-48 h-8 bg-[var(--surface-sec)] rounded-xl" /></div>
    <div className="w-full h-12 bg-[var(--surface-sec)] rounded-2xl mb-10" />
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-8 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] space-y-6"><div className="w-1/2 h-8 bg-[var(--surface-sec)] rounded-xl" /><div className="w-full h-12 bg-[var(--surface-sec)] rounded-2xl" /></div>
    ))}
  </div>
);

function EditarFichaContent() {
  const params = useParams();
  const id = params?.id as string;
  const treinoId = (params?.treinoId || params?.treinoid) as string;
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [biblioteca, setBiblioteca] = useState<any[]>([]);
  
  const [tipoTreinoForm, setTipoTreinoForm] = useState('Musculação');
  const [objetivoForm, setObjetivoForm] = useState('Hipertrofia');
  const [dificuldadeForm, setDificuldadeForm] = useState('Intermediário');
  const [dataInicio, setDataInicio] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  const [expandedExIndex, setExpandedExIndex] = useState<number | null>(0);
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [videoAberto, setVideoAberto] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    setMounted(true);
  }, []);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const showToast = (type: 'success' | 'error' | 'info', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  const themeStyles = isDark ? { '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)' } as React.CSSProperties : { '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)' } as React.CSSProperties;

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
        setTipoTreinoForm(fichaRes.data.tipo_treino || 'Musculação');
        setObjetivoForm(fichaRes.data.objetivo || 'Hipertrofia');
        setDificuldadeForm(fichaRes.data.dificuldade || 'Intermediário');
        setDataInicio(fichaRes.data.data_inicio || '');
        setDataVencimento(fichaRes.data.data_vencimento || '');
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
            if (Array.isArray(exList)) exList.forEach((ex) => { if (ex.nome) exerciciosExtraidos.push({ exercicio_nome: ex.nome, url_video: ex.video || '' }); });
          } catch (e) {}
        });
      }
      if (bibRes.data) exerciciosExtraidos = [...exerciciosExtraidos, ...bibRes.data];
      
      setBiblioteca(exerciciosExtraidos);
      setLoading(false);
    };
    carregarDados();
  }, [treinoId]);

  const injetarDoCatalogo = (selecionados: any[]) => {
    const novosEx = selecionados.map(s => ({
      nome: s.nome || s.exercicio_nome || '',
      video: s.video || s.url_video || '',
      metodo: 'Normal',
      tipoSerie: 'Repetições e carga',
      observacao: '',
      series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }]
    }));
    setExercicios(prev => [...prev, ...novosEx]);
    setExpandedExIndex(exercicios.length);
    showToast('success', `${selecionados.length} exercícios adicionados!`);
  };

  const adicionarExercicio = () => { setExercicios(prev => [...prev, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', observacao: '', series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }] }]); setExpandedExIndex(exercicios.length); };
  const removerExercicio = (index: number) => { setExercicios(prev => prev.filter((_, i) => i !== index)); setExpandedExIndex(null); };

  const moverExercicio = (index: number, direcao: 'cima' | 'baixo') => {
    if (direcao === 'cima' && index === 0) return;
    if (direcao === 'baixo' && index === exercicios.length - 1) return;
    const novosExercicios = [...exercicios];
    const indexAlvo = direcao === 'cima' ? index - 1 : index + 1;
    [novosExercicios[index], novosExercicios[indexAlvo]] = [novosExercicios[indexAlvo], novosExercicios[index]];
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
      if (Array.isArray(novos[exIndex].series)) { (novos[exIndex].series[sIndex] as any)[campo] = valor; }
      return novos;
    });
  };

  const buscarVideo = (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const videoEncontrado = biblioteca.find(v => v.exercicio_nome?.toLowerCase().trim() === nomeExercicio.toLowerCase().trim());
    if (videoEncontrado) {
      setExercicios(prev => { const n = [...prev]; n[index].video = videoEncontrado.url_video; return n; });
      showToast('info', `Vídeo vinculado: ${nomeExercicio}!`);
    }
  };

  const uploadVideo = async (exIndex: number, file: File) => {
    if (file.size > 15 * 1024 * 1024) return showToast('error', 'Limite de 15MB excedido!');
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `exercicios/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('videos').getPublicUrl(filePath);
      setExercicios(prev => { const n = [...prev]; n[exIndex].video = data.publicUrl; return n; });
    } catch (err: any) { showToast('error', 'Erro: ' + err.message); } finally { setUploading(false); }
  };

  const atualizarFicha = async () => {
    setLoading(true);
    const exerciciosValidos = exercicios.filter(ex => ex.nome && ex.nome.trim() !== '');
    const exerciciosLimpos = exerciciosValidos.map(ex => ({
      ...ex,
      series: Array.isArray(ex.series) ? ex.series.map(s => ({
        ordem: String(s.ordem || ""), reps: String(s.reps || ""), carga: String(s.carga || ""), unidadeCarga: s.unidadeCarga || 'kg', intervalo: String(s.intervalo || "")
      })) : []
    }));

    const { error } = await supabase.from('fichas').update({ 
      nome_treino: nome, 
      descricao: JSON.stringify(exerciciosLimpos),
      tipo_treino: tipoTreinoForm,
      objetivo: objetivoForm,
      dificuldade: dificuldadeForm,
      data_inicio: dataInicio || null,
      data_vencimento: dataVencimento || null
    }).eq('id', treinoId);

    if (error) {
      showToast('error', 'Erro: ' + error.message);
      setLoading(false);
    } else {
      router.push(`/dashboard/aluno/${id}?aba=treinos`);
    }
  };

  const excluirFicha = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta ficha?')) return;
    setLoading(true);
    const { error } = await supabase.from('fichas').update({ ativo: false }).eq('id', treinoId);
    if (!error) router.push(`/dashboard/aluno/${id}`);
    else showToast('error', 'Erro: ' + error.message);
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

      {videoAberto && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button onClick={() => setVideoAberto(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><FaTimes size={20}/></button>
          <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {getYouTubeId(videoAberto) ? (
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeId(videoAberto)}?autoplay=1`} allow="autoplay; fullscreen" />
            ) : videoAberto.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
              <img src={videoAberto} className="w-full h-full object-contain" />
            ) : (
              <video src={videoAberto} controls autoPlay className="w-full h-full object-contain" />
            )}
          </div>
        </div>
      )}

      {/* Uso correto do componente externo com a prop onSelect */}
      <ModalCatalogo 
        isOpen={catalogoAberto} 
        onClose={() => setCatalogoAberto(false)} 
        onSelect={injetarDoCatalogo} 
      />

      {loading ? <DashboardSkeleton /> : (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-700 relative z-10">
          
          <div className="flex items-center justify-between mb-6">
            <button type="button" onClick={() => router.back()} className="w-10 h-10 bg-[var(--surface)] rounded-full flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] active:scale-95 transition-all shadow-sm"><FaChevronLeft size={12} /></button>
            <h1 className="text-lg font-black tracking-tight">Editar Ficha</h1>
            <button type="button" onClick={toggleTheme} className="w-10 h-10 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center justify-center">{isDark ? <FaSun size={12} /> : <FaMoon size={12} />}</button>
          </div>

          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border)] shadow-xl mb-6 relative">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)] px-2.5 py-1 rounded-md">Configuração da Ficha</span>
              <button onClick={excluirFicha} className="flex items-center gap-1.5 text-[var(--danger)] font-black text-[9px] uppercase tracking-widest hover:brightness-110 active:scale-95 bg-[var(--danger)]/10 px-3 py-1.5 rounded-lg border border-[var(--danger)]/20"><FaTrash size={10} /> <span className="hidden sm:inline">Excluir Ficha</span></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Nome do Treino *</label>
                <input className="w-full bg-[var(--surface-sec)] px-4 py-3.5 rounded-xl font-bold text-base outline-none border border-[var(--border)] focus:border-[var(--primary)] transition-colors text-[var(--text-primary)]" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Treino A" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Tipo</label><select value={tipoTreinoForm} onChange={e => setTipoTreinoForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none mt-1"><option>Musculação</option><option>Aeróbico</option><option>Funcional</option><option>Crossfit</option></select></div>
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Objetivo</label><select value={objetivoForm} onChange={e => setObjetivoForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none mt-1"><option>Hipertrofia</option><option>Emagrecimento</option><option>Força / Potência</option><option>Condicionamento</option></select></div>
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Dificuldade</label><select value={dificuldadeForm} onChange={e => setDificuldadeForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none mt-1"><option>Iniciante</option><option>Intermediário</option><option>Avançado</option></select></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-dashed border-[var(--border)] pt-4">
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1 mb-1"><FaCalendarAlt/> Início</label><input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" /></div>
                <div><label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider flex items-center gap-1 mb-1"><FaCalendarAlt/> Vencimento</label><input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--danger)]" /></div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 justify-end mt-6 border-t border-[var(--border)] pt-4">
              <button type="button" onClick={() => setCatalogoAberto(true)} className="px-3 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaListUl size={10}/> Catálogo</button>
              <button type="button" onClick={adicionarExercicio} className="px-3 py-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"><FaPlus size={10}/> Adicionar Exercício</button>
            </div>
          </div>

          <div className="space-y-3.5">
            {exercicios.map((ex, exIndex) => {
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
                        {ex.nome && <span className="text-[8px] font-black uppercase tracking-wider text-[var(--primary)] mt-0.5 bg-[var(--primary)]/5 px-1.5 py-0.5 rounded w-max self-start">{autoCategorize(ex.nome)} • {ex.series?.length || 0} Séries</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-1 opacity-60 sm:opacity-100">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverExercicio(exIndex, 'cima'); }} disabled={exIndex === 0} className="p-1.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded border border-[var(--border)] disabled:opacity-20"><FaArrowUp size={10} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moverExercicio(exIndex, 'baixo'); }} disabled={exIndex === exercicios.length - 1} className="p-1.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded border border-[var(--border)] disabled:opacity-20"><FaArrowDown size={10} /></button>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); if(confirm('Remover este exercício?')) removerExercicio(exIndex); }} className="p-1.5 bg-[var(--danger)]/5 text-[var(--danger)] rounded border border-[var(--danger)]/10 hover:bg-[var(--danger)]/10" title="Excluir"><FaTrash size={10} /></button>
                      <div className="text-[var(--text-secondary)] px-1">{isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 bg-[var(--surface)] space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 gap-4">
                        <BuscadorExercicio valorNome={ex.nome} aoMudarNome={(val: string) => { setExercicios(prev => { const n = [...prev]; n[exIndex].nome = val; return n; }); }} aoSelecionarExercicio={(nomeSel: string, url: string) => { setExercicios(prev => { const n = [...prev]; n[exIndex].nome = nomeSel; if (url) n[exIndex].video = url; return n; }); }} biblioteca={biblioteca} placeholder="Nome do exercício..." onBlurFallback={(nome: string) => buscarVideo(nome, exIndex)} onOpenCatalog={() => setCatalogoAberto(true)} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider">URL do Vídeo / GIF Execução</label>
                          <div className="relative mt-1">
                            <input className="w-full pl-3 pr-10 py-3 bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl text-xs font-bold outline-none text-[var(--text-primary)] focus:border-[var(--primary)] shadow-inner" placeholder="Link da mídia (Opcional)" value={ex.video || ''} onChange={(e) => { setExercicios(prev => { const n = [...prev]; n[exIndex].video = e.target.value; return n; }); }} />
                            <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center hover:brightness-110 active:scale-95"><FaUpload size={10} /></button>
                            <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*,image/gif,image/jpeg,image/png,image/webp" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider">Orientação Específica</label>
                          <textarea rows={1} className="w-full bg-[var(--surface-sec)] text-xs p-3 rounded-xl border border-[var(--border)] mt-1 outline-none text-[var(--text-primary)] focus:border-[var(--primary)] resize-none custom-scrollbar" placeholder="Ex: Manter cotovelos alinhados..." value={ex.observacao || ''} onChange={(e) => { setExercicios(prev => { const n = [...prev]; n[exIndex].observacao = e.target.value; return n; }); }} />
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)] pt-4">
                        <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_2.5rem] gap-1 sm:gap-2 text-[8px] sm:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 text-center px-1">
                          <span>Série</span><span>Reps</span><span>Carga</span><span>Desc.</span><span></span>
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

          <button onClick={adicionarExercicio} className="w-full mt-4 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all flex items-center justify-center gap-2 bg-[var(--surface)] shadow-sm"> 
            <FaPlus size={12} /> Adicionar Exercício
          </button>

          <button onClick={atualizarFicha} className="w-full mt-6 bg-[var(--primary)] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mb-10"> 
            <FaSave size={16} /> Salvar Ficha
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