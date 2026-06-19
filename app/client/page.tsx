export default function PortailClientInfo() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
            Portail client
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-5xl">
            Vous avez reçu un lien par email
          </h1>

          <p className="mt-4 max-w-2xl text-slate-300">
            Pour protéger vos documents, DevisFlow ne permet pas de rechercher
            un devis ou une facture avec une simple adresse email.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="1. Ouvrez votre lien"
            description="Le lien envoyé par l'entreprise donne accès uniquement au devis concerné."
          />
          <InfoCard
            title="2. Consultez le devis"
            description="Vous pouvez vérifier les lignes, les montants, les conditions et le statut."
          />
          <InfoCard
            title="3. Répondez en ligne"
            description="Acceptez, refusez ou payez l'acompte directement depuis ce lien."
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Vous ne trouvez plus le lien ?</h2>
          <p className="mt-3 text-slate-300">
            Demandez à l&apos;entreprise qui vous a envoyé le devis de vous
            renvoyer le lien sécurisé. Aucun document client n&apos;est affiché
            depuis cette page publique.
          </p>
        </section>

        <footer className="mt-10 text-center text-sm text-slate-500">
          Propulsé par DevisFlow.
        </footer>
      </section>
    </main>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}
