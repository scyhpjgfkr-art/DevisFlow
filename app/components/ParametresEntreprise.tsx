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
  return (
    <section className="mt-8 rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-bold">Paramètres entreprise</h2>
      <p className="mt-2 text-gray-600">
        Ces informations apparaîtront automatiquement sur les PDF.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} className="block">
            <span className="text-sm capitalize text-gray-600">{key}</span>
            <input
              value={value}
              onChange={(e) =>
                setSettings({ ...settings, [key]: e.target.value })
              }
              className="mt-1 w-full rounded-xl border px-4 py-3"
            />
          </label>
        ))}
      </div>

      <button
        onClick={sauvegarderSettings}
        className="mt-6 rounded-xl bg-black px-5 py-3 text-white"
      >
        Sauvegarder les paramètres
      </button>
    </section>
  );
}