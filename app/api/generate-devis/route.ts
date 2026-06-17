import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY manquante dans .env.local" },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Description manquante" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant de création de devis pour PME. Tu réponds uniquement en JSON valide.",
        },
        {
          role: "user",
          content: `
Génère un devis à partir de cette demande :

${prompt}

Réponds uniquement avec ce JSON :
{
  "client": "",
  "societe": "",
  "email": "",
  "telephone": "",
  "echeance": "À réception de facture",
  "portHT": 0,
  "lignes": [
    {
      "reference": "",
      "designation": "",
      "quantite": 1,
      "prixUnitaire": 0
    }
  ]
}
`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Réponse IA vide" },
        { status: 500 }
      );
    }

    const json = JSON.parse(content);

    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Erreur OpenAI :", error);

    return NextResponse.json(
      {
        error: error?.message || "Erreur génération IA",
      },
      { status: 500 }
    );
  }
}