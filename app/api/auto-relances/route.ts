import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { buildPremiumDocumentEmail } from "@/lib/email-templates";
import { getErrorMessage } from "@/lib/server-utils";

type DevisRelance = {
  id: string;
  user_id: string;
  numero: string | null;
  client: string | null;
  email: string;
  public_token: string | null;
  port_ht: number | null;
  derniere_relance: string | null;
  date_envoi: string | null;
  date_creation: string | null;
  lignes_devis?: Array<{
    quantite: number | null;
    prix_unitaire: number | null;
  }> | null;
};

type RelanceResult = {
  devis: string | null;
  success: boolean;
  error?: unknown;
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
      .select("*, lignes_devis(quantite, prix_unitaire)")
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
      const totalHT =
        (d.lignes_devis || []).reduce(
          (sum, ligne) =>
            sum + Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0),
          0
        ) + Number(d.port_ht || 0);
      const totalTTC = totalHT * 1.2;
      const { data: entreprise } = await supabaseAdmin
        .from("entreprise_settings")
        .select(
          "nom, adresse, ville, telephone, email, siret, tva, logo_url, site_web, couleur_principale"
        )
        .eq("user_id", d.user_id)
        .maybeSingle<EntrepriseSettings>();

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: d.email,
        subject: `Relance concernant votre devis ${d.numero || ""}`,
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
          eyebrow: "Suivi de devis",
          title: `Devis ${d.numero || ""}`,
          numero: d.numero || undefined,
          client: d.client || undefined,
          intro:
            "Nous revenons vers vous concernant ce devis. Vous pouvez le consulter, l'accepter ou répondre à cet email si vous avez une question.",
          totalHT: totalHT.toFixed(2),
          totalTTC: totalTTC.toFixed(2),
          ctaLabel: acceptUrl ? "Consulter et répondre au devis" : undefined,
          ctaUrl: acceptUrl,
          note: "Ce rappel est automatique et sécurisé.",
        }),
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
