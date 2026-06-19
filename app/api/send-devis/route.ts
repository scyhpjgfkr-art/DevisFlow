import { Resend } from "resend";
import { NextResponse } from "next/server";
import {
  escapeHtml,
  getErrorMessage,
  requireSupabaseUser,
} from "@/lib/server-utils";

type LigneEmail = {
  reference?: string;
  designation?: string;
  quantite?: number;
  prixUnitaire?: number;
};

type EntrepriseEmail = {
  nom?: string;
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
    const body = (await request.json()) as SendDevisPayload;
    const { client, email, numero, totalHT, totalTTC, entreprise, lignes, acceptUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }

    const lignesHtml = (lignes || []).map((ligne) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#475569;">${escapeHtml(ligne.reference || "-")}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-weight:600;">${escapeHtml(ligne.designation || "-")}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;color:#475569;text-align:center;">${escapeHtml(ligne.quantite ?? "-")}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#475569;text-align:right;">${escapeHtml(ligne.prixUnitaire ?? "-")} € HT</td>
      </tr>
    `).join("");

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Votre devis ${numero || ""}`,
      html: `
        <div style="margin:0;background:#f8fafc;padding:32px 0;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <div style="background:#0f172a;color:#ffffff;padding:28px 32px;">
              <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#cbd5e1;">Devis à consulter</p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;">Devis ${escapeHtml(numero || "")}</h1>
            </div>

            <div style="padding:28px 32px;">
              <p style="margin:0 0 14px;">Bonjour ${escapeHtml(client || "")},</p>
              <p style="margin:0 0 22px;">
                ${escapeHtml(entreprise?.nom || "Notre entreprise")} vous transmet un devis à consulter en ligne.
                Vous pouvez le vérifier, l'accepter ou le refuser depuis le lien sécurisé ci-dessous.
              </p>

              <table style="width:100%;border-collapse:collapse;margin-top:18px;">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:0 0 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:12px;text-transform:uppercase;">Référence</th>
                    <th style="text-align:left;padding:0 8px 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:12px;text-transform:uppercase;">Désignation</th>
                    <th style="text-align:center;padding:0 8px 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:12px;text-transform:uppercase;">Qté</th>
                    <th style="text-align:right;padding:0 0 10px;border-bottom:2px solid #0f172a;color:#0f172a;font-size:12px;text-transform:uppercase;">PU HT</th>
                  </tr>
                </thead>
                <tbody>${lignesHtml}</tbody>
              </table>

              <div style="margin-top:24px;padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0;color:#475569;">Total HT : <strong style="color:#0f172a;">${escapeHtml(totalHT ?? "-")} €</strong></p>
                <p style="margin:6px 0 0;color:#475569;">Total TTC : <strong style="color:#0f172a;">${escapeHtml(totalTTC ?? "-")} €</strong></p>
              </div>

              ${
                acceptUrl
                  ? `<p style="margin:28px 0 0;">
                      <a href="${escapeHtml(acceptUrl)}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold;">
                        Consulter et répondre au devis
                      </a>
                    </p>`
                  : ""
              }

              <p style="margin:24px 0 0;color:#475569;font-size:14px;">
                Le lien permet de conserver une réponse datée avec le nom du signataire.
              </p>

              <p style="margin:28px 0 0;">Bien cordialement,<br/><strong>${escapeHtml(entreprise?.nom || "L'équipe")}</strong></p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Erreur serveur") }, { status: 500 });
  }
}
