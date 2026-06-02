'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FaUserShield, FaDollarSign, FaKey, FaSync, FaChartLine, FaCog, FaPowerOff } from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function PainelConteudo() {
  const searchParams = useSearchParams();
  const aba = searchParams.get('aba') || 'gestao';

  const [personais, setPersonais] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ token: '', valorPadrao: 22.90 });

  useEffect(() => { fetchDados(); }, []);

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
    } catch (err: any) { console.error(err); } finally { setSaving(false); }
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
    }
    setSaving(false);
  };

  const toggleStatus = async (personalId: string, statusAtual: boolean) => {
    setSaving(true);
    await supabase.from('personais').update({ ativo: !statusAtual }).eq('id', personalId);
    await fetchDados();
    setSaving(false);
  };

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black">CARREGANDO...</main>;

  return (
    <main className="min-h-screen bg-black p-6 md:p-12 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-white">
            <FaUserShield className="text-blue-600" /> AURA-ADMIN
          </h1>
          <div className="flex bg-neutral-900 rounded-full p-1 border border-white/5">
            <a href="?aba=gestao" className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'gestao' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white'}`}>Gestão</a>
            <a href="?aba=financeiro" className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${aba === 'financeiro' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-white'}`}>Financeiro</a>
          </div>
        </header>

        {aba === 'gestao' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5">
                <h2 className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-8"><FaCog/> Configurações</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <input type="password" value={config.token} onChange={(e) => setConfig({...config, token: e.target.value})} className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none focus:border-blue-500" placeholder="Token MP" />
                  <input type="number" value={config.valorPadrao} onChange={(e) => setConfig({...config, valorPadrao: Number(e.target.value)})} className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold text-white outline-none focus:border-blue-500" placeholder="Valor da Assinatura" />
                </div>
                <button onClick={salvarConfiguracoes} className="mt-6 w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all">Salvar Configurações</button>
              </div>

              <div className="bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="text-[9px] uppercase font-black text-neutral-500 tracking-[0.2em]">
                    <tr><th className="p-8">Personal</th><th className="p-8">Acesso</th><th className="p-8">Status</th><th className="p-8 text-right">Ação</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {personais.map((p) => (
                      <tr key={p.id}>
                        <td className="p-8 font-bold text-sm">{p.nome}</td>
                        <td className="p-8"><button onClick={() => toggleStatus(p.id, p.ativo)} className={`text-[10px] font-black uppercase ${p.ativo ? 'text-blue-500' : 'text-red-500'}`}><FaPowerOff /> {p.ativo ? 'ON' : 'OFF'}</button></td>
                        <td className="p-8 text-[10px] font-black uppercase tracking-widest">{p.status_pagamento}</td>
                        <td className="p-8 text-right"><button onClick={() => liberarAssinaturaManual(p.id)} className="bg-white/5 px-4 py-2 rounded-lg font-black text-[10px] hover:bg-white/10 transition-all"><FaSync className="inline mr-2"/> LIBERAR</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] text-white border border-white/5 h-fit">
               <h3 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-8">Métricas de Gestão</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4"><span>Ativos</span><span className="font-black text-2xl">{personais.filter(p => p.status_pagamento === 'ativo').length}</span></div>
                  <div className="flex justify-between items-center pb-4"><span>Total Base</span><span className="font-black text-2xl">{personais.length}</span></div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 h-96">
              <h2 className="font-black flex items-center gap-2 mb-8 text-neutral-500 text-[10px] uppercase tracking-widest"><FaChartLine/> Performance Financeira</h2>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pagamentos.slice(0, 15).reverse()}>
                  <defs><linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                  <Area type="monotone" dataKey="valor" stroke="#2563eb" fill="url(#colorValor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="text-[9px] uppercase font-black text-neutral-500 tracking-[0.2em]">
                    <tr><th className="p-8">Personal</th><th className="p-8">Data</th><th className="p-8 text-right">Valor</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pagamentos.map(p => (
                      <tr key={p.id}>
                        <td className="p-8 font-bold text-sm">{p.personais?.nome}</td>
                        <td className="p-8 text-xs text-neutral-500">{new Date(p.data_pagamento).toLocaleDateString()}</td>
                        <td className="p-8 text-right font-black text-sm">R$ {Number(p.valor).toFixed(2)}</td>
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
  return <Suspense fallback={<main className="min-h-screen bg-black flex items-center justify-center font-black">CARREGANDO...</main>}><PainelConteudo /></Suspense>;
}