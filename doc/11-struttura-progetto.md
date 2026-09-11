# 11 — Struttura del progetto

```
Grocery/
├── doc/                 documentazione (questi file)
├── Q&A.md               domande aperte in corso
├── index.html           entry point di Vite
├── package.json         React + TypeScript + Vite + Vitest
├── vite.config.ts       base: '/Grocery/' per GitHub Pages + config Vitest
├── tsconfig.json
└── src/
    ├── main.tsx         monta React su #root
    ├── vite-env.d.ts    tipi di Vite (import di asset, es. il WASM di SQLite)
    ├── data/            configurazioni statiche in JSON (vedi 05)
    ├── domain/          modello dati, dati statici tipizzati, algoritmo di generazione
    ├── storage/         interfaccia di persistenza (SQLite in dev, Supabase in prod)
    │   ├── tipi.ts      l'interfaccia `Storage` e la porta `Persistenza`
    │   ├── schema.ts    lo schema SQL di liste, voci, rotazioni
    │   ├── sqlite.ts    implementazione su sql.js
    │   ├── indexeddb.ts il blob del database dentro IndexedDB
    │   ├── memoria.ts   persistenza volatile, per i test
    │   └── index.ts     apertura dello storage dell'app (WASM + IndexedDB)
    └── ui/              componenti e schermate
        ├── tema.css     palette pastello, tipografia, misure dei tocchi
        ├── App.tsx      layout: header fisso col bottone del menu, contenuto
        ├── MenuLaterale.tsx   menu a scomparsa con sezioni e azioni
        ├── useLista.ts  la lista corrente, letta e salvata sullo storage
        ├── useArchivio.ts     le liste passate, in sola lettura
        ├── ListaSpesa.tsx     schermata principale: lista attiva + già presi
        ├── GruppoReparto.tsx  un reparto col suo titolo e le sue voci
        ├── GiaPresi.tsx       sezione ripiegata in fondo, per de-spuntare
        ├── AggiungiVoce.tsx   aggiunta rapida con autocompletamento
        ├── GeneraLista.tsx    l'azione "Genera lista" e la sua conferma
        ├── PianoSettimanale.tsx  la tabella delle cene, in consultazione
        ├── Archivio.tsx       le spese passate e una di esse aperta
        ├── Voce.tsx           una voce: checkbox, nome (rinominabile in "Altro"), ⋯
        ├── AzioniVoce.tsx     il popup con le azioni di una voce
        └── Icona.tsx          le icone SVG dell'app, al posto delle emoji
```

## `src/data` — dati statici

| File | Contenuto | Voci |
|---|---|---|
| `reparti.json` | I 9 reparti nell'ordine del percorso in corsia | 9 |
| `routine.json` | Categoria proteica per giorno + gruppi fissi (frutta, verdura) | 7 giorni |
| `catalogo.json` | Tipologie per categoria, ognuna col proprio reparto | 150 |
| `stagionalita.json` | Verdura e frutta per mese, Nord Italia | 44 + 27 |
| `prodotti.json` | Mappa `prodotto → reparto` per l'autocompletamento | 83 |

Ogni file porta un campo `$commento` che ne spiega lo scopo, così resta leggibile
anche aprendolo da solo.

### Note sui dati
- In `catalogo.json` il **pesce** è diviso tra reparto `pescheria` (fresco) e
  `surgelati`, perché si compra in entrambi i modi.
- In `stagionalita.json` i mesi sono numeri (1 = gennaio) e gli intervalli possono
  attraversare dicembre (es. le arance sono `[12,1,2,3,4]`).
- Ogni mese ha almeno 8 verdure e 8 frutti disponibili: sempre abbastanza per
  sceglierne 4 diversi.

## `src/domain`
`tipi.ts` contiene il modello dati di [06](06-modello-dati.md): `Lista`, `Voce`,
`Rotazione`. Ogni tipo di frutta e verdura è una `Voce` con categoria `verdura` o
`frutta`.

`dati.ts` è l'unico punto in cui i JSON di `src/data` vengono importati: li tipizza e
li espone come `reparti`, `categorie`, `giorniRoutine`, `gruppiFissi`,
`stagionalita`, `prodotti`, più le funzioni `reparto()`, `categoria()`,
`ordineReparto()`, `diStagione(gruppo, mese)` ed `eGruppoFisso()`. Il resto del
codice passa da qui e non tocca mai la forma grezza dei file.

`dati.test.ts` verifica la coerenza dei dati statici: i reparti citati dal catalogo,
dai prodotti e dai gruppi fissi esistono in `reparti.json`, le categorie della
routine esistono nel catalogo, la routine copre i sette giorni, i nomi dentro una
categoria non si ripetono, ogni mese ha almeno 4 verdure e 4 frutti di stagione e la
stagionalità usa solo mesi da 1 a 12.

