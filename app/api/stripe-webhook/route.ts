import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "STRIPE_WEBHOOK_SECRET manquante dans .env.local" },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Clés Supabase admin manquantes dans .env.local" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Header stripe-signature manquant" },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error: any) {
      console.error("Erreur vérification webhook Stripe:", error.message);

      return NextResponse.json(
        { error: `Webhook Error: ${error.message}` },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const factureId = session.metadata?.factureId;

      if (factureId) {
        const { error } = await supabaseAdmin
          .from("factures")
          .update({ statut: "Payée" })
          .eq("id", factureId);

        if (error) {
          console.error("Erreur mise à jour facture:", error);

          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erreur traitement webhook Stripe:", error);

    return NextResponse.json(
      { error: error?.message || "Erreur webhook Stripe" },
      { status: 500 }
    );
  }
}
