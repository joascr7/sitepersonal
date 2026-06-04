'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, subMonths, startOfWeek } from 'date-fns';
import { 
  FaArrowLeft, FaChartLine, FaGlobe, FaMoon, FaSun, 
  FaFilePdf, FaCheckCircle, FaSpinner 
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON SCREEN (UX PREMIUM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ProgressoSkeleton = () => (
  <div className="max-w-7xl mx-auto px-5 py-10 space-y-8 animate-pulse pt-24">
    <div className="flex items-center justify-between bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)]">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-sec)]" />
        <div className="space-y-2"><div className="w-40 h-6 bg-[var(--surface-sec)] rounded-lg" /><div className="w-24 h-4 bg-[var(--surface-sec)] rounded-lg" /></div>
      </div>
      <div className="w-20 h-8 bg-[var(--surface-sec)] rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="grid grid-cols-2 gap-6 md:col-span-2">
        <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-32 border border-[var(--border)]" />
        <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-32 border border-[var(--border)]" />
      </div>
      <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-32 border border-[var(--border)] md:col-span-2" />
    </div>
    <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] h-80 border border-[var(--border)]" />
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    back: 'Voltar', title: 'Dashboard de Performance', exportPdf: 'Exportar PDF',
    noObj: 'Sem objetivo', pr: 'Carga Máxima (PR)', totalSeries: 'Séries Totais',
    analysis: 'Análise de Exercício', week: 'semana', month: 'mes', 
    chartTitle: 'Evolução de Carga (kg)', generating: 'Gerando PDF...', successPdf: 'PDF gerado com sucesso!'
  },
  'pt-PT': {
    back: 'Voltar', title: 'Dashboard de Performance', exportPdf: 'Exportar PDF',
    noObj: 'Sem objetivo', pr: 'Carga Máxima (PR)', totalSeries: 'Séries Totais',
    analysis: 'Análise de Exercício', week: 'semana', month: 'mes', 
    chartTitle: 'Evolução de Carga (kg)', generating: 'A gerar PDF...', successPdf: 'PDF gerado com sucesso!'
  },
  'en': {
    back: 'Back', title: 'Performance Dashboard', exportPdf: 'Export PDF',
    noObj: 'No objective', pr: 'Max Load (PR)', totalSeries: 'Total Sets',
    analysis: 'Exercise Analysis', week: 'week', month: 'month', 
    chartTitle: 'Load Evolution (kg)', generating: 'Generating PDF...', successPdf: 'PDF generated successfully!'
  }
};

