'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';

export default function ModalAtribuirTreino({ isOpen, onClose, modelo, personalId }: any) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const buscarAlunos = async () => {
      const { data } = await supabase.from('alunos').select('id, nome').eq('personal_id', personalId).eq('ativo', true).order('nome');
      if (data) setAlunos(data);
    };
    buscarAlunos();
  }, [isOpen, personalId]);

  const executarAtribuicao = async () => {
    if (!alunoId) return alert("Selecione um aluno da lista!");
    setEnviando(true);
    try {
      const parsedDescricao = typeof modelo.descricao === 'string' ? JSON.parse(modelo.descricao) : modelo.descricao;
      const subdivisoes = parsedDescricao.subdivisoes || [];

      const { data: maxOrdem } = await supabase.from('fichas').select('ordem').eq('aluno_id', alunoId).order('ordem', { ascending: false }).limit(1).maybeSingle();
      const baseOrdem = (maxOrdem?.ordem || 0) + 1;

      const inserts = subdivisoes.map((sub: any, idx: number) => ({
        aluno_id: alunoId,
        personal_id: personalId,
        nome_treino: subdivisoes.length > 1 ? `${modelo.nome_modelo} - ${sub.nome}` : modelo.nome_modelo,
        descricao: JSON.stringify(sub.exercicios || []),
        ordem: baseOrdem + idx,
        data_inicio: dataInicio || null, // Novo campo de data
        data_vencimento: dataVencimento || null, // Novo campo de vencimento
        tipo_treino: 'Musculação',
        objetivo: 'Hipertrofia',
        dificuldade: 'Intermediário'
      }));

      const { error } = await supabase.from('fichas').insert(inserts);
      if (error) throw error;

      alert("Ficha atribuída com sucesso! Datas vinculadas.");
      onClose();
    } catch (err: any) { alert("Erro ao atribuir rotina: " + err.message); } finally { setEnviando(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-5">
      <div className="bg-[var(--surface)] w-full max-w-sm border border-[var(--border)] rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-lg text-[var(--text-primary)] tracking-tight">Atribuir Rotina</h3>
          <button onClick={onClose} className="w-8 h-8 bg-[var(--surface-sec)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 transition-colors"><FaTimes size={14}/></button>
        </div>

        <div className="space-y-5">
          <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--surface-sec)] p-4 rounded-xl border border-[var(--border)]">
            Enviando <strong className="text-[var(--primary)] font-black uppercase">"{modelo.nome_modelo}"</strong> para o aplicativo do aluno.
          </p>
          
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5">Aluno Destinatário *</label>
            <select value={alunoId} onChange={e => setAlunoId(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-4 rounded-xl font-bold text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] appearance-none">
              <option value="">Selecione um aluno ativo...</option>
              {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5 flex items-center gap-1"><FaCalendarAlt/> Início</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-wider block mb-1.5 flex items-center gap-1"><FaCalendarAlt/> Vencimento</label>
              <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="w-full bg-[var(--surface-sec)] border border-[var(--border)] p-3.5 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--danger)]" />
            </div>
          </div>
        </div>

        <button onClick={executarAtribuicao} disabled={enviando} className="w-full py-4 mt-8 bg-[var(--primary)] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[var(--primary)]/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center">
          {enviando ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirmar Envio"}
        </button>
      </div>
    </div>
  );
}