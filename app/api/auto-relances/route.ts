import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";
import { getResendFromEmail, sendTransactionalEmail } from "@/lib/email-delivery";
import { buildPremiumDocumentEmail } from "@/lib/email-templates";
import { getErrorMessage } from "@/lib/server-utils";

type RelanceRuleKey =
  | "devis_non_vu"
  | "devis_vu_non_accepte"
  | "facture_impayee";

type RelanceSettings = {
  devis_non_vu_enabled?: boolean | null;
  devis_non_vu_days?: number | null;
  devis_non_vu_template?: string | null;
  devis_vu_non_accepte_enabled?: boolean | null;
  devis_vu_non_accepte_days?: number | null;
  devis_vu_non_accepte_template?: string | null;
  facture_impayee_enabled?: boolean | null;
  facture_impayee_days?: number | null;
  facture_impayee_template?: string | null;
};

type DevisRelance = {
  id: string;
  user_id: string;
  numero: string | null;
  client: string | null;
  email: string | null;
  public_token: string | null;
  port_ht: number | null;
  derniere_relance: string | null;
  date_envoi: string | null;
  date_creation: string | null;
  date_vue: string | null;
  derniere_vue: string | null;
  statut: string | null;
  lignes_devis?: Array<{
    quantite: number | null;
    prix_unitaire: number | null;
  }> | null;
};

type FactureRelance = {
  id: string;
  user_id: string;
  numero: string | null;
  client: string | null;
  email: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  statut: string | null;
  date_creation: string | null;
  date_envoi: string | null;
  date_echeance: string | null;
  derniere_relance: string | null;
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

type RelanceResult = {
  document: string | null;
  rule: RelanceRuleKey;
  success: boolean;
  error?: unknown;
  warning?: string;
  sentToOriginalRecipient?: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_RELANCE_SETTINGS = {
  devis_non_vu_enabled: true,
  devis_non_vu_days: 2,
  devis_non_vu_template:
    "Bonjour {{client}}, nous revenons vers vous concernant le devis {{numero}}. Vous pouvez le consulter ici : {{lien}}.",
  devis_vu_non_accepte_enabled: true,
  devis_vu_non_accepte_days: 3,
  devis_vu_non_accepte_template:
    "Bonjour {{client}}, vous avez consulté le devis {{numero}}. Avez-vous besoin d'une précision avant validation ? Lien : {{lien}}.",
  facture_impayee_enabled: true,
  facture_impayee_days: 0,
  facture_impayee_template:
    "Bonjour {{client}}, nous vous rappelons que la facture {{numero}} est en attente de règlement. Vous pouvez la régler ici : {{lien_paiement}}.",
};

function daysSince(date?: string | null) {
  if (!date) return 0;
  return (Date.now() - new Date(date).getTime()) / DAY_MS;
}

function settingForUser(
  settingsByUser: Map<string, RelanceSettings>,
  userId: string
) {
  const row = settingsByUser.get(userId) || {};

  return {
    devisNonVuEnabled:
      row.devis_non_vu_enabled ?? DEFAULT_RELANCE_SETTINGS.devis_non_vu_enabled,
    devisNonVuDays:
      row.devis_non_vu_days ?? DEFAULT_RELANCE_SETTINGS.devis_non_vu_days,
    devisNonVuTemplate:
      row.devis_non_vu_template ||
      DEFAULT_RELANCE_SETTINGS.devis_non_vu_template,
    devisVuNonAccepteEnabled:
      row.devis_vu_non_accepte_enabled ??
      DEFAULT_RELANCE_SETTINGS.devis_vu_non_accepte_enabled,
    devisVuNonAccepteDays:
      row.devis_vu_non_accepte_days ??
      DEFAULT_RELANCE_SETTINGS.devis_vu_non_accepte_days,
    devisVuNonAccepteTemplate:
      row.devis_vu_non_accepte_template ||
      DEFAULT_RELANCE_SETTINGS.devis_vu_non_accepte_template,
    factureImpayeeEnabled:
      row.facture_impayee_enabled ??
      DEFAULT_RELANCE_SETTINGS.facture_impayee_enabled,
    factureImpayeeDays:
      row.facture_impayee_days ??
      DEFAULT_RELANCE_SETTINGS.facture_impayee_days,
    factureImpayeeTemplate:
      row.facture_impayee_template ||
      DEFAULT_RELANCE_SETTINGS.facture_impayee_template,
  };
}

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template
  );
}

function totalDevisTTC(devis: DevisRelance) {
  const totalHT =
    (devis.lignes_devis || []).reduce(
      (sum, ligne) =>
        sum + Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0),
      0
    ) + Number(devis.port_ht || 0);

  return {
    totalHT,
    totalTTC: totalHT * 1.2,
  };
}