export default function ProgressoPersonalCompleto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [aluno, setAluno] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ exercicio: '', periodo: 'mes' });
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'info', text: string } | null>(null);

  // Estados UI Premium
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('@premium_theme');
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedTheme) setIsDark(savedTheme === 'dark');
    if (savedLang) setLang(savedLang);
    setMounted(true);
  }, []);

  const toggleTheme = () => { const newTheme = !isDark; setIsDark(newTheme); localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light'); window.dispatchEvent(new Event('storage')); };
  const toggleLang = () => { const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en']; const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length]; setLang(nextLang); localStorage.setItem('@premium_lang', nextLang); };
  
  const t = translations[lang] || translations['pt-BR'];
  const showToast = (type: 'success' | 'info', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  // Configuração Dinâmica do Tema Premium
  const themeStyles = isDark ? {
    '--bg': '#0F1115', '--surface': '#151A22', '--surface-sec': '#1B2330', '--primary': '#3B82F6', '--danger': '#EF4444', '--success': '#22C55E', '--text-primary': '#F8FAFC', '--text-secondary': '#94A3B8', '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB', '--surface': '#FFFFFF', '--surface-sec': '#E8EEF9', '--primary': '#2563EB', '--danger': '#DC2626', '--success': '#16A34A', '--text-primary': '#111827', '--text-secondary': '#6B7280', '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  useEffect(() => {
    async function carregarTudo() {
      setLoading(true);
      const [alunoRes, seriesRes] = await Promise.all([
        supabase.from('alunos').select('*').eq('id', id).single(),
        supabase.from('registro_series')
          .select('*')
          .eq('aluno_id', id)
          .order('data_execucao', { ascending: false })
      ]);

      if (alunoRes.data) setAluno(alunoRes.data);
      if (seriesRes.data) {
        setHistorico(seriesRes.data);
        const unicos = Array.from(new Set(seriesRes.data.map((h: any) => h.exercicio_nome)));
        if (unicos.length > 0) {
          setFiltro(prev => ({ ...prev, exercicio: prev.exercicio || (unicos[0] as string) }));
        }
      }
      setLoading(false);
    }
    carregarTudo();
  }, [id]);

  const dadosFiltrados = useMemo(() => {
    // Usando as strings hardcoded originais ou traduzidas mapeadas
    const limite = (filtro.periodo === 'semana' || filtro.periodo === 'week') ? startOfWeek(new Date()) : subMonths(new Date(), 1);
    return historico.filter(h => 
      h.exercicio_nome?.trim().toLowerCase() === filtro.exercicio?.trim().toLowerCase() && 
      new Date(h.data_execucao) >= limite
    );
  }, [historico, filtro]);

  const cargaMaxima = useMemo(() => {
    const cargas = dadosFiltrados.map(d => Number(d.carga)).filter(c => !isNaN(c));
    return cargas.length > 0 ? Math.max(...cargas) : 0;
  }, [dadosFiltrados]);

  const exportarPDF = () => {
    setIsExporting(true);
    showToast('info', t.generating);
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Performance: ${aluno?.nome || 'Aluno'}`, 14, 15);
      autoTable(doc, { 
        startY: 25, 
        head: [['Data', 'Exercicio', 'Carga', 'Reps']], 
        body: historico.map(h => [format(parseISO(h.data_execucao), 'dd/MM/yyyy'), h.exercicio_nome, `${h.carga}kg`, h.repeticoes]) 
      });
      doc.save(`Performance_${aluno?.nome || 'aluno'}.pdf`);
      setIsExporting(false);
      showToast('success', t.successPdf);
    }, 500); // Timeout leve apenas para a renderização do Toast
  };

  if (!mounted) return <main className="min-h-screen bg-[#0F1115]" />;

  return (
    <main style={themeStyles} className="w-full min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)] pb-[calc(env(safe-area-inset-bottom)+8rem)] transition-colors duration-500 font-sans relative">
      
      {/* Toast Flutuante Premium */}
      {toast && (
        <div className={`fixed top-[max(env(safe-area-inset-top,24px),24px)] left-1/2 -translate-x-1/2 px-6 py-4 rounded-[1.2rem] shadow-2xl z-[500] flex items-center gap-3 backdrop-blur-md border animate-in slide-in-from-top-4 fade-in ${toast.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'}`}>
          {toast.type === 'success' ? <FaCheckCircle size={16} /> : <FaSpinner className="animate-spin" size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.text}</span>
        </div>
      )}

      {/* NAVBAR PREMIUM ESTILO APP NATIVO */}
      <nav className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-2xl border-b border-[var(--border)] px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center shadow-sm pt-[max(env(safe-area-inset-top,16px),16px)]">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors active:scale-95">
          <FaArrowLeft size={12} /> <span className="hidden sm:inline">{t.back}</span>
        </button>
        
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] truncate px-2 text-center">
          {t.title}
        </span>
        
        <div className="flex gap-2">
          <button onClick={toggleLang} className="hidden sm:flex w-9 h-9 rounded-full bg-[var(--surface-sec)] border border-[var(--border)] items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 relative">
            <FaGlobe size={12} />
          </button>
          <button onClick={toggleTheme} className="hidden sm:flex w-9 h-9 rounded-full bg-[var(--surface-sec)] border border-[var(--border)] items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95">
            {isDark ? <FaSun size={12} /> : <FaMoon size={12} />}
          </button>
          <button onClick={exportarPDF} disabled={isExporting} className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 sm:px-6 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-md shadow-[var(--primary)]/20 disabled:opacity-50">
            {isExporting ? <FaSpinner className="animate-spin" size={12} /> : <><FaFilePdf size={12} /> <span className="hidden sm:inline">{t.exportPdf}</span></>}
          </button>
        </div>
      </nav>

      {loading ? <ProgressoSkeleton /> : (
        <div className="max-w-7xl mx-auto px-5 py-8 sm:py-10 space-y-8 animate-in fade-in duration-700">
          
          {/* PERFIL HEADER */}
          <header className="flex flex-col sm:flex-row items-center justify-between bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--surface-sec)] shadow-inner">
                <img src={aluno?.avatar_url || '/placeholder.png'} className="w-full h-full object-cover" alt="Avatar"/>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[var(--text-primary)]">{aluno?.nome}</h1>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">{aluno?.objetivo || t.noObj}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${aluno?.status_pagamento === 'ativo' ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20'}`}>
               {aluno?.status_pagamento}
            </span>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:col-span-2">
              <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-[var(--border)] shadow-md flex flex-col justify-center">
                <p className="text-[9px] uppercase font-black text-[var(--text-secondary)] mb-2 tracking-widest">{t.pr}</p>
                <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">{cargaMaxima}<span className="text-xs sm:text-sm text-[var(--text-secondary)] ml-1">kg</span></p>
              </div>
              <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-[var(--border)] shadow-md flex flex-col justify-center">
                <p className="text-[9px] uppercase font-black text-[var(--text-secondary)] mb-2 tracking-widest">{t.totalSeries}</p>
                <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">{historico.length}</p>
              </div>
            </div>

            <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-[var(--border)] shadow-md md:col-span-2 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                <label className="text-[9px] uppercase font-black text-[var(--text-secondary)] block mb-3 tracking-widest">{t.analysis}</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none font-black text-lg sm:text-xl outline-none bg-[var(--surface-sec)] text-[var(--text-primary)] p-4 rounded-[1.2rem] border border-[var(--border)] focus:border-[var(--primary)] transition-colors truncate" 
                    value={filtro.exercicio} 
                    onChange={(e) => setFiltro({...filtro, exercicio: e.target.value})}
                  >
                    {Array.from(new Set(historico.map(h => h.exercicio_nome))).map(ex => 
                      <option key={ex as string} value={ex as string} className="bg-[var(--surface)]">{ex as string}</option>
                    )}
                  </select>
                </div>
              </div>
              
              <div className="flex bg-[var(--surface-sec)] p-1.5 rounded-[1.2rem] w-full md:w-auto border border-[var(--border)]">
                {['semana', 'mes'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setFiltro({...filtro, periodo: p})} 
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filtro.periodo === p ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {p === 'semana' ? t.week : t.month}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* GRÁFICO PREMIUM COM RECHARTS */}
          <section className="bg-[var(--surface)] p-6 sm:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
            <h2 className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase font-black text-[var(--text-secondary)] mb-8 tracking-widest">
              <FaChartLine size={14} className="text-[var(--primary)]" /> {t.chartTitle}
            </h2>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosFiltrados.slice(0, 15).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCarga" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#333' : '#e5e7eb'} />
                  <XAxis dataKey="data_execucao" tickFormatter={(v) => format(parseISO(v), 'dd/MM')} tick={{fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 700}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', color: 'var(--text-primary)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="carga" stroke="#3B82F6" strokeWidth={4} fill="url(#colorCarga)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          
        </div>
      )}
    </main>
  );
}