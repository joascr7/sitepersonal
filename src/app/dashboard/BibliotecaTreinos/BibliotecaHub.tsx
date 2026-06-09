'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaPlus, FaFolder, FaEllipsisV, FaShareSquare, FaEdit, FaTrash, 
  FaSearch, FaStar, FaPlay, FaVideoSlash, FaChevronDown, FaChevronUp, FaTimes, FaUpload, FaArchive, FaChevronLeft, FaHeart
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
  if (ytId) return <><img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-700" /><FaPlay className="absolute text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" size={24}/></>;
  if (url.match(/\.(gif|jpg|jpeg|png|webp)$/i)) return <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />;
  if (url.match(/\.(mp4|webm|mov)$/i)) return <video src={url} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-700" autoPlay loop muted playsInline />;
  return <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]/50"><FaVideoSlash size={24}/></div>;
};

// Categorias organizadas
const CATEGORIAS_PADRAO = [
  { id: 'peito', nome: 'Peito / Peitorais', icon: '💪' },
  { id: 'costas', nome: 'Costas / Dorsais', icon: '🦅' },
  { id: 'pernas', nome: 'Pernas / Inferiores', icon: '🦵' },
  { id: 'ombros', nome: 'Ombros / Deltoides', icon: '🛡️' },
  { id: 'braços', nome: 'Braços (Bíceps/Tríceps)', icon: '⚔️' },
  { id: 'core', nome: 'Abdômen / Core', icon: '🍫' },
  { id: 'cardio', nome: 'Cardio / Aeróbico', icon: '🏃' },
  { id: 'geral', nome: 'Outros / Geral', icon: '🏋️' }
];

