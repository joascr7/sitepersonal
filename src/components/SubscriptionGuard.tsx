'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPurchases } from '@/services/subscription';
import { supabase } from '@/lib/supabaseClient';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSubscription() {
      try {
        // 1. CHECAGEM RÁPIDA NO BANCO (Supabase)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: personal } = await supabase
            .from('personais')
            .select('is_pro')
            .eq('id', user.id)
            .single();

          if (personal?.is_pro) {
            setIsPro(true);
            setLoading(false);
            return;
          }
        }

        // 2. CHECAGEM NO REVENUECAT (Se não for pro no banco, checa o SDK)
        const Purchases = await getPurchases();
        if (!Purchases) {
          router.push('/planos');
          return;
        }

        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.entitlements.active['pro_access']) {
          setIsPro(true);
        } else {
          router.push('/planos');
        }
      } catch (error) {
        console.error("Erro na verificação:", error);
        router.push('/planos');
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-white">
        <p className="animate-pulse">Validando acesso...</p>
      </div>
    );
  }

  return isPro ? <>{children}</> : null;
}