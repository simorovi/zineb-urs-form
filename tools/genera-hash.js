// Calcola nel browser gli stessi valori di tools/hash-password.mjs, con lo stesso algoritmo usato dal
// modulo per controllare la password (hashPassword in app.js):
// PBKDF2-SHA256, 600.000 iterazioni, 32 byte; sale = 16 byte casuali in esadecimale, usato come testo.
// Nessuna rete e nessun salvataggio: la password resta solo nel campo e nella memoria della pagina.
(function () {
  'use strict';

  const ITERAZIONI = 600000;
  const $ = (id) => document.getElementById(id);
  const esadecimale = (buf) =>
    Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

  // Stessa normalizzazione del modulo (normalizza in app.js) e dello script Node.
  const normalizza = (s) => s.trim().toLowerCase();

  async function calcola(password) {
    const sale = esadecimale(crypto.getRandomValues(new Uint8Array(16)));
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(sale), iterations: ITERAZIONI },
      base,
      256
    );
    return [
      `  PASSWORD_SALT: '${sale}',`,
      `  PASSWORD_ITERAZIONI: ${ITERAZIONI},`,
      `  PASSWORD_HASH: '${esadecimale(bits)}',`,
    ].join('\n');
  }

  $('modulo').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const password = normalizza($('password').value);
    if (!password) {
      $('stato').textContent = 'Scrivi una password.';
      return;
    }
    if (!(window.crypto && crypto.subtle)) {
      $('stato').textContent = 'Questo browser non supporta WebCrypto: apri la pagina da https o da un browser recente.';
      return;
    }
    $('calcola').disabled = true;
    $('stato').textContent = 'Calcolo in corso…';
    try {
      $('righe').value = await calcola(password);
      $('risultato').hidden = false;
      $('stato').textContent = 'Fatto. Ora puoi chiudere questa pagina dopo aver copiato le righe.';
    } catch (e) {
      $('stato').textContent = 'Calcolo non riuscito: ' + (e && e.message ? e.message : e);
    } finally {
      $('calcola').disabled = false;
      $('password').value = '';
    }
  });

  $('copia').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('righe').value);
      $('stato').textContent = 'Righe copiate.';
    } catch (e) {
      $('righe').select();
      $('stato').textContent = 'Copia automatica non disponibile: righe selezionate, copiale a mano.';
    }
  });
})();
