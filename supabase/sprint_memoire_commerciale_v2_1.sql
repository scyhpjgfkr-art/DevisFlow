-- Sprint Memoire Commerciale V2.1
-- Migration additive uniquement.
-- Objectif:
-- - enrichir les lignes historiques avec le contexte reel des factures importees;
-- - conserver la V1 stable: aucune colonne existante n'est supprimee ou modifiee;
-- - ne pas modifier les policies RLS existantes.

begin;

alter table public.historique_lignes
  add column if not exists description_complete text,
  add column if not exists commande text,
  add column if not exists affaire text,
  add column if not exists bl text,
  add column if not exists famille_produit text,
  add column if not exists tva_montant numeric(12, 2),
  add column if not exists total_ttc_document numeric(12, 2),
  add column if not exists total_ht_document numeric(12, 2),
  add column if not exists date_facture date,
  add column if not exists numero_facture text,
  add column if not exists client_detecte text;

update public.historique_lignes
set
  description_complete = coalesce(description_complete, designation),
  date_facture = coalesce(date_facture, document_date),
  numero_facture = coalesce(numero_facture, document_numero),
  client_detecte = coalesce(
    client_detecte,
    nullif(client_societe, ''),
    nullif(client_nom, '')
  )
where
  description_complete is null
  or date_facture is null
  or numero_facture is null
  or client_detecte is null;

create index if not exists historique_lignes_user_numero_facture_idx
on public.historique_lignes(user_id, numero_facture)
where numero_facture is not null and numero_facture <> '';

create index if not exists historique_lignes_user_date_facture_idx
on public.historique_lignes(user_id, date_facture desc)
where date_facture is not null;

create index if not exists historique_lignes_user_client_detecte_idx
on public.historique_lignes(user_id, client_detecte)
where client_detecte is not null and client_detecte <> '';

comment on column public.historique_lignes.description_complete is
  'Memoire commerciale V2.1: description metier fusionnee depuis les lignes descriptives utiles.';

comment on column public.historique_lignes.commande is
  'Memoire commerciale V2.1: numero ou libelle de commande detecte dans le document importe.';

comment on column public.historique_lignes.affaire is
  'Memoire commerciale V2.1: affaire, projet ou chantier detecte dans le document importe.';

comment on column public.historique_lignes.bl is
  'Memoire commerciale V2.1: bon de livraison detecte dans le document importe.';

comment on column public.historique_lignes.famille_produit is
  'Memoire commerciale V2.1: famille ou contexte produit deduit des lignes descriptives.';

comment on column public.historique_lignes.tva_montant is
  'Memoire commerciale V2.1: montant TVA du document, si detecte.';

comment on column public.historique_lignes.total_ttc_document is
  'Memoire commerciale V2.1: total TTC du document, si detecte.';

comment on column public.historique_lignes.total_ht_document is
  'Memoire commerciale V2.1: total HT du document, si detecte.';

comment on column public.historique_lignes.date_facture is
  'Memoire commerciale V2.1: date facture detectee, conservee en plus de document_date pour compatibilite metier.';

comment on column public.historique_lignes.numero_facture is
  'Memoire commerciale V2.1: numero facture detecte, conserve en plus de document_numero pour compatibilite metier.';

comment on column public.historique_lignes.client_detecte is
  'Memoire commerciale V2.1: client detecte automatiquement dans le document importe.';

commit;
