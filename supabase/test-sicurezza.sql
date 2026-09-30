-- Test di sicurezza del database: verifica che il ruolo pubblico (anon) possa fare SOLO ciò che
-- setup.sql gli concede. Da eseguire dopo setup.sql, in: Dashboard Supabase → SQL Editor → Run.
--
-- Tutto avviene in una transazione annullata alla fine (rollback): non lascia righe nella tabella.
-- Se un controllo fallisce, lo script si ferma con un errore "TEST FALLITO: …".
-- Se arriva in fondo, l'ultima riga del risultato è "TUTTI I TEST SUPERATI".
--
-- Nota: i test sul freno anti-flood contano anche le righe già presenti. Eseguilo prima di mandare
-- il link a Zineb, o comunque quando nell'ultima ora non ci sono stati invii veri.
-- Nota: per provare la policy da sola, la sezione 2 toglie per un istante i vincoli della tabella
-- (dentro un savepoint, subito annullato) e la sezione 4 crea una tabella di prova: tutto viene
-- annullato. Per quegli istanti la tabella resta bloccata, quindi non eseguirlo mentre Zineb invia.

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Cosa può e non può fare il ruolo anon
-- ---------------------------------------------------------------------------------------------
set local role anon;

do $$
begin
  -- Inserimento del solo campo `risposte`: consentito.
  insert into public.urs_responses (risposte) values ('{"test": "inserimento valido"}');
  raise notice 'OK: inserimento di `risposte` consentito';

  begin
    perform 1 from public.urs_responses limit 1;
    raise exception 'TEST FALLITO: anon può leggere le risposte';
  exception when insufficient_privilege then
    raise notice 'OK: lettura rifiutata';
  end;

  begin
    update public.urs_responses set risposte = '{}';
    raise exception 'TEST FALLITO: anon può modificare le risposte';
  exception when insufficient_privilege then
    raise notice 'OK: modifica rifiutata';
  end;

  begin
    delete from public.urs_responses;
    raise exception 'TEST FALLITO: anon può cancellare le risposte';
  exception when insufficient_privilege then
    raise notice 'OK: cancellazione rifiutata';
  end;

  begin
    insert into public.urs_responses (id, risposte)
      values ('00000000-0000-0000-0000-000000000000', '{"test": "id scelto a mano"}');
    raise exception 'TEST FALLITO: anon può scegliere `id`';
  exception when insufficient_privilege then
    raise notice 'OK: invio con `id` scelto a mano rifiutato';
  end;

  begin
    insert into public.urs_responses (creato_il, risposte)
      values ('2000-01-01', '{"test": "data scelta a mano"}');
    raise exception 'TEST FALLITO: anon può scegliere `creato_il`';
  exception when insufficient_privilege then
    raise notice 'OK: invio con `creato_il` scelto a mano rifiutato';
  end;

  -- Invii non validi: li rifiutano sia la policy sia i vincoli (difesa in profondità); qui basta che
  -- uno dei due li fermi. La sezione 2 prova ciascuno dei due da solo.
  begin
    insert into public.urs_responses (risposte) values ('["non", "un", "oggetto"]');
    raise exception 'TEST FALLITO: accettato un invio che non è un oggetto JSON';
  exception
    when check_violation then
      raise notice 'OK: invio non-oggetto rifiutato (vincolo)';
    when insufficient_privilege then
      if sqlerrm not like '%row-level security%' then raise; end if;
      raise notice 'OK: invio non-oggetto rifiutato (policy)';
  end;

  begin
    -- ~300 KB di testo ripetitivo: compresso occuperebbe circa 3 KB, il testo supera 256 KB.
    insert into public.urs_responses (risposte)
      values (jsonb_build_object('test', repeat('a', 300000)));
    raise exception 'TEST FALLITO: accettato un invio oltre 256 KB non compressi';
  exception
    when check_violation then
      raise notice 'OK: invio oltre 256 KB rifiutato (vincolo)';
    when insufficient_privilege then
      if sqlerrm not like '%row-level security%' then raise; end if;
      raise notice 'OK: invio oltre 256 KB rifiutato (policy)';
  end;

  begin
    perform public.urs_freno_invii();
    raise exception 'TEST FALLITO: anon può eseguire direttamente la funzione anti-flood';
  exception when insufficient_privilege then
    raise notice 'OK: esecuzione diretta della funzione anti-flood rifiutata';
  end;

  -- public.rls_auto_enable() è di Supabase (opzione "Enable automatic RLS"): anon non deve poterla
  -- eseguire. Senza EXECUTE l'errore è "permission denied"; se invece arriva "trigger functions can
  -- only be called as triggers" vuol dire che anon HA il permesso e si ferma solo per il tipo di funzione.
  if pg_catalog.to_regprocedure('public.rls_auto_enable()') is null then
    raise notice 'SALTATO: public.rls_auto_enable() non esiste in questo progetto';
  else
    begin
      perform public.rls_auto_enable();
      raise exception 'TEST FALLITO: anon può eseguire public.rls_auto_enable()';
    exception
      when insufficient_privilege then
        raise notice 'OK: esecuzione diretta di public.rls_auto_enable() rifiutata';
      when feature_not_supported then
        raise exception 'TEST FALLITO: anon ha ancora il permesso EXECUTE su public.rls_auto_enable() '
                        '(riesegui setup.sql; se resta, la funzione appartiene a un altro ruolo)';
    end;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 2. Difesa in profondità: vincoli e policy devono rifiutare gli invii non validi ANCHE da soli
