'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { FaCalendarCheck, FaDumbbell, FaMedal } from 'react-icons/fa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    loading: 'Analisando sua performance...',
    workouts: 'Treinos Realizados',
    sessions: 'sessões',
    variety: 'Variedade',
    exercises: 'exercícios',
    records: 'Recordes Batidos',
    wins: 'vitórias',
    mostDone: 'Exercícios que você mais faz',
    series: 'séries',
    bestMarks: 'Suas Melhores Marcas',
    keepTraining: 'Continue treinando para registrar seu primeiro recorde.'
  },
  'pt-PT': {
    loading: 'A analisar a sua performance...',
    workouts: 'Treinos Realizados',
    sessions: 'sessões',
    variety: 'Variedade',
    exercises: 'exercícios',
    records: 'Recordes Batidos',
    wins: 'vitórias',
    mostDone: 'Exercícios que mais faz',
    series: 'séries',
    bestMarks: 'As Suas Melhores Marcas',
    keepTraining: 'Continue a treinar para registar o seu primeiro recorde.'
  },
  'en': {
    loading: 'Analyzing your performance...',
    workouts: 'Completed Workouts',
    sessions: 'sessions',
    variety: 'Variety',
    exercises: 'exercises',
    records: 'Records Broken',
    wins: 'wins',
    mostDone: 'Your most performed exercises',
    series: 'sets',
    bestMarks: 'Your Personal Bests',
    keepTraining: 'Keep training to log your first record.'
  }
};

export default function DashboardPerformance({ alunoId }: { alunoId: string }) {
  const [dados, setDados] = useState<any>({ frequencia: [], prs: [], totalTreinos: 0 });
  const [loading, setLoading] = useState(true);

  // Estados de Tema e i18n
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const t = translations[lang];

  useEffect(() => {
    if (!alunoId) { setLoading(false); return; }

    async function carregarDados() {
      setLoading(true);
      try {
        const { data: treinos, error: treinosError } = await supabase
          .from('conclusoes_treino')
          .select('id')
          .eq('aluno_id', alunoId.trim());

        const { data: registros, error: regError } = await supabase
          .from('registro_series')
          .select('exercicio_nome, carga')
          .eq('aluno_id', alunoId.trim());

        if (treinosError || regError) throw new Error("Erro ao buscar dados");

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

  if (!mounted) return null;

  if (loading) return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-[var(--surface)] rounded-[2rem] border border-[var(--border)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)]" />
        <div className="h-80 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)]" />
      </div>
    </div>
  );

  return (
    // Transformado de 'main' para 'div' pois este é um componente injetado na página
    <div className="w-full flex flex-col gap-6">
      
      {/* ━━━━━━━━━━ CARDS DE MÉTRICAS ━━━━━━━━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title={t.workouts} value={dados.totalTreinos.toString()} unit={t.sessions} icon={<FaCalendarCheck size={18} />} />
        <MetricCard title={t.variety} value={Object.keys(dados.frequencia).length.toString()} unit={t.exercises} icon={<FaDumbbell size={18} />} />
        <MetricCard title={t.records} value={dados.prs.length.toString()} unit={t.wins} icon={<FaMedal size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ━━━━━━━━━━ GRÁFICO DE FREQUÊNCIA ━━━━━━━━━━ */}
        <div className="lg:col-span-2 bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-6 bg-[var(--primary)] rounded-full" />
            <h2 className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{t.mostDone}</h2>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={Object.entries(dados.frequencia).map(([name, val]) => ({ name, val })).sort((a:any, b:any) => b.val - a.val).slice(0, 5)} 
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'var(--text-secondary)', fontWeight: 700 }} 
                  interval={0} 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  tickFormatter={(v) => v.length > 8 ? `${v.substring(0, 7)}...` : v} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'var(--surface-sec)', opacity: 0.5, radius: 12 }} 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-sec)', 
                    borderRadius: '1rem', 
                    border: '1px solid var(--border)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 900 }}
                  content={({ active, payload }) => active && payload ? (
                    <div className="bg-[var(--surface-sec)] border border-[var(--border)] px-4 py-3 rounded-[1rem] shadow-xl flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{payload[0].payload.name}</span>
                      <span className="text-sm font-black text-[var(--primary)]">{payload[0].value} <span className="text-[10px] text-[var(--text-primary)]">{t.series}</span></span>
                    </div>
                  ) : null} 
                />
                <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={36}>
                  {Object.entries(dados.frequencia).map((_: any, i: number) => (
                    <Cell 
                      key={i} 
                      fill={i === 0 ? 'var(--primary)' : 'var(--surface-sec)'} 
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* ━━━━━━━━━━ MELHORES MARCAS (PRs) ━━━━━━━━━━ */}
        <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-6 bg-[var(--primary-soft)] rounded-full" />
            <h2 className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{t.bestMarks}</h2>
          </div>
          
          <div className="space-y-3 flex-1">
            {dados.prs.length > 0 ? dados.prs.map((pr: any, i: number) => (
              <div 
                key={i} 
                className="flex justify-between items-center bg-[var(--bg)] p-4 rounded-[1.2rem] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-sec)] text-[9px] font-black text-[var(--text-secondary)] group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-colors">
                    {i + 1}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{pr.name}</span>
                </div>
                <span className="text-sm font-black text-[var(--primary)]">
                  {pr.val}<span className="text-[9px] text-[var(--text-secondary)] ml-1">kg</span>
                </span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-[var(--border)] rounded-[1.5rem] bg-[var(--surface-sec)]/50">
                <FaMedal className="text-3xl text-[var(--text-secondary)]/30 mb-4" />
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest leading-relaxed">
                  {t.keepTraining}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENTES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MetricCard({ title, value, unit, icon }: any) {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-[2rem] border border-[var(--border)] flex items-center gap-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group overflow-hidden relative">
      {/* Detalhe de Fundo Premium */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[var(--primary)]/10" />
      
      <div className="p-4 bg-[var(--surface-sec)] text-[var(--primary)] rounded-2xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="relative z-10 flex flex-col justify-center">
        <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-none tracking-tight flex items-baseline gap-1.5">
          {value} <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{unit}</span>
        </p>
      </div>
    </div>
  );
}
  
