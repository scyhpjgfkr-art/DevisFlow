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
  onBackToLanding?: () => void;
};

export default function Auth({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authMode,
  setAuthMode,
  onBackToLanding,
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
    <main className="flex min-h-screen items-center justify-center bg-[#07111f] p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/30">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-6 text-sm font-semibold text-blue-300 hover:text-blue-200"
          >
            Retour à l&apos;accueil
          </button>
        )}
        <h1 className="text-3xl font-black text-white">DevisFlow</h1>
        <p className="mt-2 text-sm text-slate-400">
          Connecte-toi pour gérer tes devis.
        </p>

        {resetMode ? (
          <>
            <div className="mt-8">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Email du compte
                </span>
                <input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  placeholder="email@exemple.fr"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>

            {message && (
              <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                {message}
              </p>
            )}

            <button
              onClick={envoyerResetPassword}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50 hover:bg-blue-500"
            >
              {loading ? "Envoi..." : "Recevoir un lien de récupération"}
            </button>

            <button
              onClick={() => {
                setResetMode(false);
                setMessage("");
              }}
              className="mt-4 w-full text-sm text-slate-400 hover:text-slate-200"
            >
              Retour à la connexion
            </button>
          </>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Email</span>
                <input
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  type="email"
                  placeholder="email@exemple.fr"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Mot de passe
                </span>
                <div className="mt-2 flex rounded-xl border border-slate-700 bg-slate-950 focus-within:border-blue-500">
                  <input
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    className="w-full rounded-l-xl bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded-r-xl px-4 text-sm font-semibold text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? "Masquer" : "Voir"}
                  </button>
                </div>
              </label>
            </div>

            {message && (
              <p className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                {message}
              </p>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50 hover:bg-blue-500"
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
              className="mt-5 w-full text-sm text-slate-400 hover:text-slate-200"
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
                className="mt-3 w-full text-sm font-medium text-blue-300 hover:text-blue-200"
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
