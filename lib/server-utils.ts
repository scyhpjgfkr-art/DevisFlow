import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHttpOrigin(value: string) {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("L'URL publique de l'application doit utiliser HTTP ou HTTPS.");
  }

  return url.origin;
}

export function getAppOrigin(request?: Request) {
  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (process.env.VERCEL_ENV === "preview" && vercelUrl) {
    return normalizeHttpOrigin(`https://${vercelUrl}`);
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return normalizeHttpOrigin(configuredUrl);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (productionUrl) {
    return normalizeHttpOrigin(`https://${productionUrl}`);
  }

  if (vercelUrl) {
    return normalizeHttpOrigin(`https://${vercelUrl}`);
  }

  if (process.env.NODE_ENV !== "production" && request) {
    return normalizeHttpOrigin(request.url);
  }

  throw new Error("NEXT_PUBLIC_APP_URL manquante ou invalide.");
}

export function getTrustedDevisUrl(value: string | undefined, request: Request) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const isDevisPath = /^\/devis\/[a-zA-Z0-9-]+\/?$/.test(url.pathname);

    if (url.origin !== getAppOrigin(request) || !isDevisPath) {
      return undefined;
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function requireSupabaseUser(
  request: Request
): Promise<{ user: User } | { errorResponse: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      errorResponse: NextResponse.json(
        { error: "Variables Supabase manquantes dans .env.local" },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { error: "Session Supabase requise" },
        { status: 401 }
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Session Supabase invalide" },
        { status: 401 }
      ),
    };
  }

  return { user: data.user };
}
