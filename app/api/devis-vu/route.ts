import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/server-utils";

type DevisVuPayload = {
  token?: string;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    ""
  );
}

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as DevisVuPayload;

    if (!token) {
      return NextResponse.json({ error: "Token devis manquant" }, { status: 400 });
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
    const now = new Date().toISOString();
    const ip = getClientIp(request);

    const { data: devis, error: selectError } = await supabaseAdmin
      .from("devis")
      .select("id, date_vue, nombre_vues")
      .eq("public_token", token)
      .maybeSingle<{
        id: string;
        date_vue: string | null;
        nombre_vues: number | null;
      }>();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!devis) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("devis")
      .update({
        date_vue: devis.date_vue || now,
        derniere_vue: now,
        nombre_vues: Number(devis.nombre_vues || 0) + 1,
        ip_derniere_vue: ip || null,
      })
      .eq("id", devis.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Erreur suivi devis") },
      { status: 500 }
    );
  }
}
