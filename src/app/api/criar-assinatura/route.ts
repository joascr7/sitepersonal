import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId, userEmail } = await req.json();

  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      preapproval_plan_id: "a0a7aa35113046a6a7d7054adab9dfd7",
      external_reference: userId, // AQUI É ONDE A MÁGICA ACONTECE
      payer_email: userEmail,
      auto_recurring: { frequency: 1, frequency_type: "months" }
    }),
  });

  const data = await response.json();
  return NextResponse.json({ init_point: data.init_point });
}