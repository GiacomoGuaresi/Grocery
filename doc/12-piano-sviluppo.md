# 12 — Piano di sviluppo

Step piccoli e indipendenti. Ognuno lascia l'app in uno stato **funzionante e
verificabile**: si può fermarsi dopo qualsiasi step senza lasciare cose a metà.

L'ordine è pensato per vedere qualcosa a schermo il prima possibile e rimandare le
parti infrastrutturali (Supabase, PWA) a quando la logica è già solida.

---

## Step 0 — Fondamenta ✅

- [x] Scheletro del progetto: React + TypeScript + Vite
- [x] `tsconfig`, `vite.config.ts` con `base: '/Grocery/'`, `.gitignore`
- [x] Dati statici in `src/data/*.json` (reparti, routine, catalogo, stagionalità, prodotti)
- [x] Tipi del modello dati in `src/domain/tipi.ts`
- [x] `npm install` e verifica che `npm run dev` parta
- [x] Vitest configurato, con un test di smoke che passa

## Step 1 — App vuota che gira ✅

Una pagina bianca ma vera, con la sua identità.

- [x] Layout mobile-first di base (header, area contenuto)
- [x] Palette pastello a tema culinario, tema chiaro
- [x] Font e dimensioni pensate per l'uso in corsia (testo grande, tap ampi)
- [x] Schermata segnaposto "Lista della spesa" vuota

## Step 2 — Caricamento e validazione dei dati statici ✅

Prima di costruirci sopra, assicurarsi che i JSON siano coerenti.

- [x] Modulo che carica e tipizza i cinque JSON
- [x] Test: ogni `reparto` citato nel catalogo esiste in `reparti.json`
- [x] Test: ogni categoria della routine esiste nel catalogo
- [x] Test: ogni mese ha almeno 4 verdure e 4 frutti di stagione

## Step 3 — Lista corrente (sola lettura) ✅

- [x] Stato in memoria con una lista di esempio
- [x] Voci raggruppate per reparto, nell'ordine di corsia
- [x] Reparti vuoti non mostrati
- [x] ~~Voci raggruppate *Frutta* e *Verdura* rese con i loro elementi~~ → dal
      2026-09-11 una voce per ogni tipo di frutta e verdura

## Step 4 — Spunta ✅

- [x] Tap su una voce = comprata, la voce sparisce dalla lista attiva
- [x] ~~Spunta dei **singoli elementi** dentro Frutta e Verdura~~ → ogni tipo è una
      voce a sé e si spunta dalla sua checkbox
- [x] Sezione ripiegata "Già presi" in fondo
- [x] De-spunta di una voce dalla sezione "Già presi"
- [x] Test sulle transizioni di stato

## Step 5 — Persistenza locale (SQLite) ✅

- [x] Interfaccia `Storage` (leggi lista, salva lista, leggi/salva rotazioni)
- [x] Implementazione con `sql.js` (SQLite in WASM), database su IndexedDB
- [x] Schema SQL delle tabelle `liste`, `voci`, `rotazioni` (la tabella `elementi`
      c'era fino al 2026-09-11: i database vecchi si migrano all'apertura)
- [x] La lista sopravvive al refresh della pagina
- [x] Test dell'implementazione contro l'interfaccia
- [x] ~~SQLite~~ tolto il 2026-09-11: da allora anche lo sviluppo gira su Supabase

## Step 6 — Inserimento manuale ✅

- [x] Campo di aggiunta sempre raggiungibile dalla schermata lista
- [x] Autocompletamento case-insensitive su `prodotti.json`
- [x] Prodotto riconosciuto → reparto assegnato in automatico
- [x] Prodotto nuovo → reparto `altro`
- [x] Test: riconoscimento con accenti, maiuscole, spazi

## Step 7 — Eliminazione e rinomina ✅

- [x] Eliminazione di qualsiasi voce
- [x] Rinomina delle sole voci manuali in "Altro"
- [x] Nessuna modifica del reparto, in nessun caso

## Step 8 — Algoritmo di generazione ✅

Il cuore del progetto. Solo logica, nessuna UI: tutto coperto da test.

