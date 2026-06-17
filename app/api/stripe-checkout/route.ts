import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);

    const body = await request.json();

    const {
      factureId,
      numero,
      client,
      email,
      totalTTC,
    }: {
      factureId?: string;
      numero?: string;
      client?: string;
      email?: string;
      totalTTC?: number;
    } = body;

    if (!factureId || !numero || !totalTTC || totalTTC <= 0) {
      return NextResponse.json(
        { error: "Données facture invalides" },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const amountInCents = Math.round(Number(totalTTC) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountInCents,
            product_data: {
              name: `Facture ${numero}`,
              description: client ? `Client : ${client}` : undefined,
            },
          },
        },
      ],
      metadata: {
        factureId,
        numero,
      },
      success_url: `${origin}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/client`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error("Erreur Stripe Checkout:", error);

    return NextResponse.json(
      { error: error?.message || "Erreur création paiement Stripe" },
      { status: 500 }
    );
  }
}
