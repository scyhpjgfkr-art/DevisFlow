-- Sprint 35 - Fondations e-facture
--
-- Objectif:
-- Préparer les donnees necessaires a la reforme francaise de facturation
-- electronique sans generer Factur-X, UBL, CII et sans integration PDP/PA.
--
-- Migration additive uniquement:
-- - ajoute des colonnes nullable;
-- - ne modifie pas les donnees existantes;
-- - ne change pas les policies RLS;
-- - ne change pas Stripe.

begin;

alter table public.clients
  add column if not exists type_client text,
  add column if not exists siren_client text,
  add column if not exists siret_client text,
  add column if not exists tva_intracom_client text,
  add column if not exists pays_client text,
  add column if not exists adresse_complete_client text;

alter table public.devis
  add column if not exists type_client text,
  add column if not exists siren_client text,
  add column if not exists siret_client text,
  add column if not exists tva_intracom_client text,
  add column if not exists pays_client text,
  add column if not exists adresse_complete_client text,
  add column if not exists categorie_operation text,
  add column if not exists statut_e_facture text;

alter table public.factures
  add column if not exists type_client text,
  add column if not exists siren_client text,
  add column if not exists siret_client text,
  add column if not exists tva_intracom_client text,
  add column if not exists pays_client text,
  add column if not exists adresse_complete_client text,
  add column if not exists categorie_operation text,
  add column if not exists statut_e_facture text;

create index if not exists clients_type_client_idx
on public.clients(user_id, type_client)
where type_client is not null;

create index if not exists devis_statut_e_facture_idx
on public.devis(user_id, statut_e_facture)
where statut_e_facture is not null;

create index if not exists factures_statut_e_facture_idx
on public.factures(user_id, statut_e_facture)
where statut_e_facture is not null;

comment on column public.clients.type_client is 'Fondation e-facture: type de client B2B, B2C ou B2G.';
comment on column public.clients.siren_client is 'Fondation e-facture: SIREN du client.';
comment on column public.clients.siret_client is 'Fondation e-facture: SIRET du client.';
comment on column public.clients.tva_intracom_client is 'Fondation e-facture: numero de TVA intracommunautaire du client.';
comment on column public.clients.pays_client is 'Fondation e-facture: pays du client.';
comment on column public.clients.adresse_complete_client is 'Fondation e-facture: adresse complete structuree en texte libre.';

comment on column public.devis.type_client is 'Snapshot e-facture repris depuis le client au moment du devis.';
comment on column public.devis.siren_client is 'Snapshot e-facture: SIREN client au moment du devis.';
comment on column public.devis.siret_client is 'Snapshot e-facture: SIRET client au moment du devis.';
comment on column public.devis.tva_intracom_client is 'Snapshot e-facture: TVA intracommunautaire client au moment du devis.';
comment on column public.devis.pays_client is 'Snapshot e-facture: pays client au moment du devis.';
comment on column public.devis.adresse_complete_client is 'Snapshot e-facture: adresse complete client au moment du devis.';
comment on column public.devis.categorie_operation is 'Fondation e-facture: services, biens ou mixte.';
comment on column public.devis.statut_e_facture is 'Fondation e-facture: statut de preparation/transmission future.';

comment on column public.factures.type_client is 'Snapshot e-facture repris depuis le devis au moment de la facture.';
comment on column public.factures.siren_client is 'Snapshot e-facture: SIREN client au moment de la facture.';
comment on column public.factures.siret_client is 'Snapshot e-facture: SIRET client au moment de la facture.';
comment on column public.factures.tva_intracom_client is 'Snapshot e-facture: TVA intracommunautaire client au moment de la facture.';
comment on column public.factures.pays_client is 'Snapshot e-facture: pays client au moment de la facture.';
comment on column public.factures.adresse_complete_client is 'Snapshot e-facture: adresse complete client au moment de la facture.';
comment on column public.factures.categorie_operation is 'Fondation e-facture: services, biens ou mixte.';
comment on column public.factures.statut_e_facture is 'Fondation e-facture: statut de preparation/transmission future.';

commit;
