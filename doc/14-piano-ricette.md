# 14 — Piano Ricette: import da link e ingredienti in lista

> Scritto il 2026-10-08, dopo l'analisi e le risposte dell'autore. Codice e test
> pronti; mancano il deploy su Supabase e la prova sul telefono (Step R6).

## Perché

Quando si vuole cucinare qualcosa di preciso, una torta per esempio, gli
ingredienti vanno ricopiati a mano nella lista. Con le Ricette:

1. si trova la ricetta (Google, sito, app di GialloZafferano) e la si **condivide
   a Grocery**;
2. Grocery la **salva** nella sezione *Ricette* ed **estrae gli ingredienti**;
3. chiede se **aggiungerli alla lista**;
4. e **quali**: tutti spuntati, tranne i *q.b.*; si tolgono quelli che si hanno.

In lista gli ingredienti hanno il **nome e la quantità divisi da un punto
centrale** ("burro 125 g fuso" sul sito → "burro fuso · 125 g") e stanno **dopo i
reparti**, in un gruppo col **nome della ricetta**:

```
TORTA DI MELE …
  ☐ Farina 00 · 100 g
  ☐ burro fuso · 125 g
  ☐ Sale fino · q.b.
```

La divisione la fa `formattaIngrediente` all'import: la quantità è l'ultimo
numero con la sua unità ("00" della farina non conta), quello che la segue resta
nel nome, i prodotti consigliati dal sito si tolgono, con la quantità davanti
cade il "di" ("150 gr di ricotta" → "ricotta · 150 gr"). Provata su 254
ingredienti veri di GialloZafferano, Benedetta e Misya. Le ricette importate
prima restano col testo del sito: reimportando il link si aggiornano.

Le decisioni stanno in [10](10-decisioni.md); il dettaglio in
[04](04-funzionalita.md) (F16), [06](06-modello-dati.md), [07](07-architettura-stack.md)
e [08](08-ui-ux.md).

## Come funziona

```
Android "Condividi" ──► /Grocery/?titolo=…&testo=…&link=…   (share_target del manifest)
                              │  oppure: link incollato nella sezione Ricette
                              ▼
          App: apre l'import ──► Edge Function importa-ricetta (con la sessione)
                                   scarica la pagina, segue i redirect
                                   legge lo JSON-LD schema.org Recipe
                              ◄── { nome, url, immagine, categorie, ingredienti }
          App: salva su `ricette` ──► "Aggiungo gli ingredienti?" ──► lista
```

- I siti di ricette descrivono la ricetta per Google con lo **JSON-LD `Recipe`**:
  GialloZafferano e Fatto in casa da Benedetta sì (verificato), e quasi tutti gli
  altri (Misya, Cookist, Cucchiaio d'Argento…). Non si legge l'HTML dei singoli
  siti, quindi non serve aggiornare niente quando cambiano grafica.
- Il browser non può scaricare pagine di altri siti (niente CORS): lo fa una
  **Edge Function** di Supabase. Solo la sessione dell'app la può usare.
- La **condivisione verso l'app** (Web Share Target) esiste solo con la PWA
  **installata su Android**. Su iPhone non c'è: lì resta il campo per incollare.

## Step

### Step R0 — Analisi e decisioni ✅

- [x] Verificato lo JSON-LD su GialloZafferano e Benedetta (2026-10-08)
- [x] Domande all'autore e decisioni in [10](10-decisioni.md)

### Step R1 — Parser della ricetta ✅

- [x] `supabase/functions/_shared/estraiRicetta.ts`: `estraiUrl` (link dentro il
      testo condiviso, link di Google sciolti) ed `estraiRicetta` (JSON-LD in tutte
      le forme: `@graph`, array, `@type` multiplo; canonical, foto, categorie)
- [x] Test con le pagine vere ridotte (`fixture/`, senza procedimento né recensioni)

### Step R2 — Edge Function `importa-ricetta` ✅

- [x] Controlla la sessione chiedendo a Supabase Auth (`verify_jwt` spento in
      `config.toml`, così vale anche con le chiavi di firma nuove)
- [x] Solo siti pubblici in http(s); redirect seguiti a mano e ricontrollati;
      8 secondi e 3 MB al massimo
- [x] Risponde `{ ricetta }` oppure `{ errore }`: `nessun-link`, `non-ricetta`,
      `sito-irraggiungibile`, `non-autenticato`

### Step R3 — Database ✅

- [x] Migrazione `20261008000000_ricette.sql`: tabella `ricette`, `ricetta_id` e
      `ricetta_nome` sulle voci, `salva_lista` e `salva_voci` aggiornate
- [x] Contratto di Storage: la voce rilegge la sua ricetta

### Step R4 — Dominio e storage ✅

- [x] `Voce.ricetta` e i tipi `Ricetta` / `RicettaImportata`
- [x] `domain/ricette.ts`: q.b., "già in lista", aggiunta degli ingredienti,
      ricerca e categorie
- [x] Gruppi per ricetta dopo i reparti; al ciclo nuovo si riportano come le manuali
- [x] Gli ingredienti non cambiano reparto (stanno sotto la ricetta)
- [x] `Ricettario` su Supabase, copia dell'elenco in `localStorage` per l'offline

### Step R5 — Interfaccia ✅

- [x] `share_target` nel manifest; App legge il link all'avvio e lo toglie dall'URL
- [x] Sezione **Ricette** nel menu: link da incollare, ricerca, filtro per
      categoria, card con la foto del sito
- [x] Import: attesa → errore o "Aggiungo gli ingredienti?" → scelta
- [x] Scheda: foto, categorie, ingredienti, link al procedimento sul sito,
      ri-aggiungi alla lista, elimina con conferma
- [x] Nella lista i gruppi-ricetta, col titolo che apre la scheda

### Step R6 — Messa in linea

L'ordine conta: l'app nuova legge colonne che senza migrazione non esistono, e
la lista si romperebbe.

- [ ] Migrazione e funzione su **Grocery DEV** (`supabase link` al DEV,
      `supabase db push`, `supabase functions deploy importa-ricetta`, poi di
      nuovo `supabase link` alla produzione)
- [ ] Prova in `npm run dev`: link incollato, scelta, gruppo in lista, realtime
      sull'altro dispositivo, "Genera lista" che riporta il gruppo
- [ ] Migrazione e funzione in **produzione**
- [ ] Push su `main` (deploy su Pages)
- [ ] Sul telefono Android: **reinstallare la PWA**, perché Chrome legga il
      manifest nuovo, poi condividere da Chrome e dall'app di GialloZafferano

## Fuori da questo piano

- Procedimento, porzioni e tempi: si leggono sul sito.
- Le foto non si copiano: si mostrano dal sito d'origine (se il sito le toglie,
  la card resta senza).
- Ricette scritte a mano o da siti senza JSON-LD.
- Condivisione da iPhone (servirebbe una Scorciatoia iOS).
