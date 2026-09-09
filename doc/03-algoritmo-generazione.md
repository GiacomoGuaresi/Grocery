# 03 — Algoritmo di generazione

Algoritmo **semplice e deterministico**. Nessuna IA, nessuna componente casuale.

## Input
- La **routine alimentare** ([02](02-routine-alimentare.md)): quale fonte proteica
  per ogni giorno della settimana.
- I **cataloghi** di tipologie per categoria ([05](05-dati-statici.md)). L'ordine è
  indifferente: non ci sono preferenze da anticipare.
- La **tabella di stagionalità** di verdura e frutta ([05](05-dati-statici.md)).
- Lo **storico delle rotazioni**: per ogni categoria, l'ultima posizione usata,
  persistita sul DB.
- La **data di generazione** (per determinare il mese → stagionalità).

## Output
Una lista della spesa per **14 cene** (2 settimane) più contorni e frutta,
raggruppata per **reparto**.

## Regole

### R1 — Copertura
Per ogni categoria si generano tante voci quante sono le occorrenze nel ciclo:
carne rossa ×2, formaggio ×2, pesce ×4, uova ×2, carne bianca ×2, affettati ×2.

### R2 — Rotazione deterministica
Ogni categoria ha una lista ordinata di tipologie. L'algoritmo avanza di una
posizione a ogni estrazione, ripartendo dall'inizio a fine lista (round-robin).

    carne rossa: manzo -> maiale -> vitello -> manzo -> ...

### R3 — Memoria tra i cicli
La posizione raggiunta in ogni catalogo viene **salvata sul DB** e ripresa alla
generazione successiva, così le liste consecutive non ripropongono le stesse cose.

### R4 — Varietà dentro il ciclo
Le occorrenze della stessa categoria nello stesso ciclo devono essere **tipologie
diverse tra loro**:
- le 2 carni rosse sono diverse (una per settimana);
- i 4 pesci sono tutti diversi tra loro;
- idem per formaggi, affettati e carni bianche.

Le **uova** sono l'eccezione: unica tipologia, nessuna rotazione.

### R5 — Contorni di stagione
I contorni sono verdure — **patate incluse**, mai legumi — scelte **a rotazione tra
quelle di stagione** nel mese di generazione.

Non serve un contorno diverso per ogni cena: se ne propongono **4 per ciclo**,
diverse tra loro, destinate a ripetersi lungo i giorni delle due settimane.

### R5b — Frutta di stagione
Stessa logica: **4 tipi di frutta di stagione** per ciclo, diversi tra loro, scelti a
rotazione. La frutta copre un consumo di **2 porzioni al giorno**.

### R5c — Nessuna divisione tra le settimane
Frutta e verdura si comprano **tutte insieme** in un'unica spesa. L'algoritmo
suggerisce solo *quali tipi*, non le quantità né in quale settimana consumarli.

### R5d — Voci raggruppate
Frutta e verdura non generano una voce per tipo: producono **una voce sola ciascuna**,
che elenca i 4 tipi scelti.

    Frutta:  mele, pere, arance, kiwi
    Verdura: zucchine, radicchio, patate, spinaci

Ogni tipo all'interno della voce è **sostituibile** tramite la propria **dropdown**
(R7, alternative di stagione) e si **spunta singolarmente**: se si trovano le mele ma
non le pere, si segna solo la prima.

### R6 — Voci non spuntate del ciclo precedente
Alla generazione di una nuova lista, se la precedente contiene voci **non spuntate**
l'app **chiede** se portarle nella nuova lista. Questo copre anche i prodotti
aggiunti manualmente tra una spesa e l'altra, che restano nella lista corrente e
vengono così trasferiti.

### R7 — Alternative
Ogni voce generata espone una **dropdown** con le altre tipologie disponibili della
sua categoria, così da poterla sostituire prima o durante la spesa. La sostituzione
non altera lo stato della rotazione salvata.

È l'unico modo per "modificare" una voce generata: gli alimenti sono dati statici del
catalogo, non si rinominano.

### R8 — Uova
Voce fissa, senza rotazione, senza quantità: compare semplicemente come **"uova"**.

## Cosa NON fa
- Non calcola **quantità né grammature**: propone solo cosa comprare.
- Non pianifica quale giorno si mangia cosa in modo vincolante (la vista
  [piano settimanale](08-ui-ux.md) è solo indicativa).
- Non esclude nulla per allergie o intolleranze: non ce ne sono.
- Non distingue "prima settimana" / "seconda settimana" negli acquisti: si presume
  che i freschi vengano **congelati**. Se un prodotto viene invece comprato più
  avanti, resta semplicemente non spuntato finché non lo si acquista davvero.
