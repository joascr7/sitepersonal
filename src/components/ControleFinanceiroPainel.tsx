'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaUserShield, FaSave, FaDollarSign, FaKey, FaSync, FaChartLine, FaUserCheck, FaUserTimes, FaCog, FaPowerOff } from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function PainelConteudo() {
  const searchParams = useSearchParams();
  const aba = searchParams.get('aba') || 'gestao';

  const [personais, setPersonais] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ token: '', valorPadrao: 22.90 });
  const [filtroMes, setFiltroMes] = useState(new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }));

  useEffect(() => { fetchDados(); }, []);

  const fetchDados = async () => {
    setLoading(true);
    const [pRes, fRes, cRes] = await Promise.all([
      supabase.from('personais').select('*'),
      supabase.from('financeiro').select('*, personais(nome)').order('data_pagamento', { ascending: false }),
      supabase.from('configuracoes_pagamento').select('*').limit(1).single()
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
    
    alert("✅ Valor e Token salvos com sucesso! O checkout já está lendo o novo valor.");
  } catch (err: any) {
    alert("❌ Erro ao salvar: " + err.message);
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
      alert("Assinatura liberada manualmente!");
      await fetchDados();
    }
    setSaving(false);
  };

  const toggleStatus = async (personalId: string, statusAtual: boolean) => {
    setSaving(true);
    const { error } = await supabase.from('personais').update({ ativo: !statusAtual }).eq('id', personalId);
    if (!error) await fetchDados();
    else alert("Erro ao atualizar status: " + error.message);
    setSaving(false);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center font-black animate-pulse">CARREGANDO DASHBOARD...</main>;

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <FaUserShield className="text-indigo-600" /> Admin AuraFit
          </h1>
          <div className="flex bg-white rounded-full p-1 border shadow-sm">
            <a href="?aba=gestao" className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'gestao' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>Gestão</a>
            <a href="?aba=financeiro" className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'financeiro' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>Financeiro</a>
          </div>
        </header>

        {aba === 'gestao' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                <h2 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8"><FaCog/> Configurações Globais</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <FaKey className="absolute left-4 top-4 text-slate-400" />
                    <input type="password" value={config.token} onChange={(e) => setConfig({...config, token: e.target.value})} className="w-full pl-12 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold" placeholder="Token MP" />
                  </div>
                  <div className="relative">
                    <FaDollarSign className="absolute left-4 top-4 text-slate-400" />
                    <input type="number" value={config.valorPadrao} onChange={(e) => setConfig({...config, valorPadrao: Number(e.target.value)})} className="w-full pl-12 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold" placeholder="Valor da Assinatura" />
                  </div>
                </div>
                <button onClick={salvarConfiguracoes} className="mt-6 w-full bg-slate-950 text-white py-4 rounded-xl font-black text-xs uppercase hover:bg-black transition-all">Salvar Configurações</button>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">
                    <tr><th className="p-6">Personal</th><th className="p-6">Acesso</th><th className="p-6">Recorrência</th><th className="p-6 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {personais.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-bold text-sm text-slate-900">{p.nome}</td>
                        <td className="p-6">
                            <button onClick={() => toggleStatus(p.id, p.ativo)} className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                <FaPowerOff /> {p.ativo ? 'ON' : 'OFF'}
                            </button>
                        </td>
                        <td className="p-6"><span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status_pagamento === 'ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{p.status_pagamento === 'ativo' ? <FaUserCheck/> : <FaUserTimes/>} {p.status_pagamento || 'BLOQUEADO'}</span></td>
                        <td className="p-6 text-right"><button onClick={() => liberarAssinaturaManual(p.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black text-[10px] hover:bg-indigo-700 transition-all"><FaSync className="inline mr-2"/> LIBERAR 30 DIAS</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-xl h-fit">
               <h3 className="text-[10px] font-black uppercase opacity-70 tracking-widest mb-4">Métricas de Gestão</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-indigo-500/30 pb-4"><span>Ativos</span><span className="font-black text-2xl">{personais.filter(p => p.status_pagamento === 'ativo').length}</span></div>
                  <div className="flex justify-between items-center border-b border-indigo-500/30 pb-4"><span>Bloqueados</span><span className="font-black text-2xl">{personais.filter(p => p.status_pagamento !== 'ativo').length}</span></div>
                  <div className="flex justify-between items-center"><span>Total Base</span><span className="font-black text-2xl">{personais.length}</span></div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm h-96">
              <h2 className="font-black flex items-center gap-2 mb-6"><FaChartLine/> Performance Financeira</h2>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pagamentos.slice(0, 15).reverse()}>
                  <defs><linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="data_pagamento" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="valor" stroke="#4f46e5" fillOpacity={1} fill="url(#colorValor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">
                    <tr><th className="p-6">Personal</th><th className="p-6">Data</th><th className="p-6 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagamentos.map(p => (
                      <tr key={p.id}>
                        <td className="p-6 font-bold text-sm">{p.personais?.nome}</td>
                        <td className="p-6 text-xs text-slate-500">{new Date(p.data_pagamento).toLocaleDateString()}</td>
                        <td className="p-6 text-right font-black text-sm">R$ {Number(p.valor).toFixed(2)}</td>
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
  return <Suspense fallback={<main className="text-center p-10 font-black">CARREGANDO...</main>}><PainelConteudo /></Suspense>;
}