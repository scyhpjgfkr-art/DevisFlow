-- Sprint 26 - Page devis client premium + acceptation solide
--
-- Objectifs:
-- - ajouter les metadonnees necessaires a une acceptation/refus horodates;
-- - conserver les donnees existantes;
-- - preparer la structure d'acompte Stripe sans activer le paiement;
-- - enrichir l'acces public par token via RPC, sans ouvrir les tables en direct.

begin;

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
  add column if not exists acompte_pourcentage numeric(5, 2);

update public.devis
set acompte_type = 'none'
where acompte_type is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'devis_acompte_type_check'
      and conrelid = 'public.devis'::regclass
  ) then
    alter table public.devis
      add constraint devis_acompte_type_check
      check (acompte_type in ('none', 'percent', 'fixed'));
  end if;
end $$;

create index if not exists devis_public_token_statut_idx
on public.devis(public_token, statut)
where public_token is not null;

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
  acompte_type text,
  acompte_montant numeric,
  acompte_pourcentage numeric,
  entreprise_nom text,
  entreprise_adresse text,
  entreprise_ville text,
  entreprise_telephone text,
  entreprise_email text,
  entreprise_siret text,
  entreprise_tva text,
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
    d.acompte_type,
    d.acompte_montant,
    d.acompte_pourcentage,
    coalesce(es.nom, 'Entreprise') as entreprise_nom,
    es.adresse as entreprise_adresse,
    es.ville as entreprise_ville,
    es.telephone as entreprise_telephone,
    es.email as entreprise_email,
    es.siret as entreprise_siret,
    es.tva as entreprise_tva,
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
      entreprise_settings.tva
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
    es.tva;
$$;

revoke all on function public.get_public_devis_by_token(text) from public;
grant execute on function public.get_public_devis_by_token(text) to anon, authenticated;

commit;
