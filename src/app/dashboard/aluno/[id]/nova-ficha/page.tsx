'use client';
import { useParams } from 'next/navigation';
import FormularioTreinoUniversal from '@/components/biblioteca/FormularioTreinoUniversal';

// 1. Defina o dicionário aqui dentro ou importe-o
const translations = {
  'pt-BR': {
    back: 'Voltar', title: 'Criar Programa', library: 'Biblioteca de Treinos', close: 'Fechar',
    myModels: 'Meus Modelos', defaultModels: 'Treinos Padrão', workoutName: 'Nome do Programa',
    exName: 'Pesquisar Exercício...', remove: 'Remover', videoUrl: 'Link do vídeo',
    uploadVideo: 'Upload de Mídia', uploading: 'Enviando...', series: 'Série', reps: 'Reps', 
    load: 'Carga', rest: 'Descanso', addSeries: '+ Adicionar Série', addExercise: '+ Adicionar Exercício',
    saveFinish: 'Finalizar e Salvar', saveModel: 'Salvar como Modelo', saving: 'Salvando...',
    errLimit: 'Arquivo maior que 10MB!', errName: 'Dê um nome ao programa!', errApply: 'Erro ao aplicar este modelo.',
    errUpload: 'Erro ao enviar arquivo: ', errSave: 'Erro ao salvar: ', successAdd: ' adicionado!', 
    successVideo: 'Mídia vinculada: ', successSave: 'Ficha e treinos criados com sucesso!'
  }
};

export default function NovaFichaAluno() {
  const params = useParams();
  const alunoId = params?.id as string;
  
  // 2. Agora o 't' existe e o código para de dar erro
  const t = translations['pt-BR']; 

  return <FormularioTreinoUniversal alunoId={alunoId} t={t} />;
}