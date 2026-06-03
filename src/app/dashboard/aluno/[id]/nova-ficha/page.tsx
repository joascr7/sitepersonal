'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams, useSearchParams } from 'next/navigation';


// 1. Agora defina Exercicio usando Serie
interface Exercicio {
  nome: string;
  video: string;
  metodo: string;
  tipoSerie: string;
  series: Serie[];
  observacao?: string;
}

// 2. Defina a interface Serie primeiro
interface Serie {
  ordem?: string;
  reps: string;
  carga: number | string;
  CargaPlanejada: number | string;
  intervalo: number | string;
}

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
  const [toast, setToast] = useState<string | null>(null);
  
 // Localize o seu useState de exercicios e ajuste para isto:
const [exercicios, setExercicios] = useState<Exercicio[]>([{ 
  nome: '', 
  video: '', 
  metodo: 'Normal', 
  tipoSerie: 'Repetições e carga',
  // Adicionado ordem: '' aqui embaixo:
  series: [{ ordem: '', reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] 
}]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [pRes, bRes] = await Promise.all([
        supabase.from('treinos_padrao').select('*'),
        supabase.from('videos_biblioteca').select('*')
      ]);
      
      if (pRes.data) setTreinosPadrao(pRes.data);
      if (bRes.data) setBiblioteca(bRes.data);

      if (user?.id) {
        const { data: mData } = await supabase
          .from('modelos_personal')
          .select('*')
          .eq('personal_id', user.id);
        
        if (mData) setMeusModelos(mData);
      }
    };

    fetchData();
  }, []); 

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const aplicarModelo = (modelo: any, ehPadrao: boolean) => {
    try {
      const raw = ehPadrao ? modelo.exercicios_json : modelo.descricao;
      const novosExercicios = typeof raw === 'string' ? JSON.parse(raw) : raw;
      
      setExercicios(prev => [...prev, ...novosExercicios]);
      setIsModalOpen(false);
      showToast(`${modelo.nome_modelo || modelo.nome} adicionado!`);
    } catch (e) {
      alert("Erro ao aplicar este modelo.");
    }
  };

  const uploadVideo = async (exIndex: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) return alert("Arquivo maior que 10MB!");
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
      alert('Erro ao enviar vídeo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const adicionarExercicio = () => setExercicios([
  ...exercicios, 
  { 
    nome: '', 
    video: '', 
    metodo: 'Normal', 
    tipoSerie: 'Repetições e carga', 
    // Ajuste aqui para incluir o campo 'ordem':
    series: [{ ordem: '', reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] 
  }
]);
  const removerExercicio = (index: number) => setExercicios(exercicios.filter((_, i) => i !== index));
  const adicionarSerie = (exIndex: number) => {
  const n = [...exercicios];
  
  // Garantia de segurança: se series não existir ou não for array, inicializa como array vazio
  if (!n[exIndex].series || !Array.isArray(n[exIndex].series)) {
    n[exIndex].series = [];
  }

  // Agora é seguro dar o push
  n[exIndex].series.push({
    ordem: '', 
    reps: '',
    carga: '',
    intervalo: '',
    CargaPlanejada: ''
  });

  setExercicios(n);
};
  
  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => { 
    const n = [...exercicios]; 
    n[exIndex].series[sIndex][campo] = valor; 
    setExercicios(n); 
  };
  
  const buscarVideo = (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const videoEncontrado = biblioteca.find(v => 
      v.exercicio_nome?.toLowerCase().trim() === nomeExercicio.toLowerCase().trim()
    );
    if (videoEncontrado) {
      const n = [...exercicios];
      n[index].video = videoEncontrado.url_video;
      setExercicios(n);
      showToast(`Vídeo encontrado para ${nomeExercicio}!`);
    }
  };

  const salvarFicha = async () => {
  if (!nome) throw new Error("Dê um nome ao treino!");
  setLoading(true);

  // CORREÇÃO: Mantenha todos os campos que você adicionou (incluindo 'ordem')
  const exerciciosLimpos = exercicios.map(ex => ({
    ...ex, 
    series: ex.series.map(s => ({
      ordem: s.ordem || '',
      reps: s.reps || '', 
      carga: Number(s.carga) || 0,
      CargaPlanejada: Number(s.CargaPlanejada) || 0,
      intervalo: Number(s.intervalo) || 0
    }))
  }));

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('fichas').insert([{ 
    aluno_id: id, 
    nome_treino: nome, 
    descricao: JSON.stringify(exerciciosLimpos), // JSON completo
    personal_id: user?.id 
  }]);
  
  if (error) throw error;
};

  const salvarCombo = async () => {
    if (!nome) return alert("Dê um nome ao treino!");
    setLoading(true);
    try {
      await salvarFicha();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      await supabase.from('modelos_personal').insert({
        personal_id: user.id,
        nome_modelo: nome,
        descricao: JSON.stringify(exercicios)
      });
      
      showToast("Salvo para o aluno e como modelo!");
      router.refresh();
      router.replace(`/dashboard/aluno/${id}?aba=${abaOrigem}`);
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

 return (
    <main className="min-h-screen bg-black p-4 md:p-12 transition-colors text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">← Voltar</button>
          <h1 className="text-xl font-black tracking-tighter">Nova Ficha</h1>
          <div className="w-16" />
        </div>

        {toast && <div className="fixed top-5 right-5 z-[100] bg-blue-600 text-white px-6 py-3 rounded-full font-black text-xs animate-in fade-in">{toast}</div>}

        <button onClick={() => setIsModalOpen(true)} className="w-full mb-8 py-4 bg-white/5 border border-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-[0.99]">
          + Adicionar de "Meus Modelos" ou "Padrão"
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-neutral-950 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-black text-white">Biblioteca de Treinos</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest">Fechar</button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                <div>
                  <h3 className="font-black text-blue-500 uppercase text-[9px] tracking-widest mb-3">Meus Modelos</h3>
                  <div className="grid gap-2">
                    {meusModelos.map((m) => (
                      <button key={m.id} onClick={() => aplicarModelo(m, false)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-sm font-bold text-white text-left transition-all">
                        {m.nome_modelo}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-neutral-500 uppercase text-[9px] tracking-widest mb-3">Treinos Padrão</h3>
                  <div className="grid gap-2">
                    {treinosPadrao.map((m) => (
                      <button key={m.id} onClick={() => aplicarModelo(m, true)} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-sm font-bold text-white text-left transition-all">
                        {m.nome_modelo || m.nome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <input className="w-full p-6 mb-8 bg-white/5 border border-white/5 rounded-[2rem] outline-none focus:border-blue-500 transition-all placeholder:text-neutral-600 font-bold text-white" placeholder="Nome do Treino" value={nome} onChange={(e) => setNome(e.target.value)} />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 mb-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <input 
                className="font-black text-white w-full outline-none bg-transparent" 
                placeholder="Nome do Exercício" 
                value={ex.nome} 
                onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
                onBlur={() => buscarVideo(ex.nome, exIndex)} 
              />
              <button onClick={() => removerExercicio(exIndex)} className="text-neutral-600 hover:text-red-500 font-black text-xs ml-4">REMOVER</button>
            </div>

            <div className="mb-6 space-y-4">
              <input 
                className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none text-white" 
                placeholder="Link do vídeo" 
                value={ex.video} 
                onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} 
              />
              <button 
                type="button" 
                onClick={() => document.getElementById(`file-${exIndex}`)?.click()} 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
              > 
                {uploading ? 'ENVIANDO...' : 'UPLOAD DE VÍDEO (MÁX 10MB)'} 
              </button>
              <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
            
              {ex.video && (ex.video.includes('youtube') || ex.video.includes('youtu.be')) && (
                <div className="w-full h-40 bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                  <iframe className="w-full h-full" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}

              <input 
                className="w-full text-xs text-white bg-white/5 p-4 rounded-2xl border border-white/5 outline-none placeholder:text-neutral-600 italic"
                placeholder="Adicionar observação..." 
                value={ex.observacao || ''}
                onChange={(e) => { const n = [...exercicios]; n[exIndex].observacao = e.target.value; setExercicios(n); }}
              />
            </div>

            <div className="grid grid-cols-5 gap-2 text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-3 px-1 text-center">
              <span>Série</span><span>Reps</span><span>Carga</span><span>Desc.</span><span>Planej.</span>
            </div>

            <div className="space-y-2">
              {ex && Array.isArray(ex.series) ? (
                ex.series.map((s, sIndex) => (
                  <div key={sIndex} className="grid grid-cols-5 gap-2 items-center">
                    <input 
                      type="number" 
                      className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center font-bold text-white outline-none focus:border-blue-500 transition-all" 
                      value={s.ordem ?? sIndex + 1} 
                      onChange={(e) => atualizarSerie(exIndex, sIndex, 'ordem', e.target.value)}
                    />
                    <input 
                      type="text" 
                      className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center text-white outline-none" 
                      value={s?.reps ?? ''} 
                      onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} 
                    />
                    <input 
                      type="number" 
                      className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center text-white outline-none" 
                      value={s?.carga ?? ''} 
                      onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} 
                    />
                    <input 
                      type="number" 
                      className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center text-white outline-none" 
                      value={s?.intervalo ?? ''} 
                      onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} 
                    />
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-center text-white outline-none w-full" 
                        value={s?.CargaPlanejada ?? ''} 
                        onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} 
                      />
                      <button 
                        onClick={() => { const n = [...exercicios]; n[exIndex].series.splice(sIndex, 1); setExercicios(n); }} 
                        className="text-neutral-600 hover:text-red-500 font-black px-1"
                      > × </button>
                    </div>
                  </div>
                ))
              ) : <p className="text-[10px] text-neutral-500">Nenhuma série definida.</p>}
            </div>

            <button type="button" onClick={(e) => { e.preventDefault(); adicionarSerie(exIndex); }} className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-all w-full py-3 border-2 border-dashed border-white/5 rounded-2xl"> + ADICIONAR SÉRIE </button>
          </div>
        ))}
        
        <button onClick={adicionarExercicio} className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest text-neutral-500 border-2 border-dashed border-white/5 hover:border-blue-500 transition-all mb-8"> + ADICIONAR EXERCÍCIO </button>
        
        <div className="flex flex-col gap-3">
            <button onClick={async () => { setLoading(true); try { await salvarFicha(); router.back(); } catch(e: any) { alert(e.message); } finally { setLoading(false); }}} disabled={loading} className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all"> {loading ? 'SALVANDO...' : 'FINALIZAR E SALVAR'} </button>
            <button onClick={salvarCombo} disabled={loading} className="w-full bg-white/5 border border-white/5 text-white p-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"> SALVAR COMO MODELO </button>
        </div>
      </div>
    </main>
  );
}

export default function NovaFicha() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black text-blue-500 bg-black min-h-screen">CARREGANDO...</div>}>
      <NovaFichaContent />
    </Suspense>
  );
}