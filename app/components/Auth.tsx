import { supabase } from "@/lib/supabase";

type Props = {
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (v: "login" | "signup") => void;
};

export default function Auth({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authMode,
  setAuthMode,
}: Props) {
  async function handleAuth() {
    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Compte créé. Tu peux te connecter.");
      setAuthMode("login");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) alert(error.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-8 text-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">🚀 DevisFlow</h1>
        <p className="mt-2 text-gray-600">
          Connecte-toi pour gérer tes devis.
        </p>

        <div className="mt-6 space-y-4">
          <input
            placeholder="Email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            placeholder="Mot de passe"
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <button
            onClick={handleAuth}
            className="w-full rounded-xl bg-black px-5 py-3 text-white"
          >
            {authMode === "login" ? "Se connecter" : "Créer un compte"}
          </button>

          <button
            onClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
            className="w-full text-sm text-gray-600"
          >
            {authMode === "login"
              ? "Pas encore de compte ? Créer un compte"
              : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </main>
  );
}