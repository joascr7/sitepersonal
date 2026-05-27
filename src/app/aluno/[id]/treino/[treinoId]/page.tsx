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
    if (!ficha?.descricao) return <p className="text-gray-500 text-center p-10">Treino vazio.</p>;

    try {
      const exercicios = typeof ficha.descricao === 'string' ? JSON.parse(ficha.descricao) : ficha.descricao;

      // Garantir que exercicios seja um array
      if (!Array.isArray(exercicios)) return <p className="text-red-500">Formato inválido.</p>;

      return exercicios.map((ex: any, index: number) => (
        <div key={index} className="mb-8 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6">{ex.nome}</h3>
          
          {ex.video && (
            <div className="aspect-video w-full mb-6 rounded-2xl overflow-hidden bg-black">
              <iframe 
                className="w-full h-full"
                src={ex.video
                  .replace("youtu.be/", "youtube.com/embed/")
                  .replace("watch?v=", "embed/")
                  .replace("shorts/", "embed/")
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          )}

          {/* Tabela de Séries com fallback para caso 'series' não exista */}
          <table className="w-full text-sm text-center">
            <thead className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
              <tr>
                <th className="pb-3">Séries</th>
                <th className="pb-3">Carga</th>
                <th className="pb-3">Intervalo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(ex.series || []).map((s: any, sIndex: number) => (
                <tr key={sIndex}>
                  <td className="py-4 font-bold text-gray-900">{s.reps || '-'}</td>
                  <td className="py-4 text-gray-600">{s.carga || '0'} kg</td>
                  <td className="py-4 text-gray-500">{s.intervalo || '0'} seg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ));
    } catch (e) {
      return <p className="text-red-500 p-4 text-center">Erro ao processar dados do treino.</p>;
    }
  };

  if (loading) return <main className="p-10 text-center text-gray-500">Carregando...</main>;
  if (errorMsg) return <main className="p-10 text-center text-red-500">Erro: {errorMsg}</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-10 bg-gray-50 min-h-screen">
      <ModalSelecaoAlunos isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={() => {}} />

      <div className="flex justify-between items-center mb-10">
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-400 hover:text-gray-900 transition">← Voltar</button>
        {isPersonal && (
          <div className="flex gap-3">
            <button onClick={() => setIsModalOpen(true)} className="bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98]">Duplicar</button>
            <a href={`/dashboard/aluno/${id}/editar-ficha/${treinoId}`} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all active:scale-[0.98]">Editar</a>
          </div>
        )}
      </div>

      <h1 className="text-4xl font-black text-gray-900 mb-10 tracking-tighter">{ficha?.nome_treino || "Treino"}</h1>
      {renderizarExercicios()}
    </main>
  );
}