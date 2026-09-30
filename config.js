// Configurazione del modulo. ATTENZIONE: questo file è pubblico, chiunque apra il sito può leggerlo.
//
// - Usa SOLO la chiave pubblica del progetto Supabase DEDICATO a questo modulo:
//   la "anon" (legacy, inizia con eyJ…) oppure la "publishable" (inizia con sb_publishable_…).
// - NON inserire MAI la service_role key o una chiave sb_secret_…: il form si rifiuta di usarle,
//   ma finirebbero comunque pubblicate su GitHub.
window.URS_CONFIG = {
  SUPABASE_URL: 'https://lxdwpfpavigjolfakyac.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_5RhArjP7SFOK6DBVtPN5Aw_-Dsq8GP-',

  // Password di accesso, salvata SOLO come hash PBKDF2-SHA256 (mai in chiaro, in nessun file).
  // Non è sicurezza reale: il codice è pubblico e il controllo avviene nel browser. Serve solo a
  // scoraggiare i curiosi. Per cambiarla vedi README → "Cambiare la password".
  PASSWORD_SALT: 'ba20b8f42eaf572266d418245112a4b8',
  PASSWORD_ITERAZIONI: 600000,
  PASSWORD_HASH: 'a243726a9ec3eae95a7ba979369037c5efed61c8edbe56c4642cb485b78a8179',
};
