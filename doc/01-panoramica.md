# 01 — Panoramica

## Cos'è
Tool personale, da usare **al supermercato dal telefono**, che genera la lista della
spesa per un ciclo di **due settimane** a partire dalla routine alimentare seguita
dagli utenti, e permette di spuntare i prodotti mentre si fa la spesa.

Sostituisce il **Google Keep condiviso** usato oggi per lo stesso scopo.

## Utenti
Due: l'autore e la sua ragazza. Fanno la spesa **insieme** e condividono **un unico
account**: non esiste il concetto di "dati per utente", tutto è unito e condiviso.

Nessun altro deve poter accedere ai dati reali. Il progetto è però **pubblico** su
GitHub e pensato anche come pezzo di **portfolio**, quindi in futuro esisterà una
**modalità demo** per far vedere l'app a chi visita il portfolio (non nell'MVP).

## Casi d'uso
1. **Generazione** — la lista viene generata quando si decide, tipicamente **già al
   supermercato**, e copre le due settimane successive.
2. **Spesa** — si segue la lista raggruppata per reparto e si spuntano i prodotti
   presi.
3. **Seconda settimana** — i prodotti freschi non congelabili vengono spuntati più
   tardi, quando effettivamente acquistati.
4. **Tra una spesa e l'altra** — si aggiungono a mano prodotti extra (detersivi,
   igiene, biscotti...) che finiranno nella prossima lista.

## Obiettivi
- Generare la lista dei **secondi (cene)** per due settimane, con varietà garantita.
- Essere usabile con una mano, in piedi, in corsia: testo grande, tap semplici.
- Funzionare **offline**, anche in scrittura, dentro al supermercato.
- Lista **condivisa e sincronizzata in tempo reale** tra i due telefoni.

## Non-obiettivi
- Non è un'app di meal planning completa né un tracker di spesa/budget.
- **Niente IA**: la generazione è un algoritmo deterministico.
- Nessuna registrazione pubblica di nuovi utenti.
- Non gestisce **quantità né grammature**: dice solo *cosa* comprare, le quantità si
  decidono in corsia. Le grammature indicative sono un possibile sviluppo futuro.
- Non gestisce colazione, spuntini, pranzi e pane (vedi
  [02 — Routine alimentare](02-routine-alimentare.md)).
