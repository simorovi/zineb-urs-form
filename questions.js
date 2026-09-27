// Domande del documento "URS — Sito Web Fotografa: Raccolta Requisiti" (20 settembre 2026).
//
// Ogni domanda ha un `id` che diventa la chiave nel JSON salvato in `urs_responses.risposte`.
// Non rinominare gli id dopo che Zineb ha iniziato a compilare: le bozze salvate nel suo browser
// e le righe già inviate userebbero ancora le chiavi vecchie.
//
// Tipi:
//   testo  → risposta breve (una riga)
//   lungo  → risposta lunga (area di testo)
//   scelta → una sola opzione (cliccando di nuovo si deseleziona)
//   multi  → più opzioni
// Le domande `scelta`/`multi` hanno anche un campo note libero, salvato come `<id>_note`
// (etichetta personalizzabile con `note`, oppure `note: false` per toglierlo).

window.URS_VERSIONE = '2026-09-27';

window.URS_SEZIONI = [
  {
    id: 'obiettivo',
    titolo: 'Obiettivo del sito',
    intro: 'Prima di ogni scelta tecnica serve sapere cosa deve ottenere il sito per te.',
    domande: [
      {
        id: 'obiettivo_principale',
        tipo: 'multi',
        testo: 'Qual è il risultato principale che vuoi dal sito?',
        opzioni: [
          'Più richieste di preventivo',
          'Più prenotazioni dirette',
          'Far conoscere il mio nome / brand',
          'Altro',
        ],
        note: 'Se ne scegli più di uno, qual è il più importante? (facoltativo)',
      },
      {
        id: 'obiettivo_richieste_mese',
        tipo: 'testo',
        testo: 'Quante nuove richieste al mese renderebbero il sito un successo nei primi 6 mesi?',
        placeholder: 'es. 5 al mese',
      },
      {
        id: 'sito_attuale',
        tipo: 'scelta',
        testo: 'Hai già un sito?',
        opzioni: ['Sì', 'No'],
        note: "Se sì: qual è l'indirizzo e cosa non funziona?",
      },
      {
        id: 'scadenza_lancio',
        tipo: 'testo',
        testo: "C'è una scadenza da rispettare per il lancio?",
        placeholder: 'es. prima della stagione dei matrimoni, entro marzo…',
      },
      {
        id: 'velocita_vs_effetti',
        tipo: 'scelta',
        testo:
          'Se vuoi pagine più ricche (effetti, animazioni, video), sei disposta a perdere un po’ di velocità di caricamento per averle?',
        aiuto:
          'Ogni effetto o video verrà misurato per il suo impatto reale sulla velocità, non aggiunto a prescindere.',
        opzioni: [
          'No, la velocità resta la priorità assoluta, anche con uno stile più semplice',
          'Sì, un po’ di velocità in meno va bene per avere effetti e video',
          'Una via di mezzo: decidiamo caso per caso',
        ],
      },
    ],
  },
  {
    id: 'pubblico',
    titolo: 'Pubblico',
    domande: [
      {
        id: 'clienti_tipo',
        tipo: 'multi',
        testo: 'Chi sono i tuoi clienti tipo?',
        opzioni: [
          'Coppie che cercano una fotografa di matrimonio',
          'Viaggiatori',
          'Aziende',
          'Altro',
        ],
        note: 'Altro / dettagli (facoltativo)',
      },
      {
        id: 'clienti_eta_zona',
        tipo: 'lungo',
        testo: 'Che età hanno, più o meno, e da dove vengono principalmente?',
      },
      {
        id: 'clienti_canali',
        tipo: 'multi',
        testo: 'Come ti trovano soprattutto?',
        opzioni: ['Google', 'Instagram', 'Passaparola', 'Altro'],
        note: 'Altro / dettagli (facoltativo)',
      },
      {
        id: 'cliente_ideale',
        tipo: 'lungo',
        testo: "C'è un cliente “ideale” che vorresti attrarre di più con il nuovo sito?",
      },
      {
        id: 'clienti_stranieri',
        tipo: 'testo',
        testo: 'Quanti dei tuoi clienti sono stranieri (es. matrimoni sul Lago di Como)?',
        placeholder: 'es. circa la metà, pochi, nessuno…',
      },
      {
        id: 'lingue_sito',
        tipo: 'scelta',
        testo:
          'Abbiamo previsto il sito in italiano e in inglese: l’italiano come lingua principale, l’inglese per i clienti stranieri. Ti va bene?',
        opzioni: ['Sì, va bene', 'Vorrei cambiare qualcosa'],
        note: 'Se vuoi cambiare qualcosa, scrivi cosa',
      },
    ],
  },
  {
    id: 'servizi',
    titolo: 'Servizi e pacchetti',
    domande: [
      {
        id: 'servizi_elenco',
        tipo: 'lungo',
        testo: 'Elenco completo dei servizi che offri',
        placeholder: 'es. matrimoni, ritratti di coppia, proposte, viaggi…',
      },
      {
        id: 'servizi_dettagli',
        tipo: 'lungo',
        testo: 'Per ogni servizio: cosa include, quanto dura la sessione, quante foto consegni',
        placeholder: 'es. Matrimonio — giornata intera, circa 400 foto, galleria online…',
      },
      {
        id: 'prezzi_visibili',
        tipo: 'scelta',
        testo: 'I prezzi vanno mostrati sul sito?',
        opzioni: [
          'Sì, prezzi visibili',
          'Solo un “a partire da…”',
          'No, solo su richiesta',
        ],
      },
      {
        id: 'pacchetti',
        tipo: 'scelta',
        testo: 'Hai pacchetti fissi o ogni preventivo è su misura?',
        opzioni: [
          'Pacchetti fissi',
          'Ogni preventivo è personalizzato',
          'Tutti e due: pacchetti base + personalizzazioni',
        ],
      },
    ],
  },
  {
    id: 'contenuti',
    titolo: 'Testi',
    domande: [
      {
        id: 'bio',
        tipo: 'lungo',
        testo: 'La tua bio e la tua storia personale',
        aiuto: 'Se hai già del materiale scritto (come quello condiviso finora) puoi incollarlo qui.',
      },
      {
        id: 'tono_voce',
        tipo: 'multi',
        testo: 'Che tono di voce vuoi per i testi?',
        opzioni: ['Informale e personale', 'Professionale', 'Poetico'],
      },
      {
        id: 'testi_pagine',
        tipo: 'lungo',
        testo:
          'Ci sono testi specifici che vuoi in qualche pagina (home, chi sono, servizi, portfolio, contatti)?',
      },
      {
        id: 'faq',
        tipo: 'lungo',
        testo: 'Quali domande ti fanno più spesso i clienti?',
        placeholder: 'es. “Quanto costa?”, “Con quanto anticipo devo prenotare?”',
      },
      {
        id: 'testimonianze',
        tipo: 'scelta',
        testo: 'Hai recensioni o testimonianze di clienti passati da mostrare?',
        opzioni: ['Sì', 'Qualcuna', 'No'],
        note: 'Dove si trovano? (Google, email, Instagram…)',
      },
    ],
  },
  {
    id: 'foto',
    titolo: 'Foto e portfolio',
    intro:
      'Qui si decide molto della velocità del sito: il formato delle immagini lo scegliamo insieme, non a caso.',
    domande: [
      {
        id: 'foto_selezione',
        tipo: 'scelta',
        testo: 'Le foto per il portfolio sono già selezionate?',
        opzioni: ['Sì, già selezionate', 'In parte', 'No, da scegliere insieme'],
      },
      {
        id: 'foto_formato',
        tipo: 'lungo',
        testo: 'In che formato e risoluzione hai i file originali?',
        aiuto: 'Se non lo sai, scrivi che fotocamera usi e come esporti di solito le foto.',
        placeholder: 'es. RAW + JPG, 6000×4000 px…',
      },
      {
        id: 'foto_liberatorie',
        tipo: 'scelta',
        testo:
          'Hai il diritto di pubblicare tutte le foto? (liberatorie firmate dalle persone fotografate, soprattutto per i matrimoni)',
        opzioni: ['Sì, per tutte', 'Solo per alcune', 'No', 'Non lo so'],
      },
      {
        id: 'ritratto_personale',
        tipo: 'scelta',
        testo: 'Serve un tuo ritratto professionale per l’apertura del sito?',
        opzioni: ['Ce l’ho già', 'Sì, va fatto', 'Preferisco non mettere una mia foto'],
      },
    ],
  },
  {
    id: 'identita',
    titolo: 'Identità visiva',
    domande: [
      {
        id: 'logo',
        tipo: 'scelta',
        testo: 'Hai già un logo?',
        opzioni: ['Sì', 'Sì, ma va rinnovato', 'No, va creato'],
      },
      {
        id: 'colori_font',
        tipo: 'lungo',
        testo: 'Colori e font che ti piacciono, o siti/brand che trovi belli',
        aiuto:
          'Puoi incollare anche i link. Per ogni link scrivi cosa ti piace: il font, i colori, come sono mostrate le foto, l’atmosfera…',
      },
      {
        id: 'branding_esistente',
        tipo: 'lungo',
        testo:
          'Hai materiale di branding con cui il sito deve essere coerente? (biglietti da visita, firma email, profili social)',
      },
      {
        id: 'nome_sito',
        tipo: 'scelta',
        testo: 'Il sito va a tuo nome o sotto un nome di studio/brand?',
        aiuto: 'Da questo dipende anche il nome a dominio (l’indirizzo del sito).',
        opzioni: ['A mio nome (Zineb Chahbouni)', 'Con un nome di studio/brand separato'],
        note: 'Se brand: quale nome? Hai già idee per il dominio?',
      },
    ],
  },
  {
    id: 'mappa',
    titolo: 'Pagine del sito',
    domande: [
      {
        id: 'pagine',
        tipo: 'multi',
        testo: 'Quali pagine vuoi?',
        opzioni: ['Home', 'Chi sono', 'Servizi', 'Portfolio', 'Blog', 'Contatti', 'Altro'],
        note: 'Altre pagine / dettagli (facoltativo)',
      },
      {
        id: 'blog',
        tipo: 'scelta',
        testo:
          'Vuoi un blog? Aiuta a farsi trovare su Google, ma va aggiornato ogni tanto.',
        opzioni: [
          'Sì, voglio un blog',
          'No, preferisco non avere contenuti da aggiornare',
          'Non so, parliamone',
        ],
      },
      {
        id: 'pagina_prezzi',
        tipo: 'scelta',
        testo: 'Una pagina prezzi pubblica o solo un modulo “richiedi preventivo”?',
        opzioni: ['Pagina prezzi pubblica', 'Solo modulo “richiedi preventivo”', 'Tutti e due'],
      },
    ],
  },
  {
    id: 'seo',
    titolo: 'Farsi trovare su Google',
    intro:
      'Per arrivare in prima pagina su Google serve soprattutto una zona geografica chiara: la fotografia di matrimonio è un settore molto locale.',
    domande: [
      {
        id: 'seo_zona',
        tipo: 'testo',
        testo: 'Su che zona vuoi puntare?',
        placeholder: 'es. matrimoni sul Lago di Como',
      },
      {
        id: 'seo_parole_chiave',
        tipo: 'lungo',
        testo: 'Cosa scriverebbero su Google i tuoi clienti per trovarti?',
        placeholder: 'es. “fotografa matrimonio lago di como”',
      },
      {
        id: 'google_business',
        tipo: 'scelta',
        testo: 'Hai già un profilo Google Business (la scheda che appare su Google Maps)?',
        aiuto: 'Se non ce l’hai, lo creiamo in parallelo al sito.',
        opzioni: ['Sì', 'No', 'Non lo so'],
      },
      {
        id: 'competitor',
        tipo: 'lungo',
        testo: 'Ci sono fotografi della tua zona che vorresti superare su Google?',
        aiuto: 'Nomi o link.',
      },
    ],
  },
  {
    id: 'contatto',
    titolo: 'Contatti e richieste',
    domande: [
      {
        id: 'contatto_canali',
        tipo: 'multi',
        testo: 'Come vuoi ricevere le richieste dei clienti?',
        opzioni: ['Modulo sul sito', 'Email diretta', 'WhatsApp', 'Instagram DM', 'Altro'],
      },
      {
        id: 'prenotazione',
        tipo: 'scelta',
        testo: 'Ti serve una prenotazione con calendario o basta un modulo di contatto?',
        opzioni: [
          'Basta un modulo di contatto semplice',
          'Serve la prenotazione con calendario',
          'Non so, parliamone',
        ],
      },
      {
        id: 'tempo_risposta',
        tipo: 'testo',
        testo: 'Entro quanto tempo ti impegni a rispondere a una richiesta?',
        aiuto: 'Serve per il messaggio che il cliente vede dopo aver scritto.',
        placeholder: 'es. entro 24 ore',
      },
    ],
  },
  {
    id: 'tecnico',
    titolo: 'Aspetti tecnici',
    domande: [
      {
        id: 'dominio',
        tipo: 'scelta',
        testo: 'Hai già un dominio registrato (un indirizzo tipo nome.it)?',
        opzioni: ['Sì', 'No', 'Non lo so'],
        note: 'Se sì: quale, e con quale provider? (es. Aruba, Register, GoDaddy…)',
      },
      {
        id: 'hosting',
        tipo: 'scelta',
        testo:
          'Il sito sarà ospitato su Cloudflare: è veloce, affidabile e gratuito anche per un sito professionale come il tuo. Ti va bene?',
        opzioni: ['Sì, va bene', 'Vorrei cambiare qualcosa'],
        note: 'Se vuoi cambiare qualcosa, scrivi cosa',
      },
      {
        id: 'traffico',
        tipo: 'testo',
        testo: 'Quante visite ti aspetti, soprattutto nei periodi di punta (stagione matrimoni)?',
        placeholder: 'Anche a occhio va benissimo, o “non lo so”',
      },
      {
        id: 'email_pro',
        tipo: 'scelta',
        testo: 'Ti serve un’email professionale sul dominio (es. info@tuonome.it)?',
        opzioni: ['Sì', 'No', 'Ce l’ho già'],
      },
      {
        id: 'tempo_caricamento',
        tipo: 'scelta',
        testo:
          'Abbiamo fissato un obiettivo di velocità preciso: il sito deve superare i controlli di Google sulla velocità (Core Web Vitals), cioè caricarsi in meno di 2,5 secondi anche da telefono. Ti va bene?',
        opzioni: ['Sì, va bene', 'Vorrei cambiare qualcosa'],
        note: 'Se vuoi cambiare qualcosa, scrivi cosa',
      },
      {
        id: 'aggiornamento_portfolio',
        tipo: 'scelta',
        testo:
          'Il sito sarà fatto su misura, senza WordPress. Per aggiornare il portfolio avrai un pannello tutto tuo: carichi la foto, scegli la categoria, scrivi una breve descrizione e il sito si aggiorna da solo in pochi minuti. Ti va bene?',
        opzioni: ['Sì, va bene', 'Vorrei cambiare qualcosa'],
        note: 'Se vuoi cambiare qualcosa, scrivi cosa',
      },
    ],
  },
  {
    id: 'legale',
    titolo: 'Aspetti legali',
    domande: [
      {
        id: 'liberatorie_modello',
        tipo: 'scelta',
        testo:
          'Hai un modello di liberatoria che fai firmare ai clienti? Andranno verificate prima di pubblicare le loro foto.',
        opzioni: ['Sì, ce l’ho', 'No, va preparato', 'Non lo so'],
      },
      {
        id: 'privacy_policy',
        tipo: 'scelta',
        testo: 'Hai già testi di privacy policy e cookie policy (GDPR)?',
        opzioni: ['Sì', 'No, vanno preparati', 'Non lo so'],
      },
      {
        id: 'marchi',
        tipo: 'lungo',
        testo:
          'Ci sono marchi o nomi commerciali da verificare prima del lancio? (es. il nome del brand è già usato da qualcun altro?)',
      },
    ],
  },
  {
    id: 'manutenzione',
    titolo: 'Statistiche e aggiornamenti',
    domande: [
      {
        id: 'account_google',
        tipo: 'scelta',
        testo:
          'Hai già un account Google Analytics o Search Console? Li collegheremo dal giorno del lancio.',
        opzioni: ['Sì', 'No', 'Non lo so'],
      },
      {
        id: 'chi_aggiorna',
        tipo: 'scelta',
        testo: 'Chi si occuperà di aggiornare il sito in futuro?',
        opzioni: ['Io stessa', 'Un professionista', 'Nessuno / molto raramente', 'Non lo so'],
      },
      {
        id: 'frequenza_aggiornamento',
        tipo: 'testo',
        testo: 'Ogni quanto pensi di aggiornare il portfolio (o il blog, se ci sarà)?',
        placeholder: 'es. una volta al mese, dopo ogni matrimonio…',
      },
      {
        id: 'note_finali',
        tipo: 'lungo',
        testo: 'C’è qualcosa che non ti abbiamo chiesto e che vuoi dire?',
      },
    ],
  },
];
