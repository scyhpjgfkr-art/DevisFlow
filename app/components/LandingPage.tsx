"use client";

type LandingPageProps = {
  onLogin: () => void;
  onSignup: () => void;
};

const problems = [
  "Les devis partent par email puis restent sans réponse.",
  "Personne ne sait si le client a vraiment consulté le document.",
  "Les relances sont manuelles, irrégulières et faciles à oublier.",
  "Les acomptes arrivent trop tard, alors que la mission doit démarrer vite.",
];

const solutionSteps = [
  ["Créer", "Préparez un devis professionnel avec vos prestations et conditions."],
  ["Envoyer", "Partagez un lien client sécurisé, sans compte à créer côté client."],
  ["Valider", "Le client accepte ou refuse en ligne, avec une réponse verrouillée."],
  ["Encaisser", "Demandez un acompte ou envoyez la facture au bon moment."],
];

const features = [
  ["Suivi des vues", "Sachez si le devis a été consulté, combien de fois et quand."],
  ["Acceptation en ligne", "Obtenez une validation claire avec nom du signataire et preuve."],
  ["Acompte Stripe", "Encaissez un acompte après acceptation, sans ressaisie inutile."],
  ["PDF professionnels", "Envoyez des documents propres avec votre identité d'entreprise."],
  ["Relances simples", "Gardez le contrôle des devis non vus, vus mais non acceptés et factures impayées."],
  ["Mémoire Commerciale", "Retrouvez les anciens prix et les ventes similaires avant de chiffrer."],
];

const testimonials = [
  {
    quote:
      "Emplacement témoignage client : une PME explique comment elle suit enfin ses devis envoyés.",
    author: "Dirigeant PME de services",
  },
  {
    quote:
      "Emplacement témoignage client : un artisan raconte comment l'acompte accélère le démarrage des missions.",
    author: "Artisan indépendant",
  },
  {
    quote:
      "Emplacement témoignage client : une agence décrit le gain de temps sur les relances.",
    author: "Agence B2B",
  },
];

const faqs = [
  {
    question: "DevisFlow remplace-t-il mon logiciel de comptabilité ?",
    answer:
      "Non. DevisFlow reste concentré sur le cycle devis, acceptation, acompte, facture et relance.",
  },
  {
    question: "Mon client doit-il créer un compte ?",
    answer:
      "Non. Il reçoit un lien sécurisé pour consulter, accepter, refuser ou payer depuis son navigateur.",
  },
  {
    question: "Pourquoi demander une démonstration ?",
    answer:
      "La démonstration permet de vérifier rapidement si DevisFlow correspond à votre manière de vendre et de relancer.",
  },
  {
    question: "La Mémoire Commerciale invente-t-elle des prix ?",
    answer:
      "Non. Elle s'appuie uniquement sur les ventes historiques importées et affiche pourquoi un prix est suggéré.",
  },
];

export default function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-slate-800 bg-slate-950/90 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xl font-black">DevisFlow</p>
            <p className="text-xs text-slate-400">Devis suivis, acceptés, encaissés</p>
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
              className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 sm:inline-flex"
            >
              Demander une démonstration
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            SaaS devis pour TPE/PME de services
          </p>
          <h1 className="mt-6 max-w-5xl text-4xl font-black leading-tight md:text-6xl">
            Faites accepter vos devis et encaissez vos acomptes plus vite.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Suivez chaque devis, sachez quand il est consulté, obtenez une
            validation en ligne et demandez un acompte en quelques clics.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onSignup}
              className="rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500"
            >
              Demander une démonstration
            </button>
            <button
              onClick={onLogin}
              className="rounded-xl border border-slate-700 px-6 py-4 text-sm font-bold text-slate-200 hover:bg-slate-900"
            >
              Accéder à mon espace
            </button>
          </div>

          <div className="mt-12 grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-4">
            {["Devis envoyé", "Client a vu", "Accepté en ligne", "Acompte payé"].map(
              (step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
                >
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold">
                    {index + 1}
                  </span>
                  <p className="mt-4 font-bold">{step}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Problème
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Pourquoi les PME perdent du temps.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {problems.map((problem) => (
            <article
              key={problem}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <p className="leading-7 text-slate-300">{problem}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Solution
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Comment DevisFlow règle le problème.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {solutionSteps.map(([title, description]) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Fonctionnalités
          </p>
          <h2 className="mt-3 text-3xl font-black">
            Six leviers pour accélérer la signature.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            >
              <h3 className="font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-blue-500/20 bg-blue-500/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Différenciateur
            </p>
            <h2 className="mt-3 text-3xl font-black">Mémoire Commerciale.</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Les PME ont souvent leurs prix dans d&apos;anciennes factures, des
              fichiers Excel ou la mémoire du dirigeant. DevisFlow aide à
              retrouver les anciens prix sans les inventer.
            </p>
          </div>
          <div className="rounded-3xl border border-blue-400/20 bg-slate-950/70 p-6">
            <p className="text-sm font-semibold text-blue-100">
              Exemple de suggestion justifiée
            </p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>Produit similaire : prestation de maintenance mensuelle.</p>
              <p>Prix médian observé : 480 € HT.</p>
              <p>Dernière vente : 510 € HT, client Dupont SARL.</p>
              <p>Confiance : basée sur 8 ventes historiques.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
          Témoignages
        </p>
        <h2 className="mt-3 text-3xl font-black">Ils pourront bientôt le dire.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.author}
              className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6"
            >
              <p className="leading-7 text-slate-300">“{testimonial.quote}”</p>
              <p className="mt-5 text-sm font-semibold text-slate-400">
                {testimonial.author}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-3xl font-black">FAQ</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <h3 className="font-bold">{faq.question}</h3>
                <p className="mt-3 leading-7 text-slate-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-black md:text-4xl">
            Voyez en 15 minutes si DevisFlow peut accélérer vos devis.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Demandez une démonstration et testez le parcours complet : devis,
            lien client, acceptation, acompte et relance.
          </p>
          <button
            onClick={onSignup}
            className="mt-8 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500"
          >
            Demander une démonstration
          </button>
        </div>
      </section>
    </main>
  );
}
