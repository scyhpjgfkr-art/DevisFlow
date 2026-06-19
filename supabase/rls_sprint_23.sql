-- Sprint 23 - RLS Supabase DevisFlow
-- Tables auditees:
-- devis, factures, clients, produits, entreprise_settings,
-- lignes_devis, lignes_factures.
--
-- Objectif:
-- - chaque utilisateur authentifie ne voit/modifie que ses donnees via user_id;
-- - les lignes heritent de la securite de leur devis/facture parent;
-- - l'acces public a un devis se fait uniquement via RPC tokenisee;
-- - Stripe et les relances serveur continuent via SUPABASE_SERVICE_ROLE_KEY.

begin;

alter table public.devis enable row level security;
alter table public.factures enable row level security;
alter table public.clients enable row level security;
alter table public.produits enable row level security;
alter table public.entreprise_settings enable row level security;
alter table public.lignes_devis enable row level security;
alter table public.lignes_factures enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'devis',
        'factures',
        'clients',
        'produits',
        'entreprise_settings',
        'lignes_devis',
        'lignes_factures'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create index if not exists devis_user_id_idx on public.devis(user_id);
create index if not exists factures_user_id_idx on public.factures(user_id);
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists produits_user_id_idx on public.produits(user_id);
create index if not exists entreprise_settings_user_id_idx on public.entreprise_settings(user_id);
create index if not exists lignes_devis_devis_id_idx on public.lignes_devis(devis_id);
create index if not exists lignes_factures_facture_id_idx on public.lignes_factures(facture_id);
create unique index if not exists devis_public_token_unique_idx
on public.devis(public_token)
where public_token is not null;

drop policy if exists "devis_owner_select" on public.devis;
drop policy if exists "devis_owner_insert" on public.devis;
drop policy if exists "devis_owner_update" on public.devis;
drop policy if exists "devis_owner_delete" on public.devis;

create policy "devis_owner_select"
on public.devis
for select
to authenticated
using (user_id = auth.uid());

create policy "devis_owner_insert"
on public.devis
for insert
to authenticated
with check (user_id = auth.uid());

create policy "devis_owner_update"
on public.devis
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "devis_owner_delete"
on public.devis
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "factures_owner_select" on public.factures;
drop policy if exists "factures_owner_insert" on public.factures;
drop policy if exists "factures_owner_update" on public.factures;
drop policy if exists "factures_owner_delete" on public.factures;

create policy "factures_owner_select"
on public.factures
for select
to authenticated
using (user_id = auth.uid());

create policy "factures_owner_insert"
on public.factures
for insert
to authenticated
with check (user_id = auth.uid());

create policy "factures_owner_update"
on public.factures
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "factures_owner_delete"
on public.factures
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "clients_owner_select" on public.clients;
drop policy if exists "clients_owner_insert" on public.clients;
drop policy if exists "clients_owner_update" on public.clients;
drop policy if exists "clients_owner_delete" on public.clients;

create policy "clients_owner_select"
on public.clients
for select
to authenticated
using (user_id = auth.uid());

create policy "clients_owner_insert"
on public.clients
for insert
to authenticated
with check (user_id = auth.uid());

create policy "clients_owner_update"
on public.clients
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "clients_owner_delete"
on public.clients
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "produits_owner_select" on public.produits;
drop policy if exists "produits_owner_insert" on public.produits;
drop policy if exists "produits_owner_update" on public.produits;
drop policy if exists "produits_owner_delete" on public.produits;

create policy "produits_owner_select"
on public.produits
for select
to authenticated
using (user_id = auth.uid());

create policy "produits_owner_insert"
on public.produits
for insert
to authenticated
with check (user_id = auth.uid());

create policy "produits_owner_update"
on public.produits
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "produits_owner_delete"
on public.produits
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "entreprise_settings_owner_select" on public.entreprise_settings;
drop policy if exists "entreprise_settings_owner_insert" on public.entreprise_settings;
drop policy if exists "entreprise_settings_owner_update" on public.entreprise_settings;
drop policy if exists "entreprise_settings_owner_delete" on public.entreprise_settings;

