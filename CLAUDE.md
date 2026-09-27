# Modulo: Raccolta risposte URS — Zineb Chahbouni

## Obiettivo
Mini sito statico, separato dal sito vero, che permette a Zineb di rispondere comodamente alle
domande del documento "URS — Sito Web Fotografa". Le risposte devono salvarsi in modo persistente,
non solo nel suo browser, così Simone può rivederle in qualsiasi momento senza dipendere da un export
manuale da parte sua.

## Stack tecnico
- Frontend: HTML/CSS/JS semplice (nessun framework necessario), ospitato su GitHub Pages — repo
  pubblico `zineb-urs-form` (GitHub Pages gratuito richiede repo pubblico)
- Storage risposte: Supabase — progetto DEDICATO e SEPARATO da quello del sito vero (due progetti
  distinti, così un errore qui non tocca i dati di produzione)
- Accesso: nessuna vera autenticazione utente. Protezione con una password semplice lato client, solo
  per scoraggiare i curiosi — non è sicurezza reale, e va trattata come tale (il repo è pubblico per
  forza, essendo su GitHub Pages gratuito)

## Struttura dati Supabase
- Tabella: `urs_responses`
- Colonne:
  - `id` (uuid, generato automaticamente)
  - `creato_il` (timestamp, default now())
  - `risposte` (jsonb) — tutte le risposte del form in un unico oggetto, es.
    `{ "obiettivo_sito": "...", "servizi": [...], ... }`
- Row Level Security: ABILITATA
  - Policy INSERT: consentita al ruolo `anon` (il form pubblico deve poter scrivere)
  - Policy SELECT: NON creata per il ruolo `anon` — nessuno deve poter leggere le risposte tramite
    l'API pubblica; solo Simone le legge dalla dashboard Supabase

## Comportamento del form
- Salvataggio automatico locale (localStorage) mentre Zineb compila, così non perde il lavoro se
  chiude la scheda a metà
- All'invio finale ("Invia le risposte"), il form chiama l'API REST di Supabase (o supabase-js) per
  inserire una riga in `urs_responses`, usando SOLO la chiave `anon` pubblica
- Dopo l'invio, messaggio di conferma chiaro (es. "Risposte inviate, grazie!")
- Mantenere anche l'opzione di esportare/copiare le risposte in locale come backup, nel caso la
  chiamata a Supabase fallisca (es. problemi di connessione)

## Sicurezza — cosa NON fare mai
- Non inserire MAI la `service_role key` di Supabase nel codice del form: quel codice è visibile a
  chiunque apra il sito pubblico su GitHub Pages
- Usare solo la chiave `anon` pubblica, e affidarsi alla Row Level Security per limitare cosa può
  fare (solo insert, mai select/update/delete)
- Non scrivere MAI la password di accesso in chiaro: né nei file del repo (codice, commenti, README),
  né nei messaggi di commit, né negli output dei comandi. In `config.js` va solo il suo hash
  (PBKDF2, generato con `tools/hash-password.mjs`)

## Definition of done
- [ ] Le risposte inviate da Zineb compaiono nella tabella `urs_responses` su Supabase
- [ ] Nessuno può leggere le risposte tramite l'API pubblica (verificato provando una SELECT con la
      chiave anon: deve fallire)
- [ ] Il form funziona bene anche da mobile (Zineb potrebbe compilarlo da telefono)
- [ ] La password di accesso fa da filtro semplice, senza bloccare Zineb se perde/richiede il link
