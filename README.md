# Raccolta risposte URS — Zineb Chahbouni

Mini sito statico (GitHub Pages) dove Zineb risponde alle domande dell'URS del suo sito da fotografa.
Le risposte vengono salvate in una tabella Supabase che solo Simone può leggere dalla dashboard.

Specifiche complete in [`CLAUDE.md`](CLAUDE.md).

## File

| File | Cosa contiene |
|------|---------------|
| `index.html`, `styles.css`, `app.js` | Il modulo |
| `questions.js` | Le domande (una sezione per ogni capitolo dell'URS) |
| `config.js` | URL Supabase, chiave **anon** pubblica, hash della password |
| `tools/genera-hash.html` (+ `.js`, `.css`) | **Modo standard** per calcolare l'hash di una nuova password, nel browser |
| `tools/hash-password.mjs` | Alternativa da terminale (Node) alla pagina qui sopra |
| `supabase/setup.sql` | **Unica fonte** dello schema: tabella `urs_responses`, permessi, RLS, vincoli, freno anti-flood |
| `supabase/chiudi-porta.sql` | Toglie ad anon la possibilità di inserire (da usare dopo l'invio di Zineb) |
| `supabase/test-sicurezza.sql` | Test dei permessi del ruolo anon (non lascia righe: finisce con `rollback`) |
| `.gitleaks.toml` | Regole ed eccezioni dello scanner dei segreti (gitleaks) |
| `tools/installa-gitleaks.sh` | Installa gitleaks in `.tools/`, nella versione fissata e verificata con lo SHA-256 ufficiale |
| `.githooks/pre-commit` | Controllo dei segreti prima di ogni commit (blocca se gitleaks manca) |
| `.github/workflows/segreti.yml` | Controllo dei segreti su GitHub a ogni push e PR (file e cronologia) |
| `.github/dependabot.yml` | Aggiorna gli SHA delle azioni usate nei workflow |

## Attivare il controllo dei segreti (in ogni clone, prima del primo commit)

Il repo è pubblico: prima di ogni commit un hook controlla con gitleaks che nei file in stage non ci siano
chiavi o token. Si attiva una volta per ogni clone (la configurazione è locale, non viaggia con il repo):

```sh
sh tools/installa-gitleaks.sh          # scarica gitleaks 8.30.1 in .tools/ e ne verifica lo SHA-256
git config core.hooksPath .githooks    # attiva .githooks/pre-commit
```

Se gitleaks manca o non è nella versione fissata, il commit viene **bloccato** con un messaggio. Se trova
un segreto, il commit viene bloccato e il valore nel messaggio è oscurato: toglilo dal file (e se era una
chiave vera, rigenerala subito). **Mai** saltare il controllo con `git commit --no-verify`.

Lo stesso controllo gira anche su GitHub (*Actions → Controllo segreti*) a ogni push e a ogni PR, su tutti i
file e su tutta la cronologia: se trova qualcosa la PR mostra una ✗ rossa. Vale anche per chi non ha
attivato l'hook.

## Setup (una volta)

1. **Supabase** — crea un progetto nuovo, separato da quello del sito vero.
   Poi *SQL Editor → New query*, incolla `supabase/setup.sql` e premi *Run*.
   Subito dopo, in una nuova query, esegui `supabase/test-sicurezza.sql`: deve finire con
   «TUTTI I TEST SUPERATI». Infine apri *Advisors → Security Advisor*: non devono esserci né errori né
   avvisi. Se `setup.sql` stampa un WARNING su `public.rls_auto_enable()`, la revoca non ha avuto effetto:
   fermati e verifica prima di andare avanti.
2. **config.js** — da *Project Settings → API* copia:
   - *Project URL* → `SUPABASE_URL`
   - la chiave **anon** (`eyJ…`) oppure la **publishable** (`sb_publishable_…`) → `SUPABASE_ANON_KEY`

   ⚠️ Mai la `service_role` o una `sb_secret_…`: il file è pubblico. Il form comunque si rifiuta di inviare
   se riconosce una chiave privata.
3. **Password** — già impostata (vedi *Cambiare la password* qui sotto). In `config.js` c'è solo il suo
   hash PBKDF2, mai la password in chiaro.
4. **GitHub Pages** — *Settings → Pages → Build and deployment → Deploy from a branch*, poi scegli il
   branch predefinito del repo e la cartella `/ (root)`.
5. **Link per Zineb** — mandale in privato `https://simorovi.github.io/zineb-urs-form/#k=<password>`:
   la pagina entra da sola e il browser se lo ricorda. La parte dopo `#` non arriva a nessun server, ma
   il link contiene la password: non pubblicarlo da nessuna parte. Se lo perde, basta rimandarglielo.

## Dopo che Zineb ha inviato: chiudere la porta

Quando le risposte di Zineb sono in tabella, esegui `supabase/chiudi-porta.sql` nel *SQL Editor*: toglie al
ruolo anon la policy e il permesso di inserimento, così nessuno può più scrivere nel database tramite il
modulo pubblico (l'invio fallisce e il form propone la copia di sicurezza). Le risposte restano dove sono.
Per riaprire, ad esempio se Zineb deve correggere qualcosa, basta rieseguire `supabase/setup.sql`.

## Cambiare la password

La password non va **mai** scritta in chiaro nel repo (né in file, né in commenti, né nei messaggi di
commit), e non passa dalla chat: il repo è pubblico. Il modo standard:

1. apri `tools/genera-hash.html`, dal sito (`https://simorovi.github.io/zineb-urs-form/tools/genera-hash.html`)
   o come file locale;
2. scrivi la nuova password (lunga, meglio una frase di più parole) e premi *Calcola*;
3. copia le tre righe `PASSWORD_*` al posto di quelle in `config.js`.

L'hash si calcola solo nel browser: la pagina non fa richieste di rete (lo impone la sua Content Security
Policy) e non salva nulla. Le righe `PASSWORD_*` sono pubbliche per scelta: si possono passare a Claude Code
o mettere in un commit. Maiuscole e spazi ai lati vengono ignorati, sia qui sia nel form.

In alternativa, da terminale (la password non compare a schermo né nella cronologia della shell):

```sh
read -rs PW && printf '%s' "$PW" | node tools/hash-password.mjs; unset PW
```

## Verifica sicurezza (Definition of done)

Sostituisci `URL` e `ANON` con i valori di `config.js`.

```sh
# 1. Inserimento con la chiave anon → deve rispondere 201
curl -i -X POST "$URL/rest/v1/urs_responses" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"risposte":{"test":"prova da curl"}}'

# 2. Lettura con la chiave anon → deve FALLIRE (401, "permission denied for table urs_responses")
curl -i "$URL/rest/v1/urs_responses?select=*" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# 3. Invio con `id` o `creato_il` scelti a mano → deve FALLIRE (permission denied)
curl -i -X POST "$URL/rest/v1/urs_responses" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"creato_il":"2000-01-01","risposte":{"test":"data finta"}}'

# 4. Modifica e cancellazione con la chiave anon → devono FALLIRE
curl -i -X PATCH "$URL/rest/v1/urs_responses?id=not.is.null" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d '{"risposte":{}}'
curl -i -X DELETE "$URL/rest/v1/urs_responses?id=not.is.null" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```

Con una chiave `sb_publishable_…` togli l'header `Authorization`.
Poi cancella la riga di prova dalla dashboard (*Table Editor → urs_responses*).

## Come funziona

- **Salvataggio locale**: ogni modifica viene salvata in `localStorage` (solo su quel browser/dispositivo).
- **Invio**: «Invia le risposte» fa una `POST` a `/rest/v1/urs_responses` con il solo campo `risposte`
  e `Prefer: return=minimal` (necessario perché anon non ha SELECT). Ogni invio crea una riga nuova: **vale la più recente** per
  `creato_il`. In `risposte._meta` ci sono versione delle domande e numero di risposte date.
- **Limiti nel database**: ogni invio deve essere un oggetto JSON di al massimo 256 KB (misurati sul testo);
  al massimo 20 invii nell'ultima ora e 200 in totale, poi il database rifiuta (trigger in `setup.sql`).
- **Backup**: se l'invio fallisce, Zineb può condividere (da telefono), copiare o scaricare le risposte
  come testo leggibile; in fondo al testo c'è anche il JSON completo.
- **Chiavi JSON**: sono gli `id` in `questions.js`. Le domande a scelta hanno anche `<id>_note`.
  Non rinominare gli id dopo che Zineb ha iniziato, o la sua bozza locale non verrà più ritrovata.

## Provarlo in locale

```sh
python3 -m http.server 8000
# poi apri http://localhost:8000/#k=<password>
```
