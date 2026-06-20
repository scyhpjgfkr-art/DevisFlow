"use client";

type LandingPageProps = {
  onLogin: () => void;
  onSignup: () => void;
};

const benefits = [
  "Suivi vu, accepté, acompte payé",
  "Relances automatiques simples",
  "PDF et emails professionnels",
  "Branding entreprise",
  "Acompte Stripe sur devis accepté",
];

const faqs = [
  {
    question: "DevisFlow remplace-t-il un logiciel de comptabilité ?",
    answer:
      "Non. DevisFlow reste focalisé sur le cycle commercial : devis, acceptation, paiement d'acompte, facture et relance.",
  },
  {
    question: "Est-ce adapté à une PME de services ?",
    answer:
      "Oui, l'outil est pensé pour les entreprises de 1 à 20 personnes qui envoient régulièrement des devis et veulent accélérer les réponses clients.",
  },
  {
    question: "Le client doit-il créer un compte ?",
    answer:
      "Non. Il reçoit un lien sécurisé pour consulter le devis, l'accepter et payer l'acompte si nécessaire.",
  },
];

export default function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 font-black">
              DF
            </div>
            <div>
              <p className="text-lg font-black">DevisFlow</p>
              <p className="text-xs text-slate-400">Devis, acceptation, acompte</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900"
            >
              Se connecter
            </button>
            <button
              onClick={onSignup}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Essayer
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,0.22),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0),rgba(7,17,31,1))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
              SaaS PME services
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Faites accepter vos devis et encaissez vos acomptes plus vite.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              DevisFlow aide les TPE/PME à envoyer des devis professionnels,
              suivre les ouvertures, obtenir une acceptation claire et déclencher
              le paiement d&apos;un acompte sécurisé.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onSignup}
                className="rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500"
              >
                Créer un compte
              </button>
              <button
                onClick={onLogin}
                className="rounded-xl border border-slate-700 px-6 py-4 text-sm font-bold text-slate-200 hover:bg-slate-900"
              >
                J&apos;ai déjà un compte
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-2xl shadow-black/30">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-sm text-slate-400">Pipeline commercial</p>
                  <p className="mt-1 text-2xl font-black">Devis DEV-2026-0042</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                  Accepté
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Envoyé", "12 juin"],
                  ["Vu", "4 vues"],
                  ["Accepté", "Signé"],
                  ["Acompte", "Payé"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-2 font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                <p className="text-sm text-blue-200">Prochaine action</p>
                <p className="mt-2 text-xl font-bold">Facture prête à envoyer</p>
                <p className="mt-2 text-sm text-slate-300">
                  Le client a accepté le devis et réglé l&apos;acompte. Vous savez quoi faire ensuite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Le problème", "Des devis envoyés puis oubliés, peu de visibilité sur les ouvertures et des paiements qui traînent."],
            ["La solution", "Un lien client clair, une acceptation verrouillée, un acompte Stripe et des relances simples."],
            ["Le résultat", "Moins de suivi manuel, plus de réponses, et un meilleur contrôle du cash commercial."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-black">Un flux simple en 4 étapes</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {["Créer le devis", "Envoyer le lien", "Le client accepte", "L'acompte est payé"].map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold">
                  {index + 1}
                </span>
                <p className="mt-5 text-lg font-bold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-3xl font-black">Ce qui accélère vraiment la signature</h2>
          <p className="mt-4 leading-7 text-slate-400">
            DevisFlow reste volontairement concentré sur les actions qui font avancer un devis vers l&apos;accord client.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="font-semibold">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-black">Tarifs simples</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              ["Essentiel", "19 €", "Créer, envoyer et suivre ses devis professionnels."],
              ["Pro", "29 €", "Ajouter l'acompte Stripe et les relances automatiques."],
            ].map(([name, price, description]) => (
              <article key={name} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <h3 className="text-2xl font-bold">{name}</h3>
                <p className="mt-3 text-4xl font-black">{price}<span className="text-base font-medium text-slate-400"> /mois HT</span></p>
                <p className="mt-4 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-black">FAQ</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h3 className="font-bold">{faq.question}</h3>
              <p className="mt-3 leading-7 text-slate-400">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-blue-500/30 bg-blue-500/10 p-8 text-center">
          <h2 className="text-3xl font-black">Prêt à envoyer un devis plus convaincant ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Créez votre premier devis, envoyez un lien client et suivez chaque étape jusqu&apos;au paiement.
          </p>
          <button
            onClick={onSignup}
            className="mt-7 rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white hover:bg-blue-500"
          >
            Commencer maintenant
          </button>
        </div>
      </section>
    </main>
  );
}
