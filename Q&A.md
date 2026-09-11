# Grocery — Domande aperte (Q&A) · giro 5

> I giri 1-4 sono stati digeriti in [doc/](doc/README.md).
> La documentazione è completa: struttura del progetto e dati JSON sono stati creati
> (vedi [doc/11-struttura-progetto.md](doc/11-struttura-progetto.md)).
> Queste sono le poche cose da verificare sui dati che ho scritto.

---

## 1. Cataloghi generati

Q1.1: Il catalogo carne rossa contiene anche **cavallo** (fettine, tagliata) e **agnello** (costolette, cosciotto). Li tengo o li tolgo?
A:

Q1.2: Ho messo tra i pesci anche **baccalà**, **alici**, **sardine**, **sgombro** e **salmone affumicato**. Ci stanno come cena o li tolgo?
A:

Q1.3: Tra gli affettati ho incluso **porchetta**, **pancetta** e **strolghino**: li mangiate come affettato della domenica sera?
A:

Q1.4: Nel catalogo formaggi ci sono anche stagionati da tavola (pecorino, emmental, groviera, asiago). Li considerate un secondo da cena o meglio togliere quelli troppo "da tagliere"?
A:

## 2. Rotazione

> Superate: la rotazione a giro fisso è stata sostituita dalla **pesca casuale**
> con memoria dell'ultimo ciclo (Step 8, [doc/10](doc/10-decisioni.md)).

Q2.1: La rotazione è **globale per categoria**: dopo "manzo (fettine)" la volta dopo esce "manzo (macinato)", perché sono voci consecutive del catalogo. Il risultato è che per settimane esce sempre manzo, poi per settimane sempre maiale. Preferisci che la rotazione **alterni gli animali** (manzo → maiale → vitello → manzo...) invece di scorrere l'elenco così com'è?
A:

Q2.2: Stesso tema per il pesce: 4 pesci per ciclo presi in fila danno "salmone, salmone, orata, branzino". Vuoi che tenga separati **pesce fresco** e **surgelato/molluschi**, per esempio 3 freschi + 1 tra gamberi/calamari/seppie?
A:

## 3. Prossimo passo

> Superata: algoritmo e interfaccia sono fatti entrambi (Step 3-12).

Q3.1: Procedo con l'**algoritmo di generazione** e i suoi test, o preferisci prima l'**interfaccia** (schermata lista, spunta) per vedere qualcosa a schermo?
A:
