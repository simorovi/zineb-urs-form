-- Test di sicurezza del database: verifica che il ruolo pubblico (anon) possa fare SOLO ciò che
-- setup.sql gli concede. Da eseguire dopo setup.sql, in: Dashboard Supabase → SQL Editor → Run.
--
-- Tutto avviene in una transazione annullata alla fine (rollback): non lascia righe nella tabella.
-- Se un controllo fallisce, lo script si ferma con un errore "TEST FALLITO: …".
-- Se arriva in fondo, l'ultima riga del risultato è "TUTTI I TEST SUPERATI".
--
-- Nota: i test sul freno anti-flood contano anche le righe già presenti. Eseguilo prima di mandare
-- il link a Zineb, o comunque quando nell'ultima ora non ci sono stati invii veri.

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

  begin
    insert into public.urs_responses (risposte) values ('["non", "un", "oggetto"]');
    raise exception 'TEST FALLITO: accettato un invio che non è un oggetto JSON';
  exception when check_violation then
    raise notice 'OK: invio non-oggetto rifiutato';
  end;

  begin
    -- ~300 KB di testo ripetitivo: compresso occuperebbe circa 3 KB, il testo supera 256 KB.
    insert into public.urs_responses (risposte)
      values (jsonb_build_object('test', repeat('a', 300000)));
    raise exception 'TEST FALLITO: accettato un invio oltre 256 KB non compressi';
  exception when check_violation then
    raise notice 'OK: invio oltre 256 KB rifiutato';
  end;

  begin
    perform public.urs_freno_invii();
    raise exception 'TEST FALLITO: anon può eseguire direttamente la funzione anti-flood';
  exception when insufficient_privilege then
    raise notice 'OK: esecuzione diretta della funzione anti-flood rifiutata';
  end;
end;
$$;

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
-- 2. Tetto totale di 200 righe (serve il ruolo proprietario per creare righe "vecchie")
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

select 'TUTTI I TEST SUPERATI' as esito;

rollback;
