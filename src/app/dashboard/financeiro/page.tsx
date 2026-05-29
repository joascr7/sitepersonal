'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaCheckCircle, FaLock, FaBolt } from 'react-icons/fa';

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ pix: '', token: '', modo: 'manual' });
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
      .select('chave_pix, mp_access_token, modo_pagamento')
      .eq('id', user.id)
      .single();

    setPagamentos(pData || []);
    if (cData) {
      setConfig({ 
        pix: cData.chave_pix || '', 
        token: cData.mp_access_token || '', 
        modo: cData.modo_pagamento || 'manual' 
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
      modo_pagamento: config.modo 
    }).eq('id', user?.id);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Configurações atualizadas com sucesso!');
    }
    setSaving(false);
  };

  const totalGeral = pagamentos.reduce((acc, curr) => acc + Number(curr.valor), 0);

  if (loading) return <main className="p-10 text-center text-gray-500 font-bold">Carregando painel financeiro...</main>;

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tighter">Financeiro</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Card de Faturamento */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Faturamento Acumulado</h2>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl w-fit">
              <FaCheckCircle className="text-xs" />
              <span className="text-[9px] font-black uppercase tracking-widest">Sistema Ativo</span>
            </div>
          </div>

          {/* Card de Configuração */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Modo de Pagamento</h2>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setConfig({...config, modo: 'manual'})} className={`flex-1 p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${config.modo === 'manual' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}><FaLock className="inline mr-1"/> Manual</button>
              <button onClick={() => setConfig({...config, modo: 'imediata'})} className={`flex-1 p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${config.modo === 'imediata' ? 'border-gray-900 bg-gray-50' : 'border-gray-100'}`}><FaBolt className="inline mr-1"/> Imediata</button>
            </div>
            
            <input 
              type={config.modo === 'manual' ? 'text' : 'password'}
              placeholder={config.modo === 'manual' ? 'Chave PIX' : 'Mercado Pago Access Token'}
              value={config.modo === 'manual' ? config.pix : config.token}
              onChange={(e) => config.modo === 'manual' ? setConfig({...config, pix: e.target.value}) : setConfig({...config, token: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm mb-4 focus:ring-2 focus:ring-gray-900 outline-none transition-all"
            />
            <button onClick={salvarConfig} disabled={saving} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-all active:scale-[0.98]">
              {saving ? 'Salvando...' : 'Atualizar Configurações'}
            </button>
          </div>
        </div>

        {/* Tabela de Registros */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100"><h2 className="font-black text-lg text-gray-900 tracking-tighter">Últimas Transações</h2></div>
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
                <tr key={p.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-6 font-bold text-gray-900 text-sm">{p.alunos?.nome || 'Sem nome'}</td>
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