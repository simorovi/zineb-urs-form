// Configurazione del modulo. ATTENZIONE: questo file è pubblico, chiunque apra il sito può leggerlo.
//
// - Usa SOLO la chiave pubblica del progetto Supabase DEDICATO a questo modulo:
//   la "anon" (legacy, inizia con eyJ…) oppure la "publishable" (inizia con sb_publishable_…).
// - NON inserire MAI la service_role key o una chiave sb_secret_…: il form si rifiuta di usarle,
//   ma finirebbero comunque pubblicate su GitHub.
window.URS_CONFIG = {
  SUPABASE_URL: 'https://INSERISCI-ID-PROGETTO.supabase.co',
  SUPABASE_ANON_KEY: 'INSERISCI-CHIAVE-ANON',

  // SHA-256 della password di accesso, scritta in minuscolo (maiuscole e spazi ai lati vengono
  // ignorati). Non è sicurezza reale: serve solo a scoraggiare i curiosi.
  // Per cambiarla: echo -n 'nuovapassword' | sha256sum
  PASSWORD_SHA256: '81aeff282c2fd14c28266010afe2dc0afb49efc8e7f9454347a04a5f4327cc91',
};
