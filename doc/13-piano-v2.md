# 13 — Piano di sviluppo v2: lista per categorie

> Aggiornato il 2026-09-12 con le risposte dei giri 6, 7 e 8 del Q&A. Nessuna
> domanda aperta: il piano è pronto per partire dallo Step V1.

## Perché si cambia

La lista generata con tipologie pescate (a caso o in sequenza) **non funziona
nell'uso vero**. Più comoda una lista **generica per categoria**, con il numero di
pasti da coprire, un contatore per la spesa e dei consigli al tocco.

| Voce in lista | In corsia | Reparto | Popup |
|---|---|---|---|
| Carne rossa | `[−] 0/2 [+]` pasti | Macelleria | contatore + animali |
| Carne bianca | `[−] 0/2 [+]` pasti | Macelleria | contatore + animali |
| Pesce | `[−] 0/4 [+]` pasti | Pescheria | contatore + tipi |
| Formaggio | `[−] 0/2 [+]` pasti | Latticini, formaggi e uova | contatore + tipi |
| Uova | `[−] 0/2 [+]` pasti | Latticini, formaggi e uova | — |
| Affettati | `[−] 0/2 [+]` pasti | Salumi | contatore + tipi |
| Verdura | `[−] 0/14 [+]` pasti | Ortofrutta | contatore + stagionalità |
| Frutta | `[−] 0/28 [+]` pasti | Ortofrutta | contatore + stagionalità |

Il dettaglio sta in [02](02-routine-alimentare.md), [03](03-algoritmo-generazione.md),
[04](04-funzionalita.md) (F1, F14, F15), [05](05-dati-statici.md),
[06](06-modello-dati.md), [08](08-ui-ux.md) e [10](10-decisioni.md).

---

## Cosa cambia rispetto alla v1

| Area | v1 | v2 |
|---|---|---|
| Generazione | Pesca casuale di tipologie con memoria | Una voce per categoria, totale dalla routine |
| Rotazioni | Tabella `rotazioni` | **Tolte**, database compreso |
| Voce generata | `nome` = tipologia, `alternative[]`, spunta | `nome` = categoria, `quantita` e `presi`, contatore |
| Alternative (F6) | Select dal nome e dal popup | **Tolte**: tap sul nome apre il popup con contatore e consigli |
| Frutta e verdura | 4 + 4 voci singole | Due voci; i tipi solo nel popup, in liste collassabili con chip |
| Archivio (F11) | Pagina e liste archiviate | **Tolto**, dati compresi; la lista vecchia si cancella |
| Generazione offline | Vuole la rete | Gira anche offline |
| Piano, pagine di stagione | — | **Restano** |
| Voci manuali, sync, offline, accesso, PWA | — | **Invariati** |

---

## Step

Stessa regola della v1: step piccoli, ognuno lascia l'app funzionante.

### Step V0 — Decisioni e documentazione ✅

- [x] Giro 6 del Q&A digerito nei documenti (2026-09-12)
- [x] Giro 7 del Q&A digerito nei documenti (2026-09-12)
- [x] Giro 8 del Q&A digerito nei documenti (2026-09-12)

### Step V1 — Dati statici ✅

- [x] `catalogo.json` riscritto: per categoria etichetta, reparto e consigli brevi
      (solo animale o tipo, [05](05-dati-statici.md))
- [x] `routine.json`: resta la categoria per giorno; verdura e frutta con i pasti
      per giorno (1 e 2) al posto di `tipiPerCiclo`
- [x] Test di coerenza (`dati.test.ts`): ogni categoria della routine ha un reparto;
      ogni categoria tranne le uova ha consigli; ogni mese ha verdura e frutta di
      stagione
- [x] Generazione e alternative v1 adattate ai dati nuovi (pescano dai consigli
      brevi, 4 tipi di verdura e frutta fissati nel codice) finché V3 e V6 non le
      sostituiscono (2026-09-12)

### Step V2 — Modello dati e database ✅

- [x] `Voce`: aggiunti `quantita` e `presi`, tolto `alternative`
- [x] `Lista`: tolto `stato`; `SintesiLista` e `Rotazione` eliminati
- [x] Migrazione Supabase (`20260912000000_v2.sql`): colonne nuove su `voci` con il
      vincolo `0 ≤ presi ≤ quantita`; via `alternative`, `stato`, `rotazioni`,
      `salva_rotazioni`, la vista `archivio` e le liste archiviate; un indice tiene
      una lista sola. Applicata su *Grocery DEV* (2026-09-12); in produzione
      **dopo conferma** (V7), perché cancella dati
- [x] La lista corrente di produzione **non si tocca**: le sue voci v1 restano con la
      spunta e senza popup
- [x] Contratto `Storage`, `inMemoria`, `memoriaLocale`, `sincronizzatore`: via
      rotazioni, archivio e `leggiLista`; salvare una lista cancella le altre;
      `presi` in *last-write-wins* per voce come la spunta
- [x] Coda offline: le scritture v1 rimaste in `localStorage` perdono `alternative`,
      quelle senza la forma giusta si scartano; una scrittura per una lista sparita
      non fa niente e non blocca la coda
