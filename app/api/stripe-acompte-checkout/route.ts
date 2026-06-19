import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/server-utils";

type CheckoutAcomptePayload = {
  token?: string;
};

type LigneDevisAcompte = {
  quantite: number | null;
  prix_unitaire: number | null;
};

type DevisAcompte = {
  id: string;
  numero: string | null;
  client: string | null;
  email: string | null;
  statut: string | null;
  port_ht: number | null;
  acompte_type: "none" | "percent" | "fixed" | null;
  acompte_montant: number | null;
  acompte_pourcentage: number | null;
  acompte_statut: string | null;
  acompte_date_paiement: string | null;
  lignes_devis: LigneDevisAcompte[] | null;
};

function totalTTC(devis: DevisAcompte) {
  const lignes = devis.lignes_devis || [];
  const totalLignes = lignes.reduce(
    (sum, ligne) =>
      sum + Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0),
    0
  );
  const totalHT = totalLignes + Number(devis.port_ht || 0);
  return totalHT * 1.2;
}

function calculerAcompte(devis: DevisAcompte) {
  const devisTotalTTC = totalTTC(devis);

  if (devis.acompte_type === "percent") {
    return devisTotalTTC * (Number(devis.acompte_pourcentage || 0) / 100);
  }

  if (devis.acompte_type === "fixed") {
    return Number(devis.acompte_montant || 0);
  }

  return 0;
}

export async function POST(request: Request) {
  try {
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

    const { token } = (await request.json()) as CheckoutAcomptePayload;

    if (!token) {
      return NextResponse.json(
        { error: "Lien de devis invalide" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: devis, error: devisError } = await supabaseAdmin
      .from("devis")
      .select(
        "id, numero, client, email, statut, port_ht, acompte_type, acompte_montant, acompte_pourcentage, acompte_statut, acompte_date_paiement, lignes_devis(quantite, prix_unitaire)"
      )
      .eq("public_token", token)
      .maybeSingle<DevisAcompte>();

    if (devisError || !devis) {
      return NextResponse.json(
        { error: devisError?.message || "Devis introuvable" },
        { status: 404 }
      );
    }

    if (devis.statut === "Refusé") {
      return NextResponse.json(
        { error: "Ce devis a été refusé." },
        { status: 400 }
      );
    }

    if (devis.statut !== "Accepté") {
      return NextResponse.json(
        { error: "Le devis doit être accepté avant paiement de l'acompte." },
        { status: 400 }
      );
    }

    if (devis.acompte_statut === "paid" || devis.acompte_date_paiement) {
      return NextResponse.json(
        { error: "L'acompte est déjà payé." },
        { status: 400 }
      );
    }

    const montantAcompte = calculerAcompte(devis);
    const devisTotalTTC = totalTTC(devis);

    if (
      !devis.acompte_type ||
      devis.acompte_type === "none" ||
      montantAcompte <= 0
    ) {
      return NextResponse.json(
        { error: "Aucun acompte n'est configuré sur ce devis." },
        { status: 400 }
      );
    }

    if (montantAcompte > devisTotalTTC) {
      return NextResponse.json(
        { error: "Le montant de l'acompte dépasse le total du devis." },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(montantAcompte * 100);

    if (amountInCents < 50) {
      return NextResponse.json(
        { error: "Le montant de l'acompte est trop faible pour Stripe." },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

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
              name: `Acompte devis ${devis.numero || ""}`.trim(),
              description: devis.client ? `Client : ${devis.client}` : undefined,
            },
          },
        },
      ],
      metadata: {
        type: "devis_acompte",
        devisId: devis.id,
        numero: devis.numero || "",
        publicToken: token,
      },
      success_url: `${origin}/paiement/success?type=acompte&token=${encodeURIComponent(
        token
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/devis/${encodeURIComponent(token)}`,
      customer_email: devis.email || undefined,
    });

    const { error: updateError } = await supabaseAdmin
      .from("devis")
      .update({
        acompte_statut: "pending",
        acompte_session_id: session.id,
      })
      .eq("id", devis.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Erreur Stripe acompte:", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur création paiement acompte") },
      { status: 500 }
    );
  }
}