- [x] Selezione di stagione: verdura e frutta del mese corrente
- [x] ~~Rotazione deterministica con memoria (`ultimoIndice` per categoria)~~
- [x] Scelta **casuale** con memoria (`ultimi` per categoria): a giro fisso usciva
      sempre lo stesso animale con tagli diversi
- [x] Copertura del ciclo: 2 carne rossa, 2 formaggio, 4 pesce, 2 uova, 2 carne bianca, 2 affettati
- [x] Varietà dentro il ciclo: tipologie diverse tra loro nella stessa categoria
- [x] 4 verdure e 4 frutti diversi per ciclo
- [x] Test: due cicli consecutivi non ripropongono le stesse tipologie
- [x] Test: la pesca gira su tutto il catalogo, non su un angolo solo
- [x] Test: a gennaio non escono pomodori

## Step 9 — Generazione dall'interfaccia ✅

- [x] Azione "Genera lista" con conferma
- [x] Se ci sono voci non spuntate, chiede se portarle nella nuova lista
- [x] La lista precedente viene archiviata
- [x] Nessuna rigenerazione in place

## Step 10 — Dropdown delle alternative ✅

- [x] Dropdown su ogni voce generata, con le altre tipologie della categoria
- [x] Dropdown su ogni tipo di frutta e verdura, in due sezioni: prima le alternative
      **di stagione**, poi quelle fuori stagione
- [x] La sostituzione non altera lo stato della rotazione salvata
- [x] Le alternative non ripropongono quello che è già in lista
- [x] Il reparto segue la tipologia scelta: è un dato del catalogo

## Step 11 — Piano settimanale ✅

- [x] Vista con la tabella dei pasti
- [x] Giorno corrente evidenziato
- [x] Mostra la **categoria** del giorno, non la tipologia
- [x] Barra in alto per passare tra *Lista* e *Piano*

## Step 12 — Archivio ✅

- [x] Elenco delle liste passate, in sola lettura
- [x] Apertura di una lista archiviata
- [x] Terza scheda *Archivio* nella barra in alto

## Step 12b — Menu laterale e densità ✅

- [x] Menu laterale a scomparsa al posto della barra in alto: *Lista*, *Piano*,
      *Archivio* e l'azione *Genera lista*
- [x] "Genera lista" dal menu apre direttamente la conferma
- [x] Interfaccia in scala 0.8 (i campi di testo restano a 16px per iOS)
- [x] Voci della lista compatte, attaccate in un blocco per reparto
- [x] Le funzioni della voce (alternative, rinomina, elimina) in un popup aperto
      dal ⋯: nella riga resta solo la spunta
- [x] Piano: via la pastiglia "oggi", il giorno corrente resta solo evidenziato

## Step 12c — Frutta e verdura di stagione ✅

- [x] Sezioni *Frutta* e *Verdura* nel menu laterale, stessa pagina per entrambe
- [x] Parte dalla stagione corrente; si cambia stagione o si restringe a un mese
- [x] Striscia dei 12 mesi per ogni tipo, col bordo attorno al periodo scelto;
      quello di tutto l'anno a parte
- [x] Nelle iniziali dei mesi è evidenziato solo il mese corrente

## Step 13 — Supabase ✅

Da qui in poi l'app diventa condivisa.

- [x] Schema equivalente a quello SQLite, come migrazione in `supabase/migrations`
- [x] Progetto Supabase creato (*GiacomoGuaresi's Project Grocery*, ref
      `fvsohjlrulwabvfvcfxo`) e migrazione applicata con `supabase db push`
- [x] `supabase login` + `supabase link`, per lavorare sul progetto dalla CLI senza
      connection string
- [x] Seconda implementazione dell'interfaccia `Storage`
- [x] Test di contratto in `supabase.test.ts`, che gira contro il Supabase locale
      (vuole Docker): senza, i test si saltano
- [x] ~~Selezione dell'implementazione per ambiente (dev → SQLite, prod → Supabase;
      `VITE_STORAGE` la forza)~~ → dal 2026-09-11 solo Supabase, anche in sviluppo
- [x] Policy: lettura e scrittura solo per la sessione autenticata. Verificate sul
      progetto: senza sessione tabelle, vista e funzioni rispondono "permission denied"
- [x] Registrazione pubblica disattivata in `supabase/config.toml`, che vale solo per
      il Supabase locale. **Sul progetto è ancora aperta**: rimandata allo Step 14

