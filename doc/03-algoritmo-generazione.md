# 03 — Algoritmo di generazione

> Riscritto il 2026-09-12 per la **v2** ([13](13-piano-v2.md)). La v1 pescava a
> caso le tipologie con memoria tra i cicli: nell'uso vero non funzionava ed è
> stata tolta del tutto.

Algoritmo **deterministico e banale**, senza IA e senza stato: dalla routine esce
sempre la stessa lista. Non legge nulla dal database, quindi gira anche **senza
rete**.

## Input
- La **routine alimentare** ([02](02-routine-alimentare.md)): quale categoria per
  ogni sera della settimana.
- Il **reparto** di ogni categoria ([05](05-dati-statici.md)).

La stagionalità e i consigli **non entrano nella generazione**: servono solo al
popup dei consigli ([08](08-ui-ux.md)).

## Output
Una voce per categoria, con il suo **moltiplicatore**, raggruppata per reparto.
L'unità è **"pasti" per tutte**.

| Voce | Moltiplicatore | Reparto |
|---|---|---|
| Carne rossa | ×2 pasti | Macelleria |
| Carne bianca | ×2 pasti | Macelleria |
| Pesce | ×4 pasti | Pescheria |
| Formaggio | ×2 pasti | Latticini, formaggi e uova |
| Uova | ×2 pasti | Latticini, formaggi e uova |
| Affettati | ×2 pasti | Salumi |
| Verdura | ×14 pasti | Ortofrutta |
| Frutta | ×28 pasti | Ortofrutta |

## Regole

### R1 — Moltiplicatore dalla routine
Il moltiplicatore di una categoria proteica è **quante sere la routine le assegna in
una settimana × 2** (il ciclo resta di due settimane). Non è scritto a mano: se cambia
la routine, cambiano i numeri.

### R2 — Verdura e frutta
- **Verdura**: un contorno ogni sera → 7 × 2 = **×14**.
- **Frutta**: 2 porzioni al giorno → 2 × 7 × 2 = **×28**.

### R3 — Il numero conta i pasti
Il moltiplicatore conta **pasti**, **non pezzi né confezioni**: "Uova ×2" sono due
cene a base di uova, non due confezioni.

### R4 — È un suggerimento, che si conta in corsia
Il **totale non si modifica**: ci si regola in base al piano della settimana e a
quello che c'è già in frigo o in freezer. Durante la spesa si conta **quanti se ne
sono presi** con un contatore `presi/totale` (F15, [04](04-funzionalita.md)); a
`totale/totale` la voce è completa.

### R5 — Voci non spuntate del ciclo precedente
Alla generazione, se la lista precedente ha **voci manuali** non spuntate, l'app
**chiede** se portarle nella nuova lista.
- Le voci **generate non si riportano mai**, né prese a metà (Pesce 2/4) né mai
  toccate (Pesce 0/4): la lista nuova ha già le sue, e non ci sono doppioni.
- Una voce manuale riportata non si somma a nulla: resta com'era.

### R6 — Nessuna rigenerazione
Una lista si sostituisce solo generandone una nuova. La precedente **non si archivia
più**: viene cancellata (l'archivio è stato tolto, [10](10-decisioni.md)).

## Cosa NON fa
- Non sceglie **tipologie**: i tipi sono solo consigli da leggere.
- Non ricorda nulla tra un ciclo e l'altro.
- Non calcola grammature né pezzi.
- Non pianifica quale giorno si mangia cosa: il [piano settimanale](08-ui-ux.md) è
  solo indicativo.