-- ---------------------------------------------------------------------------------------------
reset role;

-- 2a. I vincoli da soli: il proprietario della tabella non passa dalla RLS, quindi qui agiscono
--     solo i vincoli.
do $$
begin
  begin
    insert into public.urs_responses (risposte) values ('["non", "un", "oggetto"]');
    raise exception 'TEST FALLITO: il vincolo non rifiuta un invio che non è un oggetto JSON';
  exception when check_violation then
    raise notice 'OK: il vincolo da solo rifiuta l''invio non-oggetto';
  end;
  begin
    insert into public.urs_responses (risposte) values (jsonb_build_object('test', repeat('a', 300000)));
    raise exception 'TEST FALLITO: il vincolo non rifiuta un invio oltre 256 KB';
  exception when check_violation then
    raise notice 'OK: il vincolo da solo rifiuta l''invio oltre 256 KB';
  end;
end;
$$;

-- 2b. La policy da sola: tolgo i due vincoli dentro un savepoint, provo come anon, e annullo subito
--     (i vincoli tornano al "rollback to savepoint", prima ancora del rollback finale).
savepoint senza_vincoli;
alter table public.urs_responses
  drop constraint risposte_e_un_oggetto,
  drop constraint risposte_max_256kb;
set local role anon;

do $$
begin
  insert into public.urs_responses (risposte) values ('{"test": "valido, solo policy"}');
  raise notice 'OK: senza vincoli la policy accetta l''invio valido';
  begin
    insert into public.urs_responses (risposte) values ('["non", "un", "oggetto"]');
    raise exception 'TEST FALLITO: la policy da sola accetta un invio che non è un oggetto JSON';
  exception when insufficient_privilege then
    if sqlerrm not like '%row-level security%' then raise; end if;
    raise notice 'OK: la policy da sola rifiuta l''invio non-oggetto';
  end;
  begin
    insert into public.urs_responses (risposte) values (jsonb_build_object('test', repeat('a', 300000)));
    raise exception 'TEST FALLITO: la policy da sola accetta un invio oltre 256 KB';
  exception when insufficient_privilege then
    if sqlerrm not like '%row-level security%' then raise; end if;
    raise notice 'OK: la policy da sola rifiuta l''invio oltre 256 KB';
  end;
end;
$$;

rollback to savepoint senza_vincoli;

do $$
begin
  if (select count(*) from pg_catalog.pg_constraint
      where conrelid = 'public.urs_responses'::regclass
        and conname in ('risposte_e_un_oggetto', 'risposte_max_256kb')) <> 2 then
    raise exception 'TEST FALLITO: i vincoli non sono tornati dopo il savepoint';
  end if;
  raise notice 'OK: vincoli ripristinati';
