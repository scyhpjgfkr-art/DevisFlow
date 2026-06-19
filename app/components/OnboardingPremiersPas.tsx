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
      title: "Créer un client",
      description: "Ajoutez le destinataire du premier devis.",
      done: clientsCount > 0,
      action: "Créer un client",
      onClick: onGoClients,
    },
    {
      title: "Créer une prestation",
      description: "Préparez un produit ou service réutilisable.",
      done: produitsCount > 0,
      action: "Créer une prestation",
      onClick: onGoCatalogue,
    },
    {
      title: "Envoyer le premier devis",
      description: "Créez un devis, envoyez-le, puis suivez la réponse client.",
      done: devisCount > 0,
      action: "Créer un devis",
      onClick: onGoDevis,
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Mise en route
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Préparer le premier devis client
          </h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Trois étapes suffisent pour envoyer un devis professionnel et suivre
            son acceptation.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-4">
          <p className="text-sm text-slate-400">Progression</p>
          <p className="mt-1 text-2xl font-bold text-white">{progress} %</p>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!entrepriseOk && (
        <button
          onClick={onGoParametres}
          className="mt-5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-left text-sm text-amber-100"
        >
          Complétez les paramètres entreprise pour afficher des informations
          fiables sur les devis et PDF.
        </button>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={`rounded-2xl border p-5 ${
              step.done
                ? "border-emerald-500/40 bg-emerald-500/10"
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
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {step.done ? "Terminé" : "À faire"}
              </span>
            </div>

            <h3 className="mt-4 font-bold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {step.description}
            </p>

            <button
              onClick={step.onClick}
              className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
                step.done
                  ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "bg-white text-black hover:bg-slate-200"
              }`}
            >
              {step.done ? "Revoir" : step.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
