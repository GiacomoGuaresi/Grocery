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
- [x] Voci raggruppate *Frutta* e *Verdura* rese con i loro elementi

## Step 4 — Spunta ✅

- [x] Tap su una voce = comprata, la voce sparisce dalla lista attiva
- [x] Spunta dei **singoli elementi** dentro Frutta e Verdura
- [x] Sezione ripiegata "Già presi" in fondo
- [x] De-spunta di una voce dalla sezione "Già presi"
- [x] Test sulle transizioni di stato

## Step 5 — Persistenza locale (SQLite) ✅

- [x] Interfaccia `Storage` (leggi lista, salva lista, leggi/salva rotazioni)
- [x] Implementazione con `sql.js` (SQLite in WASM), database su IndexedDB
- [x] Schema SQL delle tabelle `liste`, `voci`, `elementi`, `rotazioni`
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
- [x] Dropdown sugli elementi di Frutta e Verdura, con le alternative **di stagione**
- [x] La sostituzione non altera lo stato della rotazione salvata
- [x] Le alternative non ripropongono quello che è già in lista
- [x] Il reparto segue la tipologia scelta: è un dato del catalogo (pesce fresco →
      pescheria, bastoncini → surgelati)

## Step 11 — Piano settimanale

- [ ] Vista con la tabella dei pasti
- [ ] Giorno corrente evidenziato
- [ ] Mostra la **categoria** del giorno, non la tipologia

## Step 12 — Archivio

- [ ] Elenco delle liste passate, in sola lettura
- [ ] Apertura di una lista archiviata

## Step 13 — Supabase

Da qui in poi l'app diventa condivisa.

- [ ] Progetto Supabase e schema equivalente a quello SQLite
- [ ] Seconda implementazione dell'interfaccia `Storage`
- [ ] Selezione dell'implementazione per ambiente (dev → SQLite, prod → Supabase)
- [ ] Policy: lettura e scrittura solo per la sessione autenticata

## Step 14 — Accesso con passphrase

- [ ] Schermata con il solo campo passphrase
- [ ] Sessione conservata nei cookie: non viene richiesta a ogni apertura
- [ ] Nessuna registrazione pubblica abilitata

## Step 15 — Realtime

- [ ] Sottoscrizione alle modifiche della lista corrente
- [ ] Le spunte di un dispositivo compaiono sull'altro
- [ ] Risoluzione dei conflitti *last-write-wins* per singola voce

## Step 16 — PWA e offline

- [ ] `vite-plugin-pwa`, manifest e icone
- [ ] Installabile sul telefono
- [ ] Shell in cache: l'app si apre senza rete
- [ ] Scritture offline messe in coda e sincronizzate al ritorno della connessione
- [ ] Test del ciclo offline → online

## Step 17 — Pubblicazione

- [ ] Workflow GitHub Actions: build e deploy su Pages
- [ ] Repository pubblicato
- [ ] README con qualche screenshot

---

## Dopo l'MVP

- [ ] Modalità demo per il portfolio (F12)
- [ ] Gestione dei pasti saltati, cene fuori (F13)
- [ ] Grammature indicative a persona
- [ ] Statistiche sullo storico delle spese
