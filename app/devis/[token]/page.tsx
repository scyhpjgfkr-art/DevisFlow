"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LigneDevisPublic = {
  reference: string | null;
  designation: string | null;
  quantite: number | null;
  prix_unitaire: number | null;
};

type DevisPublic = {
  id: string;
  numero: string;
  client: string | null;
  societe: string | null;
  email: string | null;
  telephone: string | null;
  echeance: string | null;
  port_ht: number | null;
  statut: string | null;
  date_creation: string | null;
  conditions_devis: string | null;
  signataire_nom: string | null;
  commentaire_client: string | null;
  date_reponse: string | null;
  date_acceptation: string | null;
  date_refus: string | null;
  response_locked_at: string | null;
  acompte_type: "none" | "percent" | "fixed" | null;
  acompte_montant: number | null;
  acompte_pourcentage: number | null;
  acompte_statut: "not_required" | "pending" | "paid" | null;
  acompte_date_paiement: string | null;
  acompte_montant_paye: number | null;
  entreprise_nom: string | null;
  entreprise_adresse: string | null;
  entreprise_ville: string | null;
  entreprise_telephone: string | null;
  entreprise_email: string | null;
  entreprise_siret: string | null;
  entreprise_tva: string | null;
  entreprise_logo_url: string | null;
  entreprise_site_web: string | null;
  entreprise_couleur_principale: string | null;
  lignes_devis: LigneDevisPublic[] | null;
};

type ReponseApi = {
  success?: boolean;
  error?: string;
  devis?: {
    statut: string;
    signataire_nom: string | null;
    commentaire_client: string | null;
    date_reponse: string | null;
    date_acceptation: string | null;
    date_refus: string | null;
    response_locked_at: string | null;
  };
};

