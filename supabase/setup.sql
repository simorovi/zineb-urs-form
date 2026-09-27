-- Setup del progetto Supabase DEDICATO al modulo URS (non quello del sito vero).
-- Da eseguire una sola volta in: Dashboard Supabase → SQL Editor → New query → Run.
-- È idempotente: si può rieseguire senza perdere dati.

create table if not exists public.urs_responses (
  id         uuid        primary key default gen_random_uuid(),
  creato_il  timestamptz not null default now(),
  risposte   jsonb       not null,
  -- Limiti contro invii malformati o abnormi (la chiave anon è pubblica, chiunque può provarci).
  constraint risposte_e_un_oggetto check (jsonb_typeof(risposte) = 'object'),
  constraint risposte_max_256kb   check (pg_column_size(risposte) <= 262144)
);

comment on table public.urs_responses is
  'Risposte di Zineb al questionario URS. Una riga per invio: vale la più recente (creato_il).';

-- Row Level Security: senza una policy, nessuna operazione è permessa.
alter table public.urs_responses enable row level security;

-- Privilegi: il ruolo pubblico (anon) può SOLO inserire.
-- Togliere anche il privilegio SELECT fa sì che una lettura con la chiave anon fallisca con un errore
-- esplicito (permission denied) invece di restituire semplicemente una lista vuota.
revoke all on table public.urs_responses from anon, authenticated;
grant insert on table public.urs_responses to anon;

drop policy if exists "anon puo solo inserire" on public.urs_responses;
create policy "anon puo solo inserire"
  on public.urs_responses
  for insert
  to anon
  with check (true);

-- Volutamente NESSUNA policy di select/update/delete: le risposte si leggono solo dalla dashboard
-- (Table Editor), che usa un ruolo privilegiato e non passa dalle policy.

