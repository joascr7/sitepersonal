import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch("https://api.mercadopago.com/v1/payment_methods", {
    headers: { "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  });
  const data = await response.json();
  return NextResponse.json({ status: response.status, data });
}