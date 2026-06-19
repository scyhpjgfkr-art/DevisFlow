import { Resend } from "resend";
import { NextResponse } from "next/server";
import { getResendFromEmail, sendTransactionalEmail } from "@/lib/email-delivery";
import { buildPremiumDocumentEmail } from "@/lib/email-templates";
import { getErrorMessage, requireSupabaseUser } from "@/lib/server-utils";

type LigneEmail = {
  reference?: string;
  designation?: string;
  quantite?: number;
  prixUnitaire?: number;
};

type EntrepriseEmail = {
  nom?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  siret?: string;
  tva?: string;
  logoUrl?: string;
  siteWeb?: string;
  couleurPrincipale?: string;
};

type SendDevisPayload = {
  client?: string;
  email?: string;
  numero?: string;
  totalHT?: string | number;
  totalTTC?: string | number;
  entreprise?: EntrepriseEmail;
  lignes?: LigneEmail[];
  acceptUrl?: string;
  acompteTTC?: string | number | null;
};

export async function POST(request: Request) {
  try {
    const auth = await requireSupabaseUser(request);
    if ("errorResponse" in auth) return auth.errorResponse;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const body = (await request.json()) as SendDevisPayload;
    const {
      client,
      email,
      numero,
      totalHT,
      totalTTC,
      entreprise,
      lignes,
      acceptUrl,
      acompteTTC,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }

    const delivery = await sendTransactionalEmail(resend, {
      from: getResendFromEmail(),
      to: email,
      subject: `Votre devis ${numero || ""}`,
      html: buildPremiumDocumentEmail({
        brand: entreprise,
        eyebrow: "Devis à consulter",
        title: `Devis ${numero || ""}`,
        numero,
        client,
        intro: `${
          entreprise?.nom || "Notre entreprise"
        } vous transmet un devis à consulter en ligne. Vous pouvez le vérifier, l'accepter ou le refuser depuis le lien sécurisé ci-dessous.`,
        totalHT,
        totalTTC,
        lignes,
        ctaLabel: acceptUrl ? "Consulter et répondre au devis" : undefined,
        ctaUrl: acceptUrl,
        acompteTTC,
        note: "Le lien permet de conserver une réponse datée avec le nom du signataire.",
      }),
    }, "send-devis");

    if (!delivery.success) {
      return NextResponse.json(
        { error: delivery.error, details: delivery.details },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: delivery.data,
      testFallback: delivery.testFallback,
      sentToOriginalRecipient: delivery.sentToOriginalRecipient,
      warning: delivery.warning,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Erreur serveur") }, { status: 500 });
  }
}
