(function () {
  'use strict';

  const CFG = window.URS_CONFIG || {};
  const SEZIONI = window.URS_SEZIONI || [];
  const VERSIONE = window.URS_VERSIONE || '';
  const DOMANDE = SEZIONI.flatMap((s) => s.domande);

  const KEY_BOZZA = 'urs-zineb-bozza-v1';
  const KEY_ACCESSO = 'urs-zineb-accesso';
  const KEY_ULTIMO_INVIO = 'urs-zineb-ultimo-invio';
  const TIMEOUT_INVIO_MS = 20000;

  const $ = (sel) => document.querySelector(sel);

  // localStorage può essere assente o lanciare eccezioni (navigazione privata, spazio pieno…).
  const store = {
    get(k) {
      try { return localStorage.getItem(k); } catch (e) { return null; }
    },
    set(k, v) {
      try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
    },
    getJSON(k) {
      try { return JSON.parse(this.get(k)); } catch (e) { return null; }
    },
  };

  function el(tag, attrs, figli) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k in n && typeof v !== 'string') n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const f of [].concat(figli === undefined ? [] : figli)) {
      n.append(f instanceof Node ? f : document.createTextNode(String(f)));
    }
    return n;
  }

  const dataOra = (d) =>
    d.toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const ora = (d) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const haNota = (d) => (d.tipo === 'scelta' || d.tipo === 'multi') && d.note !== false;

  // ---------------------------------------------------------------------------
  // Password (solo un filtro per i curiosi: il codice è pubblico)
  // ---------------------------------------------------------------------------

  const normalizza = (s) => s.trim().toLowerCase();

  async function sha256(testo) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function avvia() {
    const atteso = (CFG.PASSWORD_SHA256 || '').toLowerCase();
    if (!atteso || !(window.crypto && crypto.subtle)) return mostraApp();
    if (store.get(KEY_ACCESSO) === atteso) return mostraApp();

    // Link con la password già inclusa: …/#k=password (la parte dopo # non arriva mai al server).
    const m = location.hash.match(/[#&]k=([^&]*)/);
    if (m) {
      history.replaceState(null, '', location.pathname + location.search);
      let pw = '';
      try { pw = decodeURIComponent(m[1]); } catch (e) { /* link rovinato: chiediamo la password */ }
      if (pw && (await sha256(normalizza(pw))) === atteso) {
        store.set(KEY_ACCESSO, atteso);
        return mostraApp();
      }
    }

    $('#gate').hidden = false;
    const input = $('#gate-password');
    input.focus();
    $('#gate-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if ((await sha256(normalizza(input.value))) === atteso) {
        store.set(KEY_ACCESSO, atteso);
        $('#gate').hidden = true;
        mostraApp();
      } else {
        $('#gate-errore').hidden = false;
        input.select();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Costruzione del modulo
  // ---------------------------------------------------------------------------

  function costruisciCampo(d) {
    const base = 'q-' + d.id;
    const wrap = el('div', { class: 'domanda', 'data-id': d.id });
    const aiutoId = d.aiuto ? base + '-aiuto' : undefined;

    if (d.tipo === 'testo' || d.tipo === 'lungo') {
      wrap.append(el('label', { class: 'domanda-testo', for: base }, d.testo));
      if (d.aiuto) wrap.append(el('p', { class: 'aiuto', id: aiutoId }, d.aiuto));
      const attrs = {
        id: base,
        name: d.id,
        placeholder: d.placeholder,
        'aria-describedby': aiutoId,
        autocomplete: 'off',
      };
      wrap.append(
        d.tipo === 'lungo'
          ? el('textarea', Object.assign(attrs, { rows: '4' }))
          : el('input', Object.assign(attrs, { type: 'text', enterkeyhint: 'next' }))
      );
      return wrap;
    }

    const fs = el('fieldset', { class: 'scelte', 'aria-describedby': aiutoId });
    fs.append(el('legend', { class: 'domanda-testo' }, d.testo));
    if (d.aiuto) fs.append(el('p', { class: 'aiuto', id: aiutoId }, d.aiuto));
    if (d.tipo === 'multi') fs.append(el('p', { class: 'suggerimento' }, 'Puoi sceglierne più di una.'));
    d.opzioni.forEach((op, i) => {
      const id = base + '-' + i;
      fs.append(
        el('label', { class: 'opzione', for: id }, [
          el('input', { type: d.tipo === 'multi' ? 'checkbox' : 'radio', id, name: d.id, value: op }),
          el('span', {}, op),
        ])
      );
    });
    wrap.append(fs);

    if (haNota(d)) {
      const idNota = base + '-note';
      wrap.append(
        el('div', { class: 'nota' }, [
          el('label', { for: idNota }, d.note || 'Vuoi aggiungere qualcosa? (facoltativo)'),
          el('textarea', { id: idNota, name: d.id + '_note', rows: '2', autocomplete: 'off' }),
        ])
      );
    }
    return wrap;
  }

  function costruisciModulo() {
    const form = $('#form');
    SEZIONI.forEach((sez, i) => {
      const det = el('details', { class: 'sezione', id: 'sez-' + sez.id, 'data-sezione': sez.id });
      det.append(
        el('summary', {}, [
          el('span', { class: 'sez-num', 'aria-hidden': 'true' }, String(i + 1)),
          el('span', { class: 'sez-titolo' }, sez.titolo),
          el('span', { class: 'sez-conta' }, ''),
        ])
      );
      const corpo = el('div', { class: 'sez-corpo' });
      if (sez.intro) corpo.append(el('p', { class: 'sez-intro' }, sez.intro));
      sez.domande.forEach((d) => corpo.append(costruisciCampo(d)));

      const ultima = i === SEZIONI.length - 1;
      const avanti = el(
        'button',
        { type: 'button', class: 'btn btn-link' },
        ultima ? 'Vai all’invio ↓' : 'Sezione successiva →'
      );
      avanti.addEventListener('click', () => {
        det.open = false;
        const dest = ultima ? $('#invio') : det.nextElementSibling;
        if (!ultima) dest.open = true;
        dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      corpo.append(el('div', { class: 'sez-avanti' }, avanti));

      det.append(corpo);
      form.append(det);
    });
  }

  // I radio normalmente non si possono deselezionare: qui un secondo tocco sulla stessa opzione
  // la toglie, così Zineb può tornare a "nessuna risposta".
  function abilitaDeselezione() {
    const ultimo = {};
    const form = $('#form');
    form.querySelectorAll('input[type="radio"]:checked').forEach((r) => (ultimo[r.name] = r));
    form.addEventListener('click', (ev) => {
      const r = ev.target;
      if (!(r instanceof HTMLInputElement) || r.type !== 'radio') return;
      if (ultimo[r.name] === r) {
        r.checked = false;
        ultimo[r.name] = null;
        r.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        ultimo[r.name] = r;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Lettura / scrittura dei valori
  // ---------------------------------------------------------------------------

  function raccogli() {
    const form = $('#form');
    const r = {};
    for (const d of DOMANDE) {
      if (d.tipo === 'multi') {
        r[d.id] = Array.from(form.querySelectorAll(`input[name="${d.id}"]:checked`), (i) => i.value);
      } else if (d.tipo === 'scelta') {
        const c = form.querySelector(`input[name="${d.id}"]:checked`);
        r[d.id] = c ? c.value : '';
      } else {
        r[d.id] = form.elements[d.id].value.trim();
      }
      if (haNota(d)) r[d.id + '_note'] = form.elements[d.id + '_note'].value.trim();
    }
    return r;
  }

  function ripristina(r) {
    const form = $('#form');
    for (const d of DOMANDE) {
      const v = r[d.id];
      if (d.tipo === 'multi' || d.tipo === 'scelta') {
        const valori = Array.isArray(v) ? v : v ? [v] : [];
        form.querySelectorAll(`input[name="${d.id}"]`).forEach((i) => (i.checked = valori.includes(i.value)));
      } else if (typeof v === 'string') {
        form.elements[d.id].value = v;
      }
      if (haNota(d) && typeof r[d.id + '_note'] === 'string') {
        form.elements[d.id + '_note'].value = r[d.id + '_note'];
      }
    }
  }

  const haRisposta = (d, r) =>
    (Array.isArray(r[d.id]) ? r[d.id].length > 0 : Boolean(r[d.id])) || Boolean(r[d.id + '_note']);

  function conta(r) {
    return { date: DOMANDE.filter((d) => haRisposta(d, r)).length, totali: DOMANDE.length };
  }

  // ---------------------------------------------------------------------------
  // Progresso e salvataggio locale
  // ---------------------------------------------------------------------------

  function aggiornaProgresso(r) {
    const { date, totali } = conta(r);
    const perc = totali ? Math.round((date / totali) * 100) : 0;
    $('#progresso-barra').style.width = perc + '%';
    $('.progresso').setAttribute('aria-valuenow', String(perc));
    $('#riepilogo').textContent = `Hai risposto a ${date} domande su ${totali}.`;

    for (const sez of SEZIONI) {
      const det = document.querySelector(`[data-sezione="${sez.id}"]`);
      const fatte = sez.domande.filter((d) => haRisposta(d, r)).length;
      det.querySelector('.sez-conta').textContent = `${fatte}/${sez.domande.length}`;
      det.classList.toggle('completa', fatte === sez.domande.length);
    }
    aggiornaStatoInvio(r);
  }

  let timerSalvataggio = null;

  function salvaOra() {
    clearTimeout(timerSalvataggio);
    timerSalvataggio = null;
    const ok = store.set(
      KEY_BOZZA,
      JSON.stringify({ risposte: raccogli(), salvatoIl: new Date().toISOString() })
    );
    $('#stato-salvataggio').textContent = ok
      ? `Salvato sul dispositivo · ${ora(new Date())}`
      : 'Salvataggio automatico non disponibile: usa “Copia le risposte” prima di chiudere';
  }

  function alCambiamento() {
    aggiornaProgresso(raccogli());
    $('#stato-salvataggio').textContent = 'Salvataggio…';
    clearTimeout(timerSalvataggio);
    timerSalvataggio = setTimeout(salvaOra, 400);
  }

  function aggiornaStatoInvio(r) {
    const ultimo = store.getJSON(KEY_ULTIMO_INVIO);
    const esito = $('#esito');
    if (!ultimo || esito.dataset.fisso) return;
    const modificato = JSON.stringify(ultimo.risposte) !== JSON.stringify(r);
    mostraEsito(
      'info',
      `Ultimo invio: ${dataOra(new Date(ultimo.inviatoIl))}.`,
      modificato
        ? 'Hai fatto modifiche dopo l’ultimo invio: premi di nuovo «Invia le risposte» per mandarle.'
        : 'Nessuna modifica da allora.'
    );
  }

  function mostraEsito(tipo, titolo, testo, fisso) {
    const esito = $('#esito');
    esito.className = 'esito ' + tipo;
    esito.replaceChildren(el('p', {}, el('strong', {}, titolo)));
    if (testo) esito.append(el('p', {}, testo));
    esito.hidden = false;
    if (fisso) esito.dataset.fisso = '1';
    else delete esito.dataset.fisso;
  }

  // ---------------------------------------------------------------------------
  // Invio a Supabase
  // ---------------------------------------------------------------------------

  // Blocca l'invio se in config.js è finita per errore una chiave privata.
  function controllaChiave(k) {
    if (!k || /INSERISCI/.test(k) || !CFG.SUPABASE_URL || /INSERISCI/.test(CFG.SUPABASE_URL)) {
      return 'mancante';
    }
    if (k.startsWith('sb_secret_')) return 'privata';
    if (k.startsWith('eyJ')) {
      try {
        const payload = JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role !== 'anon') return 'privata';
      } catch (e) {
        return 'mancante';
      }
    }
    return 'ok';
  }

  async function inviaASupabase(risposte) {
    const chiave = CFG.SUPABASE_ANON_KEY;
    const headers = {
      apikey: chiave,
      'Content-Type': 'application/json',
      // Nessuna SELECT per il ruolo anon: chiediamo a Supabase di non restituire la riga inserita.
      Prefer: 'return=minimal',
    };
    // Le chiavi legacy (JWT) vanno anche nell'Authorization; le nuove sb_publishable_ no.
    if (chiave.startsWith('eyJ')) headers.Authorization = 'Bearer ' + chiave;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_INVIO_MS);
    try {
      const res = await fetch(CFG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/urs_responses', {
        method: 'POST',
        headers,
        body: JSON.stringify({ risposte }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const dettaglio = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${dettaglio}`.trim());
      }
    } finally {
      clearTimeout(timer);
    }
  }

  async function invia() {
    salvaOra();
    const r = raccogli();
    const { date, totali } = conta(r);

    if (date === 0) {
      mostraEsito('info', 'Non hai ancora risposto a nessuna domanda.', '', true);
      return;
    }
    const vuote = totali - date;
    if (
      vuote > 0 &&
      !window.confirm(
        `Hai lasciato ${vuote} ${vuote === 1 ? 'domanda' : 'domande'} senza risposta.\n\n` +
          'Vuoi inviare comunque? Potrai completarle e inviare di nuovo più avanti.'
      )
    ) {
      return;
    }

    const statoChiave = controllaChiave(CFG.SUPABASE_ANON_KEY);
    if (statoChiave !== 'ok') {
      if (statoChiave === 'privata') {
        console.error('config.js contiene una chiave Supabase privata: invio bloccato. Usa solo la chiave anon/publishable.');
      }
      erroreInvio('Il salvataggio online non è ancora configurato.');
      return;
    }

    const btn = $('#btn-invia');
    btn.disabled = true;
    btn.textContent = 'Invio in corso…';
    mostraEsito('info', 'Invio in corso…', '', true);

    try {
      await inviaASupabase(
        Object.assign({}, r, {
          _meta: {
            versione_domande: VERSIONE,
            risposte_date: date,
            domande_totali: totali,
            inviato_dal_browser_il: new Date().toISOString(),
          },
        })
      );
      store.set(KEY_ULTIMO_INVIO, JSON.stringify({ risposte: r, inviatoIl: new Date().toISOString() }));
      mostraEsito(
        'ok',
        'Risposte inviate, grazie!',
        'Simone le ha ricevute. Se vuoi cambiare qualcosa, modificala qui e premi di nuovo «Invia le risposte».'
      );
      $('.backup').classList.remove('evidenzia');
    } catch (e) {
      console.error('Invio fallito:', e);
      erroreInvio(
        e && e.name === 'AbortError'
          ? 'La connessione è troppo lenta o assente.'
          : navigator.onLine === false
            ? 'Sembra che tu non sia connessa a internet.'
            : 'Qualcosa non ha funzionato.'
      );
    } finally {
      btn.disabled = false;
      btn.textContent = 'Invia le risposte';
    }
  }

  function erroreInvio(motivo) {
    mostraEsito(
      'errore',
      'Le risposte non sono state inviate.',
      `${motivo} Non preoccuparti: sono salvate su questo dispositivo. Riprova più tardi, oppure usa i pulsanti qui sotto per mandarle a Simone in un altro modo.`,
      true
    );
    $('.backup').classList.add('evidenzia');
  }

  // ---------------------------------------------------------------------------
  // Copia di sicurezza
  // ---------------------------------------------------------------------------

  function testoLeggibile(r) {
    const righe = [
      'URS — Sito Web Fotografa: risposte di Zineb',
      'Esportate il ' + dataOra(new Date()),
      '',
    ];
    const rientra = (s) => s.replace(/\n/g, '\n   ');
    SEZIONI.forEach((sez, i) => {
      righe.push(`${i + 1}. ${sez.titolo.toUpperCase()}`, '');
      for (const d of sez.domande) {
        const v = Array.isArray(r[d.id]) ? r[d.id].join(', ') : r[d.id];
        righe.push('• ' + d.testo, '   ' + (v ? rientra(v) : '—'));
        if (r[d.id + '_note']) righe.push('   Note: ' + rientra(r[d.id + '_note']));
        righe.push('');
      }
    });
    righe.push(
      '— Dati per Simone (non modificare) —',
      JSON.stringify({ versione_domande: VERSIONE, risposte: r })
    );
    return righe.join('\n');
  }

  function avvisoBackup(testo) {
    $('#esito-backup').textContent = testo;
  }

  async function copia() {
    const testo = testoLeggibile(raccogli());
    try {
      await navigator.clipboard.writeText(testo);
    } catch (e) {
      const ta = el('textarea', { readonly: true, style: 'position:fixed;opacity:0' });
      ta.value = testo;
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (!ok) {
        avvisoBackup('Non riesco a copiare: prova con “Scarica un file”.');
        return;
      }
    }
    avvisoBackup('Copiate! Ora incollale in un messaggio o in una email per Simone.');
  }

  function scarica() {
    const blob = new Blob([testoLeggibile(raccogli())], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `risposte-sito-zineb-${new Date().toISOString().slice(0, 10)}.txt` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avvisoBackup('File scaricato: mandalo a Simone quando vuoi.');
  }

  async function condividi() {
    try {
      await navigator.share({ title: 'Risposte per il sito', text: testoLeggibile(raccogli()) });
    } catch (e) {
      if (e && e.name !== 'AbortError') avvisoBackup('Condivisione non riuscita: prova con “Copia le risposte”.');
    }
  }

  // ---------------------------------------------------------------------------
  // Avvio
  // ---------------------------------------------------------------------------

  function mostraApp() {
    costruisciModulo();

    const bozza = store.getJSON(KEY_BOZZA);
    if (bozza && bozza.risposte) {
      ripristina(bozza.risposte);
      $('#stato-salvataggio').textContent = `Bozza ripresa · ${dataOra(new Date(bozza.salvatoIl))}`;
    }
    abilitaDeselezione();

    // Apre la prima sezione non ancora completa.
    const r = raccogli();
    aggiornaProgresso(r);
    const daFare = SEZIONI.find((s) => s.domande.some((d) => !haRisposta(d, r))) || SEZIONI[0];
    document.querySelector(`[data-sezione="${daFare.id}"]`).open = true;

    const form = $('#form');
    form.addEventListener('input', alCambiamento);
    form.addEventListener('change', alCambiamento);
    form.addEventListener('submit', (ev) => ev.preventDefault());

    // Salva subito quando la pagina viene chiusa o messa in background (es. cambio app sul telefono).
    const flush = () => timerSalvataggio && salvaOra();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());

    $('#btn-invia').addEventListener('click', invia);
    $('#btn-copia').addEventListener('click', copia);
    $('#btn-scarica').addEventListener('click', scarica);
    if (navigator.share) {
      $('#btn-condividi').hidden = false;
      $('#btn-condividi').addEventListener('click', condividi);
    }

    $('#app').hidden = false;
  }

  avvia();
})();
