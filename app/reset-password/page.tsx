"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function modifierMotDePasse() {
    setMessage("");

    if (password.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Mot de passe modifié ✅ Tu peux maintenant te reconnecter.");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-950">
          🔐 Nouveau mot de passe
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Choisis un nouveau mot de passe pour ton compte DevisFlow.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </span>
            <div className="mt-2 flex rounded-xl border border-slate-300 focus-within:border-slate-950">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                className="w-full rounded-l-xl px-4 py-3 text-slate-950 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-r-xl px-4 text-sm font-semibold text-slate-600 hover:text-slate-950"
              >
                {showPassword ? "Masquer" : "Voir"}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Confirmer le mot de passe
            </span>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
            />
          </label>
        </div>

        {message && (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            {message}
          </p>
        )}

        <button
          onClick={modifierMotDePasse}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Modification..." : "Modifier mon mot de passe"}
        </button>

        <Link
          href="/"
          className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-950"
        >
          Retour à la connexion
        </Link>
      </section>
    </main>
  );
}
