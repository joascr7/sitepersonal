'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ModalSelecaoAlunos from '@/components/ModalSelecaoAlunos';

export default function DetalheTreino({ params }: { params: Promise<{ id: string; treinoId: string }> }) {
  const resolvedParams = use(params);
  const { id, treinoId } = resolvedParams;
  const router = useRouter();

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);

  useEffect(() => {
    if (!treinoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: fichaData, error: fichaError } = await supabase
          .from('fichas')
          .select('*')
          .eq('id', treinoId)
          .maybeSingle();

        if (fichaError) throw new Error(fichaError.message);
        setFicha(fichaData);

        const { data: { user } } = await supabase.auth.getUser();
        const ehDono = !!(user && fichaData && String(fichaData.personal_id) === String(user.id));
        setIsPersonal(ehDono);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [treinoId]);

  const duplicarTreino = async (alunoSelecionadoId: string) => {
    try {
      const { error } = await supabase.from('fichas').insert({
        nome_treino: `${ficha.nome_treino} (Cópia)`,
        descricao: ficha.descricao,
        aluno_id: alunoSelecionadoId,
        personal_id: ficha.personal_id
      });

      if (error) throw error;
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Erro ao duplicar:", err.message);
    }
  };

  const excluirFicha = async () => {
    if (!confirm("Tem certeza que deseja excluir esta ficha? Esta ação é irreversível.")) return;
    setLoading(true);
    const { error } = await supabase.from('fichas').delete().eq('id', treinoId);
    if (error) {
      setLoading(false);
    } else {
      router.push(`/dashboard/aluno/${id}`);
    }
  };

  const renderizarExercicios = () => {
    if (!ficha?.descricao) return <p className="text-gray-400 p-8 text-center">Nenhum exercício registrado.</p>;

    try {
      const exercicios = typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao;

      return exercicios.map((ex: any, index: number) => (
        <div key={index} className="mb-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-lg tracking-tight">{ex.nome}</h3>
            {ex.video && (
              <a href={ex.video} target="_blank" className="text-[10px] font-bold uppercase tracking-widest bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-all">
                Assistir Vídeo
              </a>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
            <span>Reps</span>
            <span>Carga</span>
            <span>Planej.</span>
            <span>Desc.</span>
          </div>

          <div className="divide-y divide-gray-100">
            {ex.series?.map((s: any, sIndex: number) => (
              <div key={sIndex} className="grid grid-cols-4 gap-4 p-6 text-sm">
                <span className="font-semibold text-gray-900">{s.reps || '-'}</span>
                <span className="font-semibold text-gray-900">{s.carga || '0'} kg</span>
                <span className="text-gray-500">{s.CargaPlanejada || '0'} kg</span>
                <span className="text-blue-600 font-semibold">{s.intervalo || '0'}s</span>
              </div>
            ))}
          </div>
        </div>
      ));
    } catch (e) {
      return <p className="text-red-500 p-8 text-center font-bold">Erro ao processar dados da ficha.</p>;
    }
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando...</main>;
  if (errorMsg) return <main className="p-10 text-center text-red-500 font-bold">Erro: {errorMsg}</main>;

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <ModalSelecaoAlunos 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSelect={duplicarTreino} 
        />

        <div className="flex justify-between items-center mb-10">
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">← Voltar</button>
          
          {isPersonal && (
            <div className="flex gap-2">
              <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all active:scale-[0.98]">Duplicar</button>
              <button onClick={excluirFicha} className="px-5 py-2.5 text-red-600 bg-red-50 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all active:scale-[0.98]">Excluir</button>
              <a href={`/dashboard/aluno/${id}/editar-ficha/${treinoId}`} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-black transition-all active:scale-[0.98]">Editar</a>
            </div>
          )}
        </div>

        <header className="mb-12">
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter mb-2">{ficha?.nome_treino || "Treino"}</h1>
           <p className="text-gray-500 font-medium">Detalhes e execução da série.</p>
        </header>

        {renderizarExercicios()}
      </div>
    </main>
  );
}