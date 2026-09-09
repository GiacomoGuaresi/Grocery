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
    │   ├── schema.ts    lo schema SQL di liste, voci, elementi, rotazioni
    │   ├── sqlite.ts    implementazione su sql.js
    │   ├── indexeddb.ts il blob del database dentro IndexedDB
    │   ├── memoria.ts   persistenza volatile, per i test
    │   └── index.ts     apertura dello storage dell'app (WASM + IndexedDB)
    └── ui/              componenti e schermate
        ├── tema.css     palette pastello, tipografia, misure dei tocchi
        ├── App.tsx      layout: header fisso + area contenuto
        ├── useLista.ts  la lista corrente, letta e salvata sullo storage
        ├── ListaSpesa.tsx     schermata principale: lista attiva + già presi
        ├── GruppoReparto.tsx  un reparto col suo titolo e le sue voci
        ├── GiaPresi.tsx       sezione ripiegata in fondo, per de-spuntare
        ├── AggiungiVoce.tsx   aggiunta rapida con autocompletamento
        ├── GeneraLista.tsx    l'azione "Genera lista" e la sua conferma
        └── Voce.tsx           una voce, con gli elementi se è raggruppata
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
`Elemento`, `Rotazione`.

`dati.ts` è l'unico punto in cui i JSON di `src/data` vengono importati: li tipizza e
li espone come `reparti`, `categorie`, `giorniRoutine`, `gruppiFissi`,
`stagionalita`, `prodotti`, più le funzioni `reparto()`, `categoria()`,
`ordineReparto()` e `diStagione(gruppo, mese)`. Il resto del codice passa da qui e
non tocca mai la forma grezza dei file.

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
esistenti, Frutta e Verdura con 4 elementi di stagione).

`spunta.ts` raccoglie le transizioni di stato della spunta, tutte pure: ogni funzione
restituisce una lista nuova e lascia intatta quella di partenza. `spuntaVoce()` e
`despuntaVoce()` spostano una voce tra lista attiva e "Già presi", trascinandosi
dietro tutti i suoi elementi se è raggruppata; `alternaElemento()` spunta un singolo
elemento di Frutta o Verdura e marca la voce comprata solo quando sono presi tutti,
riportandola tra le attive appena se ne de-spunta uno. `elementiAttivi()` dà gli
elementi ancora da prendere.

`spunta.test.ts` copre le transizioni: la voce che sparisce dalla lista attiva,
l'immutabilità della lista di partenza, l'idempotenza, il passaggio della voce
raggruppata a comprata all'ultimo elemento e il ritorno indietro, e l'invariante per
cui attive e già presi coprono sempre tutte le voci senza doppioni.

`aggiunta.ts` regge l'inserimento manuale: `normalizza()` mette i nomi in una forma
confrontabile (minuscolo, senza accenti né spazi di troppo), `suggerimenti()` propone
i prodotti del catalogo mentre si scrive e `aggiungiVoce()` crea la voce, col reparto
del prodotto riconosciuto o in "Altro". `modifica.ts` tiene eliminazione e rinomina:
solo le voci manuali in "Altro" si rinominano, e il reparto non cambia mai.

`generazione.ts` è l'algoritmo di [03](03-algoritmo-generazione.md): da routine,
cataloghi e stagionalità escono le voci del ciclo. Le tipologie si **pescano a caso**
(R2) — a scorrere il catalogo in ordine usciva sempre lo stesso animale con tagli
diversi — evitando quelle del ciclo prima, che arrivano dalle `rotazioni` salvate e
tornano aggiornate da salvare (R3). La sorgente del caso è un parametro (`caso`), così
i test la sostituiscono con un generatore a seme e restano riproducibili.

`ciclo.ts` sta intorno all'algoritmo: `vociDaRiportare()` dice cosa è rimasto da
prendere e `nuovoCiclo()` mette insieme lista nuova, rotazioni da salvare e lista
precedente da archiviare, portando avanti le voci non spuntate se lo si è chiesto
(R6). Niente rigenerazione in place: la lista di prima non viene toccata.

## `src/storage`
Tutto lo stato passa dall'interfaccia `Storage` di `tipi.ts`:
`leggiListaCorrente()`, `salvaLista()`, `leggiRotazioni()`, `salvaRotazioni()`. Il
resto dell'app conosce solo questa: l'implementazione Supabase arriverà accanto a
quella SQLite senza toccare né il dominio né la UI.

`schema.ts` tiene lo schema SQL delle quattro tabelle di
[06](06-modello-dati.md) — `liste`, `voci`, `elementi`, `rotazioni` — scritto in SQL
standard perché regga anche su Postgres. In `rotazioni` la memoria è l'elenco delle
tipologie dell'ultimo ciclo (JSON in una colonna di testo); i database di sviluppo
creati quando era una posizione nel catalogo si migrano buttando la tabella, che si
ricostruisce alla prima generazione. Le voci e gli elementi portano una
`posizione`, così l'ordine della lista è quello con cui è stata salvata, e le
`alternative` viaggiano come JSON in una colonna di testo.

`sqlite.ts` implementa `Storage` su `sql.js`: il database sta in memoria e dopo ogni
scrittura viene esportato in un blob e affidato alla `Persistenza`. Ogni salvataggio
riscrive la lista per intero dentro una transazione, così quello che sparisce
dall'oggetto sparisce anche dal database; salvando una lista `corrente` le altre
correnti passano ad archiviata, perché ce n'è sempre una sola. `export()` di sql.js
riapre la connessione, quindi il `PRAGMA foreign_keys` va rimesso a ogni
transazione: senza, i `CASCADE` smettono di scattare dopo il primo salvataggio.

La `Persistenza` è la porta che dice dove finiscono quei byte:
`PersistenzaIndexedDB` li tiene in un unico record di IndexedDB — è ciò che fa
sopravvivere la lista al refresh — e `PersistenzaMemoria` non li fa sopravvivere a
niente, ed è quella dei test. `index.ts` mette insieme i pezzi per l'app in
esecuzione: carica il WASM di SQLite e apre lo storage una volta sola.

`sqlite.test.ts` lavora contro l'interfaccia, non contro i dettagli: la lista
riletta identica a quella salvata, l'ordine di voci ed elementi, i campi opzionali
che restano assenti, il salvataggio che aggiorna invece di duplicare, le voci tolte
che spariscono con i loro elementi, l'unica lista corrente, le rotazioni sostituite
e non accumulate. Il refresh si simula riaprendo il database sulla stessa
`Persistenza`.

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
voci, ognuna una riga alta almeno `--tocco`. Le voci raggruppate (Frutta, Verdura)
elencano i propri elementi come pastiglie sotto il nome, ognuna toccabile per conto
suo.

Toccare una voce la segna comprata e la fa sparire dalla lista attiva; nelle voci
raggruppate sparisce il singolo elemento spuntato, e la voce intera se ne va quando
non ne resta nessuno. In fondo alla lista sta la sezione ripiegata "Già presi", col
conteggio di quello che è nel carrello: aprendola si rivede tutto e si può
de-spuntare quello che si è toccato per sbaglio. Non è raggruppata per reparto,
quel percorso ormai è alle spalle.

Il layout è una colonna larga al massimo 560px, centrata: sul telefono occupa tutto,
sul desktop resta stretta come sul telefono.
