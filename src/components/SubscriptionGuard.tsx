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

        // --- EXCEÇÃO PARA O ADMIN (Acesso imediato) ---
        if (user.email === 'admin@aurafit.com') {
          setIsPro(true);
          setLoading(false);
          return;
        }
        // ----------------------------------------------

        const { data: personal, error: dbError } = await supabase
          .from('personais')
          .select('is_pro')
          .eq('id', user.id)
          .maybeSingle();

        if (personal && personal.is_pro === true) {
          setIsPro(true);
        } else {
          console.log("Acesso negado: Usuário não é PRO.");
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