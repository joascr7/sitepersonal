import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, userEmail } = await req.json();

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preapproval_plan_id: "a0a7aa35113046a6a7d7054adab9dfd7",
        external_reference: userId,
        payer_email: userEmail || "cliente@email.com",
        // Adicionando status 'pending' para forçar o fluxo de redirecionamento
        status: "pending", 
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          currency_id: "BRL"
        },
        // Back URLs garantem que o cliente volte para o seu site
        back_url: "https://seu-site.com.br/sucesso" 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro MP Detalhado:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json({ init_point: data.init_point });
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}