async function relanceAlreadySent(
  supabaseAdmin: SupabaseClient,
  userId: string,
  documentType: "devis" | "facture",
  documentId: string,
  ruleKey: RelanceRuleKey
) {
  const { data, error } = await supabaseAdmin
    .from("relance_history")
    .select("id")
    .eq("user_id", userId)
    .eq("document_type", documentType)
    .eq("document_id", documentId)
    .eq("rule_key", ruleKey)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function recordRelance(
  supabaseAdmin: SupabaseClient,
  payload: {
    userId: string;
    documentType: "devis" | "facture";
    documentId: string;
    ruleKey: RelanceRuleKey;
    recipientEmail: string;
    subject: string;
    status: "sent" | "test_fallback" | "error";
    details?: string;
  }
) {
  const { error } = await supabaseAdmin.from("relance_history").insert({
    user_id: payload.userId,
    document_type: payload.documentType,
    document_id: payload.documentId,
    rule_key: payload.ruleKey,
    recipient_email: payload.recipientEmail,
    subject: payload.subject,
    status: payload.status,
    details: payload.details || null,
  });

  if (error) throw error;
}

async function loadEntreprise(
  supabaseAdmin: SupabaseClient,
  userId: string,
  cache: Map<string, EntrepriseSettings | null>
) {
  if (cache.has(userId)) return cache.get(userId) || null;

  const { data } = await supabaseAdmin
    .from("entreprise_settings")
    .select(
      "nom, adresse, ville, telephone, email, siret, tva, logo_url, site_web, couleur_principale"
    )
    .eq("user_id", userId)
    .maybeSingle<EntrepriseSettings>();

  cache.set(userId, data || null);
  return data || null;
}

async function createFacturePaymentUrl(
  stripe: Stripe | null,
  supabaseAdmin: SupabaseClient,
  facture: FactureRelance,
  origin: string
) {
  if (!stripe || !facture.email || Number(facture.total_ttc || 0) <= 0) {
    return "";
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: facture.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(facture.total_ttc || 0) * 100),
          product_data: {
            name: `Facture ${facture.numero || ""}`.trim(),
            description: facture.client ? `Client : ${facture.client}` : undefined,
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

  await supabaseAdmin
    .from("factures")
    .update({ stripe_session_id: session.id })
    .eq("id", facture.id);

  return session.url || "";
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
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
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const [{ data: devisData, error: devisError }, { data: facturesData, error: facturesError }] =
      await Promise.all([
        supabaseAdmin
          .from("devis")
          .select("*, lignes_devis(quantite, prix_unitaire)")
          .in("statut", ["Envoyé", "À relancer"])
          .not("email", "is", null)
          .returns<DevisRelance[]>(),
        supabaseAdmin
          .from("factures")
          .select("*")
          .neq("statut", "Payée")
          .not("email", "is", null)
          .returns<FactureRelance[]>(),
      ]);

    if (devisError || facturesError) {
      return NextResponse.json(
        { error: devisError?.message || facturesError?.message },
        { status: 500 }
      );
    }

    const devis = devisData || [];
    const factures = facturesData || [];
    const userIds = Array.from(
      new Set([...devis.map((item) => item.user_id), ...factures.map((item) => item.user_id)])
    );

    const settingsByUser = new Map<string, RelanceSettings>();

    if (userIds.length > 0) {
      const { data: settingsRows, error: settingsError } = await supabaseAdmin
        .from("relance_settings")
        .select("*")
        .in("user_id", userIds)
        .returns<Array<RelanceSettings & { user_id: string }>>();

      if (settingsError) {
        return NextResponse.json({ error: settingsError.message }, { status: 500 });
      }

      (settingsRows || []).forEach((row) => settingsByUser.set(row.user_id, row));
    }

    const entrepriseCache = new Map<string, EntrepriseSettings | null>();
    const results: RelanceResult[] = [];

    for (const d of devis) {
      if (!d.email || !d.public_token || !d.date_envoi) continue;

      const userSettings = settingForUser(settingsByUser, d.user_id);
      const acceptUrl = `${origin}/devis/${d.public_token}`;
      const { totalHT, totalTTC } = totalDevisTTC(d);
      const entreprise = await loadEntreprise(supabaseAdmin, d.user_id, entrepriseCache);

      const candidates: Array<{
        ruleKey: RelanceRuleKey;
        enabled: boolean;
        shouldSend: boolean;
        template: string;
        subject: string;
      }> = [
        {
          ruleKey: "devis_non_vu",
          enabled: userSettings.devisNonVuEnabled,
          shouldSend:
            !d.date_vue && daysSince(d.date_envoi) >= userSettings.devisNonVuDays,
          template: userSettings.devisNonVuTemplate,
          subject: `Avez-vous vu le devis ${d.numero || ""} ?`,
        },
        {
          ruleKey: "devis_vu_non_accepte",
          enabled: userSettings.devisVuNonAccepteEnabled,
          shouldSend:
            Boolean(d.date_vue) &&
            daysSince(d.derniere_vue || d.date_vue) >=
              userSettings.devisVuNonAccepteDays,
          template: userSettings.devisVuNonAccepteTemplate,
          subject: `Suite à votre consultation du devis ${d.numero || ""}`,
        },
      ];

      for (const candidate of candidates) {
        if (!candidate.enabled || !candidate.shouldSend) continue;
        if (
          await relanceAlreadySent(
            supabaseAdmin,
            d.user_id,
            "devis",
            d.id,
            candidate.ruleKey
          )
        ) {
          continue;
        }

        const intro = renderTemplate(candidate.template, {
          client: d.client || "Madame, Monsieur",
          numero: d.numero || "",
          lien: acceptUrl,
          montant_ttc: totalTTC.toFixed(2),
        });

        const delivery = await sendTransactionalEmail(resend, {
          from: getResendFromEmail(),
          to: d.email,
          subject: candidate.subject,
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
            eyebrow: "Relance devis",
            title: `Devis ${d.numero || ""}`,
            numero: d.numero || undefined,
            client: d.client || undefined,
            intro,
            totalHT: totalHT.toFixed(2),
            totalTTC: totalTTC.toFixed(2),
            ctaLabel: "Consulter le devis",
            ctaUrl: acceptUrl,
            note: "Ce rappel est automatique et sécurisé.",
          }),
        }, "auto-relances");

        if (!delivery.success) {
          results.push({
            document: d.numero,
            rule: candidate.ruleKey,
            success: false,
            error: delivery.error,
          });
          continue;
        }

        await recordRelance(supabaseAdmin, {
          userId: d.user_id,
          documentType: "devis",
          documentId: d.id,
          ruleKey: candidate.ruleKey,
          recipientEmail: d.email,
          subject: candidate.subject,
          status: delivery.sentToOriginalRecipient ? "sent" : "test_fallback",
          details: delivery.warning,
        });

        await supabaseAdmin
          .from("devis")
          .update({
            statut: "Envoyé",
            derniere_relance: new Date().toISOString(),
          })
          .eq("id", d.id);

        results.push({
          document: d.numero,
          rule: candidate.ruleKey,
          success: true,
          warning: delivery.warning,
          sentToOriginalRecipient: delivery.sentToOriginalRecipient,
        });
      }
    }

    for (const facture of factures) {
      if (!facture.email) continue;

      const userSettings = settingForUser(settingsByUser, facture.user_id);
      const dueDate = facture.date_echeance || facture.date_envoi || facture.date_creation;
      const shouldSend =
        userSettings.factureImpayeeEnabled &&
        Boolean(dueDate) &&
        daysSince(dueDate) >= userSettings.factureImpayeeDays;

      if (!shouldSend) continue;

      if (
        await relanceAlreadySent(
          supabaseAdmin,
          facture.user_id,
          "facture",
          facture.id,
          "facture_impayee"
        )
      ) {
        continue;
      }

      const entreprise = await loadEntreprise(
        supabaseAdmin,
        facture.user_id,
        entrepriseCache
      );
      const paymentUrl = await createFacturePaymentUrl(
        stripe,
        supabaseAdmin,
        facture,
        origin
      );
      const subject = `Rappel facture ${facture.numero || ""}`;
      const intro = renderTemplate(userSettings.factureImpayeeTemplate, {
        client: facture.client || "Madame, Monsieur",
        numero: facture.numero || "",
        lien_paiement: paymentUrl || "lien de paiement indisponible",
        montant_ttc: Number(facture.total_ttc || 0).toFixed(2),
      });

      const delivery = await sendTransactionalEmail(resend, {
        from: getResendFromEmail(),
        to: facture.email,
        subject,
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
          eyebrow: "Relance facture",
          title: `Facture ${facture.numero || ""}`,
          numero: facture.numero || undefined,
          client: facture.client || undefined,
          intro,
          totalHT: Number(facture.total_ht || 0).toFixed(2),
          totalTTC: Number(facture.total_ttc || 0).toFixed(2),
          ctaLabel: paymentUrl ? "Payer la facture" : undefined,
          ctaUrl: paymentUrl,
          note: paymentUrl
            ? "Le paiement est traité par Stripe sur une page sécurisée."
            : "Vous pouvez répondre à cet email pour toute question concernant le règlement.",
        }),
      }, "auto-relances");

      if (!delivery.success) {
        results.push({
          document: facture.numero,
          rule: "facture_impayee",
          success: false,
          error: delivery.error,
        });
        continue;
      }

      await recordRelance(supabaseAdmin, {
        userId: facture.user_id,
        documentType: "facture",
        documentId: facture.id,
        ruleKey: "facture_impayee",
        recipientEmail: facture.email,
        subject,
        status: delivery.sentToOriginalRecipient ? "sent" : "test_fallback",
        details: delivery.warning,
      });

      await supabaseAdmin
        .from("factures")
        .update({ derniere_relance: new Date().toISOString() })
        .eq("id", facture.id);

      results.push({
        document: facture.numero,
        rule: "facture_impayee",
        success: true,
        warning: delivery.warning,
        sentToOriginalRecipient: delivery.sentToOriginalRecipient,
      });
    }

    return NextResponse.json({
      success: true,
      checked: devis.length + factures.length,
      sent: results.filter((result) => result.success).length,
      testFallbacks: results.filter(
        (result) => result.success && result.sentToOriginalRecipient === false
      ).length,
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
