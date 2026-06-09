'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // --- EXCEÇÃO PARA O ADMIN ---
        if (user.email === 'admin@aurafit.com') {
          setIsPro(true);
          setLoading(false);
          return;
        }

        // --- BUSCA DADOS DE ASSINATURA E TESTE ---
        const { data: personal, error: dbError } = await supabase
          .from('personais')
          .select('is_pro, data_inicio_teste')
          .eq('id', user.id)
          .maybeSingle();

        if (personal) {
          // 1. Verifica se é PRO pago
          if (personal.is_pro === true) {
            setIsPro(true);
          } 
          // 2. Verifica se está dentro dos 10 dias de teste grátis
          else if (personal.data_inicio_teste) {
            const dataInicio = new Date(personal.data_inicio_teste);
            const hoje = new Date();
            
            // Calcula diferença em milissegundos e converte para dias
            const diffTime = hoje.getTime() - dataInicio.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 10) {
              setIsPro(true); // Libera acesso durante o período de teste
            } else {
              router.push('/planos');
            }
          } 
          // 3. Caso não seja PRO e não tenha data de início de teste
          else {
            router.push('/planos');
          }
        } else {
          router.push('/planos');
        }

      } catch (err) {
        console.error("Erro no SubscriptionGuard:", err);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black animate-pulse">
        VALIDANDO ACESSO...
      </div>
    );
  }

  return isPro ? <>{children}</> : null;
}