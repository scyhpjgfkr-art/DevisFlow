"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type DevisClient = {
  id: string;
  numero: string;
  client: string;
  societe: string;
  email: string;
  statut: string;
  date_creation: string;
};

type FactureClient = {
  id: string;
  numero: string;
  client: string;
  societe: string;
  email: string;
  statut: string;
  date_creation: string;
  total_ht: number;
  total_ttc: number;
};

export default function PortailClient() {
  const [email, setEmail] = useState("");
  const [devis, setDevis] = useState<DevisClient[]>([]);
  const [factures, setFactures] = useState<FactureClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function rechercherDocuments() {
    if (!email.trim()) {
      alert("Entre ton email client.");
      return;
    }

    setLoading(true);
    setSearched(true);

    const { data: devisData, error: devisError } = await supabase
      .from("devis")
      .select("id, numero, client, societe, email, statut, date_creation")
      .eq("email", email.trim())
      .order("date_creation", { ascending: false });

    const { data: facturesData, error: facturesError } = await supabase
      .from("factures")
      .select("id, numero, client, societe, email, statut, date_creation, total_ht, total_ttc")
      .eq("email", email.trim())
      .order("date_creation", { ascending: false });

    if (devisError) {
      console.error(devisError);
      alert("Erreur chargement devis.");
    }

    if (facturesError) {
      console.error(facturesError);
      alert("Erreur chargement factures.");
    }

    setDevis(devisData || []);
    setFactures((facturesData as FactureClient[]) || []);
    setLoading(false);
  }

  async function payerFacture(facture: FactureClient) {
    if (facture.statut === "Payée") {
      alert("Cette facture est déjà marquée comme payée.");
      return;
    }

    setPayingId(facture.id);

    try {
      const response = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factureId: facture.id,
          numero: facture.numero,
          client: facture.client,
          email: facture.email,
          totalTTC: Number(facture.total_ttc || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(data?.error || "Erreur création paiement.");
        setPayingId(null);
        return;
      }

      if (!data.url) {
        alert("Stripe n'a pas retourné de lien de paiement.");
        setPayingId(null);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Erreur paiement Stripe.");
      setPayingId(null);
    }
  }

  function badgeStyle(statut: string) {
    if (statut === "Accepté" || statut === "Payée") {
      return "border-green-500 bg-green-500/10 text-green-300";
    }

    if (statut === "Refusé") {
      return "border-red-500 bg-red-500/10 text-red-300";
    }

    if (statut === "À relancer" || statut === "À payer") {
      return "border-yellow-500 bg-yellow-500/10 text-yellow-300";
    }

    return "border-slate-600 bg-slate-800 text-slate-300";
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            Portail Client
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            🌌 Espace documents
          </h1>

          <p className="mt-4 max-w-2xl text-slate-300">
            Retrouvez vos devis, factures et statuts de paiement depuis un espace simple.
          </p>

          <div className="mt-8 flex flex-col gap-3 md:flex-row">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email client"
              type="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none focus:border-violet-400"
            />

            <button
              onClick={rechercherDocuments}
              disabled={loading}
              className="rounded-xl bg-white px-6 py-4 font-semibold text-black disabled:opacity-50"
            >
              {loading ? "Recherche..." : "Voir mes documents"}
            </button>
          </div>
        </header>

        {searched && (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card title="Devis trouvés" value={devis.length} />
            <Card title="Factures trouvées" value={factures.length} />
            <Card
              title="Total facturé TTC"
              value={`${factures
                .reduce((sum, f) => sum + Number(f.total_ttc || 0), 0)
                .toFixed(2)} €`}
            />
            <Card
              title="Reste à payer"
              value={`${factures
                .filter((f) => f.statut !== "Payée")
                .reduce((sum, f) => sum + Number(f.total_ttc || 0), 0)
                .toFixed(2)} €`}
            />
          </div>
        )}

        {searched && devis.length === 0 && factures.length === 0 && !loading && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-2xl font-bold">Aucun document trouvé</h2>
            <p className="mt-2 text-slate-400">
              Vérifiez que l’email utilisé est bien celui associé à vos devis ou factures.
            </p>
          </section>
        )}

        {devis.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">📄 Mes devis</h2>
            <p className="mt-2 text-slate-400">
              Consultez vos devis et leur état actuel.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-sm text-slate-300">
                    <th className="py-3">Numéro</th>
                    <th>Client</th>
                    <th>Société</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>

                <tbody>
                  {devis.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800">
                      <td className="py-4 font-semibold">{d.numero}</td>
                      <td>{d.client}</td>
                      <td>{d.societe || "-"}</td>
                      <td>{new Date(d.date_creation).toLocaleDateString("fr-FR")}</td>
                      <td>
                        <span className={`rounded-full border px-3 py-1 text-sm ${badgeStyle(d.statut)}`}>
                          {d.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {factures.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">🧾 Mes factures</h2>
            <p className="mt-2 text-slate-400">
              Suivez les factures émises et payez en ligne par carte bancaire.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-sm text-slate-300">
                    <th className="py-3">Numéro</th>
                    <th>Client</th>
                    <th>Société</th>
                    <th>Date</th>
                    <th>Total TTC</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {factures.map((f) => (
                    <tr key={f.id} className="border-b border-slate-800">
                      <td className="py-4 font-semibold">{f.numero}</td>
                      <td>{f.client}</td>
                      <td>{f.societe || "-"}</td>
                      <td>{new Date(f.date_creation).toLocaleDateString("fr-FR")}</td>
                      <td>{Number(f.total_ttc || 0).toFixed(2)} €</td>
                      <td>
                        <span className={`rounded-full border px-3 py-1 text-sm ${badgeStyle(f.statut)}`}>
                          {f.statut}
                        </span>
                      </td>
                      <td>
                        {f.statut === "Payée" ? (
                          <span className="text-sm text-green-300">Déjà payée</span>
                        ) : (
                          <button
                            onClick={() => payerFacture(f)}
                            disabled={payingId === f.id}
                            className="rounded-xl bg-white px-4 py-2 font-semibold text-black disabled:opacity-50"
                          >
                            {payingId === f.id ? "Redirection..." : "💳 Payer"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Paiement sécurisé via Stripe. Le marquage automatique en “Payée” sera ajouté avec le webhook Stripe.
            </p>
          </section>
        )}

        <footer className="mt-10 text-center text-sm text-slate-500">
          Propulsé par DevisFlow.
        </footer>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