type CheckoutAcompteResponse = {
  url?: string;
  error?: string;
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseignée";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClasses(statut?: string | null) {
  if (statut === "Accepté") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (statut === "Refusé") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (statut === "Envoyé" || statut === "À relancer") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function initials(value?: string | null) {
  const source = value?.trim() || "DF";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function normalizeBrandColor(value?: string | null) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value || "#0f172a" : "#0f172a";
}

function normalizeWebsite(value?: string | null) {
  const url = value?.trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function defaultConditions(echeance?: string | null) {
  return [
    "Devis valable 30 jours à compter de sa date d'émission.",
    `Conditions de règlement : ${echeance || "à définir avec l'entreprise"}.`,
    "La validation en ligne vaut accord sur le périmètre, les montants et les conditions indiqués.",
  ];
}

function isDevisLocked(devis?: DevisPublic | null) {
  return Boolean(
    devis?.statut === "Accepté" ||
      devis?.statut === "Refusé" ||
      devis?.response_locked_at ||
      devis?.date_acceptation ||
      devis?.date_refus
  );
}

function calculateAcompte(totalTTC: number, devis?: DevisPublic | null) {
  if (!devis || devis.acompte_type === "none" || !devis.acompte_type) {
    return 0;
  }

  if (devis.acompte_type === "percent") {
    return totalTTC * (Number(devis.acompte_pourcentage || 0) / 100);
  }

  return Number(devis.acompte_montant || 0);
}

export default function DevisPublicPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [devis, setDevis] = useState<DevisPublic | null>(null);
  const [signataireNom, setSignataireNom] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<"Accepté" | "Refusé" | null>(null);
  const [payingAcompte, setPayingAcompte] = useState(false);
  const [message, setMessage] = useState("");
  const [acompteMessage, setAcompteMessage] = useState("");

  useEffect(() => {
    async function chargerDevis() {
      setLoading(true);

      const { data, error } = await supabase
        .rpc("get_public_devis_by_token", { p_token: token })
        .returns<DevisPublic[]>()
        .maybeSingle();

      if (error) {
        console.error(error);
        setMessage("Impossible de charger ce devis.");
      } else {
        setDevis(data);
        setSignataireNom(data?.signataire_nom || "");
        setCommentaire(data?.commentaire_client || "");
      }

      setLoading(false);
    }

    if (token) {
      void chargerDevis();
    }
  }, [token]);

  async function repondre(statut: "Accepté" | "Refusé") {
    if (!token || !devis) return;

    const nom = signataireNom.trim();

    if (!nom) {
      setMessage("Indiquez le nom du signataire avant de répondre au devis.");
      return;
    }

    setMessage("");
    setSending(statut);

    const response = await fetch("/api/repondre-devis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        statut,
        signataireNom: nom,
        commentaire,
      }),
    });

    const data = (await response.json()) as ReponseApi;
    setSending(null);

    if (!response.ok) {
      setMessage(data.error || "Impossible d'enregistrer votre réponse.");
      return;
    }

    setDevis((current) =>
      current
        ? {
            ...current,
            statut: data.devis?.statut || statut,
            signataire_nom: data.devis?.signataire_nom || nom,
            commentaire_client: data.devis?.commentaire_client || commentaire,
            date_reponse: data.devis?.date_reponse || new Date().toISOString(),
            date_acceptation: data.devis?.date_acceptation || current.date_acceptation,
            date_refus: data.devis?.date_refus || current.date_refus,
            response_locked_at:
              data.devis?.response_locked_at || current.response_locked_at,
          }
        : current
    );
    setMessage(
      statut === "Accepté"
        ? "Merci, votre acceptation a bien été enregistrée."
        : "Votre refus a bien été enregistré."
    );
  }

  async function payerAcompte() {
    if (!token) return;

    setAcompteMessage("");
    setPayingAcompte(true);

    try {
      const response = await fetch("/api/stripe-acompte-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as CheckoutAcompteResponse;

      if (!response.ok || !data.url) {
        setAcompteMessage(
          data.error || "Impossible de préparer le paiement de l'acompte."
        );
        setPayingAcompte(false);
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error(error);
      setAcompteMessage("Erreur lors de la redirection vers Stripe.");
      setPayingAcompte(false);
    }
  }

  const lignes = devis?.lignes_devis || [];
  const totalLignes = lignes.reduce(
    (sum, ligne) =>
      sum + Number(ligne.quantite || 0) * Number(ligne.prix_unitaire || 0),
    0
  );
  const portHT = Number(devis?.port_ht || 0);
  const totalHT = totalLignes + portHT;
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;
  const reponseFinale = isDevisLocked(devis);
  const conditions = devis?.conditions_devis?.trim()
    ? devis.conditions_devis.split("\n").filter(Boolean)
    : defaultConditions(devis?.echeance);
  const entrepriseNom = devis?.entreprise_nom || "Entreprise";
  const statutAffiche =
    devis?.statut ||
    (devis?.date_acceptation
      ? "Accepté"
      : devis?.date_refus
      ? "Refusé"
      : "En attente");
  const acompteMontant = calculateAcompte(totalTTC, devis);
  const acompteConfigure = acompteMontant > 0;
  const acomptePaye =
    devis?.acompte_statut === "paid" || Boolean(devis?.acompte_date_paiement);
  const acompteLabel = acompteConfigure
    ? `${formatCurrency(acompteMontant)} à régler en acompte`
    : null;
  const brandColor = normalizeBrandColor(devis?.entreprise_couleur_principale);
  const entrepriseSiteWeb = normalizeWebsite(devis?.entreprise_site_web);

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-slate-950 md:px-8">
      <section className="mx-auto max-w-6xl">
        {loading && (
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            Chargement du devis...
          </section>
        )}

        {!loading && !devis && (
          <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">Devis introuvable</h1>
            <p className="mt-2 text-slate-600">
              Le lien est invalide ou le devis n&apos;est plus disponible.
            </p>
          </section>
        )}

        {devis && (
          <div className="space-y-6">
            <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
	                <div className="flex items-start gap-4">
	                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-lg font-black text-white">
	                    {devis.entreprise_logo_url ? (
	                      // eslint-disable-next-line @next/next/no-img-element
	                      <img
	                        src={devis.entreprise_logo_url}
	                        alt={entrepriseNom}
	                        className="h-full w-full object-contain p-2"
	                      />
	                    ) : (
	                      <span
	                        className="flex h-full w-full items-center justify-center"
	                        style={{ backgroundColor: brandColor }}
	                      >
	                        {initials(entrepriseNom)}
	                      </span>
	                    )}
	                  </div>
	                  <div>
	                    <p className="text-sm font-semibold text-slate-500">
	                      {entrepriseNom}
	                    </p>
                    <h1 className="mt-1 text-3xl font-black text-slate-950 md:text-4xl">
                      Devis {devis.numero || ""}
                    </h1>
	                    <p className="mt-2 max-w-2xl text-slate-600">
	                      Merci de vérifier les informations ci-dessous avant de
	                      transmettre votre réponse.
	                    </p>
	                    {entrepriseSiteWeb && (
	                      <a
	                        href={entrepriseSiteWeb}
	                        className="mt-2 inline-block text-sm font-medium text-slate-500 hover:text-slate-950"
	                      >
	                        {entrepriseSiteWeb.replace(/^https?:\/\//, "")}
	                      </a>
	                    )}
	                  </div>
	                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusClasses(
                      statutAffiche
                    )}`}
                  >
                    {statutAffiche}
                  </span>
                  <p className="text-sm text-slate-500">
                    Créé le {formatDate(devis.date_creation)}
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Entreprise</h2>
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p className="font-semibold text-slate-950">{entrepriseNom}</p>
                        {devis.entreprise_adresse && <p>{devis.entreprise_adresse}</p>}
                        {devis.entreprise_ville && <p>{devis.entreprise_ville}</p>}
                        {devis.entreprise_email && <p>{devis.entreprise_email}</p>}
	                        {devis.entreprise_telephone && <p>{devis.entreprise_telephone}</p>}
	                        {entrepriseSiteWeb && (
	                          <p>
	                            <a href={entrepriseSiteWeb} className="hover:text-slate-950">
	                              {entrepriseSiteWeb.replace(/^https?:\/\//, "")}
	                            </a>
	                          </p>
	                        )}
                        {devis.entreprise_siret && <p>SIRET : {devis.entreprise_siret}</p>}
                        {devis.entreprise_tva && <p>TVA : {devis.entreprise_tva}</p>}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold">Client</h2>
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p className="font-semibold text-slate-950">
                          {devis.client || "Client"}
                        </p>
                        {devis.societe && <p>{devis.societe}</p>}
                        {devis.email && <p>{devis.email}</p>}
                        {devis.telephone && <p>{devis.telephone}</p>}
                        <p>Échéance : {devis.echeance || "Non renseignée"}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold">Détail du devis</h2>

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-3 font-semibold">Référence</th>
                          <th className="font-semibold">Désignation</th>
                          <th className="font-semibold">Qté</th>
                          <th className="font-semibold">PU HT</th>
                          <th className="text-right font-semibold">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignes.map((ligne, index) => {
                          const quantite = Number(ligne.quantite || 0);
                          const prixUnitaire = Number(ligne.prix_unitaire || 0);

                          return (
                            <tr key={index} className="border-b border-slate-100">
                              <td className="py-4 text-slate-600">
                                {ligne.reference || "-"}
                              </td>
                              <td className="max-w-[360px] py-4 font-medium text-slate-950">
                                {ligne.designation || "-"}
                              </td>
                              <td className="py-4 text-slate-600">{quantite}</td>
                              <td className="py-4 text-slate-600">
                                {formatCurrency(prixUnitaire)}
                              </td>
                              <td className="py-4 text-right font-semibold text-slate-950">
                                {formatCurrency(quantite * prixUnitaire)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold">Conditions du devis</h2>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {conditions.map((condition) => (
                      <li key={condition} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold">Montant</h2>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>Sous-total HT</span>
                      <span>{formatCurrency(totalLignes)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>Port HT</span>
                      <span>{formatCurrency(portHT)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>Total HT</span>
                      <span>{formatCurrency(totalHT)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-600">
                      <span>TVA 20%</span>
                      <span>{formatCurrency(tva)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex justify-between gap-4 text-xl font-black">
                        <span>Total TTC</span>
                        <span>{formatCurrency(totalTTC)}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {acompteLabel && (
                  <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
                    <h2 className="text-lg font-bold">Acompte prévu</h2>
                    <p className="mt-2 text-sm">{acompteLabel}</p>
                    <p className="mt-2 text-sm">
                      Le solde sera réglé ultérieurement selon les conditions du
                      devis.
                    </p>

                    {acomptePaye ? (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-100 p-4 text-sm text-emerald-900">
                        <p className="font-semibold">Acompte payé</p>
                        {devis.acompte_date_paiement && (
                          <p className="mt-1">
                            Reçu le {formatDateTime(devis.acompte_date_paiement)}
                          </p>
                        )}
                        {devis.acompte_montant_paye && (
                          <p className="mt-1">
                            Montant : {formatCurrency(Number(devis.acompte_montant_paye))}
                          </p>
                        )}
                      </div>
                    ) : statutAffiche === "Accepté" ? (
                      <button
                        onClick={payerAcompte}
                        disabled={payingAcompte}
                        className="mt-4 w-full rounded-lg bg-slate-950 px-5 py-3 font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
                      >
                        {payingAcompte ? "Redirection vers Stripe..." : "Payer l'acompte"}
                      </button>
                    ) : statutAffiche === "Refusé" ? (
                      <p className="mt-4 rounded-lg border border-rose-200 bg-white p-4 text-sm text-rose-700">
                        Ce devis a été refusé, l&apos;acompte n&apos;est plus payable.
                      </p>
                    ) : (
                      <p className="mt-4 rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-900">
                        Le paiement de l&apos;acompte sera disponible après
                        acceptation du devis.
                      </p>
                    )}

                    {acompteMessage && (
                      <p className="mt-4 rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-900">
                        {acompteMessage}
                      </p>
                    )}
                  </section>
                )}

                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold">Votre réponse</h2>

                  {reponseFinale ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-950">
                        Réponse enregistrée : {statutAffiche}
                      </p>
                      {devis.signataire_nom && (
                        <p className="mt-2">Signataire : {devis.signataire_nom}</p>
                      )}
                      {devis.date_reponse && (
                        <p>Horodatage : {formatDateTime(devis.date_reponse)}</p>
                      )}
                      {devis.commentaire_client && (
                        <p className="mt-2">Commentaire : {devis.commentaire_client}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <label className="mt-4 block">
                        <span className="text-sm font-semibold text-slate-700">
                          Nom du signataire
                        </span>
                        <input
                          value={signataireNom}
                          onChange={(event) => setSignataireNom(event.target.value)}
                          placeholder="Nom et prénom"
                          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                        />
                      </label>

                      <label className="mt-4 block">
                        <span className="text-sm font-semibold text-slate-700">
                          Commentaire optionnel
                        </span>
                        <textarea
                          value={commentaire}
                          onChange={(event) => setCommentaire(event.target.value)}
                          rows={4}
                          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                        />
                      </label>

                      <div className="mt-5 grid gap-3">
                        <button
                          onClick={() => repondre("Accepté")}
                          disabled={Boolean(sending)}
                          className="rounded-lg bg-emerald-600 px-5 py-4 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {sending === "Accepté"
                            ? "Validation en cours..."
                            : "Accepter le devis"}
                        </button>
                        <button
                          onClick={() => repondre("Refusé")}
                          disabled={Boolean(sending)}
                          className="rounded-lg border border-rose-300 px-5 py-3 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {sending === "Refusé" ? "Envoi en cours..." : "Refuser le devis"}
                        </button>
                      </div>
                    </>
                  )}

                  {message && (
                    <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {message}
                    </p>
                  )}
                </section>

                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950 shadow-sm">
                  <h2 className="font-bold">Message de confiance</h2>
                  <p className="mt-2">
                    Votre réponse est enregistrée avec son horodatage. Une fois
                    le devis accepté ou refusé, la réponse ne peut plus être
                    modifiée depuis ce lien.
                  </p>
                </section>
              </aside>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