// Identificador rápido de categoria para os dados brutos
const autoCategorize = (nome: string, grupoOriginal: string): string => {
  if (grupoOriginal && grupoOriginal !== 'Geral') return grupoOriginal;
  const n = nome.toLowerCase();
  if (/(supino|crucifixo|peck deck|peito|chest)/.test(n)) return 'Peito';
  if (/(puxada|remada|barra|costas|dorsal|pulldown)/.test(n)) return 'Costas';
  if (/(agachamento|leg|extensora|flexora|panturrilha|perna|glúteo|stiff)/.test(n)) return 'Pernas';
  if (/(desenvolvimento|elevação|ombro|manguito)/.test(n)) return 'Ombros';
  if (/(rosca|tríceps|bíceps|francesa|testa)/.test(n)) return 'Braços';
  if (/(abdominal|core|prancha)/.test(n)) return 'Core';
  if (/(esteira|bike|corrida|pular corda)/.test(n)) return 'Cardio';
  return 'Geral';
};

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
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [videoAberto, setVideoAberto] = useState<string | null>(null); // PLAYER NATIVO

  const [modalCriarExercicio, setModalCriarExercicio] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [novoExercicio, setNovoExercicio] = useState({ nome: '', video: '', grupo: 'Peito' });

  useEffect(() => {
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
                    grupo: autoCategorize(ex.nome, ex.musculo_alvo)
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
            grupo: autoCategorize(b.exercicio_nome, b.musculo_alvo)
          });
        });
      }

      const listaLimpa = Array.from(new Map(unificados.map(item => [item.nome.toLowerCase().trim(), item])).values());
      listaLimpa.sort((a, b) => a.nome.localeCompare(b.nome));
      setExercicios(listaLimpa);
      setLoading(false);
    };
    fetchData();
  }, []);

  // ━━━━━━━━━ FUNÇÕES DE AÇÃO ━━━━━━━━━
  const deletarModelo = async (id: string) => {
    if (!confirm("Excluir este modelo permanentemente?")) return;
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
    // Atualiza localmente
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, favorito: !e.favorito } : e));
    // Dica: A implementação no banco exigiria criar uma tabela pivot ou atualizar a videos_biblioteca
  };

  const uploadVideoLocal = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) return alert("Arquivo muito grande! Máximo de 15MB.");
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const fileName = `exercicios/${Date.now()}_${Math.random().toString(36).substring(5)}.${ext}`;
      const { error } = await supabase.storage.from('videos').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('videos').getPublicUrl(fileName);
      setNovoExercicio(prev => ({ ...prev, video: data.publicUrl }));
    } catch (err: any) { alert("Erro no upload: " + err.message); } finally { setUploading(false); }
  };

  const salvarExercicioBanco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoExercicio.nome) return alert("Dê um nome ao exercício!");
    setUploading(true);
    try {
      const payload = { personal_id: personalId, exercicio_nome: novoExercicio.nome, url_video: novoExercicio.video, musculo_alvo: novoExercicio.grupo, favorito: false };
      const { data, error } = await supabase.from('videos_biblioteca').insert([payload]).select().single();
      if (error) throw error;
      setExercicios(prev => [...prev, { id: data.id, nome: data.exercicio_nome, video: data.url_video, origem: 'seus', favorito: false, grupo: data.musculo_alvo }].sort((a, b) => a.nome.localeCompare(b.nome)));
      setModalCriarExercicio(false);
      setNovoExercicio({ nome: '', video: '', grupo: 'Peito' });
    } catch (err: any) { alert("Erro ao criar exercício: " + err.message); } finally { setUploading(false); }
  };

  // ━━━━━━━━━ FILTROS MEMOIZADOS ━━━━━━━━━
  const exerciciosFiltrados = useMemo(() => {
    return exercicios.filter(ex => {
      const bateBusca = ex.nome.toLowerCase().includes(buscaExercicio.toLowerCase());
      const bateCategoria = !categoriaAtiva || ex.grupo?.toLowerCase() === categoriaAtiva.toLowerCase();
      
      let bateOrigem = true;
      if (filtroExercicio === 'favoritos') bateOrigem = ex.favorito;
      if (filtroExercicio === 'seus') bateOrigem = ex.origem === 'seus';
      
      return bateBusca && bateCategoria && bateOrigem;
    });
  }, [exercicios, buscaExercicio, filtroExercicio, categoriaAtiva]);

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
              return (
                <div key={i} className="flex items-center gap-3 bg-[var(--surface)] p-2.5 rounded-2xl border border-[var(--border)] shadow-sm">
                  <div className="w-14 h-12 bg-black rounded-xl overflow-hidden relative shrink-0 border border-[var(--border)] flex items-center justify-center cursor-pointer" onClick={() => setVideoAberto(ex.video)}>
                    {ytId ? (
                      <><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80" /><FaPlay className="absolute text-white drop-shadow-md" size={10} /></>
                    ) : ex.video && (ex.video.toLowerCase().endsWith('.gif') || ex.video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                      <img src={ex.video} className="w-full h-full object-cover" />
                    ) : ex.video ? (
                      <><video src={ex.video} className="w-full h-full object-cover opacity-80" /><FaPlay className="absolute text-white drop-shadow-md" size={10} /></>
                    ) : <FaVideoSlash className="text-[var(--text-secondary)]/40" size={12} />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{ex.nome}</span>
                    <span className="text-[9px] uppercase font-black text-[var(--text-secondary)] mt-0.5">{ex.series?.length || 0} Séries</span>
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
    <div className="min-h-[100dvh] bg-[var(--bg)] pb-24 text-[var(--text-primary)] font-sans antialiased">
      
      {/* CABEÇALHO GLOBAL */}
      <div className="bg-[var(--bg)]/90 backdrop-blur-xl pt-[max(env(safe-area-inset-top,2rem),2rem)] px-5 pb-4 sticky top-0 z-40 border-b border-[var(--border)] shadow-sm">
        <h1 className="text-2xl font-black mb-4 tracking-tight">{aba === 'rotinas' ? 'Biblioteca de Treinos' : 'Catálogo de Exercícios'}</h1>
        <div className="flex bg-[var(--surface-sec)] p-1.5 rounded-[1rem] border border-[var(--border)] shadow-inner">
          <button onClick={() => { setAba('rotinas'); setCategoriaAtiva(null); setBuscaExercicio(''); }} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${aba === 'rotinas' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Rotinas</button>
          <button onClick={() => { setAba('exercicios'); setCategoriaAtiva(null); setBuscaExercicio(''); }} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${aba === 'exercicios' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Exercícios</button>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto mt-2">
        
        {/* ABA ROTINAS */}
        {aba === 'rotinas' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <button onClick={() => router.push('/dashboard/BibliotecaTreinos/novo')} className="w-full py-5 border-2 border-dashed border-[var(--primary)] text-[var(--primary)] rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--primary)]/10 transition-all active:scale-[0.98]">
              <FaPlus size={14}/> Criar Nova Rotina
            </button>

            <div className="flex gap-2 mb-4 bg-[var(--surface-sec)] p-1 rounded-xl border border-[var(--border)] w-max shadow-inner">
              <button onClick={() => setStatusRotina('ativos')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusRotina === 'ativos' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>Ativos</button>
              <button onClick={() => setStatusRotina('arquivados')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusRotina === 'arquivados' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>Arquivados</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {rotinasFiltradas.length === 0 && <p className="text-center text-[var(--text-secondary)] text-sm py-10 font-bold">Nenhum modelo encontrado.</p>}
                
                {rotinasFiltradas.map(rotina => {
                  const isExpanded = rotinaExpandida === rotina.id;
                  return (
                    <div key={rotina.id} className={`bg-[var(--surface)] rounded-[1.5rem] border overflow-hidden shadow-sm transition-colors ${rotina.arquivado ? 'border-[var(--border)] opacity-70 grayscale' : 'border-[var(--border)] hover:border-[var(--primary)]/40'}`}>
                      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setRotinaExpandida(isExpanded ? null : rotina.id)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-colors shadow-inner border border-[var(--border)] ${isExpanded ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-sec)] text-[var(--primary)]'}`}><FaFolder size={22}/></div>
                          <div>
                            <span className="font-black text-[var(--text-primary)] text-sm flex items-center gap-2">{rotina.nome_modelo} {rotina.arquivado && <FaArchive className="text-[var(--text-secondary)]" size={10}/>}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">{isExpanded ? 'Ocultar detalhes' : 'Toque para ver a ficha'}</span>
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
                            <button onClick={() => router.push(`/dashboard/BibliotecaTreinos/editar/${rotina.id}`)} className="flex-1 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:border-[var(--primary)] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"><FaEdit/> Editar</button>
                            {!rotina.arquivado && <button onClick={() => setModeloParaAtribuir(rotina)} className="flex-1 py-4 bg-[var(--primary)] text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all hover:brightness-110"><FaShareSquare size={14}/> Atribuir</button>}
                          </div>
                        </div>
                      )}

                      {menuAberto === rotina.id && (
                        <>
                          <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setMenuAberto(null)} />
                          <div className="absolute top-16 right-5 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-56 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => toggleArquivar(rotina)} className="w-full text-left px-5 py-4 text-xs font-black text-[var(--text-primary)] hover:bg-[var(--surface-sec)] flex items-center gap-3 border-b border-[var(--border)] transition-colors"><FaArchive className="text-[var(--text-secondary)]" size={14}/> {rotina.arquivado ? 'Desarquivar' : 'Arquivar Modelo'}</button>
                            <button onClick={() => deletarModelo(rotina.id)} className="w-full text-left px-5 py-4 text-xs font-black text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-3 transition-colors"><FaTrash size={14}/> Excluir Permanente</button>
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

        {/* ABA EXERCÍCIOS (DRILL-DOWN PREMIUM / IMAGENS GRANDES) */}
        {aba === 'exercicios' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-400">
            
            {/* BUSCA GLOBAL */}
            <div className="relative">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14} />
              <input 
                type="text" 
                placeholder="Buscar qualquer exercício..." 
                value={buscaExercicio} 
                onChange={(e) => setBuscaExercicio(e.target.value)} 
                className="w-full bg-[var(--surface)] border border-[var(--border)] py-4 pl-12 pr-5 rounded-[1.2rem] text-sm font-bold outline-none focus:border-[var(--primary)] shadow-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 transition-colors" 
              />
            </div>

            {/* NÍVEL 1: SELEÇÃO DE CATEGORIAS (Aparece se não houver busca e não houver categoria selecionada) */}
            {!categoriaAtiva && buscaExercicio === '' ? (
              <div className="animate-in fade-in duration-300">
                <button onClick={() => setModalCriarExercicio(true)} className="w-full py-5 rounded-[1.5rem] border-2 border-dashed border-[var(--primary)]/50 text-[var(--primary)] font-black text-xs uppercase tracking-widest bg-transparent flex justify-center items-center gap-2 hover:bg-[var(--primary)]/5 transition-all mb-8 active:scale-[0.98]">
                  <FaPlus size={14}/> Criar Novo Exercício
                </button>

                <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4 pl-1">Categorias Musculares</h2>
                
                <div className="grid grid-cols-1 gap-3">
                  {CATEGORIAS_PADRAO.map((cat) => {
                    const count = exercicios.filter(e => e.grupo?.toLowerCase() === cat.id).length;
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => setCategoriaAtiva(cat.id)} 
                        className="w-full bg-[var(--surface)] border border-[var(--border)] p-4 rounded-[1.2rem] flex items-center justify-between text-left hover:border-[var(--primary)]/40 transition-all active:scale-[0.99] group shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl bg-[var(--surface-sec)] w-14 h-14 rounded-[1rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            {cat.icon}
                          </span>
                          <div>
                            <h3 className="font-black text-[var(--text-primary)] text-[15px] tracking-tight">{cat.nome}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mt-0.5">{count} Exercícios</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                          <FaChevronRight size={12}/>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              
              // NÍVEL 2: LISTAGEM DE EXERCÍCIOS (CARDS GRANDES 16:9)
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                
                <div className="flex justify-between items-center mb-2">
                  <button onClick={() => { setCategoriaAtiva(null); setBuscaExercicio(''); }} className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest hover:text-[var(--primary)] transition-colors py-2 active:scale-95">
                    <FaChevronLeft size={10} /> Voltar às categorias
                  </button>
                  {categoriaAtiva && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1.5 rounded-lg border border-[var(--primary)]/20 shadow-sm">
                      {CATEGORIAS_PADRAO.find(c => c.id === categoriaAtiva)?.nome.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* FILTROS DE ORIGEM (CHIPS) */}
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 -mx-5 px-5 sm:mx-0 sm:px-0">
                  <button onClick={() => setFiltroExercicio('app')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filtroExercicio === 'app' ? 'bg-[var(--primary)] text-white border-transparent shadow-md' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>Global</button>
                  <button onClick={() => setFiltroExercicio('seus')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filtroExercicio === 'seus' ? 'bg-[var(--primary)] text-white border-transparent shadow-md' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>Meus Vídeos</button>
                  <button onClick={() => setFiltroExercicio('favoritos')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-1.5 ${filtroExercicio === 'favoritos' ? 'bg-[var(--primary)] text-white border-transparent shadow-md' : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/30'}`}>Favoritos</button>
                </div>

                {/* GRID DE CARDS CINEMATOGRÁFICOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  {exerciciosFiltrados.length > 0 ? exerciciosFiltrados.map((ex) => (
                    <div key={ex.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl hover:border-[var(--primary)]/40 transition-all flex flex-col group relative">
                      
                      {/* Container Aspect-Video Mídia */}
                      <div className="w-full aspect-video bg-black relative shrink-0 cursor-pointer overflow-hidden border-b border-[var(--border)]" onClick={() => setVideoAberto(ex.video)}>
                        <MediaPreview url={ex.video} />
                        
                        {/* Botão de Favorito Overlay */}
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorito(ex.id); }} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg z-10">
                          {ex.favorito ? <FaHeart className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" size={16} /> : <FaHeart className="opacity-50 hover:opacity-100 transition-opacity" size={16} />}
                        </button>
                      </div>
                      
                      {/* Dados do Exercício */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-[var(--text-primary)] text-base tracking-tight leading-tight line-clamp-2">{ex.nome}</h3>
                          <div className="mt-3">
                            <span className="px-2.5 py-1 bg-[var(--surface-sec)] border border-[var(--border)] rounded-md text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest inline-block shadow-inner">
                              {ex.grupo}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-[var(--border)] rounded-[2rem] bg-[var(--surface-sec)]/30">
                      <p className="text-[var(--text-secondary)] font-black uppercase text-[10px] tracking-widest">Nenhum exercício encontrado nesta categoria.</p>
                    </div>
                  )}
                </div>

              </div>
            )}
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
              <img src={videoAberto} className="w-full h-full object-contain absolute inset-0" />
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
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Novo Exercício</h2>
              <button type="button" onClick={() => setModalCriarExercicio(false)} className="w-10 h-10 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] active:scale-95 transition-all"><FaTimes size={16}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">Nome do Exercício *</label>
                <input required autoFocus value={novoExercicio.nome} onChange={e => setNovoExercicio({...novoExercicio, nome: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] shadow-inner" placeholder="Ex: Supino Reto com Halteres" />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">Grupo Muscular Principal</label>
                <select value={novoExercicio.grupo} onChange={e => setNovoExercicio({...novoExercicio, grupo: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] appearance-none shadow-inner cursor-pointer">
                  {CATEGORIAS_PADRAO.map(c => <option key={c.id} value={c.id.charAt(0).toUpperCase() + c.id.slice(1)}>{c.nome}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1.5 block">Mídia (URL YouTube, Arquivo ou GIF)</label>
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
              {uploading ? "Salvando..." : "Criar Exercício no Catálogo"}
            </button>
          </form>
        </div>
      )}

      {/* Modal para Atribuir Rotina ao Aluno */}
      {modeloParaAtribuir && <ModalAtribuirTreino isOpen={!!modeloParaAtribuir} onClose={() => setModeloParaAtribuir(null)} modelo={modeloParaAtribuir} personalId={personalId} />}
    </div>
  );
}
