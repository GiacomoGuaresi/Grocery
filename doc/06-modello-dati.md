# 06 — Modello dati

Due tipi di dato, con vite diverse:

| Tipo | Dove vive | Chi lo cambia |
|---|---|---|
| **Configurazione** (cataloghi, routine, stagionalità) | JSON nel repo — vedi [05](05-dati-statici.md) | Un commit |
| **Stato** (lista corrente, archivio, rotazioni) | DB condiviso — SQLite in sviluppo, Supabase in produzione | L'app |

Non esiste il concetto di "utente proprietario": **un solo account condiviso**,
tutti i dati sono comuni.

---

## Entità

### `lista`
Una lista della spesa per un ciclo di due settimane.

| Campo | Tipo | Note |
|---|---|---|
| `id` | id | |
| `creata_il` | timestamp | Inizio del ciclo (momento della generazione) |
| `stato` | `corrente` \| `archiviata` | Una sola `corrente` alla volta |
| `voci` | `voce[]` | |

### `voce`
Un articolo della lista.

| Campo | Tipo | Note |
|---|---|---|
| `id` | id | |
| `nome` | string | Es. "salmone", "detersivo piatti" |
| `reparto` | string | Riferito a `reparti.json`; `Altro` se prodotto nuovo |
| `categoria` | string? | Categoria di rotazione (`pesce`, `carne_rossa`, ...); assente per le voci manuali |
| `origine` | `generata` \| `manuale` | |
| `comprata` | bool | Spuntata durante la spesa |
| `alternative` | string[]? | Tipologie sostitutive per la dropdown (F6) |
| `elementi` | `elemento[]`? | Solo per le voci raggruppate *Frutta* e *Verdura*: i 4 tipi scelti |

### `elemento`
Un tipo dentro una voce raggruppata. Sostituibile e spuntabile singolarmente.

| Campo | Tipo | Note |
|---|---|---|
| `nome` | string | Es. "mele" |
| `comprato` | bool | Spunta indipendente dagli altri |

### `rotazione`
Memoria della rotazione tra un ciclo e l'altro (R3).

| Campo | Tipo | Note |
|---|---|---|
| `categoria` | string | `carne_rossa`, `pesce`, `formaggio`, ... (più `verdura` e `frutta`) |
| `ultimi` | string[] | Le tipologie proposte nell'ultimo ciclo, da evitare in quello nuovo |

---

## Note
- Le voci manuali aggiunte **tra una spesa e l'altra** entrano nella lista
  `corrente` già esistente. Alla generazione successiva l'app chiede se portare le
  voci non spuntate nella nuova lista: è così che arrivano alla spesa successiva,
  senza bisogno di una lista "prossima spesa" separata.
- L'archiviazione (F11) consiste nel passare la lista da `corrente` ad `archiviata`
  al momento della generazione della successiva.
- Non esiste un'operazione di **rigenerazione** in place: una lista, una volta
  creata, si sostituisce solo generandone una nuova.
- Non esiste campo **note** sulle voci, né campo **quantità/grammatura**.
- Le voci generate non sono rinominabili: il nome viene dal catalogo statico. Solo le
  voci manuali con reparto `Altro` possono essere rinominate.
- Le voci sono **denormalizzate** (nome e reparto copiati dal catalogo al momento
  della generazione): una lista archiviata resta leggibile anche se il catalogo JSON
  cambia con un commit successivo.
