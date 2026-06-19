-- Sprint 31-34 - Professionnalisation PME
--
-- Objectifs:
-- - suivre la consultation publique d'un devis sans modifier les policies RLS;
-- - conserver les informations minimales de preuve d'acceptation;
-- - suivre l'envoi d'une facture pour le pipeline commercial;
-- - conserver une version simple du devis pour les preuves PDF.

begin;

alter table public.devis
  add column if not exists date_vue timestamptz,
  add column if not exists derniere_vue timestamptz,
  add column if not exists nombre_vues integer default 0,
  add column if not exists ip_derniere_vue text,
  add column if not exists ip_reponse text,
  add column if not exists devis_version integer default 1;

update public.devis
set nombre_vues = 0
where nombre_vues is null;

update public.devis
set devis_version = 1
where devis_version is null;

alter table public.factures
  add column if not exists date_envoi timestamptz;

create index if not exists devis_date_vue_idx
on public.devis(date_vue)
where date_vue is not null;

create index if not exists factures_date_envoi_idx
on public.factures(date_envoi)
where date_envoi is not null;

commit;
