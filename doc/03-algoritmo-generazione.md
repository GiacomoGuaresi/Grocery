# 03 — Algoritmo di generazione

Algoritmo **semplice**, senza nessuna IA. La scelta delle tipologie è **casuale**:
è l'unica componente non deterministica, e c'è per un motivo preciso (R2).

## Input
- La **routine alimentare** ([02](02-routine-alimentare.md)): quale fonte proteica
  per ogni giorno della settimana.
- I **cataloghi** di tipologie per categoria ([05](05-dati-statici.md)). L'ordine è
  indifferente: non ci sono preferenze da anticipare.
- La **tabella di stagionalità** di verdura e frutta ([05](05-dati-statici.md)).
- Lo **storico delle rotazioni**: per ogni categoria, le tipologie proposte
  nell'ultimo ciclo, persistite sul DB.
- La **data di generazione** (per determinare il mese → stagionalità).

## Output
Una lista della spesa per **14 cene** (2 settimane) più contorni e frutta,
raggruppata per **reparto**.

## Regole

### R1 — Copertura
Per ogni categoria si generano tante voci quante sono le occorrenze nel ciclo:
carne rossa ×2, formaggio ×2, pesce ×4, uova ×2, carne bianca ×2, affettati ×2.

### R2 — Scelta casuale
Ogni tipologia della categoria si pesca **a caso**, con la stessa probabilità delle
altre. Non si scorre il catalogo in ordine.

Prima era un giro fisso sul catalogo (round-robin) e si è rivelato sbagliato nell'uso
reale: i cataloghi sono ordinati per animale, e a scorrerli in ordine capitavano cicli
interi sullo **stesso animale con tagli diversi** — tredici tagli di manzo di fila
prima di arrivare al maiale. Pescando a caso da tutto il catalogo la varietà si vede
davvero.

    carne rossa: ossobuco di vitello -> salsiccia -> roast beef -> ...

### R3 — Memoria tra i cicli
Le tipologie proposte vengono **salvate sul DB** e alla generazione successiva sono
**escluse dalla pesca**: due cicli di fila non ripropongono le stesse cose. Se il
catalogo del mese è troppo corto per farne a meno — può capitare alla frutta — quelle
del ciclo prima tornano pescabili, ma solo dopo tutte le altre.

### R4 — Varietà dentro il ciclo
Le occorrenze della stessa categoria nello stesso ciclo devono essere **tipologie
diverse tra loro**:
- le 2 carni rosse sono diverse (una per settimana);
- i 4 pesci sono tutti diversi tra loro;
- idem per formaggi, affettati e carni bianche.

Le **uova** sono l'eccezione: unica tipologia, nessuna rotazione.

In generale **nella lista una voce non si ripete mai**: se una categoria ha meno
tipologie delle sue occorrenze, ogni tipologia compare una volta sola.

### R5 — Contorni di stagione
I contorni sono verdure — **patate incluse**, mai legumi — scelte **a caso tra quelle
di stagione** nel mese di generazione.

Non serve un contorno diverso per ogni cena: se ne propongono **4 per ciclo**,
diverse tra loro, destinate a ripetersi lungo i giorni delle due settimane.

### R5b — Frutta di stagione
Stessa logica: **4 tipi di frutta di stagione** per ciclo, diversi tra loro, scelti a
caso. La frutta copre un consumo di **2 porzioni al giorno**.

### R5c — Nessuna divisione tra le settimane
Frutta e verdura si comprano **tutte insieme** in un'unica spesa. L'algoritmo
suggerisce solo *quali tipi*, non le quantità né in quale settimana consumarli.

### R5d — Una voce per tipo
Frutta e verdura generano **una voce per ogni tipo scelto**, in elenco diretto nel
reparto Ortofrutta, come tutte le altre voci. Non c'è una voce "Frutta" o "Verdura"
che raggruppa i tipi.

    Carote
    Indivia
    Zucca
    Cavolfiore
    Fichi
    More
    Prugne

Ogni tipo è **sostituibile** tramite la propria **dropdown** (R7, alternative di
stagione dello stesso gruppo) e si **spunta** come qualsiasi altra voce: se si trovano
le mele ma non le pere, si segna solo la prima.

### R6 — Voci non spuntate del ciclo precedente
Alla generazione di una nuova lista, se la precedente contiene voci **non spuntate**
l'app **chiede** se portarle nella nuova lista. Questo copre anche i prodotti
aggiunti manualmente tra una spesa e l'altra, che restano nella lista corrente e
vengono così trasferiti.

### R7 — Alternative
Ogni voce generata espone una **dropdown** con le altre tipologie disponibili della
sua categoria, così da poterla sostituire prima o durante la spesa. La sostituzione
non altera la memoria salvata.

È l'unico modo per "modificare" una voce generata: gli alimenti sono dati statici del
catalogo, non si rinominano.

### R8 — Uova
Voce fissa, senza rotazione, senza quantità: compare semplicemente come **"uova"**,
**una volta sola**, anche se nel ciclo le cene a base di uova sono due.

## Cosa NON fa
- Non calcola **quantità né grammature**: propone solo cosa comprare.
- Non pianifica quale giorno si mangia cosa in modo vincolante (la vista
  [piano settimanale](08-ui-ux.md) è solo indicativa).
- Non esclude nulla per allergie o intolleranze: non ce ne sono.
- Non distingue "prima settimana" / "seconda settimana" negli acquisti: si presume
  che i freschi vengano **congelati**. Se un prodotto viene invece comprato più
  avanti, resta semplicemente non spuntato finché non lo si acquista davvero.
