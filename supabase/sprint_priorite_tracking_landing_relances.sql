-- Sprint Priorite Produit - Tracking, landing, relances
-- Migration additive uniquement.
-- Objectifs:
-- - historiser les relances automatiques pour eviter le spam;
-- - stocker les reglages de relances par utilisateur;
-- - enrichir le suivi paiement des factures.

alter table public.factures
  add column if not exists date_echeance timestamptz,
  add column if not exists date_paiement timestamptz,
  add column if not exists montant_paye numeric(12, 2),
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists derniere_relance timestamptz;

create index if not exists factures_date_echeance_idx
on public.factures(user_id, date_echeance)
where date_echeance is not null;

create index if not exists factures_stripe_session_id_idx
on public.factures(stripe_session_id)
where stripe_session_id is not null;

create table if not exists public.relance_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  devis_non_vu_enabled boolean not null default true,
  devis_non_vu_days integer not null default 2,
  devis_non_vu_template text not null default 'Bonjour {{client}}, nous revenons vers vous concernant le devis {{numero}}. Vous pouvez le consulter ici : {{lien}}.',
  devis_vu_non_accepte_enabled boolean not null default true,
  devis_vu_non_accepte_days integer not null default 3,
  devis_vu_non_accepte_template text not null default 'Bonjour {{client}}, vous avez consulté le devis {{numero}}. Avez-vous besoin d''une précision avant validation ? Lien : {{lien}}.',
  facture_impayee_enabled boolean not null default true,
  facture_impayee_days integer not null default 0,
  facture_impayee_template text not null default 'Bonjour {{client}}, nous vous rappelons que la facture {{numero}} est en attente de règlement. Vous pouvez la régler ici : {{lien_paiement}}.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relance_settings_user_id_unique unique (user_id),
  constraint relance_settings_days_check check (
    devis_non_vu_days between 1 and 30
    and devis_vu_non_accepte_days between 1 and 30
    and facture_impayee_days between 0 and 60
  )
);

create index if not exists relance_settings_user_id_idx
on public.relance_settings(user_id);

create table if not exists public.relance_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  document_id uuid not null,
  rule_key text not null,
  recipient_email text,
  subject text,
  status text not null default 'sent',
  details text,
  sent_at timestamptz not null default now(),
  constraint relance_history_document_type_check check (document_type in ('devis', 'facture')),
  constraint relance_history_rule_key_check check (
    rule_key in ('devis_non_vu', 'devis_vu_non_accepte', 'facture_impayee')
  ),
  constraint relance_history_status_check check (status in ('sent', 'test_fallback', 'error')),
  constraint relance_history_unique_rule unique (user_id, document_type, document_id, rule_key)
);

create index if not exists relance_history_user_sent_at_idx
on public.relance_history(user_id, sent_at desc);

create index if not exists relance_history_document_idx
on public.relance_history(document_type, document_id, rule_key);

alter table public.relance_settings enable row level security;
alter table public.relance_history enable row level security;

drop policy if exists "relance_settings_owner_select" on public.relance_settings;
drop policy if exists "relance_settings_owner_insert" on public.relance_settings;
drop policy if exists "relance_settings_owner_update" on public.relance_settings;
drop policy if exists "relance_settings_owner_delete" on public.relance_settings;

create policy "relance_settings_owner_select"
on public.relance_settings
for select
using (auth.uid() = user_id);

create policy "relance_settings_owner_insert"
on public.relance_settings
for insert
with check (auth.uid() = user_id);

create policy "relance_settings_owner_update"
on public.relance_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "relance_settings_owner_delete"
on public.relance_settings
for delete
using (auth.uid() = user_id);

drop policy if exists "relance_history_owner_select" on public.relance_history;
drop policy if exists "relance_history_owner_insert" on public.relance_history;
drop policy if exists "relance_history_owner_update" on public.relance_history;
drop policy if exists "relance_history_owner_delete" on public.relance_history;

create policy "relance_history_owner_select"
on public.relance_history
for select
using (auth.uid() = user_id);

create policy "relance_history_owner_insert"
on public.relance_history
for insert
with check (auth.uid() = user_id);

create policy "relance_history_owner_update"
on public.relance_history
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "relance_history_owner_delete"
on public.relance_history
for delete
using (auth.uid() = user_id);

comment on table public.relance_settings is 'Reglages MVP des relances automatiques par utilisateur.';
comment on table public.relance_history is 'Historique anti-spam des relances automatiques envoyees.';
comment on column public.factures.date_echeance is 'Date d echeance utilisee pour les relances de facture impayee.';
comment on column public.factures.date_paiement is 'Date de paiement confirmee manuellement ou par Stripe.';
comment on column public.factures.montant_paye is 'Montant paye confirme pour la facture.';
