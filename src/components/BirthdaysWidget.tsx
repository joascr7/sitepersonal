import { useMemo } from 'react';
import { FaBirthdayCake } from 'react-icons/fa';

export default function BirthdaysWidget({ alunos }: { alunos: any[] }) {
  const aniversariantes = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    
    return alunos.filter(a => {
      if (!a.data_nascimento) return false;
      const [, mes] = a.data_nascimento.split('-');
      return parseInt(mes) === mesAtual;
    }).sort((a, b) => {
      const diaA = parseInt(a.data_nascimento.split('-')[2]);
      const diaB = parseInt(b.data_nascimento.split('-')[2]);
      return diaA - diaB;
    });
  }, [alunos]);

  if (aniversariantes.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 rounded-xl shadow-lg mb-4">
      <div className="flex items-center gap-3 mb-3">
        <FaBirthdayCake size={20} />
        <h4 className="font-black text-sm uppercase tracking-wider">Aniversariantes do Mês</h4>
      </div>
      <div className="space-y-2">
        {aniversariantes.map(aluno => {
          const dia = aluno.data_nascimento.split('-')[2];
          return (
            <div key={aluno.id} className="flex justify-between items-center bg-white/20 px-3 py-2 rounded-lg">
              <span className="font-bold text-sm">{aluno.nome}</span>
              <span className="bg-white text-purple-700 text-xs font-black px-2 py-1 rounded">Dia {dia}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}