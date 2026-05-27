'use client';
import { useState } from 'react';
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
  tipoSerie: string;
  series: Serie[];
}

export default function NovaFicha() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [exercicios, setExercicios] = useState<Exercicio[]>([{ 
    nome: '', 
    video: '', 
    tipoSerie: 'Repetições e carga',
    series: [{ reps: '', carga: '', intervalo: '0' }] 
  }]);

  const adicionarExercicio = () => {
    setExercicios([...exercicios, { 
      nome: '', 
      video: '', 
      tipoSerie: 'Repetições e carga', 
      series: [{ reps: '', carga: '', intervalo: '0' }] 
    }]);
  };

  const adicionarSerie = (exIndex: number) => {
    const novas = [...exercicios];
    novas[exIndex].series.push({ reps: '', carga: '', intervalo: '0' });
    setExercicios(novas);
  };

  const atualizarSerie = (exIndex: number, sIndex: number, campo: keyof Serie, valor: string) => {
    const novas = [...exercicios];
    novas[exIndex].series[sIndex][campo] = valor;
    setExercicios(novas);
  };

  const buscarVideo = async (nomeExercicio: string, index: number) => {
    if (!nomeExercicio.trim()) return;
    const { data } = await supabase.from('biblioteca_exercicios').select('url_video').eq('nome_exercicio', nomeExercicio.trim()).maybeSingle();
    if (data) {
      const novas = [...exercicios];
      novas[index].video = data.url_video;
      setExercicios(novas);
    }
  };

  const salvarFicha = async () => {
    if (!nome) return alert("Dê um nome ao treino!");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('fichas').insert([{ 
        aluno_id: id, 
        nome_treino: nome, 
        descricao: JSON.stringify(exercicios),
        personal_id: user?.id 
      }]);
      
      router.push(`/dashboard/aluno/${id}`);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tighter">Nova Ficha</h1>
        
        <input 
          className="w-full p-4 mb-8 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900 transition" 
          placeholder="Nome do Treino (ex: Treino A)" 
          value={nome} 
          onChange={(e) => setNome(e.target.value)} 
        />

        {exercicios.map((ex, exIndex) => (
          <div key={exIndex} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <input 
              className="font-black text-xl w-full mb-4 outline-none border-b border-gray-100 pb-2" 
              placeholder="Nome do Exercício" 
              value={ex.nome} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].nome = e.target.value; setExercicios(n); }} 
              onBlur={() => buscarVideo(ex.nome, exIndex)} 
            />

            <input 
              className="w-full p-4 border border-gray-200 rounded-xl mb-6 text-sm outline-none focus:ring-2 focus:ring-gray-900" 
              placeholder="Link do vídeo (YouTube)" 
              value={ex.video} 
              onChange={(e) => { const n = [...exercicios]; n[exIndex].video = e.target.value; setExercicios(n); }} 
            />
            
            <div className="space-y-3">
              {ex.series.map((s, sIndex) => (
                <div key={sIndex} className="grid grid-cols-3 gap-3">
                  <input className="p-3 border border-gray-200 rounded-xl" placeholder="Reps" value={s.reps} onChange={(e) => atualizarSerie(exIndex, sIndex, 'reps', e.target.value)} />
                  <input className="p-3 border border-gray-200 rounded-xl" placeholder="Carga" value={s.carga} onChange={(e) => atualizarSerie(exIndex, sIndex, 'carga', e.target.value)} />
                  <input className="p-3 border border-gray-200 rounded-xl" placeholder="Int" value={s.intervalo} onChange={(e) => atualizarSerie(exIndex, sIndex, 'intervalo', e.target.value)} />
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => adicionarSerie(exIndex)} 
              className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700 transition"
            >
              + Adicionar série
            </button>
          </div>
        ))}
        
        <button 
          onClick={adicionarExercicio} 
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 p-4 rounded-2xl mb-4 font-bold transition-all active:scale-[0.98]"
        >
          + Adicionar Exercício
        </button>
        
        <button 
          onClick={salvarFicha} 
          disabled={loading} 
          className="w-full bg-gray-900 hover:bg-black text-white p-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-sm disabled:bg-gray-400"
        >
          {loading ? 'Salvando...' : 'Finalizar e Salvar Ficha'}
        </button>
      </div>
    </main>
  );
}