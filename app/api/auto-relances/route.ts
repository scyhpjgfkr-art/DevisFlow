import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { escapeHtml, getErrorMessage } from "@/lib/server-utils";

type DevisRelance = {
  id: string;
  numero: string | null;
  client: string | null;
  email: string;
  public_token: string | null;
  derniere_relance: string | null;
  date_envoi: string | null;
  date_creation: string | null;
};

type RelanceResult = {
  devis: string | null;
  success: boolean;
  error?: unknown;
};

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const authHeader = request.headers.get("authorization");

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET manquant dans .env.local" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return NextResponse.json(
        { error: "Variables Supabase ou Resend manquantes dans .env.local" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendApiKey);
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "DevisFlow <onboarding@resend.dev>";

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const { data: devis, error } = await supabaseAdmin
      .from("devis")
      .select("*")
      .in("statut", ["Envoyé", "À relancer"])
      .not("email", "is", null)
      .or(
        `derniere_relance.is.null,derniere_relance.lt.${threeDaysAgo.toISOString()}`
      )
      .returns<DevisRelance[]>();

    if (error) {
      console.error("Erreur chargement devis à relancer:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: RelanceResult[] = [];

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
        from: fromEmail,
        to: d.email,
        subject: `Relance concernant votre devis ${d.numero || ""}`,
        html: `
          <div style="margin:0;background:#f8fafc;padding:32px 0;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
              <div style="background:#0f172a;color:#ffffff;padding:26px 32px;">
                <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#cbd5e1;">Suivi de devis</p>
                <h1 style="margin:10px 0 0;font-size:24px;">Devis ${escapeHtml(d.numero || "")}</h1>
              </div>

              <div style="padding:28px 32px;">
                <p style="margin:0 0 14px;">Bonjour ${escapeHtml(d.client || "")},</p>
                <p style="margin:0 0 20px;">
                  Nous revenons vers vous concernant ce devis. Vous pouvez le
                  consulter, l'accepter ou répondre à cet email si vous avez une question.
                </p>

                ${
                  acceptUrl
                    ? `<p style="margin:28px 0 0;">
                        <a href="${escapeHtml(acceptUrl)}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold;">
                          Consulter et répondre au devis
                        </a>
                      </p>`
                    : ""
                }

                <p style="margin:28px 0 0;">Bien cordialement,<br/><strong>L'équipe</strong></p>
              </div>
            </div>
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
  } catch (error: unknown) {
    console.error("Erreur auto-relances:", error);

    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur auto-relances") },
      { status: 500 }
    );
  }
}
