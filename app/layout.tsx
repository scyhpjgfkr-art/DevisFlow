import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevisFlow - Faites accepter vos devis plus vite",
  description:
    "Suivez chaque devis, obtenez une validation en ligne et encaissez vos acomptes plus vite avec DevisFlow.",
  openGraph: {
    title: "DevisFlow - Devis acceptés et acomptes encaissés plus vite",
    description:
      "Un SaaS simple pour TPE/PME de services : devis, suivi des vues, acceptation en ligne, acompte Stripe et relances.",
    siteName: "DevisFlow",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
