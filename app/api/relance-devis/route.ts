import { Resend } from "resend";
import { NextResponse } from "next/server";
import {
  escapeHtml,
  getErrorMessage,
  requireSupabaseUser,
} from "@/lib/server-utils";

type RelancePayload = {
  client?: string;
  email?: string;
  numero?: string;
  totalHT?: string | number;
  totalTTC?: string | number;
  entreprise?: {
    nom?: string;
  };
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
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "DevisFlow <onboarding@resend.dev>";
    const body = (await request.json()) as RelancePayload;

    const { client, email, numero, totalHT, totalTTC, entreprise } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email client manquant" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Relance concernant votre devis ${numero || ""}`,
      html: `
        <div style="margin:0;background:#f8fafc;padding:32px 0;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <div style="background:#0f172a;color:#ffffff;padding:26px 32px;">
              <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#cbd5e1;">Suivi de devis</p>
              <h1 style="margin:10px 0 0;font-size:24px;">Relance devis ${escapeHtml(numero || "")}</h1>
            </div>

            <div style="padding:28px 32px;">
              <p style="margin:0 0 14px;">Bonjour ${escapeHtml(client || "")},</p>
              <p style="margin:0 0 20px;">
                Nous revenons vers vous concernant le devis <strong>${escapeHtml(numero || "")}</strong>.
                Si vous avez une question ou souhaitez avancer, vous pouvez répondre directement à cet email.
              </p>

              <div style="padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0;color:#475569;">Montant HT : <strong style="color:#0f172a;">${escapeHtml(totalHT ?? "-")} €</strong></p>
                <p style="margin:6px 0 0;color:#475569;">Montant TTC : <strong style="color:#0f172a;">${escapeHtml(totalTTC ?? "-")} €</strong></p>
              </div>

              <p style="margin:28px 0 0;">Bien cordialement,<br/><strong>${escapeHtml(entreprise?.nom || "L'équipe")}</strong></p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur serveur relance") },
      { status: 500 }
    );
  }
}
