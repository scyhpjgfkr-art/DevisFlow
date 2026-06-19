import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevisFlow",
  description: "Créez, envoyez, relancez et transformez vos devis en factures.",
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
