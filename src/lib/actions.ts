import { supabase } from '@/lib/supabaseClient';

export async function salvarFeedbackNoBanco(alunoId: string, dados: any) {
  // 1. Busca o personal_id desse aluno
  const { data: aluno } = await supabase
    .from('alunos')
    .select('personal_id')
    .eq('id', alunoId)
    .single();

  // 2. Insere incluindo o personal_id
  const { data, error } = await supabase.from('feedbacks_treino').insert([{ 
    aluno_id: alunoId,
    personal_id: aluno?.personal_id, // <--- O ID do personal entra aqui
    intensidade: dados.intensidade,
    sentimento: dados.sentimento,
    observacoes: dados.observacoes,
    data_criacao: new Date().toISOString()
  }]);
  
  return { data, error };
}