# 06 — Modello dati

> Aggiornato il 2026-09-12 per la **v2** ([13](13-piano-v2.md)): via le rotazioni,
> l'archivio e le alternative; entra il moltiplicatore.

Due tipi di dato, con vite diverse:

| Tipo | Dove vive | Chi lo cambia |
|---|---|---|
| **Configurazione** (routine, reparti, consigli, stagionalità, prodotti) | JSON nel repo — vedi [05](05-dati-statici.md) | Un commit |
| **Stato** (la lista corrente) | DB condiviso — Supabase (*Grocery DEV* in sviluppo) | L'app |

Non esiste il concetto di "utente proprietario": **un solo account condiviso**,
tutti i dati sono comuni.

---

## Entità

### `lista`
La lista della spesa del ciclo di due settimane. **Ce n'è una sola**.

| Campo | Tipo | Note |
|---|---|---|
| `id` | id | |
| `creata_il` | timestamp | Inizio del ciclo (momento della generazione) |
| `voci` | `voce[]` | |

Lo stato `corrente | archiviata` sparisce con l'archivio: alla generazione la lista
precedente, dopo il riporto delle voci non spuntate, **si cancella**.

### `voce`
Un articolo della lista.

| Campo | Tipo | Note |
|---|---|---|
| `id` | id | |
| `nome` | string | Generata: la categoria ("Pesce"). Manuale: "detersivo piatti" |
| `reparto` | string | Riferito a `reparti.json`; `altro` se prodotto nuovo |
| `categoria` | string? | `carne_rossa`, `pesce`, …, `verdura`, `frutta`; assente per le manuali |
| `origine` | `generata` \| `manuale` | |
| `quantita` | number? | Totale di pasti dalla routine. Solo voci generate |
| `presi` | number? | Quanti pasti sono già stati presi, da 0 a `quantita`. Solo voci generate |
| `comprata` | bool | Spuntata durante la spesa; per le generate vale `presi = quantita` |
| `modificata_il` | timestamp | *Last-write-wins* per voce, come oggi |

Via `alternative`: i consigli si leggono dal catalogo statico, non si copiano sulla
voce.

### ~~`rotazione`~~
Tolta con la v2, tabella e funzioni sul database comprese.

---

## Note
- Le voci manuali aggiunte **tra una spesa e l'altra** entrano nella lista esistente.
  Alla generazione successiva l'app chiede se portare le voci non spuntate nella nuova
  lista.
- Le voci manuali **non hanno moltiplicatore**.
- Una voce riportata non si **somma** a quella generata della stessa categoria: restano
  due voci. Delle generate non se ne riporta nessuna: alla generazione si portano
  avanti solo le **manuali** non spuntate.
- `presi` segue il *last-write-wins* per voce come la spunta: se due telefoni
  premono **+** sulla stessa voce nello stesso istante, un tocco può perdersi. Accettato
  per ora: si fa la spesa insieme e il numero si vede su entrambi.
- **Migrazione**: la lista corrente al passaggio alla v2 **resta com'è** (voci con i
  nomi delle tipologie, senza moltiplicatore); la pulisce l'utente. Le liste archiviate
  si cancellano insieme alla tabella delle rotazioni.
- Non esiste campo **note** sulle voci, né grammatura.
- Le voci generate non sono rinominabili. Solo le voci manuali con reparto `altro`
  possono essere rinominate.
