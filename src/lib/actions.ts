'use server' // Certifique-se de que esta linha está no topo
import { supabaseAdmin } from '@/lib/supabaseServer'; // Use o cliente Admin!

export async function salvarFeedbackNoBanco(alunoId: string, dados: any) {
  try {
    // 1. Busca o personal_id do aluno
    const { data: aluno, error: alunoError } = await supabaseAdmin
      .from('alunos')
      .select('personal_id')
      .eq('id', alunoId)
      .single();

    if (alunoError || !aluno) {
      throw new Error("Erro ao buscar dados do aluno: " + alunoError?.message);
    }

    // 2. Insere o feedback usando o cliente administrativo
    const { data, error } = await supabaseAdmin
      .from('feedbacks_treino')
      .insert([{ 
        aluno_id: alunoId,
        personal_id: aluno.personal_id,
        intensidade: dados.intensidade,
        sentimento: dados.sentimento,
        observacoes: dados.observacoes,
        data_criacao: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (err: any) {
    console.error("Erro na função salvarFeedbackNoBanco:", err);
    return { data: null, error: err.message };
  }
}