import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { token, statut, commentaire } = await request.json();

    if (!token || !["Accepté", "Refusé"].includes(statut)) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const { error } = await supabase
      .from("devis")
      .update({
        statut,
        commentaire_client: commentaire || "",
        date_reponse: new Date().toISOString(),
      })
      .eq("public_token", token);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}