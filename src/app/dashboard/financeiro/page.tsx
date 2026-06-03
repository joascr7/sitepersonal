'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCheckCircle, FaDollarSign, FaPlus } from 'react-icons/fa';

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ pix: '', valor: 150 });
  const [saving, setSaving] = useState(false);
  const [novoValor, setNovoValor] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [listaAlunos, setListaAlunos] = useState<any[]>([]);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [pRes, cRes, aRes] = await Promise.all([
      supabase.from('pagamentos').select('id, valor, data_pagamento, alunos(nome)').eq('personal_id', user.id).order('data_pagamento', { ascending: false }),
      supabase.from('personais').select('chave_pix, valor_mensalidade').eq('id', user.id).single(),
      supabase.from('alunos').select('id, nome').eq('personal_id', user.id)
    ]);

    setPagamentos(pRes.data || []);
    setListaAlunos(aRes.data || []);
    if (cRes.data) {
      setConfig({ 
        pix: cRes.data.chave_pix || '', 
        valor: cRes.data.valor_mensalidade || 150
      });
    }
    setLoading(false);
  };

  const registrarPagamentoManual = async () => {
    if (!alunoId || !novoValor) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('pagamentos').insert([{
      aluno_id: alunoId,
      personal_id: user?.id,
      valor: Number(novoValor),
      data_pagamento: new Date().toISOString(),
      status: 'pago'
    }]);

    if (!error) {
      setNovoValor('');
      await fetchDados();
    }
    setSaving(false);
  };

  const salvarConfig = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('personais').update({ 
      chave_pix: config.pix, 
      valor_mensalidade: config.valor
    }).eq('id', user?.id);
    setSaving(false);
  };

  const totalGeral = pagamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);

  
 if (loading) return (
    <main className="min-h-screen bg-black p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-10">
        <div className="w-16 h-4 bg-neutral-900 rounded-full" />
        <div className="w-24 h-8 bg-neutral-900 rounded-xl" />
      </div>

      {/* Título e Barra de Progresso Skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-8 bg-neutral-900 rounded-full" />
        <div className="w-32 h-3 bg-neutral-900 rounded-full" />
        <div className="w-full h-2 bg-neutral-900 rounded-full" />
      </div>

      {/* Cards de Exercícios Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-8 bg-neutral-900/50 rounded-[2.5rem] border border-white/5 space-y-4">
          <div className="w-full h-40 bg-neutral-900 rounded-2xl" />
          <div className="w-1/2 h-6 bg-neutral-900 rounded-full" />
        </div>
      ))}
    </main>
  );

  return (
    // PT-20 e PB-32 garantem que o conteúdo não fique escondido pelas navs fixas
    <main className="w-full min-h-screen bg-black text-white pt-20 px-4 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-black tracking-tighter">Financeiro</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl flex flex-col justify-between">
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Faturamento Acumulado</h2>
            <p className="text-5xl font-black tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}</p>
            <div className="mt-8 flex items-center gap-2 text-emerald-500 bg-emerald-600/10 px-4 py-2 rounded-xl w-fit border border-emerald-600/20">
              <FaCheckCircle className="text-xs" />
              <span className="text-[9px] font-black uppercase tracking-widest">Sistema Ativo</span>
            </div>
          </div>

          <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Configurações</h2>
            <div className="space-y-4">
              <div className="relative">
                <FaDollarSign className="absolute left-4 top-4 text-neutral-600" />
                <input type="number" placeholder="Valor Mensalidade" value={config.valor} onChange={(e) => setConfig({...config, valor: Number(e.target.value)})} className="w-full pl-12 p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold outline-none focus:border-blue-500" />
              </div>
              <input type="text" placeholder="Chave PIX" value={config.pix} onChange={(e) => setConfig({...config, pix: e.target.value})} className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-sm font-bold outline-none focus:border-blue-500" />
            </div>
            <button onClick={salvarConfig} disabled={saving} className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all">Salvar Alterações</button>
          </div>
        </div>

        {/* Pagamento Manual - FLEX WRAP para mobile */}
        <div className="bg-neutral-950/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl">
          <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-6">Registrar Pagamento Manual</h2>
          <div className="flex flex-wrap gap-3">
            <select onChange={(e) => setAlunoId(e.target.value)} className="flex-[2] min-w-[200px] p-4 bg-white/5 rounded-2xl text-sm font-bold border border-white/5 outline-none focus:border-blue-500 text-white">
              <option value="" className="text-black">Selecione o aluno...</option>
              {listaAlunos.map(a => <option key={a.id} value={a.id} className="text-black">{a.nome}</option>)}
            </select>
            <input type="number" placeholder="Valor R$" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} className="flex-1 min-w-[100px] p-4 bg-white/5 rounded-2xl text-sm font-bold border border-white/5 outline-none focus:border-blue-500" />
            <button onClick={registrarPagamentoManual} disabled={saving} className="bg-blue-600 text-white px-8 rounded-2xl font-black text-sm hover:bg-blue-500 transition-all"><FaPlus /></button>
          </div>
        </div>

        <div className="bg-neutral-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-white/5"><h2 className="font-black text-lg tracking-tighter">Últimas Transações</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[9px] uppercase font-black text-neutral-500 tracking-[0.2em]">
                <tr><th className="p-8">Aluno</th><th className="p-8">Data</th><th className="p-8 text-right">Valor</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td className="p-8 font-bold text-sm">{p.alunos?.nome || 'Sem nome'}</td>
                    <td className="p-8 text-xs text-neutral-500">{p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-8 text-right font-black text-sm text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Espaçador de segurança final */}
        <div className="h-24 w-full shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}