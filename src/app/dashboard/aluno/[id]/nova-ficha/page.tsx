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
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Nova Ficha</h1>
        </div>

        {toast && <div className="fixed top-5 right-5 z-[100] bg-black text-white px-6 py-3 rounded-full font-bold shadow-2xl">{toast}</div>}

        <button onClick={() => setIsModalOpen(true)} className="w-full mb-8 py-5 bg-gray-900 text-white rounded-3xl font-black shadow-lg hover:bg-black transition-all active:scale-[0.98]">
          + Adicionar de "Meus Modelos" ou "Padrão"
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl p-8 overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">Biblioteca de Treinos</h2>
                <button onClick={() => setIsModalOpen(false)} className="font-bold text-gray-500 hover:text-gray-900">FECHAR</button>
              </div>
              
              <h3 className="font-bold text-blue-600 uppercase text-xs mb-3">Meus Modelos</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {meusModelos.map((m) => (
                  <button key={m.id} onClick={() => aplicarModelo(m, false)} className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-800 text-left hover:border-blue-300 transition">
                    {m.nome_modelo}
                  </button>
                ))}
              </div>

              <h3 className="font-bold text-gray-400 uppercase text-xs mb-3">Treinos Padrão</h3>
              <div className="grid grid-cols-2 gap-3">
                {treinosPadrao.map((m) => (
                  <button key={m.id} onClick={() => aplicarModelo(m, true)} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 text-left hover:border-gray-900 transition">
                    {m.nome_modelo || m.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <input className="w-full p-4 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="Nome do Treino" value={nome} onChange={(e) => setNome(e.target.value)} />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 relative">
            <button onClick={() => removerExercicio(exIndex)} className="absolute top-6 right-6 text-red-400 font-bold text-sm">Remover</button>
            <input className="font-black text-xl w-full mb-4 outline-none border-b border-gray-100 pb-2" placeholder="Nome do Exercício" value={ex.nome} onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} onBlur={() => buscarVideo(ex.nome, exIndex)} />
            
            <div className="mb-4">
              <input className="w-full p-4 border border-gray-200 rounded-xl text-sm mb-2" placeholder="Link do vídeo" value={ex.video} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
              <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="w-full py-2 bg-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-300"> {uploading ? 'Enviando...' : 'Upload de Vídeo'} </button>
              <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
            
              {ex.video && (ex.video.includes('youtube') || ex.video.includes('youtu.be')) && (
                <div className="mt-4 w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <iframe className="w-full h-full" src={ex.video.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').replace('/shorts/', '/embed/').split('&')[0]} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-[9px] font-black text-gray-400 uppercase px-1 mb-2">
              <span className="text-center">Reps</span>
              <span className="text-center">Carga Rec.</span>
              <span className="text-center">Intervalo</span>
              <span className="text-center">Planejada</span>
            </div>

            <div className="space-y-2">
              {ex.series.map((s, sIndex) => (
                <div key={sIndex} className="flex gap-2 items-center">
                  <div className="grid grid-cols-4 gap-2 flex-grow">
                    <input type="text" className="p-3 bg-gray-50 border rounded-xl font-bold text-sm text-center" placeholder="-" value={s.reps} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                    <input type="number" className="p-3 bg-gray-50 border rounded-xl font-bold text-sm text-center" placeholder="-" value={s.carga} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                    <input type="number" className="p-3 bg-gray-50 border rounded-xl font-black text-blue-600 text-sm text-center" placeholder="-" value={s.intervalo} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                    <input type="number" className="p-3 bg-gray-50 border rounded-xl font-bold text-sm text-center" placeholder="-" value={s.CargaPlanejada} onChange={(e) => atualizarSerie(exIndex, sIndex, 'CargaPlanejada', e.target.value)} />
                  </div>
                  <button onClick={() => { const n = [...exercicios]; n[exIndex].series = n[exIndex].series.filter((_, i) => i !== sIndex); setExercicios(n); }} className="text-red-400 font-black p-2 hover:bg-red-50 rounded-full">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => adicionarSerie(exIndex)} className="mt-6 text-sm font-bold text-blue-600"> + Adicionar série </button>
          </div>
        ))}
        
        <button onClick={adicionarExercicio} className="w-full bg-gray-100 p-4 rounded-2xl mb-4 font-bold"> + Adicionar Exercício </button>
        
        <div className="flex flex-col gap-3">
            <button onClick={async () => { setLoading(true); try { await salvarFicha(); router.back(); } catch(e: any) { alert(e.message); } finally { setLoading(false); }}} disabled={loading} className="w-full bg-gray-900 text-white p-4 rounded-2xl font-bold"> {loading ? 'Salvando...' : 'Finalizar e Salvar para o Aluno'} </button>
            <button onClick={salvarCombo} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold"> Salvar para Aluno + Salvar como Modelo </button>
        </div>
      </div>
    </main>
  );
}

export default function NovaFicha() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando...</div>}>
      <NovaFichaContent />
    </Suspense>
  );
}