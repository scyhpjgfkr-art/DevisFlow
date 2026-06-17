import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { client, email, numero, totalHT, totalTTC, entreprise } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email client manquant" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "DevisFlow <onboarding@resend.dev>",
      to: email,
      subject: `Relance concernant votre devis ${numero}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;">
          <h1>Relance devis ${numero}</h1>

          <p>Bonjour ${client || ""},</p>

          <p>
            Nous revenons vers vous concernant le devis <strong>${numero}</strong>.
          </p>

          <p>
            Montant HT : <strong>${totalHT} €</strong><br/>
            Montant TTC : <strong>${totalTTC} €</strong>
          </p>

          <p>
            N'hésitez pas à nous répondre si vous avez une question ou si vous souhaitez valider le devis.
          </p>

          <p>
            Bien cordialement,<br/>
            ${entreprise?.nom || "L'équipe"}
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur serveur relance" },
      { status: 500 }
    );
  }
}