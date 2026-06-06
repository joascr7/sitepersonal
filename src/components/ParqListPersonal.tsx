'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaNotesMedical, FaSearch, FaCheckCircle, FaExclamationTriangle, FaPenNib, FaChevronDown } from 'react-icons/fa';

// Como o personal precisa ver as perguntas, mantemos um espelho delas aqui
const QUESTIONS_PT = [
  'Algum médico já disse que você possui algum problema de coração e recomendou que fizesse apenas atividades supervisionadas?',
  'Você sente dor no peito causada pela prática de atividade física?',
  'Você sentiu dor no peito no último mês?',
  'Você tende a perder a consciência ou cair em virtude de tontura?',
  'Você tem algum problema ósseo ou articular que poderia piorar com a atividade física?',
  'Algum médico já lhe receitou medicamento para pressão arterial ou para o coração?',
  'Você passou por alguma cirurgia ou lesão grave recentemente?',
  'Você sabe de alguma outra razão pela qual não deva praticar atividade física?'
];

export default function ParqListPersonal({ personalId }: { personalId: string }) {
  const [parqs, setParqs] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null); // Controla qual card está aberto
  const [isParqModalOpen, setIsParqModalOpen] = useState(false);

  useEffect(() => {
    if (personalId) fetchParqs();
  }, [personalId]);

  const fetchParqs = async () => {
    setLoading(true);
    try {
      // Puxa os dados da tabela de parq, fazendo INNER JOIN com a tabela de alunos para garantir que o aluno pertence ao personal
      const { data, error } = await supabase
        .from('aluno_parq')
        .select(`
          id,
          respostas,
          assinatura,
          data_preenchimento,
          data_validade,
          aluno_id,
          alunos!inner(nome, avatar_url, personal_id)
        `)
        .eq('alunos.personal_id', personalId)
        .order('data_preenchimento', { ascending: false });

      if (error) throw error;
      if (data) setParqs(data);
    } catch (err) {
      console.error('Erro ao buscar PAR-Qs:', err);
    } finally {
      setLoading(false);
    }
  };

  const parqsFiltrados = useMemo(() => {
    return parqs.filter(p => p.alunos?.nome?.toLowerCase().includes(busca.toLowerCase()));
  }, [parqs, busca]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) {
    return <div className="p-8 text-center text-sm font-bold animate-pulse text-[var(--text-secondary)]">Carregando avaliações...</div>;
  }

  return (
    <div className="bg-[var(--surface)] p-6 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
      
      {/* Header do Componente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="font-black text-[var(--text-primary)] text-lg flex items-center gap-3">
          <FaNotesMedical className="text-[var(--danger)]" /> Avaliações PAR-Q
        </h3>
        
        {/* Campo de Pesquisa */}
        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={12} />
          <input 
            type="text" 
            placeholder="Buscar aluno..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[var(--surface-sec)] py-2.5 pl-10 pr-4 rounded-xl text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] border border-[var(--border)] transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {parqsFiltrados.length === 0 ? (
          <p className="text-center text-xs text-[var(--text-secondary)] py-10">Nenhum formulário PAR-Q encontrado.</p>
        ) : (
          parqsFiltrados.map((parq) => {
            const isExpanded = expandedId === parq.id;
            const dataPreenchimento = new Date(parq.data_preenchimento).toLocaleDateString('pt-BR');
            const expirado = new Date() > new Date(parq.data_validade);
            const statusColor = expirado ? 'text-[var(--danger)] bg-[var(--danger)]/10' : 'text-[var(--success)] bg-[var(--success)]/10';

            return (
              <div key={parq.id} className="bg-[var(--surface-sec)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300">
                
                {/* Linha Resumida (Sempre Visível) */}
                <div 
                  onClick={() => toggleExpand(parq.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                      {parq.alunos?.avatar_url ? (
                        <img src={parq.alunos.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-[var(--text-secondary)] text-sm">{parq.alunos?.nome?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <strong className="text-sm font-black text-[var(--text-primary)]">{parq.alunos?.nome}</strong>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium">Preenchido em: {dataPreenchimento}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${statusColor}`}>
                      {expirado ? <><FaExclamationTriangle /> Expirado</> : <><FaCheckCircle /> Válido</>}
                    </span>
                    <FaChevronDown className={`text-[var(--text-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} size={12}/>
                  </div>
                </div>

                {/* Área Expandida (Perguntas e Assinatura) */}
                <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="p-5 border-t border-[var(--border)] bg-[var(--surface)]/50 space-y-4">
                      
                      <h4 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4">Respostas do Aluno</h4>
                      
                      {/* Grade de Respostas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {QUESTIONS_PT.map((pergunta, idx) => {
                          const resposta = parq.respostas[idx];
                          if (!resposta) return null;
                          
                          const requiresAttention = resposta.yesNo === true; // Se respondeu SIM, precisa de atenção médica

                          return (
                            <div key={idx} className={`p-4 rounded-xl border ${requiresAttention ? 'border-[var(--danger)]/30 bg-[var(--danger)]/5' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                              <p className="text-[11px] font-medium text-[var(--text-primary)] leading-relaxed mb-3">
                                {idx + 1}. {pergunta}
                              </p>
                              <div className="flex flex-col gap-2">
                                <span className={`w-max px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${requiresAttention ? 'bg-[var(--danger)] text-white' : 'bg-[var(--primary)]/20 text-[var(--primary)]'}`}>
                                  {resposta.yesNo ? 'SIM' : 'NÃO'}
                                </span>
                                {resposta.obs && (
                                  <p className="text-[10px] text-[var(--text-secondary)] italic border-l-2 border-[var(--text-secondary)]/30 pl-2 mt-1">
                                    Obs: {resposta.obs}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Assinatura */}
                      <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-col items-center">
                        <h4 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4 flex items-center gap-2">
                          <FaPenNib /> Assinatura Digital
                        </h4>
                        <div className="w-full max-w-sm bg-white rounded-xl p-2 border border-[var(--border)]">
                          <img src={parq.assinatura} alt="Assinatura do Aluno" className="w-full h-auto object-contain" />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}