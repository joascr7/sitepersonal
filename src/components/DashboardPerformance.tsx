'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  FaUserShield, FaSync, FaChartLine, FaCog, FaPowerOff, 
  FaMoon, FaSun, FaGlobe, FaCheckCircle, FaExclamationCircle 
} from 'react-icons/fa';
// AQUI ESTÁ A CORREÇÃO: Adicionados CartesianGrid, XAxis e YAxis
import { AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from 'recharts';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DICIONÁRIO DE INTERNACIONALIZAÇÃO (i18n)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const translations = {
  'pt-BR': {
    loading: 'CARREGANDO...',
    admin: 'AURA-ADMIN',
    tabManagement: 'Gestão',
    tabFinancial: 'Financeiro',
    configTitle: 'Configurações',
    placeholderToken: 'Token MP',
    placeholderValue: 'Valor da Assinatura',
    btnSaveConfig: 'Salvar Configurações',
    saving: 'Processando...',
    tableTrainer: 'Personal',
    tableAccess: 'Acesso',
    tableStatus: 'Status',
    tableAction: 'Ação',
    tableDate: 'Data',
    tableValue: 'Valor',
    btnRelease: 'LIBERAR',
    metricsTitle: 'Métricas de Gestão',
    metricsActive: 'Ativos',
    metricsTotal: 'Total Base',
    chartTitle: 'Performance Financeira',
    successSave: 'Configurações salvas com sucesso!',
    successRelease: 'Assinatura liberada com sucesso!',
    successStatus: 'Status atualizado!',
    errorGeneral: 'Erro na operação: '
  },
  'pt-PT': {
    loading: 'A CARREGAR...',
    admin: 'AURA-ADMIN',
    tabManagement: 'Gestão',
    tabFinancial: 'Financeiro',
    configTitle: 'Configurações',
    placeholderToken: 'Token MP',
    placeholderValue: 'Valor da Assinatura',
    btnSaveConfig: 'Guardar Configurações',
    saving: 'A processar...',
    tableTrainer: 'Personal',
    tableAccess: 'Acesso',
    tableStatus: 'Status',
    tableAction: 'Ação',
    tableDate: 'Data',
    tableValue: 'Valor',
    btnRelease: 'LIBERTAR',
    metricsTitle: 'Métricas de Gestão',
    metricsActive: 'Ativos',
    metricsTotal: 'Total Base',
    chartTitle: 'Performance Financeira',
    successSave: 'Configurações guardadas com sucesso!',
    successRelease: 'Assinatura libertada com sucesso!',
    successStatus: 'Status atualizado!',
    errorGeneral: 'Erro na operação: '
  },
  'en': {
    loading: 'LOADING...',
    admin: 'AURA-ADMIN',
    tabManagement: 'Management',
    tabFinancial: 'Financial',
    configTitle: 'Settings',
    placeholderToken: 'MP Token',
    placeholderValue: 'Subscription Value',
    btnSaveConfig: 'Save Settings',
    saving: 'Processing...',
    tableTrainer: 'Trainer',
    tableAccess: 'Access',
    tableStatus: 'Status',
    tableAction: 'Action',
    tableDate: 'Date',
    tableValue: 'Amount',
    btnRelease: 'RELEASE',
    metricsTitle: 'Management Metrics',
    metricsActive: 'Active',
    metricsTotal: 'Total Base',
    chartTitle: 'Financial Performance',
    successSave: 'Settings saved successfully!',
    successRelease: 'Subscription released successfully!',
    successStatus: 'Status updated!',
    errorGeneral: 'Operation error: '
  }
};

function PainelConteudo() {
  const searchParams = useSearchParams();
  const aba = searchParams.get('aba') || 'gestao';

  const [personais, setPersonais] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ token: '', valorPadrao: 22.90 });

  // Estados de Tema, i18n e Notificações
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'pt-BR' | 'pt-PT' | 'en'>('pt-BR');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchDados();
    
    const savedTheme = localStorage.getItem('@premium_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');
    
    const savedLang = localStorage.getItem('@premium_lang') as 'pt-BR' | 'pt-PT' | 'en';
    if (savedLang) setLang(savedLang);
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('@premium_theme', newTheme ? 'dark' : 'light');
    window.dispatchEvent(new Event('storage'));
  };

  const toggleLang = () => {
    const langs: ('pt-BR' | 'pt-PT' | 'en')[] = ['pt-BR', 'pt-PT', 'en'];
    const nextLang = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(nextLang);
    localStorage.setItem('@premium_lang', nextLang);
  };

  const showToast = (message: string, type: 'error' | 'success' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const t = translations[lang] || translations['pt-BR'];

  // Configuração das Variáveis CSS Globais (Design System)
  const themeStyles = isDark ? {
    '--bg': '#0F1115',
    '--surface': '#151A22',
    '--surface-sec': '#1B2330',
    '--primary': '#3B82F6',
    '--primary-soft': '#60A5FA',
    '--danger': '#EF4444',
    '--success': '#22C55E',
    '--text-primary': '#F8FAFC',
    '--text-secondary': '#94A3B8',
    '--border': 'rgba(255,255,255,0.05)',
  } as React.CSSProperties : {
    '--bg': '#F3F6FB',
    '--surface': '#FFFFFF',
    '--surface-sec': '#E8EEF9',
    '--primary': '#2563EB',
    '--primary-soft': '#60A5FA',
    '--danger': '#DC2626',
    '--success': '#16A34A',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--border': 'rgba(15,23,42,0.06)',
  } as React.CSSProperties;

  const fetchDados = async () => {
    setLoading(true);
    const [pRes, fRes, cRes] = await Promise.all([
      supabase.from('personais').select('*'),
      supabase.from('financeiro').select('*, personais(nome)').order('data_pagamento', { ascending: false }),
      supabase.from('configuracoes_pagamento').select('*').limit(1).maybeSingle()
    ]);

    setPersonais(pRes.data || []);
    setPagamentos(fRes.data || []);
    if (cRes.data) {
      setConfig({ token: cRes.data.mp_access_token || '', valorPadrao: cRes.data.valor_padrao || 22.90 });
    }
    setLoading(false);
  };

  const salvarConfiguracoes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('configuracoes_pagamento').upsert({ 
        id: '00000000-0000-0000-0000-000000000000', 
        mp_access_token: config.token, 
        valor_padrao: config.valorPadrao,
        data_atualizacao: new Date().toISOString()
      });
      if (error) throw error;
      showToast(t.successSave, 'success');
    } catch (err: any) { 
      showToast(t.errorGeneral + err.message, 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const liberarAssinaturaManual = async (personalId: string) => {
    setSaving(true);
    const { error } = await supabase.from('financeiro').insert([{ 
      personal_id: personalId, 
      valor: config.valorPadrao, 
      data_pagamento: new Date().toISOString() 
    }]);

    if (!error) {
      await supabase.from('personais').update({ 
        status_pagamento: 'ativo',
        vencimento_plano: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
      }).eq('id', personalId);
      await fetchDados();
      showToast(t.successRelease, 'success');
    } else {
      showToast(t.errorGeneral + error.message, 'error');
    }
    setSaving(false);
  };

  const toggleStatus = async (personalId: string, statusAtual: boolean) => {
    setSaving(true);
    const { error } = await supabase.from('personais').update({ ativo: !statusAtual }).eq('id', personalId);
    if (!error) {
      await fetchDados();
      showToast(t.successStatus, 'success');
    } else {
      showToast(t.errorGeneral + error.message, 'error');
    }
    setSaving(false);
  };

  if (loading || !mounted) return (
    <main className="min-h-screen bg-[#0F1115] flex items-center justify-center text-[#3B82F6] font-black tracking-widest text-sm uppercase animate-pulse">
      {mounted ? t.loading : 'CARREGANDO...'}
    </main>
  );

  return (
    <main style={themeStyles} className="min-h-screen bg-[var(--bg)] p-6 md:p-12 text-[var(--text-primary)] transition-colors duration-500 font-sans antialiased md:ml-64">
      
      {/* ━━━━━━━━━━ NOTIFICAÇÃO PREMIUM FLOATING ━━━━━━━━━━ */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`bg-[var(--surface-sec)] border shadow-2xl rounded-[1.2rem] px-5 py-4 flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'border-[var(--danger)]/30' : 'border-[var(--success)]/30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'error' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-[var(--success)]/10 text-[var(--success)]'}`}>
              {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pb-20">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-3">
            <FaUserShield className="text-[var(--primary)]" /> {t.admin}
          </h1>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex bg-[var(--surface)] rounded-full p-1 border border-[var(--border)] w-full md:w-auto shadow-sm">
              <a href="?aba=gestao" className={`flex-1 md:flex-none text-center px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'gestao' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {t.tabManagement}
              </a>
              <a href="?aba=financeiro" className={`flex-1 md:flex-none text-center px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'financeiro' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {t.tabFinancial}
              </a>
            </div>
          </div>
        </header>

        {aba === 'gestao' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-8">
              
              {/* CONFIGURAÇÕES */}
              <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
                <h2 className="flex items-center gap-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-8">
                  <FaCog/> {t.configTitle}
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">{t.placeholderToken}</label>
                    <input 
                      type="password" 
                      value={config.token} 
                      onChange={(e) => setConfig({...config, token: e.target.value})} 
                      className="w-full p-4 bg-[var(--surface-sec)] rounded-[1.2rem] border border-[var(--border)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">{t.placeholderValue}</label>
                    <input 
                      type="number" 
                      value={config.valorPadrao} 
                      onChange={(e) => setConfig({...config, valorPadrao: Number(e.target.value)})} 
                      className="w-full p-4 bg-[var(--surface-sec)] rounded-[1.2rem] border border-[var(--border)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-inner" 
                    />
                  </div>
                </div>
                <button 
                  onClick={salvarConfiguracoes} 
                  disabled={saving}
                  className={`mt-6 w-full py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] ${
                    saving ? 'bg-[var(--surface-sec)] text-[var(--text-secondary)] border border-[var(--border)]' : 'bg-[var(--primary)] text-white hover:bg-blue-600 shadow-[0_10px_30px_-10px_var(--primary)]'
                  }`}
                >
                  {saving ? t.saving : t.btnSaveConfig}
                </button>
              </div>

              {/* TABELA DE GESTÃO */}
              <div className="bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-[var(--surface-sec)]/50 text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-[0.2em]">
                    <tr>
                      <th className="p-6 pl-8">{t.tableTrainer}</th>
                      <th className="p-6">{t.tableAccess}</th>
                      <th className="p-6">{t.tableStatus}</th>
                      <th className="p-6 pr-8 text-right">{t.tableAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {personais.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--surface-sec)] transition-colors">
                        <td className="p-6 pl-8 font-bold text-[var(--text-primary)] text-sm">{p.nome}</td>
                        <td className="p-6">
                          <button 
                            onClick={() => toggleStatus(p.id, p.ativo)} 
                            disabled={saving}
                            className={`flex items-center gap-1.5 text-[10px] font-black uppercase transition-all hover:scale-105 disabled:opacity-50 ${p.ativo ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}
                          >
                            <FaPowerOff /> {p.ativo ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td className="p-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                          <span className={`px-2 py-1 rounded-md ${p.status_pagamento === 'ativo' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'}`}>
                            {p.status_pagamento}
                          </span>
                        </td>
                        <td className="p-6 pr-8 text-right">
                          <button 
                            onClick={() => liberarAssinaturaManual(p.id)} 
                            disabled={saving}
                            className="bg-[var(--surface-sec)] border border-[var(--border)] px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--primary)] hover:text-white transition-all hover:border-[var(--primary)] active:scale-95 disabled:opacity-50"
                          >
                            <FaSync className="inline mr-2"/> {t.btnRelease}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div className="bg-[var(--surface)] p-8 rounded-[2.5rem] border border-[var(--border)] h-fit shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-all group-hover:bg-[var(--primary)]/20" />
               <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-8 relative z-10">{t.metricsTitle}</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                    <span className="text-sm font-bold text-[var(--text-secondary)]">{t.metricsActive}</span>
                    <span className="font-black text-3xl text-[var(--primary)]">{personais.filter(p => p.status_pagamento === 'ativo').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[var(--text-secondary)]">{t.metricsTotal}</span>
                    <span className="font-black text-3xl text-[var(--text-primary)]">{personais.length}</span>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* GRÁFICO */}
            <div className="bg-[var(--surface)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border)] h-96 shadow-sm">
              <h2 className="font-black flex items-center gap-2 mb-8 text-[var(--text-secondary)] text-[10px] uppercase tracking-widest">
                <FaChartLine/> {t.chartTitle}
              </h2>
              <div className="w-full h-[calc(100%-3rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pagamentos.slice(0, 15).reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="data_pagamento" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-sec)', border: '1px solid var(--border)', borderRadius: '1rem', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#3B82F6' }}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#3B82F6" strokeWidth={3} fill="url(#colorValor)" activeDot={{ r: 6, fill: '#3B82F6', stroke: 'var(--surface)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABELA FINANCEIRA */}
            <div className="bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden shadow-sm overflow-x-auto">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-[var(--surface-sec)]/50 text-[9px] uppercase font-black text-[var(--text-secondary)] tracking-[0.2em]">
                    <tr>
                      <th className="p-6 pl-8">{t.tableTrainer}</th>
                      <th className="p-6">{t.tableDate}</th>
                      <th className="p-6 pr-8 text-right">{t.tableValue}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {pagamentos.map(p => (
                      <tr key={p.id} className="hover:bg-[var(--surface-sec)] transition-colors">
                        <td className="p-6 pl-8 font-bold text-[var(--text-primary)] text-sm">{p.personais?.nome}</td>
                        <td className="p-6 text-xs font-medium text-[var(--text-secondary)]">{new Date(p.data_pagamento).toLocaleDateString()}</td>
                        <td className="p-6 pr-8 text-right font-black text-[var(--primary)] text-sm">R$ {Number(p.valor).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminFinanceiro() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0F1115] flex items-center justify-center text-[#3B82F6] font-black tracking-widest text-sm uppercase animate-pulse">
        CARREGANDO...
      </main>
    }>
      <PainelConteudo />
    </Suspense>
  );
}