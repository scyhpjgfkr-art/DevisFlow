"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!session && !showAuth) {
    return (
      <LandingPage
        onLogin={() => {
          setAuthMode("login");
          setShowAuth(true);
        }}
        onSignup={() => {
          setAuthMode("signup");
          setShowAuth(true);
        }}
      />
    );
  }

  if (!session) {
    return (
      <Auth
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onBackToLanding={() => setShowAuth(false)}
      />
    );
  }

  return <Dashboard session={session} logout={logout} />;
}
