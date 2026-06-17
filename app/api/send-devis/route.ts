import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client, email, numero, totalHT, totalTTC, entreprise, lignes, acceptUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
    }

    const lignesHtml = lignes.map((ligne: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${ligne.reference || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${ligne.designation}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${ligne.quantite}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${ligne.prixUnitaire} € HT</td>
      </tr>
    `).join("");

    const { data, error } = await resend.emails.send({
      from: "DevisFlow <onboarding@resend.dev>",
      to: email,
      subject: `Votre devis ${numero}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;">
          <h1>Votre devis ${numero}</h1>
          <p>Bonjour ${client || ""},</p>
          <p>Voici votre devis envoyé par <strong>${entreprise?.nom || "notre entreprise"}</strong>.</p>

          <table style="width:100%;border-collapse:collapse;margin-top:20px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #111;">Référence</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #111;">Désignation</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #111;">Qté</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #111;">PU HT</th>
              </tr>
            </thead>
            <tbody>${lignesHtml}</tbody>
          </table>

          <p><strong>Total HT :</strong> ${totalHT} €</p>
          <p><strong>Total TTC :</strong> ${totalTTC} €</p>

          ${
            acceptUrl
              ? `<p style="margin-top:28px;">
                  <a href="${acceptUrl}" style="background:#111;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold;">
                    Consulter / accepter le devis
                  </a>
                </p>`
              : ""
          }

          <p style="margin-top:24px;">Bien cordialement,<br/>${entreprise?.nom || "L'équipe"}</p>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}