end;
$$;

set local role anon;

-- Freno anti-flood orario: al più tardi il 21° invio dell'ultima ora deve essere rifiutato.
do $$
declare
  riusciti int := 0;
begin
  for i in 1..25 loop
    begin
      insert into public.urs_responses (risposte) values (jsonb_build_object('test', 'flood', 'n', i));
      riusciti := riusciti + 1;
    exception when raise_exception then
      if sqlerrm not like '%ultima ora%' then
        raise exception 'TEST FALLITO: errore inatteso dal freno anti-flood: %', sqlerrm;
      end if;
      raise notice 'OK: invio rifiutato dopo 20 invii nell''ultima ora (% riusciti in questo test)', riusciti;
      return;
    end;
  end loop;
  raise exception 'TEST FALLITO: accettati % invii di fila senza limite orario', riusciti;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- 3. Tetto totale di 200 righe (serve il ruolo proprietario per creare righe "vecchie")
-- ---------------------------------------------------------------------------------------------
reset role;

-- Le righe del test orario (con data di adesso) andrebbero a bloccare prima il limite orario:
-- le spostiamo indietro nel tempo, così resta attivo solo il tetto totale.
update public.urs_responses set creato_il = now() - interval '2 hours' where creato_il > now() - interval '1 hour';

do $$
begin
  -- Porta la tabella a 200 righe con date di più di un'ora fa (non contano per il limite orario).
  while (select count(*) from public.urs_responses) < 200 loop
    insert into public.urs_responses (creato_il, risposte)
      values (now() - interval '2 hours', '{"test": "riempimento"}');
  end loop;
end;
$$;

set local role anon;

do $$
begin
  insert into public.urs_responses (risposte) values ('{"test": "oltre il tetto"}');
  raise exception 'TEST FALLITO: accettato un invio oltre le 200 righe totali';
exception when raise_exception then
  if sqlerrm not like '%numero massimo%' then
    raise exception 'TEST FALLITO: errore inatteso dal tetto totale: %', sqlerrm;
  end if;
  raise notice 'OK: invio rifiutato oltre le 200 righe totali';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------------------------
-- 4. public.rls_auto_enable() di Supabase: nessuno la esegue direttamente, ma l'attivazione
--    automatica della RLS funziona ancora (Postgres non controlla EXECUTE per gli event trigger)
-- ---------------------------------------------------------------------------------------------
do $$
declare
  funzione regprocedure := pg_catalog.to_regprocedure('public.rls_auto_enable()');
  evento   name;
  rls      boolean;
begin
  if funzione is null then
    raise notice 'SALTATO: public.rls_auto_enable() non esiste in questo progetto';
    return;
  end if;

  if pg_catalog.has_function_privilege('anon', funzione::oid, 'execute')
     or pg_catalog.has_function_privilege('authenticated', funzione::oid, 'execute') then
    raise exception 'TEST FALLITO: anon o authenticated hanno EXECUTE su public.rls_auto_enable()';
  end if;
  raise notice 'OK: anon e authenticated non hanno EXECUTE su public.rls_auto_enable()';

  select evtname into evento
    from pg_catalog.pg_event_trigger
    where evtfoid = funzione::oid and evtenabled <> 'D'
    limit 1;
  if evento is null then
    raise notice 'SALTATO: nessun event trigger attivo usa public.rls_auto_enable()';
    return;
  end if;

  create table public.urs_prova_rls_automatica (x int);
  select relrowsecurity into rls
    from pg_catalog.pg_class
    where oid = 'public.urs_prova_rls_automatica'::regclass;
  if not rls then
    raise exception 'TEST FALLITO: la tabella nuova non ha la RLS attiva (event trigger %)', evento;
  end if;
  raise notice 'OK: l''event trigger % attiva ancora la RLS sulle tabelle nuove', evento;
end;
$$;

select 'TUTTI I TEST SUPERATI' as esito;

rollback;
