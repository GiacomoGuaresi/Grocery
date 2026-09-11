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
- [x] Stessi test di contratto per le due implementazioni. Finora eseguiti solo su
      SQLite: `supabase.test.ts` gira contro il Supabase locale, che vuole Docker
- [x] Selezione dell'implementazione per ambiente (dev → SQLite, prod → Supabase;
      `VITE_STORAGE` la forza)
- [x] Policy: lettura e scrittura solo per la sessione autenticata. Verificate sul
      progetto: senza sessione tabelle, vista e funzioni rispondono "permission denied"
- [x] Registrazione pubblica disattivata in `supabase/config.toml`, che vale solo per
      il Supabase locale. **Sul progetto è ancora aperta**: rimandata allo Step 14

## Step 14 — Accesso con passphrase

- [x] Schermata con il solo campo passphrase, davanti all'app finché non c'è una
      sessione; in sviluppo, su SQLite, non compare
- [x] Sessione conservata nei cookie (`@supabase/ssr`): non viene richiesta a ogni
      apertura, nemmeno senza rete
- [x] Se la sessione finisce con l'app aperta si torna alla passphrase
- [x] Email dell'account in `.env.local` (`VITE_SUPABASE_EMAIL`)
- [x] Unico account creato dalla dashboard; verificato sul progetto: con la
      passphrase giusta si entra e si leggono le tabelle, con quella sbagliata no
- [ ] Nessuna registrazione pubblica abilitata — **buco di sicurezza aperto**: sul
      progetto Supabase le registrazioni sono ancora attive. Con la chiave
      publishable, che è pubblica, chiunque può crearsi un account, diventare
      `authenticated` e leggere, modificare e cancellare tutto, perché le policy non
      filtrano per utente. Da spegnere in dashboard → Authentication → Sign In /
      Providers → *Allow new users to sign up* (il 2026-09-11 il salvataggio dalla
      dashboard dava "Failed to fetch"; in alternativa si fa con la Management API,
      `disable_signup: true`)

## Step 15 — Realtime

- [x] Sottoscrizione alle modifiche della lista corrente: il realtime ascolta la
      tabella `liste`, che fa da campanello (`aggiornata_il`), e a ogni avviso la
      lista si rilegge. Si rilegge anche a ogni riconnessione del canale e quando
      l'app torna in primo piano. Migrazione `20260911100000_realtime.sql`
      applicata al progetto con `supabase db push`
- [ ] Le spunte di un dispositivo compaiono sull'altro — scritto ma **non ancora
      provato con due dispositivi veri**. Il test di `supabase.test.ts` lo verifica
      contro il Supabase locale, che vuole Docker
- [x] Risoluzione dei conflitti *last-write-wins* per singola voce: dopo ogni
      modifica si scrivono solo le voci toccate (`salvaVoci`, funzione
      `salva_voci`), così due spunte su voci diverse si sommano. Test di contratto
      su entrambe le implementazioni
- [x] Una voce appena toccata non torna indietro per una rilettura capitata a metà:
      finché la sua scrittura è in volo vale la versione di questo dispositivo
- [x] Una generazione fatta sull'altro dispositivo porta anche qui la lista nuova;
      le scritture rimaste indietro non toccano l'archivio

## Step 16 — PWA e offline

- [ ] `vite-plugin-pwa`, manifest e icone
- [ ] Installabile sul telefono
- [ ] Shell in cache: l'app si apre senza rete
- [ ] Scritture offline messe in coda e sincronizzate al ritorno della connessione.
      Oggi una scrittura fallita per mancanza di rete resta a schermo solo fino
      alla rilettura successiva, poi vince il database
- [ ] Rivedere il *last-write-wins*: oggi l'"ultima" scrittura è l'ultima arrivata
      al database, e una coda offline svuotata tardi vincerebbe su modifiche più
      recenti. Probabilmente serve l'ora della modifica su ogni voce
- [ ] Test del ciclo offline → online

## Step 17 — Pubblicazione

- [ ] **Prima di pubblicare**: verificare che le registrazioni pubbliche sul progetto
      Supabase siano spente (Step 14). Con il sito online la chiave publishable
      circola, e con le registrazioni aperte i dati sono di chiunque
- [ ] Workflow GitHub Actions: build e deploy su Pages
- [ ] Repository pubblicato
- [ ] README con qualche screenshot

---

## Dopo l'MVP

- [ ] Modalità demo per il portfolio (F12)
- [ ] Gestione dei pasti saltati, cene fuori (F13)
- [ ] Grammature indicative a persona
- [ ] Statistiche sullo storico delle spese