`lista.ts` lavora sulla lista corrente: `raggruppaPerReparto(voci)` divide le voci per
reparto nell'ordine del percorso in corsia scartando i reparti vuoti, `vociAttive(lista)`
tiene solo quelle non ancora comprate e `vociComprate(lista)` solo quelle già prese.
`listaEsempio.ts` è una lista di settembre: da quando l'app genera da sé resta come
banco di prova dei test.

`lista.test.ts` verifica l'ordine dei reparti, l'esclusione di quelli vuoti, l'ordine
delle voci dentro un reparto e la coerenza della lista di esempio (id unici, reparti
esistenti, 4 tipi di verdura e 4 di frutta di stagione, una voce ciascuno).

`spunta.ts` raccoglie le transizioni di stato della spunta, tutte pure: ogni funzione
restituisce una lista nuova e lascia intatta quella di partenza. `spuntaVoce()` e
`despuntaVoce()` spostano una voce tra lista attiva e "Già presi". Ogni tipo di
frutta e verdura è una voce a sé, quindi si spunta come le altre.

`spunta.test.ts` copre le transizioni: la voce che sparisce dalla lista attiva,
l'immutabilità della lista di partenza, l'idempotenza, il tipo di verdura che si
spunta senza toccare gli altri, e l'invariante per cui attive e già presi coprono
sempre tutte le voci senza doppioni.

`aggiunta.ts` regge l'inserimento manuale: `normalizza()` mette i nomi in una forma
confrontabile (minuscolo, senza accenti né spazi di troppo), `suggerimenti()` propone
i prodotti del catalogo mentre si scrive e `aggiungiVoce()` crea la voce, col reparto
del prodotto riconosciuto o in "Altro". `modifica.ts` tiene eliminazione e rinomina:
solo le voci manuali in "Altro" si rinominano, e il reparto non cambia mai.

`generazione.ts` è l'algoritmo di [03](03-algoritmo-generazione.md): da routine,
cataloghi e stagionalità escono le voci del ciclo, compresa una voce per ogni tipo di
verdura e di frutta scelto. Le tipologie si **pescano a caso** (R2) — a scorrere il
catalogo in ordine usciva sempre lo stesso animale con tagli diversi — evitando
quelle del ciclo prima, che arrivano dalle `rotazioni` salvate e tornano aggiornate
da salvare (R3). La sorgente del caso è un parametro (`caso`), così i test la
sostituiscono con un generatore a seme e restano riproducibili.

`alternative.ts` dà le alternative della dropdown (F6): le altre tipologie della
categoria o, per un tipo di frutta e verdura, gli altri tipi del gruppo divisi tra di
stagione nel mese e fuori stagione, senza quello che è già in lista.
`sostituisciVoce()` mette la scelta al posto della voce.

`archivio.ts` è la parte di dominio delle liste passate: solo formattazione, perché
una lista archiviata non ha più transizioni di stato. `etichettaData()` scrive la
data per esteso ("7 settembre 2026"), `riepilogo()` dice com'è andata quella spesa in
una riga ("12 voci · 10 prese") e `sintesi()` conta le voci di una lista già
caricata, così l'elenco e la lista aperta dicono le stesse cose.

`ciclo.ts` sta intorno all'algoritmo: `vociDaRiportare()` dice cosa è rimasto da
prendere e `nuovoCiclo()` mette insieme lista nuova, rotazioni da salvare e lista
precedente da archiviare, portando avanti le voci non spuntate se lo si è chiesto
(R6). Niente rigenerazione in place: la lista di prima non viene toccata.

## `src/storage`
Tutto lo stato passa dall'interfaccia `Storage` di `tipi.ts`:
`leggiListaCorrente()`, `salvaLista()`, `leggiArchivio()`, `leggiLista(id)`,
`leggiRotazioni()`, `salvaRotazioni()`. Il
resto dell'app conosce solo questa: l'implementazione Supabase arriverà accanto a
quella SQLite senza toccare né il dominio né la UI.

`schema.ts` tiene lo schema SQL delle tre tabelle di
[06](06-modello-dati.md) — `liste`, `voci`, `rotazioni` — scritto in SQL
standard perché regga anche su Postgres. In `rotazioni` la memoria è l'elenco delle
tipologie dell'ultimo ciclo (JSON in una colonna di testo); i database di sviluppo
creati quando era una posizione nel catalogo si migrano buttando la tabella, che si
ricostruisce alla prima generazione. Le voci portano una `posizione`, così l'ordine
della lista è quello con cui è stata salvata, e le `alternative` viaggiano come JSON
in una colonna di testo.

