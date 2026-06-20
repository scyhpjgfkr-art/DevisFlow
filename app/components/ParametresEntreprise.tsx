"use client";

import { useEffect, useState } from "react";

type Settings = {
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  tva: string;
  logoUrl: string;
  siteWeb: string;
  couleurPrincipale: string;
};

export default function ParametresEntreprise({
  settings,
  setSettings,
  sauvegarderSettings,
  onLogoUpload,
  onLogoRemove,
  logoUploading,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  sauvegarderSettings: () => void;
  onLogoUpload: (file: File) => Promise<void>;
  onLogoRemove: () => Promise<void>;
  logoUploading: boolean;
}) {
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const initials = (settings.nom || "DF")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const couleur = /^#[0-9a-fA-F]{6}$/.test(settings.couleurPrincipale)
    ? settings.couleurPrincipale
    : "#2563eb";
  const displayedLogoUrl = logoPreviewUrl || settings.logoUrl;

  useEffect(() => {
    if (!logoPreviewUrl) return;

    return () => URL.revokeObjectURL(logoPreviewUrl);
  }, [logoPreviewUrl]);

  const fields: Array<{
    key: keyof Settings;
    label: string;
    helper?: string;
    type?: string;
  }> = [
    { key: "nom", label: "Nom de l'entreprise" },
    { key: "adresse", label: "Adresse" },
    { key: "ville", label: "Ville" },
    { key: "telephone", label: "Téléphone" },
    {
      key: "email",
      label: "Email affiché sur les devis et PDF",
      helper: "Cet email sera visible par les clients sur les documents envoyés.",
      type: "email",
    },
    { key: "siteWeb", label: "Site web", type: "url" },
    { key: "siret", label: "SIRET" },
    { key: "tva", label: "Numéro de TVA" },
  ];

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-white shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            Identité visuelle
          </p>
          <h2 className="mt-2 text-2xl font-bold">Paramètres entreprise</h2>
          <p className="mt-2 max-w-2xl text-slate-400">
            Ces informations apparaissent sur les devis, les factures, les PDF
            et la page client publique du devis.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 rounded-2xl border border-slate-800 bg-slate-950 p-5 md:grid-cols-[220px_1fr]">
        <div>
          <p className="text-sm font-medium text-slate-300">Logo entreprise</p>
          <div className="mt-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            {displayedLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayedLogoUrl}
                alt="Logo entreprise"
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-2xl font-black text-white"
                style={{ backgroundColor: couleur }}
              >
                {initials}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              Importer un logo
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={logoUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  const nextPreviewUrl = URL.createObjectURL(file);
                  setLogoPreviewUrl(nextPreviewUrl);
                  void onLogoUpload(file).finally(() => setLogoPreviewUrl(""));
                }
                event.currentTarget.value = "";
              }}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-semibold file:text-white disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-slate-500">
              PNG, JPG ou WebP. Taille recommandée : logo horizontal ou carré.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              Couleur principale
            </span>
            <div className="mt-2 flex gap-3">
              <input
                type="color"
                value={couleur}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    couleurPrincipale: event.target.value,
                  })
                }
                className="h-12 w-16 rounded-xl border border-slate-700 bg-slate-950"
              />
              <input
                value={settings.couleurPrincipale}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    couleurPrincipale: event.target.value,
                  })
                }
                placeholder="#2563eb"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400"
              />
            </div>
          </label>

          {settings.logoUrl && (
            <button
              type="button"
              onClick={() => {
                setLogoPreviewUrl("");
                void onLogoRemove();
              }}
              className="w-fit rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-900"
            >
              Retirer le logo
            </button>
          )}

          {logoUploading && (
            <p className="self-center text-sm text-slate-400">
              Upload du logo en cours...
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map(({ key, label, helper, type = "text" }) => (
          <label key={key} className="block">
            <span className="text-sm font-medium text-slate-300">
              {label}
            </span>
            <input
              type={type}
              value={settings[key]}
              onChange={(e) =>
                setSettings({ ...settings, [key]: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400"
            />
            {helper && (
              <p className="mt-2 text-xs text-slate-500">
                {helper}
              </p>
            )}
          </label>
        ))}
      </div>

      <button
        onClick={() => sauvegarderSettings()}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
      >
        Sauvegarder les paramètres
      </button>
    </section>
  );
}
