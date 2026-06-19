import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/server-utils";

const statutsAutorises = ["Accepté", "Refusé"] as const;
type StatutReponse = (typeof statutsAutorises)[number];

type RepondreDevisPayload = {
  token?: string;
  statut?: string;
  signataireNom?: string;
  signataire_nom?: string;
  commentaire?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RepondreDevisPayload;
    const { token, statut } = body;
    const signataireNom = (
      body.signataireNom ||
      body.signataire_nom ||
      ""
    ).trim();
    const commentaire = (body.commentaire || "").trim().slice(0, 2000);

    if (!token || !statutsAutorises.includes(statut as StatutReponse)) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    if (!signataireNom) {
      return NextResponse.json(
        { error: "Nom du signataire obligatoire" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Clés Supabase admin manquantes dans .env.local" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: devisExistant, error: selectError } = await supabaseAdmin
      .from("devis")
      .select("id, statut, response_locked_at, date_acceptation, date_refus")
      .eq("public_token", token)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!devisExistant) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    if (
      devisExistant.statut === "Accepté" ||
      devisExistant.statut === "Refusé" ||
      devisExistant.response_locked_at ||
      devisExistant.date_acceptation ||
      devisExistant.date_refus
    ) {
      return NextResponse.json(
        { error: "Ce devis a déjà reçu une réponse définitive." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const statutFinal = statut as StatutReponse;

    const { data, error } = await supabaseAdmin
      .from("devis")
      .update({
        statut: statutFinal,
        signataire_nom: signataireNom,
        commentaire_client: commentaire,
        date_reponse: now,
        date_acceptation: statutFinal === "Accepté" ? now : null,
        date_refus: statutFinal === "Refusé" ? now : null,
        response_locked_at: now,
      })
      .eq("id", devisExistant.id)
      .is("response_locked_at", null)
      .select(
        "id, statut, signataire_nom, commentaire_client, date_reponse, date_acceptation, date_refus, response_locked_at"
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Ce devis a déjà reçu une réponse définitive." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, devis: data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur serveur") },
      { status: 500 }
    );
  }
}
