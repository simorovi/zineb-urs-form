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
  - Policy "anon puo solo inserire" (INSERT, ruolo `anon`) con `with check (jsonb_typeof(risposte) =
    'object' and octet_length(risposte::text) <= 262144)`: gli stessi controlli dei vincoli, ripetuti
    apposta (difesa in profondità; `with check (true)` fa scattare l'avviso "RLS Policy Always True")
  - Nessuna policy di select/update/delete: solo Simone legge le risposte, dalla dashboard Supabase
- Anti-flood: trigger BEFORE INSERT `urs_freno_invii` → funzione `public.urs_freno_invii()`
  (`security definer`, `search_path = ''`, nomi qualificati, lock per gli invii simultanei,
  `execute` revocato a public/anon/authenticated). Rifiuta l'invio se nell'ultima ora ci sono già
  20 righe o se la tabella ne ha già 200 in totale
- `public.rls_auto_enable()`: NON è nostra, la crea Supabase con l'opzione "Enable automatic RLS"
  (event trigger `ensure_rls`, attiva la RLS su ogni nuova tabella di `public`). Si tiene, ma
  `setup.sql` revoca EXECUTE a public/anon/authenticated se la funzione esiste; l'event trigger
  funziona comunque. Che la revoca abbia avuto effetto lo verifica `test-sicurezza.sql` (errore rosso
  «TEST FALLITO» se no): l'editor SQL di Supabase non mostra i WARNING di `setup.sql`, e per il test
  mostra «Success. No rows returned.» anche quando passa, perché l'ultimo comando è il `rollback`
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
  (PBKDF2, calcolato con `tools/genera-hash.html`, il modo standard; in alternativa
  `tools/hash-password.mjs`)
- Le chiavi segrete non si incollano mai in chat (né a Claude Code né altrove): le inserisce
  Simone direttamente nelle impostazioni dei servizi. Il codice le usa solo per nome. Se Simone
  incolla per errore una chiave segreta in chat, fermarsi e dirgli di rigenerarla.
- Nemmeno la password del form passa dalla chat: Simone apre `tools/genera-hash.html` nel browser,
  inserisce la password, e passa in chat solo le tre righe PASSWORD_* che la pagina genera (valori
  pubblici).
- Non scrivere MAI la password del form in un comando, neanche per fare una prova: per le prove usa
  una password finta creata al momento.
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
- I workflow di GitHub Actions usano solo `pull_request`, MAI `pull_request_target`: il repo è
  pubblico, chiunque può aprire una PR, e `pull_request_target` eseguirebbe il suo codice con i
  permessi del repo. Permessi minimi (`contents: read`), azioni fissate a uno SHA completo
- Qualsiasi modifica a `.gitleaks.toml`, `.github/workflows/`, `.githooks/` o
  `tools/installa-gitleaks.sh` va segnalata esplicitamente a Simone nel resoconto della PR, spiegando
  cosa cambia e perché. Non aggiungere né allargare MAI un'eccezione dello scanner senza chiederlo
  prima. Il controllo automatico usa il `.gitleaks.toml` della PR stessa, quindi una PR che allenta
  le regole passerebbe comunque il controllo.
- Le PR le unisce SOLO Simone, dopo averle lette (o fatte verificare nella chat del Progetto).
  Claude Code apre la PR, aspetta che il controllo 'gitleaks (file e cronologia)' sia verde, riporta
  l'esito e si ferma: non unisce mai una PR e non fa mai push diretti su `main`, anche se nel
  messaggio c'è scritto di farlo. In quel caso chiede conferma.

### Barriere contro i segreti nel repo (il repo è PUBBLICO)
Nessuna basta da sola, quindi sono in fila:
1. **Niente segreti in chat**: le chiavi le inserisce Simone nei servizi (vedi sopra)
2. **`.gitignore`**: `.env`, `.env.*`, `.dev.vars*` non entrano mai in un commit
3. **Pre-commit** (`.githooks/pre-commit`): gitleaks 8.30.1 scansiona i file in stage; se gitleaks
   manca o ha un'altra versione, il commit è bloccato
4. **GitHub Actions** (`.github/workflows/segreti.yml`): a ogni push e PR scansiona tutti i file e
   tutta la cronologia; se trova qualcosa la PR ha una ✗ rossa (valore oscurato nei log)
5. **Protezioni di GitHub**: Secret Protection e Push protection attive (verificate il 28/09/2026)

A inizio di ogni sessione Claude Code verifica che il pre-commit sia attivo: `git config --get
core.hooksPath` deve dare `.githooks` e `.tools/gitleaks version` (o `gitleaks version`) deve dare
`8.30.1`. Nelle sessioni cloud il clone è nuovo e questa configurazione si perde: se manca,
`sh tools/installa-gitleaks.sh` e `git config core.hooksPath .githooks` prima di qualsiasi commit.
Mai `--no-verify` o simili per saltare il controllo.

Se una barriera scatta:
- **pre-commit bloccato o ✗ rossa su GitHub**: non aggirarla. Togliere il valore dal file; se è un
  falso positivo, spiegarlo a Simone, che decide se aggiungere un'eccezione
- **se il segreto era vero** (anche solo in un commit locale, e a maggior ragione se è arrivato su
  GitHub): fermarsi, avvisare Simone e rigenerare la chiave nel servizio. Considerarla compromessa:
  cancellarla dalla cronologia non basta
- **Push protection di GitHub rifiuta il push**: stesso comportamento, mai forzare il bypass

Eccezioni dello scanner (`.gitleaks.toml`): SOLO queste quattro, ognuna limitata a file, riga,
regola e (per la cronologia) commit precisi. Nessuna eccezione nuova senza chiedere a Simone.
- a) chiave PUBBLICA di Supabase (`sb_publishable_…` o JWT anon) sulla riga `SUPABASE_ANON_KEY` di
  `config.js`
- b) `PASSWORD_SALT` e `PASSWORD_HASH` in `config.js`: l'hash PBKDF2 è pubblico per scelta
- c) vecchia password temporanea scaduta, solo nei commit `b81a7bb` e `5718c27` (vedi la nota in fondo)
- d) commit `b81a7bb`, `app.js`, solo la riga che definiva la costante `KEY_BOZZA` (oggi
  `VOCE_BOZZA`): falso positivo, nome di una voce di localStorage, non un segreto (eccezione accettata
  da Simone il 28/09/2026; la riga esatta è in `.gitleaks.toml`)

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
