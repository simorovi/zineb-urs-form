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
| `supabase/setup.sql` | Tabella `urs_responses` + Row Level Security |

## Setup (una volta)

1. **Supabase** — crea un progetto nuovo, separato da quello del sito vero.
   Poi *SQL Editor → New query*, incolla `supabase/setup.sql` e premi *Run*.
2. **config.js** — da *Project Settings → API* copia:
   - *Project URL* → `SUPABASE_URL`
   - la chiave **anon** (`eyJ…`) oppure la **publishable** (`sb_publishable_…`) → `SUPABASE_ANON_KEY`

   ⚠️ Mai la `service_role` o una `sb_secret_…`: il file è pubblico. Il form comunque si rifiuta di inviare
   se riconosce una chiave privata.
3. **Password** — scegli una password e mettine l'hash in `PASSWORD_SHA256`:
   ```sh
   echo -n 'lapassword' | sha256sum
   ```
   (scrivila in minuscolo: il form ignora maiuscole e spazi ai lati).
4. **GitHub Pages** — *Settings → Pages → Deploy from a branch* → `main` / root.
5. **Link per Zineb** — mandale `https://simorovi.github.io/zineb-urs-form/#k=lapassword`: la password
   è nel link (dopo `#`, quindi non arriva a nessun server) e la pagina entra da sola. Una volta entrata,
   il browser se lo ricorda. Se perde il link, basta rimandarglielo o dirle la password.

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

# 3. Modifica e cancellazione con la chiave anon → devono FALLIRE
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
- **Invio**: «Invia le risposte» fa una `POST` a `/rest/v1/urs_responses` con `Prefer: return=minimal`
  (necessario perché anon non ha SELECT). Ogni invio crea una riga nuova: **vale la più recente** per
  `creato_il`. In `risposte._meta` ci sono versione delle domande e numero di risposte date.
- **Backup**: se l'invio fallisce, Zineb può condividere (da telefono), copiare o scaricare le risposte
  come testo leggibile; in fondo al testo c'è anche il JSON completo.
- **Chiavi JSON**: sono gli `id` in `questions.js`. Le domande a scelta hanno anche `<id>_note`.
  Non rinominare gli id dopo che Zineb ha iniziato, o la sua bozza locale non verrà più ritrovata.

## Provarlo in locale

```sh
python3 -m http.server 8000
# poi apri http://localhost:8000/#k=<password>
```