create policy "entreprise_settings_owner_select"
on public.entreprise_settings
for select
to authenticated
using (user_id = auth.uid());

create policy "entreprise_settings_owner_insert"
on public.entreprise_settings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "entreprise_settings_owner_update"
on public.entreprise_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "entreprise_settings_owner_delete"
on public.entreprise_settings
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "lignes_devis_owner_select" on public.lignes_devis;
drop policy if exists "lignes_devis_owner_insert" on public.lignes_devis;
drop policy if exists "lignes_devis_owner_update" on public.lignes_devis;
drop policy if exists "lignes_devis_owner_delete" on public.lignes_devis;

create policy "lignes_devis_owner_select"
on public.lignes_devis
for select
to authenticated
using (
  exists (
    select 1
    from public.devis d
    where d.id = lignes_devis.devis_id
      and d.user_id = auth.uid()
  )
);

create policy "lignes_devis_owner_insert"
on public.lignes_devis
for insert
to authenticated
with check (
  exists (
    select 1
    from public.devis d
    where d.id = lignes_devis.devis_id
      and d.user_id = auth.uid()
  )
);

create policy "lignes_devis_owner_update"
on public.lignes_devis
for update
to authenticated
using (
  exists (
    select 1
    from public.devis d
    where d.id = lignes_devis.devis_id
      and d.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.devis d
    where d.id = lignes_devis.devis_id
      and d.user_id = auth.uid()
  )
);

create policy "lignes_devis_owner_delete"
on public.lignes_devis
for delete
to authenticated
using (
  exists (
    select 1
    from public.devis d
    where d.id = lignes_devis.devis_id
      and d.user_id = auth.uid()
  )
);

drop policy if exists "lignes_factures_owner_select" on public.lignes_factures;
drop policy if exists "lignes_factures_owner_insert" on public.lignes_factures;
drop policy if exists "lignes_factures_owner_update" on public.lignes_factures;
drop policy if exists "lignes_factures_owner_delete" on public.lignes_factures;

create policy "lignes_factures_owner_select"
on public.lignes_factures
for select
to authenticated
using (
  exists (
    select 1
    from public.factures f
    where f.id = lignes_factures.facture_id
      and f.user_id = auth.uid()
  )
);

create policy "lignes_factures_owner_insert"
on public.lignes_factures
for insert
to authenticated
with check (
  exists (
    select 1
    from public.factures f
    where f.id = lignes_factures.facture_id
      and f.user_id = auth.uid()
  )
);

create policy "lignes_factures_owner_update"
on public.lignes_factures
for update
to authenticated
using (
  exists (
    select 1
    from public.factures f
    where f.id = lignes_factures.facture_id
      and f.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.factures f
    where f.id = lignes_factures.facture_id
      and f.user_id = auth.uid()
  )
);

create policy "lignes_factures_owner_delete"
on public.lignes_factures
for delete
to authenticated
using (
  exists (
    select 1
    from public.factures f
    where f.id = lignes_factures.facture_id
      and f.user_id = auth.uid()
  )
);

create or replace function public.get_public_devis_by_token(p_token text)
returns table (
  id text,
  numero text,
  client text,
  societe text,
  email text,
  telephone text,
  echeance text,
  port_ht numeric,
  statut text,
  date_creation timestamptz,
  lignes_devis jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    d.id::text,
    d.numero,
    d.client,
    d.societe,
    d.email,
    d.telephone,
    d.echeance,
    d.port_ht,
    d.statut,
    d.date_creation,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'reference', ld.reference,
          'designation', ld.designation,
          'quantite', ld.quantite,
          'prix_unitaire', ld.prix_unitaire
        )
        order by ld.id
      ) filter (where ld.id is not null),
      '[]'::jsonb
    ) as lignes_devis
  from public.devis d
  left join public.lignes_devis ld on ld.devis_id = d.id
  where d.public_token::text = p_token
  group by d.id;
$$;

revoke all on function public.get_public_devis_by_token(text) from public;
grant execute on function public.get_public_devis_by_token(text) to anon, authenticated;

commit;
