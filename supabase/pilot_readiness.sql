-- Préparation pilote : cohérence des relances et immutabilité des réponses.
-- À appliquer après les migrations sprint_26 à sprint_35.

begin;

alter table public.devis
  add column if not exists derniere_relance timestamptz;

create index if not exists devis_derniere_relance_idx
on public.devis(user_id, derniere_relance)
where derniere_relance is not null;

create or replace function public.prevent_answered_devis_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  was_final boolean :=
    old.response_locked_at is not null
    or old.statut in ('Accepté', 'Refusé');
  allowed_runtime_fields constant text[] := array[
    'acompte_statut',
    'acompte_session_id',
    'acompte_payment_intent_id',
    'acompte_date_paiement',
    'acompte_montant_paye',
    'date_vue',
    'derniere_vue',
    'nombre_vues',
    'ip_derniere_vue',
    'derniere_relance',
    'updated_at'
  ];
begin
  if tg_op = 'DELETE' then
    if was_final then
      raise exception 'Un devis accepté ou refusé ne peut pas être supprimé.';
    end if;

    return old;
  end if;

  if was_final and
    (to_jsonb(new) - allowed_runtime_fields) is distinct from
    (to_jsonb(old) - allowed_runtime_fields)
  then
    raise exception 'Le contenu d''un devis accepté ou refusé est immuable.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_answered_devis on public.devis;
create trigger protect_answered_devis
before update or delete on public.devis
for each row execute function public.prevent_answered_devis_mutation();

create or replace function public.prevent_answered_devis_lines_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_devis_id uuid;
  parent_is_final boolean;
begin
  if tg_op = 'DELETE' then
    parent_devis_id := old.devis_id;
  else
    parent_devis_id := new.devis_id;
  end if;

  select (
    d.response_locked_at is not null
    or d.statut in ('Accepté', 'Refusé')
  )
  into parent_is_final
  from public.devis d
  where d.id = parent_devis_id;

  if coalesce(parent_is_final, false) then
    raise exception 'Les lignes d''un devis accepté ou refusé sont immuables.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_answered_devis_lines on public.lignes_devis;
create trigger protect_answered_devis_lines
before insert or update or delete on public.lignes_devis
for each row execute function public.prevent_answered_devis_lines_mutation();

commit;