## Step 14 — Accesso con passphrase

- [x] Schermata con il solo campo passphrase, davanti all'app finché non c'è una
      sessione
- [x] Sessione conservata nei cookie (`@supabase/ssr`): non viene richiesta a ogni
      apertura, nemmeno senza rete
- [x] Se la sessione finisce con l'app aperta si torna alla passphrase
- [x] Email dell'account in `.env.local` (`VITE_SUPABASE_EMAIL`)
- [x] Unico account creato dalla dashboard; verificato sul progetto: con la
      passphrase giusta si entra e si leggono le tabelle, con quella sbagliata no
- [x] Nessuna registrazione pubblica abilitata. Spenta il 2026-09-11 con la
      Management API (`PATCH /v1/projects/{ref}/config/auth`, `disable_signup:
      true`), perché il salvataggio dalla dashboard dava "Failed to fetch".
      Verificato su `/auth/v1/settings`: `disable_signup: true`. Serviva: le policy
      non filtrano per utente, quindi con le registrazioni aperte chiunque avesse la
      chiave publishable poteva crearsi un account e fare di tutto sui dati

## Step 15 — Realtime

- [x] Sottoscrizione alle modifiche della lista corrente: il realtime ascolta la
      tabella `liste`, che fa da campanello (`aggiornata_il`), e a ogni avviso la
      lista si rilegge. Si rilegge anche a ogni riconnessione del canale e quando
      l'app torna in primo piano. Migrazione `20260911100000_realtime.sql`
      applicata al progetto con `supabase db push`
- [ ] Le spunte di un dispositivo compaiono sull'altro — scritto ma **non ancora
      provato con due dispositivi veri**. Il test di `supabase.test.ts` lo verifica
      contro il Supabase locale, che vuole Docker → Step 18
- [x] Risoluzione dei conflitti *last-write-wins* per singola voce: dopo ogni
      modifica si scrivono solo le voci toccate (`salvaVoci`, funzione
      `salva_voci`), così due spunte su voci diverse si sommano. Coperta dai test
      di contratto
- [x] Una voce appena toccata non torna indietro per una rilettura capitata a metà:
      finché la sua scrittura è in volo vale la versione di questo dispositivo
- [x] Una generazione fatta sull'altro dispositivo porta anche qui la lista nuova;
      le scritture rimaste indietro non toccano l'archivio

## Step 16 — PWA e offline

- [x] `vite-plugin-pwa`, manifest e icone. Le icone escono da `public/icona.svg`
      con `npm run icone` e sono versionate in `public/`
- [ ] Installabile sul telefono — manifest, icone e service worker ci sono (e il
      sito pubblicato li serve), ma **non ancora provato su un telefono vero** →
      Step 18
- [x] Voce "Installa l'app" in fondo al menu laterale (`src/ui/installazione.ts`):
      i browser non mostrano un popup di installazione, quindi senza voce non si
      trovava. Usa il prompt di Chrome/Edge/Android se c'è, altrimenti mostra le
      istruzioni per iOS, Android o desktop
- [x] Shell in cache: il service worker della build mette in precache HTML, JS,
      CSS e icone. Verificato sull'output della build, non ancora a rete staccata
      sul telefono
- [x] La lista resta sul dispositivo (`localStorage`): l'app si apre e la mostra
      anche senza rete. Solo la primissima apertura su un dispositivo vuole la rete
- [x] Scritture offline messe in coda, anche lei in `localStorage`: sopravvive
      alla chiusura dell'app e parte al ritorno della rete (evento `online`,
      riconnessione del realtime, app in primo piano). In cima alla lista una riga
      dice che si è senza rete e quante modifiche aspettano
- [x] *Last-write-wins* rivisto: ogni scrittura porta l'ora della modifica
      (`quando`), e sulla voce resta in `modificata_il`; una modifica più vecchia
      arrivata tardi non copre una più nuova. Una voce eliminata non torna più
      (`voci_eliminate`). Migrazione `20260911200000_offline.sql`, applicata al
      progetto con `supabase db push` il 2026-09-11
- [x] Test del ciclo offline → online in `sincronizzatore.test.ts`, su un database
      in memoria che passa lo stesso contratto di Supabase. Il contratto nuovo
      contro il Supabase locale non è ancora girato (vuole Docker)
