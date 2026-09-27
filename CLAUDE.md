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
Unica fonte: `supabase/setup.sql` (rieseguibile senza errori né perdita di dati). Test:
`supabase/test-sicurezza.sql` (impersona il ruolo anon, finisce con `rollback`).

- Tabella: `urs_responses` — una riga per invio, vale la più recente per `creato_il`
- Colonne:
  - `id` (uuid, default `gen_random_uuid()`) — lo decide sempre il database
  - `creato_il` (timestamptz, default `now()`) — lo decide sempre il database
  - `risposte` (jsonb, not null) — tutte le risposte del form in un unico oggetto, es.
    `{ "obiettivo_principale": [...], "sito_attuale": "...", "_meta": {...} }`; unica colonna
    che il ruolo anon può scrivere
- Vincoli (drop + add, così restano rieseguibili):
  - `risposte_e_un_oggetto`: `risposte` deve essere un oggetto JSON
  - `risposte_max_256kb`: `octet_length(risposte::text) <= 262144` (testo non compresso)
- Permessi: `revoke all` ad `anon` e `authenticated`, poi `grant insert (risposte)` ad `anon`.
  Nessun altro permesso: lettura, modifica e cancellazione con la chiave pubblica falliscono con
  "permission denied"
- Row Level Security: ABILITATA
  - Policy "anon puo solo inserire" (INSERT, ruolo `anon`)
  - Nessuna policy di select/update/delete: solo Simone legge le risposte, dalla dashboard Supabase
- Anti-flood: trigger BEFORE INSERT `urs_freno_invii` → funzione `public.urs_freno_invii()`
  (`security definer`, `search_path = ''`, nomi qualificati, lock per gli invii simultanei,
  `execute` revocato a public/anon/authenticated). Rifiuta l'invio se nell'ultima ora ci sono già
  20 righe o se la tabella ne ha già 200 in totale
- Chiusura: `supabase/chiudi-porta.sql` (da eseguire dopo che Zineb ha inviato) toglie la policy e il
  permesso di inserimento ad anon; per riaprire si riesegue `setup.sql`

## Comportamento del form
- Salvataggio automatico locale (localStorage) mentre Zineb compila, così non perde il lavoro se
  chiude la scheda a metà
- All'invio finale ("Invia le risposte"), il form chiama l'API REST di Supabase (o supabase-js) per
  inserire una riga in `urs_responses`, usando SOLO la chiave `anon` pubblica
- Dopo l'invio, messaggio di conferma chiaro (es. "Risposte inviate, grazie!")
- Mantenere anche l'opzione di esportare/copiare le risposte in locale come backup, nel caso la
  chiamata a Supabase fallisca (es. problemi di connessione)

## Sicurezza — requisito fondamentale
La sicurezza è una priorità assoluta per Simone. In caso di conflitto tra comodità e sicurezza,
vince la sicurezza; se una scelta ha un impatto sulla sicurezza, va spiegata a Simone PRIMA di farla.

- La chiave `service_role`/`secret` di Supabase non va MAI nel codice, nei commit, nei log, nelle PR
  o nelle issue. Se compare per errore in un commit: fermarsi, avvisare Simone, rigenerare la chiave
- Usare solo la chiave pubblica (`anon`/`publishable`). Tutta la protezione vive nel database:
  `supabase/setup.sql` è l'unica fonte (permessi colonna per colonna + Row Level Security + vincoli +
  trigger anti-flood). Ogni modifica a tabelle, permessi o policy si fa lì, resta rieseguibile ed è
  accompagnata dal relativo test di sicurezza
- La password di accesso non va MAI scritta in chiaro: né nei file del repo (codice, commenti,
  README), né nei messaggi di commit, né negli output dei comandi. In `config.js` va solo il suo hash
  (PBKDF2, generato con `tools/hash-password.mjs`)
- La password NON è una misura di sicurezza: il controllo avviene nel browser e si può aggirare.
  Non va mai presentata come tale né usata per proteggere dati. Deve essere lunga, perché l'hash è
  pubblico
- L'invio manda SOLO il campo `risposte` (mai `id` o `creato_il`) e usa `Prefer: return=minimal`
  (non esiste una policy di lettura, quindi chiedere indietro la riga farebbe fallire l'invio)
- Il testo inserito dall'utente non va mai scritto in pagina con `innerHTML`: usare `.value` per i
  campi e `textContent` per i testi
- Nessuno script esterno oltre a quelli strettamente necessari. Preferibile una semplice chiamata
  `fetch` all'API REST, senza librerie; se mai servisse una libreria da CDN: versione fissata e
  attributo `integrity` (SRI)
- La pagina deve avere `<meta name="robots" content="noindex, nofollow">`

## Definition of done
- [ ] Le risposte inviate da Zineb compaiono nella tabella `urs_responses` su Supabase
- [ ] Il form funziona bene anche da mobile (Zineb potrebbe compilarlo da telefono)
- [ ] La password di accesso fa da filtro semplice, senza bloccare Zineb se perde/richiede il link
- [ ] Con la chiave pubblica: lettura, modifica e cancellazione rifiutate
- [ ] Con la chiave pubblica: invio con `id`/`creato_il` scelti a mano rifiutato
- [ ] Invio oltre 256 KB (testo non compresso) o non-oggetto rifiutato; oltre 20 invii/ora rifiutati
- [ ] `setup.sql` rieseguibile senza errori
- [ ] Security Advisor di Supabase senza errori
- [ ] Nessuna chiave segreta né password ancora valida in chiaro nella cronologia git

Eccezione accettata da Simone il 27/09/2026: la vecchia password temporanea del modulo compare in
chiaro in 2 commit già pubblicati (`b81a7bb`, `5718c27`). È scaduta (non apre più il modulo) e la
cronologia non viene riscritta: il repo è pubblico, quindi riscriverla non la eliminerebbe davvero.
