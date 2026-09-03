"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerificationState = "checking" | "paid" | "pending" | "error";

export default function PaiementSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const token = searchParams.get("token");
  const [verification, setVerification] = useState<VerificationState>(() =>
    sessionId ? "checking" : "error"
  );
  const retourHref = token ? `/devis/${token}` : "/client";
  const retourLabel = token ? "Retour au devis" : "Retour";

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const controller = new AbortController();

    async function verifyPayment() {
      try {
        const response = await fetch("/api/stripe-session-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, token }),
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as { paid?: boolean };

        if (!response.ok) {
          setVerification("error");
          return;
        }

        setVerification(data.paid ? "paid" : "pending");
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        setVerification("error");
      }
    }

    void verifyPayment();

    return () => controller.abort();
  }, [sessionId, token]);

  const content = {
    checking: {
      eyebrow: "Vérification sécurisée",
      title: "Vérification du paiement…",
      description:
        "Nous interrogeons Stripe avant de confirmer le règlement. Cette étape prend généralement quelques secondes.",
      color: "text-blue-300",
    },
    paid: {
      eyebrow: "Paiement validé",
      title: "Paiement confirmé",
      description:
        "Stripe confirme que votre paiement a été encaissé. Le statut du document est mis à jour automatiquement.",
      color: "text-green-300",
    },
    pending: {
      eyebrow: "Paiement en traitement",
      title: "Confirmation en attente",
      description:
        "Stripe n'a pas encore confirmé l'encaissement. Revenez au document et vérifiez son statut dans quelques instants.",
      color: "text-amber-300",
    },
    error: {
      eyebrow: "Vérification impossible",
      title: "Paiement non confirmé",
      description:
        "Nous ne pouvons pas confirmer ce paiement à partir de ce lien. Aucun statut payé n'est affiché sans validation de Stripe.",
      color: "text-red-300",
    },
  }[verification];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <section className="max-w-xl rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <p
          className={`text-sm font-semibold uppercase tracking-[0.3em] ${content.color}`}
        >
          {content.eyebrow}
        </p>

        <h1 className="mt-4 text-4xl font-black">{content.title}</h1>

        <p className="mt-4 text-slate-300">
          {content.description}
          {verification === "paid" &&
            (token
              ? " Vous pouvez fermer cette page ou retourner au devis."
              : " Vous pouvez fermer cette page ou retourner à la page précédente.")}
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href={retourHref}
            className={`rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition ${
              verification === "checking"
                ? "pointer-events-none bg-slate-700 opacity-60"
                : "bg-blue-600 shadow-blue-900/30 hover:bg-blue-500"
            }`}
          >
            {retourLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
