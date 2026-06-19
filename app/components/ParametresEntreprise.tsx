type Settings = {
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  tva: string;
};

export default function ParametresEntreprise({
  settings,
  setSettings,
  sauvegarderSettings,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  sauvegarderSettings: () => void;
}) {
  const labels: Record<keyof Settings, string> = {
    nom: "Nom de l'entreprise",
    adresse: "Adresse",
    ville: "Ville",
    telephone: "Téléphone",
    email: "Email affiché sur les devis et PDF",
    siret: "SIRET",
    tva: "Numéro de TVA",
  };

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">
            Identité
          </p>
          <h2 className="mt-2 text-2xl font-bold">Paramètres entreprise</h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Ces informations apparaissent sur les devis, les factures, les PDF
            et la page client publique du devis.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} className="block">
            <span className="text-sm font-medium text-slate-300">
              {labels[key as keyof Settings]}
            </span>
            <input
              value={value}
              onChange={(e) =>
                setSettings({ ...settings, [key]: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
            />
            {key === "email" && (
              <p className="mt-2 text-xs text-slate-500">
                Cet email sera visible par les clients sur les documents envoyés.
              </p>
            )}
          </label>
        ))}
      </div>

      <button
        onClick={sauvegarderSettings}
        className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
      >
        Sauvegarder les paramètres
      </button>
    </section>
  );
}
