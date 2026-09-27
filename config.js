// Configurazione del modulo. ATTENZIONE: questo file è pubblico, chiunque apra il sito può leggerlo.
//
// - Usa SOLO la chiave pubblica del progetto Supabase DEDICATO a questo modulo:
//   la "anon" (legacy, inizia con eyJ…) oppure la "publishable" (inizia con sb_publishable_…).
// - NON inserire MAI la service_role key o una chiave sb_secret_…: il form si rifiuta di usarle,
//   ma finirebbero comunque pubblicate su GitHub.
window.URS_CONFIG = {
  SUPABASE_URL: 'https://INSERISCI-ID-PROGETTO.supabase.co',
  SUPABASE_ANON_KEY: 'INSERISCI-CHIAVE-ANON',

  // Password di accesso, salvata SOLO come hash PBKDF2-SHA256 (mai in chiaro, in nessun file).
  // Non è sicurezza reale: il codice è pubblico e il controllo avviene nel browser. Serve solo a
  // scoraggiare i curiosi. Per cambiarla vedi README → "Cambiare la password".
  PASSWORD_SALT: 'a914b231fbf9e5201e0270a596c3fdd8',
  PASSWORD_ITERAZIONI: 600000,
  PASSWORD_HASH: 'f8c246ba4a5da67da32debbf118275a0ad31f5b27aca82f18607dfc15ff209a1',
};
