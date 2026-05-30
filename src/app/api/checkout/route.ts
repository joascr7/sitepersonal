import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { motivo } = await req.json();

    // Aqui é onde entra a lógica real de criar o checkout do Stripe
    // Por enquanto, vamos simular uma resposta de sucesso para testar sua interface
    
    console.log("Processando pagamento para motivo:", motivo);

    // Exemplo de retorno (quando você configurar o Stripe, aqui virá a URL oficial)
    return NextResponse.json({ 
      url: 'https://checkout.stripe.com/c/pay/...' // Sua URL do Stripe virá aqui
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao processar checkout' }, 
      { status: 500 }
    );
  }
}