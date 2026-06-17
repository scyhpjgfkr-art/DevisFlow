import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const { data: devis, error } = await supabaseAdmin
      .from("devis")
      .select("*")
      .in("statut", ["Envoyé", "À relancer"])
      .not("email", "is", null)
      .or(
        `derniere_relance.is.null,derniere_relance.lt.${threeDaysAgo.toISOString()}`
      );

    if (error) {
      console.error("Erreur chargement devis à relancer:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: any[] = [];

    for (const d of devis || []) {
      const lastDate = d.derniere_relance || d.date_envoi || d.date_creation;

      if (!lastDate) continue;

      const daysSince =
        (now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < 3) continue;

      const acceptUrl = d.public_token
        ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/devis/${d.public_token}`
        : "";

      const { error: emailError } = await resend.emails.send({
        from: "DevisFlow <onboarding@resend.dev>",
        to: d.email,
        subject: `Relance concernant votre devis ${d.numero}`,
        html: `
          <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;">
            <h1>Relance devis ${d.numero}</h1>

            <p>Bonjour ${d.client || ""},</p>

            <p>
              Nous revenons vers vous concernant le devis <strong>${d.numero}</strong>.
            </p>

            <p>
              Vous pouvez répondre à cet email si vous avez une question.
            </p>

            ${
              acceptUrl
                ? `<p style="margin-top:24px;">
                    <a href="${acceptUrl}" style="background:#111;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold;">
                      Consulter / accepter le devis
                    </a>
                  </p>`
                : ""
            }

            <p style="margin-top:24px;">
              Bien cordialement,<br/>
              L'équipe
            </p>
          </div>
        `,
      });

      if (emailError) {
        console.error("Erreur email relance:", emailError);
        results.push({
          devis: d.numero,
          success: false,
          error: emailError,
        });
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from("devis")
        .update({
          statut: "Envoyé",
          derniere_relance: now.toISOString(),
        })
        .eq("id", d.id);

      if (updateError) {
        console.error("Erreur update relance:", updateError);
        results.push({
          devis: d.numero,
          success: false,
          error: updateError.message,
        });
        continue;
      }

      results.push({
        devis: d.numero,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      checked: devis?.length || 0,
      sent: results.filter((r) => r.success).length,
      results,
    });
  } catch (error: any) {
    console.error("Erreur auto-relances:", error);

    return NextResponse.json(
      { error: error?.message || "Erreur auto-relances" },
      { status: 500 }
    );
  }
}
