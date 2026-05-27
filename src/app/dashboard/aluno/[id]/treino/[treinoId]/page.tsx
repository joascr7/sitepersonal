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
        const estaNoDashboard = window.location.pathname.includes('/dashboard');
        setIsPersonal(ehDono && estaNoDashboard);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [treinoId]);

  const renderizarExercicios = () => {
    if (!ficha?.descricao) return <p className="text-gray-500 p-8 text-center">Treino vazio.</p>;

    try {
      const exercicios = typeof ficha.descricao === 'string' 
        ? JSON.parse(ficha.descricao) 
        : ficha.descricao;

      return exercicios.map((ex: any, index: number) => (
        <div key={index} className="mb-8 bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-gray-900 text-white p-6 font-black tracking-tight flex justify-between items-center">
            {ex.nome}
            {ex.video && (
              <a href={ex.video} target="_blank" className="text-[10px] uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition">
                Ver Vídeo
              </a>
            )}
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
              <tr>
                <th className="p-4 border-b">Série/Rep</th>
                <th className="p-4 border-b">Carga</th>
                <th className="p-4 border-b">Intervalo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ex.series?.map((s: any, sIndex: number) => (
                <tr key={sIndex}>
                  <td className="p-4 font-bold text-gray-900">{s.reps}</td>
                  <td className="p-4 font-bold text-gray-900">{s.carga} kg</td>
                  <td className="p-4 text-gray-500">{s.intervalo} seg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ));
    } catch (e) {
      return <p className="text-red-500 p-8 text-center font-bold">Erro ao processar estrutura da ficha.</p>;
    }
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando...</main>;
  if (errorMsg) return <main className="p-10 text-center text-red-500 font-bold">Erro: {errorMsg}</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <ModalSelecaoAlunos isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={() => {}} />

        <div className="flex justify-between items-center mb-10">
          <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition">← Voltar</button>
          {isPersonal && (
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(true)} className="bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98]">Duplicar</button>
              <a href={`/dashboard/aluno/${id}/editar-ficha/${treinoId}`} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-[0.98]">Editar</a>
            </div>
          )}
        </div>

        <h1 className="text-4xl font-black text-gray-900 mb-10 tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
        {renderizarExercicios()}
      </div>
    </main>
  );
}