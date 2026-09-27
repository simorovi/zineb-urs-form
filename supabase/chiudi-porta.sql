-- Chiude la porta: il ruolo pubblico (anon) non può più inserire risposte.
-- Da eseguire DOPO che Zineb ha inviato le risposte, in: Dashboard Supabase → SQL Editor → Run.
-- Da quel momento il modulo online non può più scrivere nulla nel database (l'invio fallisce e il form
-- propone la copia di sicurezza). Le risposte già inviate restano dove sono.
--
-- Per riaprire basta rieseguire supabase/setup.sql.
-- Rieseguibile senza errori.

drop policy if exists "anon puo solo inserire" on public.urs_responses;

-- Il revoke sulla tabella toglie anche il permesso di inserimento sulla colonna `risposte`.
revoke insert on table public.urs_responses from anon;
