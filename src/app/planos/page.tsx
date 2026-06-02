'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { getPurchases } from '@/services/subscription';

export default function EscolherPlano() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAssinar = async () => {
    setIsProcessing(true);

    try {
      // 1. Obter instância do SDK de forma segura
      const Purchases = await getPurchases();
      if (!Purchases) {
        alert("Por favor, realize a assinatura diretamente pelo nosso aplicativo mobile.");
        return;
      }

      // 2. Verificar usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Faça login para continuar");
        return;
      }

      // 3. Conectar e buscar ofertas
      await Purchases.logIn(user.id);
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current?.monthly) {
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.monthly);
        
        if (customerInfo.entitlements.active["pro_access"]) {
          router.push('/dashboard');
        }
      } else {
        alert("Nenhum plano disponível no momento.");
      }
    } catch (e: any) {
      console.error("Erro na compra:", e);
      alert("Houve um erro no processo de assinatura. Tente novamente pelo App.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="relative max-w-lg w-full bg-[#161921]/80 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-white mb-3">AuraFit Pro</h1>
        <p className="text-slate-400 mb-10">Assine pelo app para gerenciar sua consultoria com total liberdade.</p>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAssinar}
          disabled={isProcessing}
          className="w-full p-5 rounded-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 transition-all"
        >
          {isProcessing ? "Processando..." : "Assinar via App"}
        </motion.button>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-3">
          <p className="text-slate-500 text-xs text-center uppercase tracking-widest mb-2">
            Disponível em
          </p>
          <div className="flex gap-4">
            <a 
              href="https://apps.apple.com" // Substitua pelo link real
              target="_blank" 
              className="flex-1 bg-white/5 p-3 rounded-xl text-center text-white text-xs hover:bg-white/10 transition"
            >
              App Store
            </a>
            <a 
              href="https://play.google.com" // Substitua pelo link real
              target="_blank" 
              className="flex-1 bg-white/5 p-3 rounded-xl text-center text-white text-xs hover:bg-white/10 transition"
            >
              Google Play
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}