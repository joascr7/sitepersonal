'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaPlus, FaFolder, FaEllipsisV, FaShareSquare, FaEdit, FaTrash, 
  FaSearch, FaStar, FaPlay, FaVideoSlash, FaChevronDown, FaChevronUp, FaTimes, FaUpload, FaArchive
} from 'react-icons/fa';
import ModalAtribuirTreino from '@/components/biblioteca/ModalAtribuirTreino';

// Extrai ID do YouTube para Thumbnail e Player Nativo
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

export  function BibliotecaHub() {
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
                    grupo: ex.musculo_alvo || 'Geral'
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
            grupo: b.musculo_alvo || 'Geral'
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

  const toggleFavorito = (id: string) => {
    setExercicios(prev => prev.map(e => e.id === id ? { ...e, favorito: !e.favorito } : e));
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

  const exerciciosFiltrados = useMemo(() => {
    return exercicios.filter(ex => {
      const bateBusca = ex.nome.toLowerCase().includes(buscaExercicio.toLowerCase());
      if (filtroExercicio === 'favoritos') return bateBusca && ex.favorito;
      if (filtroExercicio === 'seus') return bateBusca && ex.origem === 'seus';
      return bateBusca;
    });
  }, [exercicios, buscaExercicio, filtroExercicio]);

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
    <div className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text-primary)]">
      <div className="bg-[var(--surface-sec)] pt-8 px-5 pb-4 sticky top-0 z-40 border-b border-[var(--border)] shadow-sm">
        <h1 className="text-2xl font-black mb-4 tracking-tight">{aba === 'rotinas' ? 'Biblioteca de treinos' : 'Biblioteca de exercícios'}</h1>
        <div className="flex bg-[var(--bg)] p-1.5 rounded-xl border border-[var(--border)] shadow-sm">
          <button onClick={() => setAba('rotinas')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${aba === 'rotinas' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}>Rotinas</button>
          <button onClick={() => setAba('exercicios')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${aba === 'exercicios' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}>Exercícios</button>
        </div>
      </div>

      <div className="p-5 max-w-2xl mx-auto mt-2">
        {aba === 'rotinas' && (
          <div className="space-y-5 animate-in fade-in">
            <button onClick={() => router.push('/dashboard/BibliotecaTreinos/novo')} className="w-full py-5 border-2 border-dashed border-[var(--primary)] text-[var(--primary)] rounded-[1.5rem] font-black flex items-center justify-center gap-2 hover:bg-[var(--primary)]/5 transition-all active:scale-[0.98]">
              <FaPlus size={14}/> Criar Nova Rotina
            </button>

            <div className="flex gap-2 mb-4 bg-[var(--surface-sec)] p-1 rounded-xl border border-[var(--border)] w-max">
              <button onClick={() => setStatusRotina('ativos')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusRotina === 'ativos' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>Ativos</button>
              <button onClick={() => setStatusRotina('arquivados')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${statusRotina === 'arquivados' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>Arquivados</button>
            </div>

            {loading ? <div className="text-center py-10 font-bold text-[var(--text-secondary)] animate-pulse">Carregando seus modelos...</div> : (
              <div className="space-y-4">
                {rotinasFiltradas.length === 0 && <p className="text-center text-[var(--text-secondary)] text-sm py-10">Nenhum modelo encontrado.</p>}
                
                {rotinasFiltradas.map(rotina => {
                  const isExpanded = rotinaExpandida === rotina.id;
                  return (
                    <div key={rotina.id} className={`bg-[var(--surface)] rounded-[1.5rem] border overflow-hidden shadow-sm transition-colors ${rotina.arquivado ? 'border-[var(--border)] opacity-70 grayscale' : 'border-[var(--border)] hover:border-[var(--primary)]/40'}`}>
                      <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setRotinaExpandida(isExpanded ? null : rotina.id)}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-inner border border-[var(--border)] ${isExpanded ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-sec)] text-[var(--primary)]'}`}><FaFolder size={22}/></div>
                          <div>
                            <span className="font-black text-[var(--text-primary)] uppercase text-sm block flex items-center gap-2">{rotina.nome_modelo} {rotina.arquivado && <FaArchive className="text-[var(--text-secondary)]" size={10}/>}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">{isExpanded ? 'Ocultar detalhes' : 'Toque para ver a ficha'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setMenuAberto(menuAberto === rotina.id ? null : rotina.id); }} className="p-3 text-[var(--text-secondary)] active:scale-90"><FaEllipsisV /></button>
                          <div className="text-[var(--text-secondary)] px-2">{isExpanded ? <FaChevronUp size={14}/> : <FaChevronDown size={14}/>}</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-sec)]/30 animate-in fade-in">
                          <div className="mb-5">{renderEstruturaRotina(rotina)}</div>
                          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
                            <button onClick={() => router.push(`/dashboard/BibliotecaTreinos/editar/${rotina.id}`)} className="flex-1 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"><FaEdit/> Editar</button>
                            {!rotina.arquivado && <button onClick={() => setModeloParaAtribuir(rotina)} className="flex-1 py-3.5 bg-[var(--primary)] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 active:scale-95 transition-all"><FaShareSquare size={14}/> Atribuir</button>}
                          </div>
                        </div>
                      )}

                      {menuAberto === rotina.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(null)} />
                          <div className="absolute top-16 right-5 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-48 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => toggleArquivar(rotina)} className="w-full text-left px-5 py-4 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-sec)] flex items-center gap-3 border-b border-[var(--border)]"><FaArchive className="text-[var(--text-secondary)]"/> {rotina.arquivado ? 'Desarquivar' : 'Arquivar Modelo'}</button>
                            <button onClick={() => deletarModelo(rotina.id)} className="w-full text-left px-5 py-4 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)]/10 flex items-center gap-3"><FaTrash /> Excluir</button>
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
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => setModalCriarExercicio(true)} className="w-full py-5 rounded-[1.5rem] border-2 border-[var(--primary)] text-[var(--primary)] font-black text-sm bg-transparent flex justify-center items-center gap-2 hover:bg-[var(--primary)]/5 transition-all mb-5 active:scale-[0.98]">
              <FaPlus size={14}/> Criar Exercício
            </button>
            <div className="relative mb-5">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={14} />
              <input type="text" placeholder="Buscar exercícios..." value={buscaExercicio} onChange={(e) => setBuscaExercicio(e.target.value)} className="w-full bg-[var(--surface)] border border-[var(--border)] py-4 pl-12 pr-5 rounded-2xl text-sm font-medium outline-none focus:border-[var(--primary)] shadow-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60" />
            </div>
            <div className="flex gap-2 mb-5 overflow-x-auto custom-scrollbar pb-2">
              <button onClick={() => setFiltroExercicio('app')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filtroExercicio === 'app' ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>Global</button>
              <button onClick={() => setFiltroExercicio('seus')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filtroExercicio === 'seus' ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>Meus Vídeos</button>
              <button onClick={() => setFiltroExercicio('favoritos')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filtroExercicio === 'favoritos' ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>Favoritos</button>
            </div>
            <div className="space-y-3">
              {exerciciosFiltrados.map((ex) => {
                const ytId = getYouTubeId(ex.video);
                return (
                  <div key={ex.id} className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-2xl shadow-sm flex items-center justify-between hover:border-[var(--primary)]/40 transition-all group">
                    <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => setVideoAberto(ex.video)}>
                      <div className="w-[90px] h-[65px] bg-black rounded-xl overflow-hidden relative shrink-0 border border-[var(--border)] flex items-center justify-center shadow-inner">
                        {ytId ? (
                          <><img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-80" /><FaPlay className="absolute text-white drop-shadow-md" size={16} /></>
                        ) : ex.video && (ex.video.toLowerCase().endsWith('.gif') || ex.video.toLowerCase().match(/\.(jpeg|jpg|png|webp)$/)) ? (
                          <img src={ex.video} className="w-full h-full object-cover" />
                        ) : ex.video ? (
                          <div className="w-full h-full relative"><video src={ex.video} className="w-full h-full object-cover opacity-80" /><FaPlay className="absolute text-white drop-shadow-md" size={16} /></div>
                        ) : <FaVideoSlash className="text-[var(--text-secondary)]/30" size={16} />}
                      </div>
                      <div className="flex flex-col min-w-0 pr-2">
                        <h3 className="font-bold text-[var(--text-primary)] text-sm truncate leading-tight mb-1.5">{ex.nome}</h3>
                        <span className="px-2.5 py-1 w-max bg-[var(--surface-sec)] border border-[var(--border)] rounded-lg text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{ex.grupo}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleFavorito(ex.id)} className="p-3 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors active:scale-90">
                      <FaStar size={18} className={ex.favorito ? 'text-yellow-500 drop-shadow-sm' : ''} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PLAYER DE VÍDEO IN-APP */}
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

      {/* MODAIS (Criar e Atribuir) */}
      {modalCriarExercicio && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-5 animate-in fade-in">
          <form onSubmit={salvarExercicioBanco} className="bg-[var(--surface)] w-full max-w-md rounded-[2rem] p-6 sm:p-8 border border-[var(--border)] shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
              <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Criar Exercício</h2>
              <button type="button" onClick={() => setModalCriarExercicio(false)} className="w-8 h-8 rounded-full bg-[var(--surface-sec)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)]"><FaTimes size={14}/></button>
            </div>
            <div className="space-y-5">
              <div><label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider mb-1.5 block">Nome do Exercício *</label><input required autoFocus value={novoExercicio.nome} onChange={e => setNovoExercicio({...novoExercicio, nome: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" /></div>
              <div><label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider mb-1.5 block">Grupo Muscular</label><select value={novoExercicio.grupo} onChange={e => setNovoExercicio({...novoExercicio, grupo: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] appearance-none"><option>Peito</option><option>Costas</option><option>Pernas</option><option>Ombros</option><option>Braços</option><option>Core</option><option>Cardio</option><option>Geral</option></select></div>
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider mb-1.5 block">Mídia (Link ou Upload)</label>
                <div className="relative">
                  <input value={novoExercicio.video} onChange={e => setNovoExercicio({...novoExercicio, video: e.target.value})} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 pr-12 rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" placeholder="Cole URL YouTube..." />
                  <button type="button" onClick={() => document.getElementById('upload-novo-ex')?.click()} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center shadow-md">{uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={14}/>}</button>
                  <input type="file" id="upload-novo-ex" className="hidden" accept="video/*,image/gif" onChange={e => e.target.files && uploadVideoLocal(e.target.files[0])} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={uploading} className="w-full py-4 mt-8 bg-[var(--primary)] text-white rounded-xl font-black uppercase tracking-widest text-xs flex justify-center items-center shadow-lg active:scale-95 transition-all">{uploading ? "Aguarde..." : "Salvar Exercício"}</button>
          </form>
        </div>
      )}

      {modeloParaAtribuir && <ModalAtribuirTreino isOpen={!!modeloParaAtribuir} onClose={() => setModeloParaAtribuir(null)} modelo={modeloParaAtribuir} personalId={personalId} />}
    </div>
  );
}