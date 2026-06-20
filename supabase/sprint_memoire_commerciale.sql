-- Sprint - Memoire Commerciale & Suggestions de Prix
-- Migration additive uniquement.
-- Objectif:
-- - importer un historique commercial CSV/XLSX;
-- - conserver les lignes historiques isolees par user_id;
-- - reconstruire catalogue, clients et suggestions sans modifier les tables metier existantes.

begin;

create table if not exists public.historique_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fichier_nom text not null,
  source_type text not null,
  statut text not null default 'termine',
  lignes_total integer not null default 0,
  lignes_importees integer not null default 0,
  lignes_ignorees integer not null default 0,
  erreurs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint historique_imports_source_type_check
    check (source_type in ('csv', 'xlsx')),
  constraint historique_imports_statut_check
    check (statut in ('termine', 'erreur'))
);

create table if not exists public.historique_lignes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_id uuid references public.historique_imports(id) on delete set null,
  document_numero text,
  document_type text not null default 'facture',
  document_date date,
  client_nom text,
  client_societe text,
  client_email text,
  produit_reference text,
  produit_nom text,
  designation text not null,
  categorie text,
  quantite numeric(12, 3) not null default 1,
  prix_unitaire_ht numeric(12, 2),
  montant_ht numeric(12, 2),
  source_ligne integer,
  fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint historique_lignes_document_type_check
    check (document_type in ('facture', 'devis', 'catalogue', 'autre')),
  constraint historique_lignes_quantite_check
    check (quantite >= 0),
  constraint historique_lignes_prix_check
    check (
      prix_unitaire_ht is null
      or prix_unitaire_ht >= 0
    ),
  constraint historique_lignes_montant_check
    check (
      montant_ht is null
      or montant_ht >= 0
    )
);

create unique index if not exists historique_lignes_user_fingerprint_unique_idx
on public.historique_lignes(user_id, fingerprint);

create index if not exists historique_imports_user_created_idx
on public.historique_imports(user_id, created_at desc);

create index if not exists historique_lignes_user_date_idx
on public.historique_lignes(user_id, document_date desc)
where document_date is not null;

create index if not exists historique_lignes_user_reference_idx
on public.historique_lignes(user_id, produit_reference)
where produit_reference is not null and produit_reference <> '';

create index if not exists historique_lignes_user_client_idx
on public.historique_lignes(user_id, client_societe, client_nom);

alter table public.historique_imports enable row level security;
alter table public.historique_lignes enable row level security;

drop policy if exists "historique_imports_owner_select" on public.historique_imports;
drop policy if exists "historique_imports_owner_insert" on public.historique_imports;
drop policy if exists "historique_imports_owner_update" on public.historique_imports;
drop policy if exists "historique_imports_owner_delete" on public.historique_imports;

create policy "historique_imports_owner_select"
on public.historique_imports
for select
to authenticated
using (user_id = auth.uid());

create policy "historique_imports_owner_insert"
on public.historique_imports
for insert
to authenticated
with check (user_id = auth.uid());

create policy "historique_imports_owner_update"
on public.historique_imports
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "historique_imports_owner_delete"
on public.historique_imports
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "historique_lignes_owner_select" on public.historique_lignes;
drop policy if exists "historique_lignes_owner_insert" on public.historique_lignes;
drop policy if exists "historique_lignes_owner_update" on public.historique_lignes;
drop policy if exists "historique_lignes_owner_delete" on public.historique_lignes;

create policy "historique_lignes_owner_select"
on public.historique_lignes
for select
to authenticated
using (user_id = auth.uid());

create policy "historique_lignes_owner_insert"
on public.historique_lignes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "historique_lignes_owner_update"
on public.historique_lignes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "historique_lignes_owner_delete"
on public.historique_lignes
for delete
to authenticated
using (user_id = auth.uid());

comment on table public.historique_imports is
  'Imports d historique commercial utilises pour reconstruire catalogue, clients et prix.';

comment on table public.historique_lignes is
  'Lignes commerciales historiques isolees par utilisateur pour suggestions de prix justifiees.';

comment on column public.historique_lignes.fingerprint is
  'Empreinte stable de doublon: document, client, produit, designation, quantite et prix.';

commit;
