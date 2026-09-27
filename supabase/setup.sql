-- Setup del progetto Supabase DEDICATO al modulo URS (non quello del sito vero).
-- Da eseguire una sola volta in: Dashboard Supabase → SQL Editor → New query → Run.
-- È idempotente: si può rieseguire senza perdere dati (serve anche a riaprire gli invii dopo
-- supabase/chiudi-porta.sql).
--
-- Questo file è l'UNICA fonte dello schema: ogni modifica a tabella, permessi, policy, vincoli o
-- trigger si fa qui, e deve restare rieseguibile.

create table if not exists public.urs_responses (
  id         uuid        primary key default gen_random_uuid(),
  creato_il  timestamptz not null default now(),
  risposte   jsonb       not null
);

comment on table public.urs_responses is
  'Risposte di Zineb al questionario URS. Una riga per invio: vale la più recente (creato_il).';

-- Limiti contro invii malformati o abnormi (la chiave anon è pubblica, chiunque può provarci).
-- Drop + add, così rieseguendo il file i vincoli vengono sempre riportati alla versione attuale.
alter table public.urs_responses drop constraint if exists risposte_e_un_oggetto;
alter table public.urs_responses
  add constraint risposte_e_un_oggetto check (jsonb_typeof(risposte) = 'object');

-- La dimensione si misura sul testo NON compresso. pg_column_size misura invece la rappresentazione
-- interna, che dipende da come arriva il dato: un valore già compresso (es. copiato da un'altra riga)
-- risulterebbe piccolissimo anche se enorme (300 KB ripetitivi → circa 3 KB). octet_length sul testo
-- misura sempre la dimensione reale, qualunque sia la strada da cui arriva il dato.
alter table public.urs_responses drop constraint if exists risposte_max_256kb;
alter table public.urs_responses
  add constraint risposte_max_256kb check (octet_length(risposte::text) <= 262144);

-- Row Level Security: senza una policy, nessuna operazione è permessa.
alter table public.urs_responses enable row level security;

-- Privilegi: il ruolo pubblico (anon) può SOLO inserire, e solo la colonna `risposte`.
-- Togliere anche il privilegio SELECT fa sì che una lettura con la chiave anon fallisca con un errore
-- esplicito (permission denied) invece di restituire semplicemente una lista vuota.
-- `id` e `creato_il` li decide sempre il database: chi invia non può sceglierli (e quindi non può
-- nemmeno retrodatare le righe per aggirare il freno anti-flood qui sotto).
-- `revoke all` sulla tabella toglie anche i permessi colonna per colonna dati in precedenza.
revoke all on table public.urs_responses from anon, authenticated;
grant insert (risposte) on table public.urs_responses to anon;

drop policy if exists "anon puo solo inserire" on public.urs_responses;
create policy "anon puo solo inserire"
  on public.urs_responses
  for insert
  to anon
  with check (true);

-- Volutamente NESSUNA policy di select/update/delete: le risposte si leggono solo dalla dashboard
-- (Table Editor), che usa un ruolo privilegiato e non passa dalle policy.

-- Freno anti-flood: la chiave anon è pubblica, quindi chiunque potrebbe inviare righe a raffica.
-- Il trigger rifiuta l'invio se nell'ultima ora ci sono già 20 righe, o se la tabella ne ha già 200.
-- `security definer`: deve contare le righe, cosa che il ruolo anon non può fare (niente SELECT).
-- `search_path = ''` e nomi qualificati: nessuno può dirottare la funzione con oggetti omonimi.
create or replace function public.urs_freno_invii()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  invii_ultima_ora bigint;
  invii_totali     bigint;
begin
  -- Un invio alla volta: senza questo lock, invii simultanei potrebbero superare i limiti.
  perform pg_catalog.pg_advisory_xact_lock(7358120461);

  select count(*) into invii_totali from public.urs_responses;
  if invii_totali >= 200 then
    raise exception 'Invio rifiutato: raggiunto il numero massimo di risposte (200). Contatta Simone.';
  end if;

  select count(*) into invii_ultima_ora
    from public.urs_responses
    where creato_il > pg_catalog.now() - interval '1 hour';
  if invii_ultima_ora >= 20 then
    raise exception 'Invio rifiutato: troppi invii nell''ultima ora (massimo 20). Riprova più tardi.';
  end if;

  return new;
end;
$$;

-- Nessuno deve poter chiamare la funzione direttamente (es. via API): il trigger funziona comunque,
-- perché i permessi di esecuzione non vengono controllati quando scatta un trigger.
revoke execute on function public.urs_freno_invii() from public, anon, authenticated;

drop trigger if exists urs_freno_invii on public.urs_responses;
create trigger urs_freno_invii
  before insert on public.urs_responses
  for each row
  execute function public.urs_freno_invii();
