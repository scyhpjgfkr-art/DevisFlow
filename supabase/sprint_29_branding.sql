-- Sprint 29 - Branding entreprise, logo et donnees publiques premium
--
-- Objectifs:
-- - ajouter logo, site web et couleur principale aux parametres entreprise;
-- - creer un bucket public Supabase Storage pour les logos;
-- - securiser l'ecriture des logos par utilisateur;
-- - enrichir la RPC publique tokenisee avec les donnees de branding.

begin;

alter table public.entreprise_settings
  add column if not exists logo_url text,
  add column if not exists site_web text,
  add column if not exists couleur_principale text;

update public.entreprise_settings
set couleur_principale = '#0f172a'
where couleur_principale is null;

alter table public.devis
  add column if not exists signataire_nom text,
  add column if not exists commentaire_client text,
  add column if not exists date_reponse timestamptz,
  add column if not exists date_acceptation timestamptz,
  add column if not exists date_refus timestamptz,
  add column if not exists response_locked_at timestamptz,
  add column if not exists conditions_devis text,
  add column if not exists acompte_type text default 'none',
  add column if not exists acompte_montant numeric(12, 2),
  add column if not exists acompte_pourcentage numeric(5, 2),
  add column if not exists acompte_statut text default 'not_required',
  add column if not exists acompte_session_id text,
  add column if not exists acompte_payment_intent_id text,
  add column if not exists acompte_date_paiement timestamptz,
  add column if not exists acompte_montant_paye numeric(12, 2);

update public.devis
set acompte_type = 'none'
where acompte_type is null;

update public.devis
set acompte_statut = 'not_required'
where acompte_statut is null;

create index if not exists devis_acompte_session_id_idx
on public.devis(acompte_session_id)
where acompte_session_id is not null;

create index if not exists devis_public_token_statut_acompte_idx
on public.devis(public_token, statut, acompte_statut)
where public_token is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entreprise-logos',
  'entreprise-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "entreprise_logos_public_read" on storage.objects;
drop policy if exists "entreprise_logos_owner_insert" on storage.objects;
drop policy if exists "entreprise_logos_owner_update" on storage.objects;
drop policy if exists "entreprise_logos_owner_delete" on storage.objects;

create policy "entreprise_logos_public_read"
on storage.objects
for select
using (bucket_id = 'entreprise-logos');

create policy "entreprise_logos_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'entreprise-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "entreprise_logos_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'entreprise-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'entreprise-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "entreprise_logos_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'entreprise-logos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop function if exists public.get_public_devis_by_token(text);

create function public.get_public_devis_by_token(p_token text)
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
  conditions_devis text,
  signataire_nom text,
  commentaire_client text,
  date_reponse timestamptz,
  date_acceptation timestamptz,
  date_refus timestamptz,
  response_locked_at timestamptz,
  acompte_type text,
  acompte_montant numeric,
  acompte_pourcentage numeric,
  acompte_statut text,
  acompte_date_paiement timestamptz,
  acompte_montant_paye numeric,
  entreprise_nom text,
  entreprise_adresse text,
  entreprise_ville text,
  entreprise_telephone text,
  entreprise_email text,
  entreprise_siret text,
  entreprise_tva text,
  entreprise_logo_url text,
  entreprise_site_web text,
  entreprise_couleur_principale text,
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
    d.conditions_devis,
    d.signataire_nom,
    d.commentaire_client,
    d.date_reponse,
    d.date_acceptation,
    d.date_refus,
    d.response_locked_at,
    d.acompte_type,
    d.acompte_montant,
    d.acompte_pourcentage,
    d.acompte_statut,
    d.acompte_date_paiement,
    d.acompte_montant_paye,
    coalesce(es.nom, 'Entreprise') as entreprise_nom,
    es.adresse as entreprise_adresse,
    es.ville as entreprise_ville,
    es.telephone as entreprise_telephone,
    es.email as entreprise_email,
    es.siret as entreprise_siret,
    es.tva as entreprise_tva,
    es.logo_url as entreprise_logo_url,
    es.site_web as entreprise_site_web,
    es.couleur_principale as entreprise_couleur_principale,
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
  left join lateral (
    select
      entreprise_settings.nom,
      entreprise_settings.adresse,
      entreprise_settings.ville,
      entreprise_settings.telephone,
      entreprise_settings.email,
      entreprise_settings.siret,
      entreprise_settings.tva,
      entreprise_settings.logo_url,
      entreprise_settings.site_web,
      entreprise_settings.couleur_principale
    from public.entreprise_settings
    where entreprise_settings.user_id = d.user_id
    limit 1
  ) es on true
  left join public.lignes_devis ld on ld.devis_id = d.id
  where d.public_token::text = p_token
  group by
    d.id,
    es.nom,
    es.adresse,
    es.ville,
    es.telephone,
    es.email,
    es.siret,
    es.tva,
    es.logo_url,
    es.site_web,
    es.couleur_principale;
$$;

revoke all on function public.get_public_devis_by_token(text) from public;
grant execute on function public.get_public_devis_by_token(text) to anon, authenticated;

commit;
