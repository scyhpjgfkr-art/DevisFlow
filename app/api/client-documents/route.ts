import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "La recherche de documents par email est désactivée. Utilisez le lien sécurisé du devis.",
    },
    { status: 410 }
  );
}
