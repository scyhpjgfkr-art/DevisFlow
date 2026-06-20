import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getErrorMessage, requireSupabaseUser } from "@/lib/server-utils";

type CheckoutPayload = {
  factureId?: string;
};

type FacturePaiement = {
  id: string;
  numero: string | null;
  client: string | null;
  email: string | null;
  total_ttc: number | null;
  statut: string | null;
};

export async function POST(request: Request) {
  try {
    const auth = await requireSupabaseUser(request);
    if ("errorResponse" in auth) return auth.errorResponse;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Clés Supabase admin manquantes dans .env.local" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secretKey);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = (await request.json()) as CheckoutPayload;

    const { factureId } = body;

    if (!factureId) {
      return NextResponse.json(
        { error: "Données facture invalides" },
        { status: 400 }
      );
    }

    const { data: facture, error: factureError } = await supabaseAdmin
      .from("factures")
      .select("id, numero, client, email, total_ttc, statut")
      .eq("id", factureId)
      .eq("user_id", auth.user.id)
      .single<FacturePaiement>();

    if (factureError || !facture) {
      return NextResponse.json(
        { error: factureError?.message || "Facture introuvable" },
        { status: 404 }
      );
    }

    if (facture.statut === "Payée") {
      return NextResponse.json(
        { error: "Cette facture est déjà payée" },
        { status: 400 }
      );
    }

    const totalTTC = Number(facture.total_ttc || 0);

    if (!facture.numero || totalTTC <= 0) {
      return NextResponse.json(
        { error: "Facture non payable" },
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
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountInCents,
            product_data: {
              name: `Facture ${facture.numero}`,
              description: facture.client ? `Client : ${facture.client}` : undefined,
            },
          },
        },
      ],
      metadata: {
        type: "facture",
        factureId,
        numero: facture.numero,
      },
      success_url: `${origin}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/client`,
      customer_email: facture.email || undefined,
    });

    const { error: updateError } = await supabaseAdmin
      .from("factures")
      .update({ stripe_session_id: session.id })
      .eq("id", facture.id)
      .eq("user_id", auth.user.id);

    if (updateError) {
      console.error("Erreur stockage session paiement facture:", updateError);
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: unknown) {
    console.error("Erreur Stripe Checkout:", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur création paiement Stripe") },
      { status: 500 }
    );
  }
}
