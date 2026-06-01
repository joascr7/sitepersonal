'use client';
import { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { supabase } from '@/lib/supabaseClient';

// Inicialize com sua PUBLIC KEY
initMercadoPago('APP_USR-aa430b51-73fc-4c01-a415-07749a12c130', { locale: 'pt-BR' });

export default function CheckoutPage() {
  const [valorPlano, setValorPlano] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarValor = async () => {
      // Busca o valor atualizado do banco de dados (o valor salvo no Painel Admin)
      const { data } = await supabase
        .from('configuracoes_pagamento')
        .select('valor_padrao')
        .limit(1)
        .single();
      
      setValorPlano(data?.valor_padrao || 22.90);
      setLoading(false);
    };
    buscarValor();
  }, []);

  if (loading) return <p className="text-center font-bold">Carregando checkout...</p>;

  return (
    <CardPayment
      initialization={{ amount: valorPlano! }}
      onSubmit={async (cardFormData) => {
        try {
          const response = await fetch('/api/criar-assinatura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: cardFormData.token,
              email: cardFormData.payer.email,
              valor: valorPlano // Enviamos o valor para garantir consistência no Backend
            }),
          });
          
          const result = await response.json();
          if (result.status === 'approved') {
            alert("Pagamento aprovado!");
          } else {
            alert("Erro no pagamento: " + result.message);
          }
        } catch (error) {
          alert("Erro ao processar: " + error);
        }
      }}
    />
  );
}