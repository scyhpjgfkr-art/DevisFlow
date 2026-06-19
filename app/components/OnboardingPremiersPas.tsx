"use client";

type OnboardingPremiersPasProps = {
  entrepriseOk: boolean;
  clientsCount: number;
  produitsCount: number;
  devisCount: number;
  onGoParametres: () => void;
  onGoClients: () => void;
  onGoCatalogue: () => void;
  onGoDevis: () => void;
};

export default function OnboardingPremiersPas({
  entrepriseOk,
  clientsCount,
  produitsCount,
  devisCount,
  onGoParametres,
  onGoClients,
  onGoCatalogue,
  onGoDevis,
}: OnboardingPremiersPasProps) {
  const steps = [
    {
      title: "Configurer l’entreprise",
      description: "Nom, adresse, email, SIRET et TVA pour les PDF.",
      done: entrepriseOk,
      action: "Configurer",
      onClick: onGoParametres,
    },
    {
      title: "Ajouter un client",
      description: "Créer la première fiche client pour gagner du temps.",
      done: clientsCount > 0,
      action: "Ajouter client",
      onClick: onGoClients,
    },
    {
      title: "Ajouter un produit",
      description: "Préparer une prestation récurrente dans le catalogue.",
      done: produitsCount > 0,
      action: "Ajouter produit",
      onClick: onGoCatalogue,
    },
    {
      title: "Créer le premier devis",
      description: "Générer, prévisualiser puis envoyer un devis.",
      done: devisCount > 0,
      action: "Créer devis",
      onClick: onGoDevis,
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  if (doneCount === steps.length) {
    return (
      <section className="mt-8 rounded-3xl border border-green-500/40 bg-green-500/10 p-6 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-300">
              Décollage réussi
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              ✅ DevisFlow est prêt à être utilisé
            </h2>
            <p className="mt-2 text-slate-300">
              L’entreprise, les clients, le catalogue et le premier devis sont configurés.
            </p>
          </div>

          <button
            onClick={onGoDevis}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
          >
            Continuer
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-3xl border border-violet-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950 p-6 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            Premiers pas
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Configure DevisFlow en 4 étapes
          </h2>

          <p className="mt-2 max-w-2xl text-slate-300">
            Suis ces étapes pour rendre le logiciel immédiatement utilisable par une entreprise.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4">
          <p className="text-sm text-slate-400">Progression</p>
          <p className="mt-1 text-2xl font-black text-white">{progress} %</p>
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-violet-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`rounded-2xl border p-5 ${
              step.done
                ? "border-green-500/40 bg-green-500/10"
                : "border-slate-800 bg-slate-950"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                Étape {index + 1}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  step.done
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {step.done ? "Fait" : "À faire"}
              </span>
            </div>

            <h3 className="mt-4 font-bold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{step.description}</p>

            <button
              onClick={step.onClick}
              className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
                step.done
                  ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-black"
              }`}
            >
              {step.done ? "Revoir" : step.action}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
