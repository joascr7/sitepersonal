'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';

interface Serie {
  reps: string;
  carga: string;
  intervalo: string;
}

interface Exercicio {
  nome: string;
  video: string;
  metodo: string;
  tipoSerie: string;
  series: Serie[];
}

export default function NovaFicha() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modelos, setModelos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [exercicios, setExercicios] = useState<Exercicio[]>([{ 
    nome: '', 
    video: '', 
    metodo: 'Normal', 
    tipoSerie: 'Repetições e carga',
    series: [{ reps: '', carga: '', intervalo: '0' }] 
  }]);

  useEffect(() => {
    const fetchModelos = async () => {
      const { data } = await supabase.from('treinos_padrao').select('*');
      if (data) setModelos(data);
    };
    fetchModelos();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const aplicarModelo = (modelo: any) => {
    try {
      const novosExercicios = typeof modelo.exercicios_json === 'string' 
        ? JSON.parse(modelo.exercicios_json) 
        : modelo.exercicios_json;

      setExercicios(prev => [...prev, ...novosExercicios]);
      setIsModalOpen(false);
      showToast(`${modelo.nome_modelo} adicionado!`);
    } catch (e) {
      alert("Erro ao aplicar este modelo de treino.");
    }
  };

  const uploadVideo = async (exIndex: number, file: File) => {
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

  const adicionarExercicio = () => setExercicios([...exercicios, { nome: '', video: '', metodo: 'Normal', tipoSerie: 'Repetições e carga', series: [{ reps: '', carga: '', intervalo: '0' }] }]);
  const removerExercicio = (index: number) => setExercicios(exercicios.filter((_, i) => i !== index));
  const adicionarSerie = (exIndex: number) => { const n = [...exercicios]; n[exIndex].series.push({ reps: '', carga: '', intervalo: '0' }); setExercicios(n); };
  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => { const n = [...exercicios]; n[exIndex].series[sIndex][campo] = valor; setExercicios(n); };
  
  const buscarVideo = async (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const { data } = await supabase.from('biblioteca_exercicios').select('url_video').eq('nome_exercicio', nomeExercicio.trim()).maybeSingle();
    if (data) { const n = [...exercicios]; n[index].video = data.url_video; setExercicios(n); }
  };

  const salvarFicha = async () => {
    if (!nome) return alert("Dê um nome ao treino!");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('fichas').insert([{ aluno_id: id, nome_treino: nome, descricao: JSON.stringify(exercicios), personal_id: user?.id }]);
      router.push(`/dashboard/aluno/${id}`);
    } catch (err: any) { alert('Erro ao salvar: ' + err.message); setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tighter">Nova Ficha</h1>

        {/* Notificaçãoo */}
        {toast && <div className="fixed top-5 right-5 z-[100] bg-black text-white px-6 py-3 rounded-full font-bold shadow-2xl">{toast}</div>}

        {/* Botão de Biblioteca */}
        <button onClick={() => setIsModalOpen(true)} className="w-full mb-8 py-5 bg-gray-900 text-white rounded-3xl font-black hover:bg-black transition-all shadow-lg active:scale-[0.98]">
          + Adicionar Treino da Biblioteca
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl p-8 overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Biblioteca de Treinos</h2>
                <button onClick={() => setIsModalOpen(false)} className="font-bold text-gray-400">FECHAR</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {modelos.map((m) => (
                  <button key={m.id} onClick={() => aplicarModelo(m)} className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:border-gray-900 transition text-left">
                    {m.nome_modelo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <input className="w-full p-4 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" placeholder="Nome do Treino (ex: Treino A)" value={nome} onChange={(e) => setNome(e.target.value)} />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 relative">
            <button onClick={() => removerExercicio(exIndex)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 font-bold text-sm">Remover</button>
            <input className="font-black text-xl w-full mb-4 outline-none border-b border-gray-100 pb-2" placeholder="Nome do Exercício" value={ex.nome} onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} onBlur={() => buscarVideo(ex.nome, exIndex)} />
            <div className="mb-4">
              <input className="w-full p-4 border border-gray-200 rounded-xl text-sm mb-2" placeholder="Link do vídeo ou carregue abaixo..." value={ex.video} onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} />
              <button type="button" onClick={() => document.getElementById(`file-${exIndex}`)?.click()} className="w-full py-2 bg-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-300"> {uploading ? 'Enviando...' : 'Upload de Vídeo'} </button>
              <input type="file" id={`file-${exIndex}`} className="hidden" accept="video/*" onChange={(e) => e.target.files && uploadVideo(exIndex, e.target.files[0])} />
            </div>
            <div className="mb-6">
              <input list="metodos-list" className="w-full p-4 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" placeholder="Método..." value={ex.metodo} onChange={(e) => { const n = [...exercicios]; n[exIndex].metodo = e.target.value; setExercicios(n); }} />
              <datalist id="metodos-list"><option value="Normal" /><option value="Drop-set" /><option value="Rest-Pause" /><option value="Bi-set" /><option value="Tri-set" /><option value="Pirâmide" /><option value="Até a Exaustão" /></datalist>
            </div>
            <div className="space-y-3">{ex.series.map((s, sIndex) => (<div key={sIndex} className="grid grid-cols-3 gap-3"><input className="p-3 border border-gray-200 rounded-xl" placeholder="Reps" value={s.reps} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} /><input className="p-3 border border-gray-200 rounded-xl" placeholder="Carga" value={s.carga} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} /><input className="p-3 border border-gray-200 rounded-xl" placeholder="Int" value={s.intervalo} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} /></div>))}</div>
            <button onClick={() => adicionarSerie(exIndex)} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 transition"> + Adicionar série </button>
          </div>
        ))}
        
        <button onClick={adicionarExercicio} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 p-4 rounded-2xl mb-4 font-bold transition-all active:scale-[0.98]"> + Adicionar Exercício </button>
        <button onClick={salvarFicha} disabled={loading} className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"> {loading ? 'Salvando...' : 'Finalizar e Salvar Ficha'} </button>
      </div>
    </main>
  );
}