- La generazione vuole la rete: legge le rotazioni dal database

## Step 17 — Pubblicazione

- [x] **Prima di pubblicare**: verificare che le registrazioni pubbliche sul progetto
      Supabase siano spente (Step 14). Con il sito online la chiave publishable
      circola, e con le registrazioni aperte i dati sono di chiunque. Spente e
      verificate il 2026-09-11 su `/auth/v1/settings` (`disable_signup: true`)
- [x] Workflow GitHub Actions `.github/workflows/pubblica.yml`: a ogni push su
      `main` (o a mano) installa, controlla che ci siano le variabili di Supabase,
      fa girare i test e la build e pubblica `dist` su Pages. Il primo giro è
      fallito per le variabili mancanti; da quando ci sono gira (2026-09-11)
- [x] Repository pubblicato: `github.com/GiacomoGuaresi/Grocery`, pubblico
- [x] README con gli screenshot, in `doc/immagini`: accesso, menu, piano, frutta di
      stagione. Fatti con Chrome headless sull'app in sviluppo, larga 390px. Manca
      la lista: sul database non c'è ancora una lista corrente → Step 18

## Step 18 — Quello che è rimasto indietro

Le cose aperte degli step prima, raccolte in un posto solo.

Prima di mettere il sito online, in quest'ordine:

- [x] Spegnere le registrazioni pubbliche sul progetto Supabase (Step 14, 17):
      fatto con la Management API, `PATCH /v1/projects/{ref}/config/auth` con
      `disable_signup: true`. `/auth/v1/settings` dice `disable_signup: true`
- [x] Applicare al progetto la migrazione `20260911200000_offline.sql` con
      `supabase db push` (Step 16)
- [x] Variabili del repository per la build (Settings → Secrets and variables →
      Actions → Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
      `VITE_SUPABASE_EMAIL`, gli stessi valori di `.env.local`. Impostate il
      2026-09-11 con `gh variable set`. Il primo giro del workflow, partito prima,
      era fallito proprio per queste
- [x] Pages attivato con sorgente *GitHub Actions* (Settings → Pages). Era già
      acceso ma su *Deploy from a branch*, che pubblicava il sorgente del repo;
      passato a `workflow` il 2026-09-11
- [x] Commit e push su `main`, primo giro del workflow e sito aperto su
      `giacomoguaresi.github.io/Grocery/`. Workflow riuscito il 2026-09-11; il
      sito risponde e il bundle ha dentro la configurazione di Supabase

Da provare sui telefoni veri:

- [ ] Le spunte di un dispositivo compaiono sull'altro (Step 15)
- [ ] L'app si installa sul telefono (Step 16)
- [ ] L'app si apre a rete staccata e mostra la lista (Step 16)
- [ ] Il ciclo offline → online: modifiche fatte senza rete che partono al ritorno
      (Step 16)

Test e documentazione:

- [ ] `supabase.test.ts` contro il Supabase locale, compreso il contratto nuovo
      dell'offline (Step 13, 15, 16): vuole Docker acceso e `supabase start`
- [ ] Screenshot della lista piena nel README, appena c'è una lista corrente
- [x] [07](07-architettura-stack.md) e [10](10-decisioni.md) allineati allo stack
      reale: CSS a mano accanto ai componenti, niente Tailwind né Testing Library
- [ ] [Q&A.md](../Q&A.md): le domande sulla rotazione e sul prossimo passo sono
      segnate come superate; restano senza risposta quelle sui cataloghi (Q1)

---

Modifiche chieste dalla lista vera:

- [x] Tap sul nome di una voce con alternative (frutta, verdura, carne, pesce…) =
      si apre subito la select per sostituirla, senza passare dal ⋯ (2026-09-11)
- [x] Matita semitrasparente accanto al nome delle voci rinominabili ("Altro"),
      come la freccia ⌄ accanto a quelle con alternative (2026-09-11)

## Dopo l'MVP

- [ ] Modalità demo per il portfolio (F12)
- [ ] Gestione dei pasti saltati, cene fuori (F13)
- [ ] Grammature indicative a persona
- [ ] Statistiche sullo storico delle spese
