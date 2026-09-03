import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getErrorMessage } from "@/lib/server-utils";

type SessionStatusPayload = {
  sessionId?: string;
  token?: string;
};

export async function POST(request: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    const { sessionId, token } = (await request.json()) as SessionStatusPayload;

    if (!sessionId || !sessionId.startsWith("cs_") || sessionId.length > 255) {
      return NextResponse.json(
        { error: "Session de paiement invalide." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentType = session.metadata?.type || "facture";
    const expectsDeposit = Boolean(token);

    if (
      (paymentType === "devis_acompte") !== expectsDeposit ||
      (paymentType === "devis_acompte" &&
        session.metadata?.publicToken !== token)
    ) {
      return NextResponse.json(
        { error: "Session de paiement introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        paid: session.payment_status === "paid",
        status: session.status,
        paymentStatus: session.payment_status,
        type: paymentType,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur vérification session Stripe:", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Impossible de vérifier le paiement.") },
      { status: 500 }
    );
  }
}
