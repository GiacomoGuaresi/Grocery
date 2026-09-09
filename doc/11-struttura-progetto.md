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
    ├── data/            configurazioni statiche in JSON (vedi 05)
    ├── domain/          modello dati, dati statici tipizzati, algoritmo di generazione
    ├── storage/         interfaccia di persistenza (SQLite in dev, Supabase in prod)
    └── ui/              componenti e schermate
        ├── tema.css     palette pastello, tipografia, misure dei tocchi
        ├── App.tsx      layout: header fisso + area contenuto
        ├── ListaSpesa.tsx     schermata principale (lista in sola lettura)
        ├── GruppoReparto.tsx  un reparto col suo titolo e le sue voci
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
tiene solo quelle non ancora comprate. `listaEsempio.ts` è una lista di settembre usata
finché non ci sono generazione e persistenza: serve a vedere la schermata piena.

`lista.test.ts` verifica l'ordine dei reparti, l'esclusione di quelli vuoti, l'ordine
delle voci dentro un reparto e la coerenza della lista di esempio (id unici, reparti
esistenti, Frutta e Verdura con 4 elementi di stagione).

L'algoritmo di generazione ([03](03-algoritmo-generazione.md)) e i suoi test sono il
prossimo passo.

## `src/ui`
Il tema sta tutto in `tema.css` come variabili CSS: colori pastello (crema, salvia,
zucca, pomodoro), raggi, spaziature e `--tocco`, l'altezza minima di ogni elemento
toccabile. Ogni componente ha il suo `.css` accanto, importato dal componente
stesso. Nessuna libreria di stili.

La lista è una sequenza di reparti: titolo del reparto in maiuscoletto e sotto le sue
voci, ognuna una riga alta almeno `--tocco`. Le voci raggruppate (Frutta, Verdura)
elencano i propri elementi come pastiglie sotto il nome.

Il layout è una colonna larga al massimo 560px, centrata: sul telefono occupa tutto,
sul desktop resta stretta come sul telefono.