- [x] Per lasciare l'app funzionante, anticipati da V6: tolti `archivio.ts`,
      `useArchivio.ts`, `Archivio.tsx/.css`, il test e la voce *Archivio* del menu.
      Generazione e ciclo v1 senza rotazioni né archiviazione (pesca casuale senza
      memoria) finché V3 non li riscrive

### Step V3 — Generazione nuova ✅

- [x] `generazione.ts` riscritto: una voce per categoria (id = categoria, nome =
      etichetta, `presi` 0), totale dalla routine; una categoria senza sere non entra
- [x] `nuovoCiclo()`: niente rotazioni né archiviazione; la lista vecchia si cancella
- [x] Riporto: solo le voci manuali non spuntate; le generate mai, complete o no
      (nemmeno quelle rimaste dalla v1)
- [x] Genera lista funziona **anche offline**: la lista va subito a schermo, un
      segno in memoria locale (`grocery.generata`) la salva per intera al ritorno
      della rete, prima della coda; conta come una modifica in attesa
- [x] Test: totali giusti dalla routine (pesce 4, verdura 14, frutta 28); cambiando
      la routine cambiano i numeri; nessuna generata riportata, le manuali sì;
      generazione senza rete che sopravvive alla chiusura (2026-09-12)

### Step V4 — Contatore in lista ✅

- [x] Dominio (`contatore.ts`): `aumenta`, `diminuisci`, `impostaPresi` con limiti 0
      e totale; a totale la voce è comprata, sotto no. Test sulle transizioni
- [x] Componente `Contatore` `[−] presi/totale [+]` con unità "pasti" in piccolo;
      numero scrivibile (tastiera numerica, 16px per iOS)
- [x] Nella riga delle voci generate al posto della spunta, di lato al nome; le
      manuali e le generate rimaste dalla v1 tengono la spunta
- [x] Voce completa → "Già presi" con la stessa animazione della spunta; lì tiene il
      contatore e il − la riporta in lista a totale − 1
- [x] Animazione breve sul cambio di numero (in su se sale, in giù se scende)
- [x] Le scritture del contatore passano dalla coda offline come le spunte (test nel
      sincronizzatore). Le voci col contatore non hanno più la dropdown delle
      alternative (2026-09-12)

### Step V5 — Popup dei consigli ✅

- [x] Tap sul nome di una voce generata → popup dal fondo (`ConsigliVoce`), stesso
      stile di `AzioniVoce`, con il **contatore in cima** (fisso mentre si scorre)
- [x] Il popup resta aperto anche al totale; la voce va tra i "Già presi" alla
      chiusura (il numero che la sposterebbe resta in sospeso fino ad allora)
- [x] **Carni, pesce, formaggio, affettati**: elenco breve dei tipi
- [x] **Verdura / Frutta**: *Di stagione* aperta (chip *tutto l'anno*, *in uscita*)
      e *Fuori stagione* chiusa (chip *in arrivo*), dal dominio `consigli.ts`
- [x] **Uova**: niente popup e niente icona accanto al nome
- [x] Nel ⋯ resta solo *Elimina* (e *Rinomina* per le voci in "Altro"). Tolta
      anche la dropdown delle alternative dal nome delle voci v1: il file
      `alternative.ts` resta fino a V6, non più usato dalla UI
- [x] Test (`consigli.test.ts`): in arrivo / in uscita a cavallo d'anno (dicembre →
      gennaio) (2026-09-12)

### Step V6 — Pulizia ✅

- [x] Codice tolto: `alternative.ts`, `ciclo.ts` e i loro test. `vociDaRiportare()`
      e `nuovoCiclo()` servono ancora e sono passati in `generazione.ts`, coi test.
      `listaEsempio.ts` resta: la usano i test di aggiunta, spunta, modifica e il
      contratto di Storage (l'archivio è già andato in V2)
- [x] Menu laterale senza *Archivio* (fatto in V2)
- [x] [07](07-architettura-stack.md) (la generazione non vuole più la rete),
      [11](11-struttura-progetto.md) e il README allineati al codice nuovo
- [x] Screenshot del README rifatti con Chrome headless sull'app in sviluppo, larga
      390px: lista, consigli, accesso, menu, piano, frutta di stagione (2026-09-12)

### Step V7 — Prova sulla lista vera

- [ ] Migrazione applicata in produzione (dopo conferma, V2)
- [ ] Una spesa intera fatta con la v2; rivedere il **+** di uno per verdura e frutta
      e i consigli brevi
- [ ] Nello stesso giro le prove rimaste dalla v1 ([12](12-piano-sviluppo.md), Step 18):
      spunte tra due dispositivi, installazione, apertura a rete staccata, ciclo
      offline → online

---

## Cosa **non** cambia

- Accesso con passphrase, Supabase, realtime, coda offline, PWA
- Aggiunta manuale con autocompletamento e reparto automatico; le manuali si spuntano
- "Già presi", eliminazione, rinomina delle voci in "Altro"
- Piano settimanale, pagine di stagione, menu laterale, stile e animazioni
