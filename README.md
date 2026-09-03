# DevisFlow

DevisFlow est un SaaS B2B pour les TPE/PME de services qui veulent envoyer des devis plus professionnels, obtenir une acceptation claire et encaisser un acompte plus vite.

## Positionnement

Promesse principale :

> Faites accepter vos devis et encaissez vos acomptes plus vite.

Le produit reste volontairement focalisé sur le parcours commercial court :

1. Créer un client et une prestation.
2. Générer un devis professionnel.
3. Envoyer un lien client sécurisé.
4. Suivre si le devis est vu.
5. Obtenir une acceptation/refus verrouillé.
6. Encaisser un acompte ou une facture via Stripe.
7. Relancer sans perdre le fil.

## Stack

- Next.js 16
- TypeScript
- Supabase Auth, Database et Storage
- Stripe Checkout et webhooks
- Resend pour les emails transactionnels
- Vercel pour le déploiement et le cron des relances

## Modules Produit

- Landing page publique orientée conversion.
- Authentification et mot de passe oublié.
- Dashboard PME sombre avec pipeline commercial.
- Clients et catalogue de prestations.
- Devis, PDF, email, lien public et suivi de vues.
- Acceptation/refus en ligne avec verrouillage de la réponse.
- Acompte Stripe sur devis accepté.
- Factures, PDF, email et paiement Stripe.
- Relances manuelles et automatiques simples.
- Import/export CSV.
- Mémoire commerciale pour reconstruire clients, produits et prix historiques.
- Fondations e-facture additives, sans intégration PDP/Factur-X active.

## Ce Que Le Produit Ne Fait Pas

DevisFlow ne doit pas devenir un CRM lourd, un ERP, une comptabilité complète, une gestion de stock ou une gestion de chantier. Toute évolution doit renforcer directement l'un de ces objectifs :

- augmenter le taux d'acceptation des devis ;
- réduire le délai de paiement ;
- améliorer la confiance client ;
- simplifier l'usage quotidien.

## Développement

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Variables D'environnement

Les valeurs ne doivent jamais être commitées. Les clés attendues côté production sont notamment :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TEST_MODE`
- `RESEND_TEST_TO_EMAIL`
- `CRON_SECRET`

## Déploiement

Le projet est déployé sur Vercel. Le fichier `vercel.json` à la racine déclare le cron `/api/auto-relances`.

Avant chaque déploiement :

```bash
npm run lint
npm run build
```

Avant le premier pilote, appliquer également la migration additive
`supabase/pilot_readiness.sql` dans Supabase. Elle ajoute le suivi de la
dernière relance et verrouille le contenu d'un devis après acceptation ou
refus.

## Sécurité

- Les routes sensibles utilisent la session Supabase.
- Les routes publiques utilisent des tokens documentaires et relisent les données côté serveur.
- Stripe recalcule les montants côté serveur.
- Les secrets restent côté serveur ou dans Vercel/Supabase.
