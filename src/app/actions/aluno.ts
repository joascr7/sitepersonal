'use server'
import { createClient } from '@supabase/supabase-js';

// Cliente Admin com Service Role (apenas servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function cadastrarAlunoAction(dados: any, personalId: string) {
  try {
    // 1. Criar o usuário no Auth do Supabase
    // Isso gera a credencial para o aluno fazer login
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dados.email,
      password: dados.password,
      email_confirm: true,
      user_metadata: { nome: dados.nome }
    });

    if (authError) throw new Error(authError.message);

    const userId = newUser.user.id;

    // 2. Salvar na tabela 'alunos' (Dados de gestão do Personal)
    const { error: alunoError } = await supabaseAdmin
      .from('alunos')
      .upsert({
        id: userId, 
        personal_id: personalId, // Vincula o aluno ao professor logado
        nome: dados.nome,
        telefone: dados.telefone,
        objetivo: dados.objetivo,
        data_vencimento: dados.dataVencimento,
        link_pagamento: dados.linkPagamento
      });

    if (alunoError) {
      throw new Error("Erro ao salvar na tabela alunos: " + alunoError.message);
    }

    // 3. Salvar na tabela 'profiles' (Dados para controle de acesso/login)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: dados.email,
        full_name: dados.nome,
        role: 'aluno'
      });

    if (profileError) {
      throw new Error("Erro ao salvar na tabela profiles: " + profileError.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Erro na Action de cadastro:", err);
    return { error: err.message };
  }
}