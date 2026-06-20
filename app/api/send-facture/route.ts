import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";
import { getResendFromEmail, sendTransactionalEmail } from "@/lib/email-delivery";
import { buildPremiumDocumentEmail } from "@/lib/email-templates";
import { getErrorMessage, requireSupabaseUser } from "@/lib/server-utils";

type SendFacturePayload = {
  factureId?: string;
};

type LigneFacture = {
  reference?: string | null;
  designation?: string | null;
  quantite?: number | null;
  prix_unitaire?: number | null;
};

type FactureEmail = {
  id: string;
  user_id: string;
  numero: string | null;
  client: string | null;
  email: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  statut: string | null;
  lignes_factures?: LigneFacture[] | null;
};

type EntrepriseSettings = {
  nom?: string | null;
  adresse?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  siret?: string | null;
  tva?: string | null;
  logo_url?: string | null;
  site_web?: string | null;
  couleur_principale?: string | null;
};

export async function POST(request: Request) {
  try {
    const auth = await requireSupabaseUser(request);
    if ("errorResponse" in auth) return auth.errorResponse;

    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Clés Supabase admin manquantes dans .env.local" },
        { status: 500 }
      );
    }

    const { factureId } = (await request.json()) as SendFacturePayload;

    if (!factureId) {
      return NextResponse.json(
        { error: "Identifiant facture manquant" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: facture, error: factureError } = await supabaseAdmin
      .from("factures")
      .select("*, lignes_factures(*)")
      .eq("id", factureId)
      .eq("user_id", auth.user.id)
      .maybeSingle<FactureEmail>();

    if (factureError || !facture) {
      return NextResponse.json(
        { error: factureError?.message || "Facture introuvable" },
        { status: 404 }
      );
    }

    if (!facture.email) {
      return NextResponse.json(
        { error: "Email client manquant" },
        { status: 400 }
      );
    }

    const { data: entreprise } = await supabaseAdmin
      .from("entreprise_settings")
      .select(
        "nom, adresse, ville, telephone, email, siret, tva, logo_url, site_web, couleur_principale"
      )
      .eq("user_id", auth.user.id)
      .maybeSingle<EntrepriseSettings>();

    let paymentUrl = "";
    let paymentSessionId = "";
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const totalTTC = Number(facture.total_ttc || 0);

    if (stripeSecretKey && facture.statut !== "Payée" && totalTTC > 0) {
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      const stripe = new Stripe(stripeSecretKey);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: facture.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(totalTTC * 100),
              product_data: {
                name: `Facture ${facture.numero || ""}`.trim(),
                description: facture.client
                  ? `Client : ${facture.client}`
                  : undefined,
              },
            },
          },
        ],
        metadata: {
          type: "facture",
          factureId: facture.id,
          numero: facture.numero || "",
        },
        success_url: `${origin}/paiement/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: origin,
      });

      paymentUrl = session.url || "";
      paymentSessionId = session.id;
    }

    const resend = new Resend(resendApiKey);

    const delivery = await sendTransactionalEmail(resend, {
      from: getResendFromEmail(),
      to: facture.email,
      subject: `Votre facture ${facture.numero || ""}`,
      html: buildPremiumDocumentEmail({
        brand: {
          nom: entreprise?.nom || undefined,
          adresse: entreprise?.adresse || undefined,
          ville: entreprise?.ville || undefined,
          telephone: entreprise?.telephone || undefined,
          email: entreprise?.email || undefined,
          siret: entreprise?.siret || undefined,
          tva: entreprise?.tva || undefined,
          logo_url: entreprise?.logo_url || undefined,
          site_web: entreprise?.site_web || undefined,
          couleur_principale: entreprise?.couleur_principale || undefined,
        },
        eyebrow: "Facture à régler",
        title: `Facture ${facture.numero || ""}`,
        numero: facture.numero || undefined,
        client: facture.client || undefined,
        intro:
          facture.statut === "Payée"
            ? "Nous vous transmettons cette facture pour vos archives. Elle est indiquée comme payée."
            : "Nous vous transmettons cette facture. Vous pouvez la régler depuis le lien sécurisé ci-dessous ou selon les modalités convenues.",
        totalHT: Number(facture.total_ht || 0).toFixed(2),
        totalTTC: totalTTC.toFixed(2),
        lignes: (facture.lignes_factures || []).map((ligne) => ({
          reference: ligne.reference || "",
          designation: ligne.designation || "",
          quantite: Number(ligne.quantite || 0),
          prixUnitaire: Number(ligne.prix_unitaire || 0),
        })),
        ctaLabel: paymentUrl ? "Payer la facture" : undefined,
        ctaUrl: paymentUrl,
        note: paymentUrl
          ? "Le paiement est traité par Stripe sur une page sécurisée."
          : "Vous pouvez répondre à cet email pour toute question concernant le règlement.",
      }),
    }, "send-facture");

    if (!delivery.success) {
      return NextResponse.json(
        { error: delivery.error, details: delivery.details },
        { status: 500 }
      );
    }

    if (delivery.sentToOriginalRecipient) {
      const { error: updateError } = await supabaseAdmin
        .from("factures")
        .update({
          date_envoi: new Date().toISOString(),
          stripe_session_id: paymentSessionId || null,
        })
        .eq("id", facture.id)
        .eq("user_id", auth.user.id);

      if (updateError) {
        console.error("Erreur mise à jour date envoi facture:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: delivery.data,
      paymentUrlCreated: Boolean(paymentUrl),
      testFallback: delivery.testFallback,
      sentToOriginalRecipient: delivery.sentToOriginalRecipient,
      warning: delivery.warning,
    });
  } catch (error: unknown) {
    console.error("Erreur envoi facture:", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur serveur facture") },
      { status: 500 }
    );
  }
}
