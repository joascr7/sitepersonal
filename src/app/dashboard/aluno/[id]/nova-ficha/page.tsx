'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams, useSearchParams } from 'next/navigation';

interface Serie {
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
  
  const [exercicios, setExercicios] = useState<Exercicio[]>([{ 
    nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga',
    series: [{ reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] 
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

  const adicionarExercicio = () => setExercicios([...exercicios, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', series: [{ reps: '', carga: '', CargaPlanejada: '', intervalo: '' }] }]);
  const removerExercicio = (index: number) => setExercicios(exercicios.filter((_, i) => i !== index));
  const adicionarSerie = (exIndex: number) => { const n = [...exercicios]; n[exIndex].series.push({ reps: '', carga: '', CargaPlanejada: '', intervalo: '' }); setExercicios(n); };
  
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
    const exerciciosLimpos = exercicios.map(ex => ({
      ...ex, series: ex.series.map(s => ({
        reps: s.reps, 
        carga: Number(s.carga) || 0,
        CargaPlanejada: Number(s.CargaPlanejada) || 0,
        intervalo: Number(s.intervalo) || 0
      }))
    }));

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('fichas').insert([{ 
      aluno_id: id, nome_treino: nome, descricao: JSON.stringify(exerciciosLimpos), personal_id: user?.id 
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
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-12 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">← Voltar</button>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Nova Ficha</h1>
          <div className="w-16" />
        </div>

        {toast && <div className="fixed top-5 right-5 z-[100] bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-in fade-in">{toast}</div>}

        <button onClick={() => setIsModalOpen(true)} className="w-full mb-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-sm">
          + Adicionar de "Meus Modelos" ou "Padrão"
        </button>

        {isModalOpen && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
      {/* Header Fixo */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-xl font-black text-gray-900">Biblioteca de Treinos</h2>
        <button 
          onClick={() => setIsModalOpen(false)} 
          className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
        >
          Fechar
        </button>
      </div>

      {/* Conteúdo com Scroll Customizado */}
      <div className="overflow-y-auto pr-2 space-y-8 custom-scrollbar">
        
        {/* Agrupamento Meus Modelos */}
        <div>
          <h3 className="font-bold text-blue-600 uppercase text-[10px] tracking-widest mb-3">Meus Modelos</h3>
          <div className="grid gap-2">
            {meusModelos.map((m) => (
              <button 
                key={m.id} 
                onClick={() => aplicarModelo(m, false)} 
                className="w-full p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-900 text-left transition-all"
              >
                {m.nome_modelo}
              </button>
            ))}
          </div>
        </div>

        {/* Agrupamento Treinos Padrão */}
        <div>
          <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-3">Treinos Padrão</h3>
          <div className="grid gap-2">
            {treinosPadrao.map((m) => (
              <button 
                key={m.id} 
                onClick={() => aplicarModelo(m, true)} 
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 text-left transition-all"
              >
                {m.nome_modelo || m.nome}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)}
        
        <input className="w-full p-4 mb-8 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-400" placeholder="Nome do Treino" value={nome} onChange={(e) => setNome(e.target.value)} />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
              <input className="font-semibold text-gray-900 w-full outline-none border-b border-transparent focus:border-gray-200 pb-1" placeholder="Nome do Exercício" value={ex.nome} onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} onBlur={() => buscarVideo(ex.nome, exIndex)} />
              <button onClick={() => removerExercicio(exIndex)} className="text-gray-400 hover:text-red-500 font-bold text-xs ml-4">Remover</button>
            </div>
            
            <div className="mb-6 space-y-2">
              <input className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-gray-300 transition-all" placeholder="Link do vídeo" value={ex.video} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
              <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"> {uploading ? 'Enviando...' : 'Upload de Vídeo (Máx 10MB)'} </button>
              <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
            
              {ex.video && (ex.video.includes('youtube') || ex.video.includes('youtu.be')) && (
                <div className="mt-4 w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <iframe className="w-full h-full" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              <span>Reps</span>
              <span>Carga</span>
              <span>Desc.</span>
              <span>Planej.</span>
            </div>

            <div className="space-y-2">
              {ex.series.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-4 gap-2">
                  <input type="text" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 outline-none transition-all" placeholder="3x12" value={s.reps} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                  <input type="number" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 outline-none transition-all" placeholder="0" value={s.carga} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                  <input type="number" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 outline-none transition-all" placeholder="0" value={s.intervalo} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                  <input type="number" className="p-2 bg-gray-50 border border-transparent rounded-lg text-sm text-center focus:bg-white focus:border-gray-200 outline-none transition-all" placeholder="0" value={s.CargaPlanejada} onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} />
                </div>
              ))}
            </div>
            <button onClick={() => adicionarSerie(exIndex)} className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"> + Adicionar série </button>
          </div>
        ))}
        
        <button onClick={adicionarExercicio} className="w-full py-4 rounded-xl font-bold text-sm text-gray-500 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-900 transition-all mb-8"> + Adicionar Exercício </button>
        
        <div className="flex flex-col gap-3">
            <button onClick={async () => { setLoading(true); try { await salvarFicha(); router.back(); } catch(e: any) { alert(e.message); } finally { setLoading(false); }}} disabled={loading} className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all"> {loading ? 'Salvando...' : 'Finalizar e Salvar'} </button>
            <button onClick={salvarCombo} disabled={loading} className="w-full bg-white border border-gray-900 text-gray-900 p-4 rounded-xl font-bold hover:bg-gray-50 transition-all"> Salvar para Aluno + Modelo </button>
        </div>
      </div>
    </main>
  );
}

export default function NovaFicha() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-medium">Carregando...</div>}>
      <NovaFichaContent />
    </Suspense>
  );
}