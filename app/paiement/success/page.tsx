import Link from "next/link";
import { Suspense } from "react";
import PaiementSuccessContent from "./PaiementSuccessContent";

export default function PaiementSuccessPage() {
  return (
    <Suspense fallback={<PaiementSuccessFallback />}>
      <PaiementSuccessContent />
    </Suspense>
  );
}

function PaiementSuccessFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-300">
          Paiement
        </p>

        <h1 className="mt-4 text-4xl font-black">Chargement...</h1>

        <div className="mt-8 flex justify-center">
          <Link
            href="/client"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black"
          >
            Retour au portail client
          </Link>
        </div>
      </section>
    </main>
  );
}
