"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaiementSuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const retourHref = token ? `/devis/${token}` : "/client";
  const retourLabel = token ? "Retour au devis" : "Retour";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-300">
          Paiement validé
        </p>

        <h1 className="mt-4 text-4xl font-black">Paiement confirmé</h1>

        <p className="mt-4 text-slate-300">
          Votre paiement a bien été pris en compte. Le statut du document est
          mis à jour automatiquement. Vous pouvez fermer cette page
          {type === "acompte"
            ? " ou retourner au devis."
            : " ou retourner à la page précédente."}
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href={retourHref}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500"
          >
            {retourLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
