'use client';
import { createContext, useContext, useState } from 'react';

// Define a estrutura do que vamos compartilhar
interface AlunoContextType {
  telefoneAluno: string | null;
  setTelefoneAluno: (tel: string | null) => void;
}

const AlunoContext = createContext<AlunoContextType | undefined>(undefined);

export const AlunoProvider = ({ children }: { children: React.ReactNode }) => {
  const [telefoneAluno, setTelefoneAluno] = useState<string | null>(null);

  return (
    <AlunoContext.Provider value={{ telefoneAluno, setTelefoneAluno }}>
      {children}
    </AlunoContext.Provider>
  );
};

// Hook personalizado para facilitar o uso nos componentes
export const useAluno = () => {
  const context = useContext(AlunoContext);
  if (!context) {
    throw new Error('useAluno deve ser usado dentro de um AlunoProvider');
  }
  return context;
};