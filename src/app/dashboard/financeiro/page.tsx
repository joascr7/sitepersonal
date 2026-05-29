'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCheckCircle, FaLock, FaBolt, FaDollarSign } from 'react-icons/fa';

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ pix: '', token: '', modo: 'manual', valor: 150 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca Financeiro
    const { data: pData } = await supabase
      .from('pagamentos')
      .select(`id, valor, data_pagamento, alunos(nome)`)
      .eq('alunos.personal_id', user.id)
      .order('data_pagamento', { ascending: false });

    // Busca Configuração do Personal
    const { data: cData } = await supabase
      .from('personais')
      .select('chave_pix, mp_access_token, modo_pagamento, valor_mensalidade')
      .eq('id', user.id)
      .single();

    setPagamentos(pData || []);
    if (cData) {
      setConfig({ 
        pix: cData.chave_pix || '', 
        token: cData.mp_access_token || '', 
        modo: cData.modo_pagamento || 'manual',
        valor: cData.valor_mensalidade || 150
      });
    }
    setLoading(false);
  };

  const salvarConfig = async () => {
  setSaving(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase.from('personais').update({ 
    chave_pix: config.pix, 
    mp_access_token: config.token, 
    modo_pagamento: config.modo,
    valor_mensalidade: config.valor // Garantindo que este dado está sendo enviado
  }).eq('id', user?.id);

  if (error) {
    alert('Erro ao salvar: ' + error.message);
  } else {
    alert('Configurações atualizadas!');
    await fetchDados(); // Adicione isso: força a busca do valor novo logo após salvar
  }
  setSaving(false);
};

  const totalGeral = pagamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);

  if (loading) return <main className="p-10 text-center font-black">CARREGANDO DADOS...</main>;

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-10 tracking-tighter">Financeiro</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Faturamento Acumulado</h2>
              <p className="text-5xl font-black tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl w-fit">
              <FaCheckCircle className="text-xs" />
              <span className="text-[9px] font-black uppercase tracking-widest">Sistema Ativo</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Configurações</h2>
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setConfig({...config, modo: 'manual'})} className={`flex-1 p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${config.modo === 'manual' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}><FaLock className="inline mr-1"/> Manual</button>
              <button onClick={() => setConfig({...config, modo: 'imediata'})} className={`flex-1 p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${config.modo === 'imediata' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}><FaBolt className="inline mr-1"/> Imediata</button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <FaDollarSign className="absolute left-4 top-3.5 text-gray-400" />
                <input type="number" placeholder="Valor Mensalidade" value={config.valor} onChange={(e) => setConfig({...config, valor: Number(e.target.value)})} className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold outline-none" />
              </div>
              <input 
                type={config.modo === 'manual' ? 'text' : 'password'}
                placeholder={config.modo === 'manual' ? 'Chave PIX' : 'Mercado Pago Token'}
                value={config.modo === 'manual' ? config.pix : config.token}
                onChange={(e) => config.modo === 'manual' ? setConfig({...config, pix: e.target.value}) : setConfig({...config, token: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold outline-none"
              />
            </div>
            
            <button onClick={salvarConfig} disabled={saving} className="w-full mt-6 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98]">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100"><h2 className="font-black text-lg tracking-tighter">Últimas Transações</h2></div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[9px] uppercase font-black text-gray-400 tracking-[0.2em]">
              <tr>
                <th className="p-6">Aluno</th>
                <th className="p-6">Data</th>
                <th className="p-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagamentos.map((p) => (
                <tr key={p.id}>
                  <td className="p-6 font-bold text-sm">{p.alunos?.nome || 'Sem nome'}</td>
                  <td className="p-6 text-xs text-gray-500 font-medium">{p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="p-6 text-right font-black text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.valor))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}