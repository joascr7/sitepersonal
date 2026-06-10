'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  FaChevronLeft, FaSave, FaPlus, FaTrash, FaChevronDown, 
  FaChevronUp, FaUpload, FaBars, FaArrowUp, FaArrowDown, FaPlay, FaVideoSlash, FaLink, FaTimes, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';
import ModalCatalogo from './ModalCatalogo';

interface Serie { ordem: string; reps: string; carga: string; unidadeCarga: string; intervalo: string; }
interface Exercicio { nome: string; video: string; metodo: string; observacao?: string; series: Serie[]; }
interface Subdivisao { id: string; nome: string; exercicios: Exercicio[]; }

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function FormularioModelo({ modeloIdEdit }: { modeloIdEdit?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [videoAberto, setVideoAberto] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => { 
    setToast({ type, text }); 
    setTimeout(() => setToast(null), 4000); 
  };

  const [nomeFicha, setNomeFicha] = useState('');
  const [tipoTreinoForm, setTipoTreinoForm] = useState('Musculação');
  const [objetivoForm, setObjetivoForm] = useState('Hipertrofia');
  const [dificuldadeForm, setDificuldadeForm] = useState('Intermediário');
  
  const [subdivisoes, setSubdivisoes] = useState<Subdivisao[]>([{ id: Date.now().toString(), nome: 'Treino A', exercicios: [] }]);
  const [activeSubId, setActiveSubId] = useState(subdivisoes[0].id);
  const [expandedExIndex, setExpandedExIndex] = useState<number | null>(0);

  useEffect(() => {
    if (modeloIdEdit) {
      const carregarEdicao = async () => {
        const { data } = await supabase.from('modelos_personal').select('*').eq('id', modeloIdEdit).single();
        if (data) {
          setNomeFicha(data.nome_modelo);
          const parsed = typeof data.descricao === 'string' ? JSON.parse(data.descricao) : data.descricao;
          
          if (parsed.tipo_treino) setTipoTreinoForm(parsed.tipo_treino);
          if (parsed.objetivo) setObjetivoForm(parsed.objetivo);
          if (parsed.dificuldade) setDificuldadeForm(parsed.dificuldade);
          
          if (parsed.subdivisoes) {
            setSubdivisoes(parsed.subdivisoes);
            setActiveSubId(parsed.subdivisoes[0].id);
          }
        }
      };
      carregarEdicao();
    }
  }, [modeloIdEdit]);

  const subAtivaIndex = subdivisoes.findIndex(s => s.id === activeSubId) !== -1 ? subdivisoes.findIndex(s => s.id === activeSubId) : 0;
  const exerciciosAtivos = subdivisoes[subAtivaIndex]?.exercicios || [];

  const setExercicios = (novos: any) => {
    setSubdivisoes(prev => {
      const copy = [...prev];
      copy[subAtivaIndex].exercicios = typeof novos === 'function' ? novos(copy[subAtivaIndex].exercicios) : novos;
      return copy;
    });
  };

  const moverExercicio = (index: number, direcao: 'cima' | 'baixo') => {
    const novos = [...exerciciosAtivos];
    const alvo = direcao === 'cima' ? index - 1 : index + 1;
    if (alvo < 0 || alvo >= novos.length) return;
    [novos[index], novos[alvo]] = [novos[alvo], novos[index]];
    setExercicios(novos);
    setExpandedExIndex(alvo);
  };

  const injetarDoCatalogo = (selecionados: any[]) => {
    const novosEx = selecionados.map(s => ({
      nome: s.nome || '',
      video: s.video || '',
      metodo: 'Normal',
      observacao: '',
      series: [{ ordem: '1ª', reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }]
    }));
    setExercicios((prev: any) => [...prev, ...novosEx]);
    setExpandedExIndex(exerciciosAtivos.length);
  };

  const uploadVideoNativo = async (exIndex: number, file: File) => {
    if (file.size > 15 * 1024 * 1024) return showToast('error', "Limite máximo de 15MB por arquivo!");
    try {
      setUploadingIndex(exIndex);
      const ext = file.name.split('.').pop();
      const path = `exercicios/${Date.now()}_${Math.random().toString(36).substring(5)}.${ext}`;
      
      const { error } = await supabase.storage.from('videos').upload(path, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('videos').getPublicUrl(path);
      const novos = [...exerciciosAtivos];
      novos[exIndex].video = data.publicUrl;
      setExercicios(novos);
      showToast('success', "Mídia enviada com sucesso!");
    } catch (err: any) {
      showToast('error', "Erro ao enviar: " + err.message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const salvarModelo = async () => {
    if (!nomeFicha) return showToast('error', "Insira o nome da rotina de treinos!");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        personal_id: user?.id,
        nome_modelo: nomeFicha,
        descricao: JSON.stringify({
          tipo_treino: tipoTreinoForm,
          objetivo: objetivoForm,
          dificuldade: dificuldadeForm,
          subdivisoes
        })
      };
      if (modeloIdEdit) {
        await supabase.from('modelos_personal').update(payload).eq('id', modeloIdEdit);
      } else {
        await supabase.from('modelos_personal').insert(payload);
      }
      showToast('success', "Rotina salva com sucesso!");
      setTimeout(() => router.push('/dashboard/BibliotecaTreinos'), 1000);
    } catch (e: any) { 
      showToast('error', "Erro ao salvar: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text-primary)] pb-[calc(max(env(safe-area-inset-bottom),1.25rem)+6.5rem)] font-sans antialiased">
      
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[99999] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaExclamationCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      <header className="sticky top-0 z-[900] bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-5 py-4 flex items-center justify-between shadow-sm pt-[max(env(safe-area-inset-top,1rem),1rem)]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-[var(--surface)] rounded-full flex items-center justify-center border border-[var(--border)] active:scale-95 transition-transform text-[var(--text-secondary)] hover:text-[var(--primary)]">
            <FaChevronLeft size={12} />
          </button>
          <h1 className="text-lg font-black tracking-tight">{modeloIdEdit ? 'Editar Rotina' : 'Nova Rotina'}</h1>
        </div>
        <button onClick={salvarModelo} disabled={loading} className="px-6 py-3 bg-[var(--primary)] text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
          {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave size={12}/>} Salvar
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-5 space-y-6 mt-4">
        
        <div className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Nome do Modelo de Treino *</label>
            <input className="w-full bg-[var(--surface-sec)] px-4 py-3.5 rounded-xl font-bold text-base outline-none border border-[var(--border)] focus:border-[var(--primary)] text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-secondary)]" placeholder="Ex: Hipertrofia Avançada 4 Dias" value={nomeFicha} onChange={(e) => setNomeFicha(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Tipo de Treino</label>
              <select value={tipoTreinoForm} onChange={e => setTipoTreinoForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none cursor-pointer text-[var(--text-primary)]">
                <option>Musculação</option><option>Aeróbico</option><option>Funcional</option><option>Crossfit</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Objetivo</label>
              <select value={objetivoForm} onChange={e => setObjetivoForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none cursor-pointer text-[var(--text-primary)]">
                <option>Hipertrofia</option><option>Emagrecimento</option><option>Força / Potência</option><option>Condicionamento</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Dificuldade</label>
              <select value={dificuldadeForm} onChange={e => setDificuldadeForm(e.target.value)} className="w-full bg-[var(--surface-sec)] p-3.5 rounded-xl border border-[var(--border)] text-xs font-bold outline-none focus:border-[var(--primary)] appearance-none cursor-pointer text-[var(--text-primary)]">
                <option>Iniciante</option><option>Intermediário</option><option>Avançado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
          {subdivisoes.map(s => (
            <button key={s.id} onClick={() => { setActiveSubId(s.id); setExpandedExIndex(0); }} className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubId === s.id ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20 border-transparent' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'}`}>{s.nome}</button>
          ))}
          <button onClick={() => { const id = Date.now().toString(); const letra = String.fromCharCode(65 + subdivisoes.length); setSubdivisoes([...subdivisoes, { id, nome: `Treino ${letra}`, exercicios: [] }]); setActiveSubId(id); }} className="px-6 py-3.5 rounded-2xl bg-[var(--surface-sec)] border border-dashed border-[var(--border)] text-[10px] font-black uppercase text-[var(--text-secondary)] flex items-center gap-2 shrink-0 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors">
            <FaPlus size={10}/> Novo Dia
          </button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-[1.5rem] flex justify-between items-center shadow-sm">
          <input type="text" value={subdivisoes[subAtivaIndex]?.nome || ''} onChange={e => setSubdivisoes(prev => prev.map(s => s.id === activeSubId ? { ...s, nome: e.target.value } : s))} className="font-black text-xl bg-transparent border-b border-dashed border-[var(--text-secondary)]/50 focus:border-[var(--primary)] outline-none pb-0.5 text-[var(--text-primary)] max-w-[150px] sm:max-w-[300px] transition-colors" />
          <div className="flex gap-2">
            {subdivisoes.length > 1 && (
               <button onClick={() => { if(window.confirm('Tem certeza que deseja excluir este dia?')) { const f = subdivisoes.filter(s => s.id !== activeSubId); setSubdivisoes(f); setActiveSubId(f[0].id); } }} className="px-4 py-3 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white rounded-[1rem] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm active:scale-95 transition-colors">
                 <FaTrash size={10}/> <span className="hidden sm:inline">Excluir Dia</span>
               </button>
            )}
            <button onClick={() => setCatalogoAberto(true)} className="px-4 py-3 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-[1rem] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm active:scale-95 transition-colors">
              <FaPlus size={10}/> <span className="hidden sm:inline">Adicionar</span> Exercícios
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {exerciciosAtivos.map((ex, exIndex) => {
            const isExpanded = expandedExIndex === exIndex;
            const ytId = getYouTubeId(ex.video);
            
            // INTELIGÊNCIA ADICIONADA AQUI: Lê o número digitado e substitui o "1"
            const valorOrdem = String(ex.series?.[0]?.ordem || '');
            const numerosOrdem = valorOrdem.replace(/\D/g, ''); // Extrai apenas números do campo
            const qtdSeriesExibicao = Math.max(parseInt(numerosOrdem) || 0, ex.series?.length || 0);

            return (
              <div key={exIndex} className="bg-[var(--surface)] rounded-[1.5rem] border border-[var(--border)] overflow-hidden shadow-sm transition-all group">
                
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--surface-sec)]/50 transition-colors" onClick={() => setExpandedExIndex(isExpanded ? null : exIndex)}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <FaBars className="text-[var(--text-secondary)] opacity-40 shrink-0 cursor-grab hover:text-[var(--primary)] hover:opacity-100 transition-colors" size={14} />
                    
                    <div className="w-14 h-14 bg-[var(--surface-sec)] rounded-xl overflow-hidden shrink-0 border border-[var(--border)] flex items-center justify-center relative cursor-pointer group/thumb" onClick={(e) => { e.stopPropagation(); if (ex.video) setVideoAberto(ex.video); }}>
                      {ytId ? (
                        <><img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover opacity-80 group-hover/thumb:scale-110 transition-transform"/><FaPlay className="absolute text-white drop-shadow-md" size={12}/></>
                      ) : ex.video && (ex.video.endsWith('.gif') || ex.video.match(/\.(jpeg|jpg|png|webp)$/)) ? (
                        <img src={ex.video} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                      ) : ex.video ? (
                        <><video src={ex.video} className="w-full h-full object-cover opacity-80 group-hover/thumb:scale-110 transition-transform" /><FaPlay className="absolute text-white drop-shadow-md" size={12}/></>
                      ) : (
                        <FaVideoSlash className="text-[var(--text-secondary)]/30" size={14}/>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-[var(--text-primary)] truncate">{ex.nome || "Novo Exercício"}</span>
                      {/* TEXTO AZUL CORRIGIDO AQUI */}
                      <span className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest mt-0.5">{qtdSeriesExibicao} {qtdSeriesExibicao === 1 ? 'série configurada' : 'séries configuradas'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 items-center shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => moverExercicio(exIndex, 'cima')} className="p-2.5 bg-[var(--surface-sec)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"><FaArrowUp size={10}/></button>
                    <button onClick={() => moverExercicio(exIndex, 'baixo')} className="p-2.5 bg-[var(--surface-sec)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"><FaArrowDown size={10}/></button>
                    <button onClick={() => { if(window.confirm('Remover exercício?')) setExercicios((prev: any) => prev.filter((_: any, idx: number) => idx !== exIndex)); }} className="p-2.5 bg-[var(--danger)]/5 text-[var(--danger)] rounded-xl hover:bg-[var(--danger)]/10 transition-colors"><FaTrash size={10}/></button>
                    <div className="px-3 text-[var(--text-secondary)] opacity-50">{isExpanded ? <FaChevronUp size={12}/> : <FaChevronDown size={12}/>}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-sec)]/30 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Mídia (Link ou Arquivo)</label>
                        <div className="relative flex items-center">
                          <FaLink className="absolute left-4 text-[var(--text-secondary)]" size={12} />
                          <input className="w-full bg-[var(--surface)] pl-10 pr-12 py-3.5 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] shadow-sm placeholder:text-[var(--text-secondary)]/50" placeholder="URL do YouTube ou GIF..." value={ex.video || ''} onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].video = e.target.value; setExercicios(copy); }} />
                          <button onClick={() => document.getElementById(`upload-ex-${exIndex}`)?.click()} className="absolute right-1.5 w-9 h-9 bg-[var(--primary)] text-white rounded-[0.6rem] flex items-center justify-center hover:brightness-110 shadow-sm transition-all" title="Upload de Vídeo/Imagem">
                            {uploadingIndex === exIndex ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaUpload size={12}/>}
                          </button>
                          <input type="file" id={`upload-ex-${exIndex}`} className="hidden" accept="video/*,image/gif,image/jpeg,image/png,image/webp" onChange={e => e.target.files && uploadVideoNativo(exIndex, e.target.files[0])} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Instruções / Observações</label>
                        <input className="w-full bg-[var(--surface)] px-4 py-3.5 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] shadow-sm placeholder:text-[var(--text-secondary)]/50" placeholder="Ex: Focar na fase excêntrica (3 segundos descendo)" value={ex.observacao || ''} onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].observacao = e.target.value; setExercicios(copy); }} />
                      </div>
                    </div>

                    <div className="border border-[var(--border)] rounded-[1.2rem] overflow-hidden bg-[var(--surface)] shadow-inner">
                      <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[400px]">
                          <div className="bg-[var(--surface-sec)] grid grid-cols-[1.5fr_1fr_1.5fr_1fr_3rem] gap-2 text-[9px] font-black uppercase text-center py-3 text-[var(--text-secondary)] px-3 border-b border-[var(--border)] tracking-widest">
                            <span>Série (Editável)</span><span>Reps</span><span>Carga & Und</span><span>Pausa</span><span>Excluir</span>
                          </div>
                          
                          <div className="p-3 space-y-2">
                            {ex.series?.map((s, sIdx) => (
                              <div key={sIdx} className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_3rem] gap-2 items-center text-center">
                                
                                <input className="bg-[var(--surface-sec)] border border-[var(--border)] p-2.5 rounded-xl text-xs font-black text-center text-[var(--primary)] outline-none focus:border-[var(--primary)] w-full placeholder:text-[var(--text-secondary)]/50 shadow-sm" value={s.ordem || ''} placeholder={`${sIdx + 1}ª`} onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].series[sIdx].ordem = e.target.value; setExercicios(copy); }} />
                                
                                <input className="bg-[var(--surface-sec)] border border-[var(--border)] p-2.5 rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full shadow-sm" value={s.reps || ''} placeholder="10" onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].series[sIdx].reps = e.target.value; setExercicios(copy); }} />
                                
                                <div className="flex bg-[var(--surface-sec)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-[var(--primary)] shadow-sm">
                                  <input className="w-full bg-transparent p-2.5 text-xs font-bold text-center text-[var(--text-primary)] outline-none min-w-0 placeholder:text-[var(--text-secondary)]/50" value={s.carga || ''} placeholder="Peso" onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].series[sIdx].carga = e.target.value; setExercicios(copy); }} />
                                  <select className="bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase outline-none px-2 cursor-pointer border-l border-[var(--border)]" value={s.unidadeCarga || 'kg'} onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].series[sIdx].unidadeCarga = e.target.value; setExercicios(copy); }}>
                                    <option value="kg">kg</option>
                                    <option value="lbs">lbs</option>
                                  </select>
                                </div>

                                <input className="bg-[var(--surface-sec)] border border-[var(--border)] p-2.5 rounded-xl text-xs font-bold text-center text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full shadow-sm placeholder:text-[var(--text-secondary)]/50" value={s.intervalo || ''} placeholder="60s" onChange={e => { const copy = [...exerciciosAtivos]; copy[exIndex].series[sIdx].intervalo = e.target.value; setExercicios(copy); }} />
                                
                                <button onClick={() => { const copy = [...exerciciosAtivos]; copy[exIndex].series.splice(sIdx,1); setExercicios(copy); }} className="h-full bg-[var(--danger)]/10 text-[var(--danger)] rounded-xl flex items-center justify-center hover:bg-[var(--danger)] hover:text-white transition-colors border border-[var(--danger)]/20">
                                  <FaTrash size={12}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]">
                        <button onClick={() => { const copy = [...exerciciosAtivos]; copy[exIndex].series.push({ ordem: `${copy[exIndex].series.length + 1}ª`, reps: '10', carga: '', unidadeCarga: 'kg', intervalo: '60s' }); setExercicios(copy); }} className="w-full py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] border border-dashed border-[var(--primary)]/40 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--primary)]/5 hover:border-[var(--primary)] transition-all">
                          <FaPlus size={10}/> Adicionar Série
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ModalCatalogo isOpen={catalogoAberto} onClose={() => setCatalogoAberto(false)} onSelect={injetarDoCatalogo} />

      {videoAberto && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-md">
          <button onClick={() => setVideoAberto(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-xl backdrop-blur-md">
            <FaTimes size={20}/>
          </button>
          <div className="w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
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
    </div>
  );
}