`sqlite.ts` implementa `Storage` su `sql.js`: il database sta in memoria e dopo ogni
scrittura viene esportato in un blob e affidato alla `Persistenza`. Ogni salvataggio
riscrive la lista per intero dentro una transazione, così quello che sparisce
dall'oggetto sparisce anche dal database; salvando una lista `corrente` le altre
correnti passano ad archiviata, perché ce n'è sempre una sola. `export()` di sql.js
riapre la connessione, quindi il `PRAGMA foreign_keys` va rimesso a ogni
transazione: senza, i `CASCADE` smettono di scattare dopo il primo salvataggio.

Fino al 2026-09-11 frutta e verdura erano una voce sola ciascuna, coi tipi in una
tabella `elementi`. All'apertura, se quella tabella c'è ancora, `migraElementi()`
riscrive ogni lista salvata con una voce per tipo — spunte comprese, archivio
compreso — e poi la butta.

L'archivio si legge da lì: `leggiArchivio()` elenca le liste `archiviata` dalla più
recente alla più vecchia contando le voci con un'aggregazione — per l'elenco non
serve caricarle — e `leggiLista(id)` tira su una lista qualsiasi per intero, come
`leggiListaCorrente()`, che ormai è la stessa lettura con una `WHERE` diversa.

La `Persistenza` è la porta che dice dove finiscono quei byte:
`PersistenzaIndexedDB` li tiene in un unico record di IndexedDB — è ciò che fa
sopravvivere la lista al refresh — e `PersistenzaMemoria` non li fa sopravvivere a
niente, ed è quella dei test. `index.ts` mette insieme i pezzi per l'app in
esecuzione: carica il WASM di SQLite e apre lo storage una volta sola.

`sqlite.test.ts` lavora contro l'interfaccia, non contro i dettagli: la lista
riletta identica a quella salvata, l'ordine delle voci, i campi opzionali che restano
assenti, il salvataggio che aggiorna invece di duplicare, le voci tolte che
spariscono, l'unica lista corrente, le rotazioni sostituite e non accumulate,
l'archivio che elenca le liste passate ma non quella corrente, nell'ordine giusto e
con i conteggi giusti, la lista archiviata riletta identica a com'era e la
migrazione delle liste con frutta e verdura raggruppate. Il refresh si simula
riaprendo il database sulla stessa `Persistenza`.

## `src/ui`
Il tema sta tutto in `tema.css` come variabili CSS: colori pastello (crema, salvia,
zucca, pomodoro), raggi, spaziature e `--tocco`, l'altezza minima di ogni elemento
toccabile. Ogni componente ha il suo `.css` accanto, importato dal componente
stesso. Nessuna libreria di stili.

La lista corrente arriva dallo storage: `useLista.ts` la legge all'apertura, mostra
"Apro la lista…" finché non c'è e alla prima apertura salva la lista di esempio, che
da lì in poi è la lista corrente vera. Ogni spunta va prima nello stato React —
l'interfaccia risponde subito — e poi in coda verso il database, in modo che i tocchi
rapidi arrivino nell'ordine in cui sono stati fatti.

La lista è una sequenza di reparti: titolo del reparto in maiuscoletto e sotto le sue
voci, righe compatte alte almeno `--riga` e attaccate in un unico blocco. Frutta e
verdura sono in elenco diretto: ogni tipo è una riga come le altre, in Ortofrutta.

Toccare la checkbox di una voce la segna comprata e la fa sparire dalla lista
attiva; il tap sul testo non spunta, e nelle voci manuali in "Altro" rende il nome
modificabile nella riga. In fondo alla lista sta la sezione ripiegata "Già presi",
col conteggio di quello che è nel carrello: aprendola si rivede tutto e si può
de-spuntare quello che si è toccato per sbaglio. Non è raggruppata per reparto,
quel percorso ormai è alle spalle.

Il menu laterale a scomparsa, aperto dal bottone ☰ dell'intestazione, tiene le tre
sezioni *Lista*, *Piano* e *Archivio* e, sotto, l'azione *Genera lista*. Per questo
`useLista` sta in `App.tsx` e non dentro la schermata della lista: la conferma della
generazione ha bisogno della lista corrente anche quando si è altrove.

`useArchivio.ts` legge le spese passate e ne apre una su richiesta: sono due
letture separate, perché l'elenco non ha bisogno delle voci. La schermata mostra una
riga per spesa — data per esteso e riepilogo — e aprendone una rivede le sue voci
per reparto, barrate quelle che erano finite nel carrello. Non c'è niente da toccare
oltre alla riga che apre e a quella che riporta indietro: quel ciclo è chiuso (F11).

Il layout è una colonna larga al massimo 448px, centrata: sul telefono occupa tutto,
sul desktop resta stretta come sul telefono.
