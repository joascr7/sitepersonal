'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { FaCalendarCheck, FaDumbbell, FaMedal } from 'react-icons/fa';

export default function DashboardPerformance({ alunoId }: { alunoId: string }) {
  const [dados, setDados] = useState<any>({ frequencia: [], prs: [], totalTreinos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }

    async function carregarDados() {
      setLoading(true);
      try {
        // 1. Buscamos a lista real de treinos concluídos
        const { data: treinos, error: treinosError } = await supabase
          .from('conclusoes_treino')
          .select('id') // Selecionamos apenas o id para ser rápido
          .eq('aluno_id', alunoId.trim());

        // 2. Buscamos registros de séries
        const { data: registros, error: regError } = await supabase
          .from('registro_series')
          .select('exercicio_nome, carga')
          .eq('aluno_id', alunoId.trim());

        if (treinosError || regError) throw new Error("Erro ao buscar dados");

        // 3. Processamento de dados
        const prMap = (registros || []).reduce((acc: any, curr) => {
          const carga = Number(curr.carga) || 0;
          if (!acc[curr.exercicio_nome] || carga > acc[curr.exercicio_nome]) acc[curr.exercicio_nome] = carga;
          return acc;
        }, {});

        setDados({
          frequencia: (registros || []).reduce((acc: any, curr) => {
            acc[curr.exercicio_nome] = (acc[curr.exercicio_nome] || 0) + 1;
            return acc;
          }, {}),
          prs: Object.entries(prMap)
            .map(([name, val]) => ({ name, val }))
            .sort((a: any, b: any) => b.val - a.val)
            .slice(0, 4),
          // AQUI: Usamos o length do array real retornado
          totalTreinos: treinos ? treinos.length : 0
        });
      } catch (err) { 
        console.error("Erro no Dashboard:", err); 
      } finally { 
        setLoading(false); 
      }
    }
    carregarDados();
  }, [alunoId]);

  if (loading) return <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">Analisando sua performance...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Treinos Realizados" value={dados.totalTreinos.toString()} unit="sessões" icon={<FaCalendarCheck className="text-emerald-500" />} />
        <MetricCard title="Variedade" value={Object.keys(dados.frequencia).length.toString()} unit="exercícios" icon={<FaDumbbell className="text-blue-500" />} />
        <MetricCard title="Recordes Batidos" value={dados.prs.length.toString()} unit="vitórias" icon={<FaMedal className="text-amber-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Exercícios que você mais faz</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(dados.frequencia).map(([name, val]) => ({ name, val })).sort((a:any, b:any) => b.val - a.val).slice(0, 5)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
  dataKey="name" 
  axisLine={false} 
  tickLine={false} 
  tick={{ fontSize: 9, fill: '#64748b' }} 
  interval={0} 
  angle={-45}        // Rotaciona o texto em 45 graus
  textAnchor="end"   // Alinha o texto para não cortar
  height={60}        // Dá altura extra para o texto rotacionado
  tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 7)}...` : value} // Trunca nomes longos
/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', radius: 12 }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0 && payload[0]?.value !== undefined) {
                      return (
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-2xl">
                          {payload[0].value} séries
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Bar dataKey="val" radius={[6, 6, 6, 6]} barSize={40}>
                  {Object.entries(dados.frequencia).map((_: any, index: number) => (
                    <Cell key={index} fill={index === 0 ? '#0f172a' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-between">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Suas Melhores Marcas</h2>
          <div className="space-y-6">
            {dados.prs.length > 0 ? dados.prs.map((pr: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                <span className="text-sm font-semibold text-slate-300">{pr.name}</span>
                <span className="text-sm font-black text-white">{pr.val}kg</span>
              </div>
            )) : <p className="text-xs text-slate-500">Continue treinando para registrar seu primeiro recorde.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 hover:border-slate-200 transition-colors shadow-sm">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-lg font-black text-slate-950">{value} <span className="text-[10px] text-slate-400 font-medium">{unit}</span></p>
      </div>
    </div>
  );
}