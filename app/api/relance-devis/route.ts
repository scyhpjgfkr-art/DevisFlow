import { Resend } from "resend";
import { NextResponse } from "next/server";
import { getResendFromEmail, sendTransactionalEmail } from "@/lib/email-delivery";
import { buildPremiumDocumentEmail } from "@/lib/email-templates";
import { getErrorMessage, requireSupabaseUser } from "@/lib/server-utils";

type RelancePayload = {
  client?: string;
  email?: string;
  numero?: string;
  totalHT?: string | number;
  totalTTC?: string | number;
  entreprise?: {
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
  acceptUrl?: string;
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
    const body = (await request.json()) as RelancePayload;

    const { client, email, numero, totalHT, totalTTC, entreprise, acceptUrl } =
      body;

    if (!email) {
      return NextResponse.json(
        { error: "Email client manquant" },
        { status: 400 }
      );
    }

    const delivery = await sendTransactionalEmail(resend, {
      from: getResendFromEmail(),
      to: email,
      subject: `Relance concernant votre devis ${numero || ""}`,
      html: buildPremiumDocumentEmail({
        brand: entreprise,
        eyebrow: "Suivi de devis",
        title: `Relance devis ${numero || ""}`,
        numero,
        client,
        intro:
          "Nous revenons vers vous concernant ce devis. Vous pouvez le consulter, le valider ou répondre directement à cet email si vous avez une question.",
        totalHT,
        totalTTC,
        ctaLabel: acceptUrl ? "Consulter le devis" : undefined,
        ctaUrl: acceptUrl,
        note: "Ce rappel est envoyé pour faciliter votre prise de décision.",
      }),
    }, "relance-devis");

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
    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur serveur relance") },
      { status: 500 }
    );
  }
}
