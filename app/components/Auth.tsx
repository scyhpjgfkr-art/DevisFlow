"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthProps = {
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (value: "login" | "signup") => void;
};

export default function Auth({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authMode,
  setAuthMode,
}: AuthProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth() {
    setMessage("");

    if (!authEmail.trim()) {
      setMessage("Entre ton email.");
      return;
    }

    if (!authPassword.trim()) {
      setMessage("Entre ton mot de passe.");
      return;
    }

    setLoading(true);

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage("Compte créé ✅ Vérifie tes emails si Supabase demande une confirmation.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  async function envoyerResetPassword() {
    setMessage("");

    if (!authEmail.trim()) {
      setMessage("Entre ton email pour recevoir le lien de récupération.");
      return;
    }

    setLoading(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(
      authEmail.trim(),
      { redirectTo }
    );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Email de récupération envoyé ✅ Vérifie ta boîte mail.");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-black text-slate-950">🚀 DevisFlow</h1>
        <p className="mt-2 text-sm text-slate-500">
          Connecte-toi pour gérer tes devis.
        </p>

        {resetMode ? (
          <>
            <div className="mt-8">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email du compte
                </span>
                <input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  placeholder="email@exemple.fr"
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
              onClick={envoyerResetPassword}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Recevoir un lien de récupération"}
            </button>

            <button
              onClick={() => {
                setResetMode(false);
                setMessage("");
              }}
              className="mt-4 w-full text-sm text-slate-500 hover:text-slate-950"
            >
              Retour à la connexion
            </button>
          </>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  placeholder="email@exemple.fr"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Mot de passe
                </span>
                <div className="mt-2 flex rounded-xl border border-slate-300 focus-within:border-slate-950">
                  <input
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
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
            </div>

            {message && (
              <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                {message}
              </p>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Chargement..."
                : authMode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
            </button>

            <button
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setMessage("");
              }}
              className="mt-5 w-full text-sm text-slate-500 hover:text-slate-950"
            >
              {authMode === "login"
                ? "Pas encore de compte ? Créer un compte"
                : "Déjà un compte ? Se connecter"}
            </button>

            {authMode === "login" && (
              <button
                onClick={() => {
                  setResetMode(true);
                  setMessage("");
                }}
                className="mt-3 w-full text-sm font-medium text-violet-600 hover:text-violet-800"
              >
                Mot de passe oublié ?
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}