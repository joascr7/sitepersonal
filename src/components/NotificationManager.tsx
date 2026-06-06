import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FaPaperPlane, FaBell } from 'react-icons/fa';

interface Props {
  personalId: string;
  alunos: any[];
  showStatus: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function NotificationManager({ personalId, alunos, showStatus }: Props) {
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [alunoDestino, setAlunoDestino] = useState('todos');
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alunos && alunos.length > 0) {
      fetchNotificacoes();
    }
  }, [alunos]);

  const fetchNotificacoes = async () => {
    try {
      // Como a tabela não tem personal_id, buscamos as notificações 
      // enviadas para os alunos deste personal.
      const alunoIds = alunos.map(a => a.id);
      
      if (alunoIds.length === 0) return;

      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .in('user_id', alunoIds)
        .order('criado_em', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setNotificacoes(data);
    } catch (error) {
      console.error("Erro ao buscar notificações. Verifique a tabela user_notifications.", error);
    }
  };

  const enviar = async () => {
    if (!titulo.trim()) return showStatus('error', 'Digite um título.');
    if (!mensagem.trim()) return showStatus('error', 'Digite uma mensagem.');
    if (alunos.length === 0) return showStatus('error', 'Nenhum aluno cadastrado.');
    
    setLoading(true);

    try {
      if (alunoDestino === 'todos') {
        const inserts = alunos.map(a => ({
          user_id: a.id,
          titulo: titulo.trim(),
          corpo: mensagem.trim(),
          lida: false
        }));
        
        const { error } = await supabase.from('user_notifications').insert(inserts);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_notifications').insert([{
          user_id: alunoDestino,
          titulo: titulo.trim(),
          corpo: mensagem.trim(),
          lida: false
        }]);
        if (error) throw error;
      }
      
      showStatus('success', 'Notificação enviada!');
      setTitulo('');
      setMensagem('');
      fetchNotificacoes();
    } catch (err: any) {
      console.error("ERRO AO SALVAR NOTIFICAÇÃO:", err);
      showStatus('error', 'Erro ao enviar. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para pegar o nome do aluno pelo ID
  const getNomeAluno = (id: string) => {
    const aluno = alunos.find(a => a.id === id);
    return aluno ? aluno.nome : 'Desconhecido';
  };

  return (
    <div className="bg-[var(--surface)] p-5 rounded-[1.5rem] border border-[var(--border)] shadow-sm space-y-6">
      <div>
        <h4 className="font-black text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <FaPaperPlane className="text-[var(--primary)]" /> Enviar Aviso
        </h4>
        <select 
          value={alunoDestino} 
          onChange={(e) => setAlunoDestino(e.target.value)}
          className="w-full bg-[var(--surface-sec)] p-3 rounded-xl mb-3 text-sm text-[var(--text-primary)] outline-none border border-[var(--border)] font-medium"
        >
          <option value="todos">Todos os Alunos</option>
          {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título (ex: Novo Treino!)"
          className="w-full bg-[var(--surface-sec)] p-3 rounded-xl mb-3 text-sm text-[var(--text-primary)] outline-none border border-[var(--border)] font-bold"
        />
        
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Escreva sua mensagem..."
          className="w-full bg-[var(--surface-sec)] p-3 rounded-xl mb-3 text-sm text-[var(--text-primary)] outline-none border border-[var(--border)] resize-none h-24"
        />
        
        <button 
          onClick={enviar} 
          disabled={loading}
          className="w-full bg-[#3B82F6] text-white p-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar Notificação'}
        </button>
      </div>

      <hr className="border-[var(--border)]" />

      <div>
        <h4 className="font-black text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <FaBell className="text-[var(--warning)]" /> Últimas Enviadas
        </h4>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {notificacoes.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">Nenhuma notificação recente.</p>
          ) : (
            notificacoes.map(notif => (
              <div key={notif.id} className="bg-[var(--surface-sec)] p-3 rounded-lg border border-[var(--border)] flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#3B82F6] uppercase">
                    {getNomeAluno(notif.user_id)}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)]">
                    {new Date(notif.criado_em).toLocaleDateString()}
                  </span>
                </div>
                <strong className="text-xs text-[var(--text-primary)]">{notif.titulo}</strong>
                <p className="text-[11px] text-[var(--text-secondary)]">{notif.corpo}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}