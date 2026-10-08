# 08 — UI / UX

## Principi
Mobile-first, pensata per l'uso **in piedi, con una mano, in corsia**: target tap
ampi, testo leggibile, poche schermate, nessun passaggio inutile.

## Stile
- **Tema chiaro** soltanto (nessun tema scuro).
- **Colori caldi**, **terracotta** su fondo **panna chiara**, con un leggero tema
  **culinario**.
- **Intestazione terracotta** piena con le **scritte bianche**; la barra di stato
  del telefono (theme-color) è dello stesso terracotta. Nell'intestazione solo
  il **cesto dell'icona dell'app** e il titolo **Grocery**, nessun sottotitolo.
- **Fondo della schermata panna** (`--crema`), **sidebar bianca**.
- **Sfondo a tema cucina**: sul panna, poche icone grandi e bianche, sparse e
  ruotate, ripetute senza giunture (stile doodle di WhatsApp). Sono le icone
  dell'app stessa, mai un set esterno; lo sfondo si rigenera con
  `npm run sfondo` (scripts/genera-sfondo.ts).
- **Anche da PC, a tutto schermo**: l'app occupa l'intera finestra, senza bordi
  né fondo diverso ai lati; l'intestazione va da bordo a bordo. Solo il
  contenuto resta centrato, largo al massimo 720px, per non allungare troppo
  le righe.
- Lingua: **solo italiano**.
- **Scala 0.8**: testi, spazi e tocchi sono ridotti all'80% della prima versione,
  che sul telefono era troppo grande. I campi di testo restano a 16px, altrimenti
  iOS zooma al tocco.
- **Icone, non emoji**: tutte le icone sono disegni a tratto dello stesso set
  (stile Lucide), nel colore del testo. Le emoji cambiano aspetto da un telefono
  all'altro e stonano con la palette.
- **Voci compatte**: le voci di un reparto sono righe basse attaccate l'una
  all'altra, un unico blocco per reparto, così se ne vedono più alla volta.

## Animazioni
Brevi (intorno ai 200ms), solo dove aiutano a capire cosa è successo. Chi ha
chiesto meno movimento nelle impostazioni del telefono vede tutto cambiare di
colpo.
- **Eliminazione**: la riga sfuma e si ripiega in altezza, quelle sotto salgono
  senza scatti. Se parte dal popup, prima il popup ridiscende, poi la riga se ne va.
- **Spunta**: il segno si riempie con un piccolo scatto, poi la riga si ripiega
  e va tra i "Già presi".
- **De-spunta**: la riga lascia i "Già presi" allo stesso modo e si apre, in
  dissolvenza, nel suo reparto.
- **Voce aggiunta**: si apre nel suo reparto con un breve lampo color zucca, e
  la lista scorre fin lì se era fuori schermo.
- **Reparto che si svuota**: quando esce l'ultima voce, il titolo del reparto si
  ripiega insieme a lei.
- **"Già presi"** si apre e si chiude a fisarmonica; il contatore fa un saltello
  quando cambia.
- **"Preso tutto"** entra col carrello che scivola dentro da sinistra.
- **Popup delle azioni**: sale dal fondo e ridiscende quando si chiude, in
  qualunque modo (Chiudi, tocco fuori, Esc).
- **Conferma di "Genera lista"**: entra con una dissolvenza e un lieve
  ingrandimento.

## Gesture
Scorciatoie per l'uso con una mano: i bottoni restano il modo principale.
- **Pressione lunga sul nome** di una voce, o su una card delle ricette: apre il
  popup delle azioni (come il ⋯).
- **Pressione lunga sul + / −** del contatore: completa / azzera la voce.
- **Scorrere una riga verso destra**: spunta; le voci col contatore si completano.
  Nei "Già presi" la riporta nella lista (le voci col contatore a zero).
- **Scorrere una riga verso sinistra**: elimina. Vale per tutte le righe, anche gli
  ingredienti delle ricette. Sotto la riga si scopre l'azione; oltre un terzo della
  riga l'icona si ingrandisce e lasciando parte. Dai bordi dello schermo non si
  scorre, per non rubare il gesto "indietro" di Android. Le card delle ricette
  invece non si scorrono: eliminare una ricetta non si annulla.
- **Trascinare in giù** un popup delle azioni, o la testa di quello dei consigli:
  lo chiude. La maniglia in cima lo suggerisce.

## Annulla e ripristina
Nell'intestazione, a destra, solo nella schermata della lista: **annulla** e
**ripristina** le modifiche fatte su questo dispositivo (cronologia breve, ultime
30, solo per la sessione, niente sul server). Generare una lista nuova la svuota.
Le righe che spariscono o cambiano posto prima escono; poi le voci toccate
lampeggiano color zucca dove sono tornate, e la lista ci scorre se serve.
I tocchi veloci vanno in coda e si fanno uno alla volta; aspettano anche le righe
che stanno uscendo per uno swipe, così annullano proprio quello. Una voce eliminata
che torna ha un id nuovo e finisce in fondo al suo reparto: il database non
riprende mai un id eliminato (`voci_eliminate`).

## Navigazione
Un **menu laterale a scomparsa**, aperto dal bottone ☰ nell'intestazione, contiene
tutte le sezioni e le azioni. **Da desktop** (finestra larga almeno 1024px) il menu
è **sempre aperto**: una colonna fissa a sinistra sotto l'intestazione, senza ☰ e
senza X.
- **Lista**
- **Piano**
- **Ricette** ([14](14-piano-ricette.md))
- ~~**Archivio**~~ (tolto in v2)
- **Frutta** (di stagione)
- **Verdura** (di stagione)
- **Genera lista** (azione, staccata dalle sezioni)
- **Installa l'app** (in fondo al menu, sparisce quando l'app è già installata)

Il browser non propone più l'installazione con un popup (su iOS mai, su desktop
solo un'icona nella barra degli indirizzi), quindi la voce serve a trovarla.
Dove il browser lo permette (Chrome, Edge, Android) apre il suo prompt con un
tocco; altrove (Safari, iOS) apre una schermata con i passi da fare a mano, scelti
in base al dispositivo.

Si chiude toccando fuori, con la ✕ o scegliendo una voce. Non c'è più la barra
delle schede in alto.

## Schermate

### 1. Accesso
Campo unico per la **passphrase**. La sessione viene salvata nei **cookie**: una
volta inserita, non viene più richiesta sul dispositivo.

### 2. Lista della spesa *(schermata principale)*
- Voci raggruppate per **reparto**, nell'ordine del percorso in corsia.
- Tap sulla **checkbox** di una voce = **comprata**: la voce **sparisce** dalla lista
  attiva. Si spunta **esclusivamente dalla checkbox**: il tap sul testo non spunta.
- Nelle voci manuali sotto **"Altro"** (senza categoria) il tap sul testo rende il
  nome **modificabile nella riga stessa**: Invio o tap fuori salvano, Esc annulla.
  Una **matita** semitrasparente accanto al nome dice che si può correggere.
- **Voci generate (v2)**: una per categoria — *Carne rossa, Carne bianca, Pesce,
  Formaggio, Uova, Affettati, Verdura, Frutta* — ognuna nel suo reparto.
- **Contatore** al posto della spunta, in testa alla riga: **`[−] 0/4 [+]`**, senza
  unità e il più compatto possibile. I tasti sono grandi quanto la casella della
  spunta e in colonna con lei, pieni e bordati perché si capisca che si premono;
  tra il numero e i tasti 8px, e dal nome lo stesso spazio che ha la casella. I tasti vanno di uno; il numero non si scrive. A **4/4**
  la voce è completa e va tra i "Già presi", dove tiene il contatore: il **−** la
  riporta nella lista a 3/4. Il totale non si modifica.
- Il tap sul nome di una voce generata apre il **popup dei consigli** (F14). Una
  piccola icona accanto al nome dice che si può toccare. Le uova non hanno popup.
- Il **popup** ha in cima lo **stesso contatore** della riga, perché si tiene aperto
  nel reparto mentre si prende tutto; sotto, i consigli in sola lettura. Quando la voce
  arriva al totale il popup **resta aperto**; la voce va tra i "Già presi" alla
  chiusura.
- **Verdura** e **Frutta** sono **due voci** nel reparto Ortofrutta; i tipi si vedono
  **solo nel popup**, in due **schede** affiancate (*Di stagione* / *Fuori stagione*),
  come **pillole** divise in gruppi: *Ultimi giorni* (pallino zucca), *Nel pieno*,
  *Tutto l'anno* (tenue); *In arrivo* (pallino terracotta), *Più avanti*. Le pillole
  del **mese corrente** sono **in evidenza**: piene, più grandi, in grassetto
  (terracotta, zucca negli ultimi giorni); le altre restano chiare.
- Il popup ha tre parti: **testa ferma** con il nome e il **contatore in grande** in una
  card, con la **barra a tacche** dei pasti e lo stato (*Mancano N pasti* / *Tutto
  preso*); **tipi** che scorrono; **piede fermo** col bottone *Chiudi*, che a voce
  completa diventa **Fatto** (pieno, terracotta).
- Sezione ripiegata **"Già presi"** in fondo, per rivedere e **de-spuntare**.
- Nella riga della voce ci sono la **spunta**, il nome e il moltiplicatore. Le
  funzioni della voce (rinomina, elimina) stanno in un **popup**, che si apre col ⋯
  a lato e sale dal fondo dello schermo.
- Ogni voce si può **eliminare**; solo le voci manuali sotto "Altro" si possono
  anche **rinominare**.
- Via la select delle **alternative** e la freccina ⌄ della v1.
- **Aggiunta rapida** sempre raggiungibile (serve anche mentre si è al supermercato):
  campo di testo con **autocompletamento case-insensitive**; se il prodotto è nel
  catalogo eredita il reparto, altrimenti finisce sotto **"Altro"**. Sta **sempre in
  fondo allo schermo**, anche con la lista corta, in una **card galleggiante** (bordo,
  angoli arrotondati, ombra) staccata dal bordo, sopra lo sfondo a icone.

### 3. Genera lista
Azione per generare il nuovo ciclo di due settimane. Da confermare, perché
**cancella** la lista corrente (non c'è più l'archivio). Sta nel **menu laterale**, che apre direttamente la conferma; nella
lista vuota resta anche come bottone principale.

Se la lista corrente ha voci **non spuntate**, la conferma **chiede se portarle nella
nuova lista**.

Non esiste un'azione "rigenera": per rifare la lista se ne genera una nuova.

### 4. Piano settimanale
La tabella dei pasti con il **giorno corrente evidenziato**. Vista di consultazione.

Mostra solo la **categoria** del giorno ("mercoledì: pesce"), non quale tipologia
specifica: ci si regola con quello che si ha in casa. Resta anche nella v2: serve a
regolarsi in corsia sul moltiplicatore.

### ~~5. Archivio~~
Tolto con la v2: pagina, voce del menu e dati.

### 6. Frutta e verdura di stagione
Viste di consultazione della tabella di stagionalità: due pagine del menu, una per
la **frutta** e una per la **verdura**, fatte allo stesso modo.
- Si apre sulla **stagione corrente**; in alto si passa a un'altra delle quattro
  stagioni (inverno dicembre–febbraio, primavera marzo–maggio, estate giugno–agosto,
  autunno settembre–novembre) e si può **restringere a un mese** della stagione.
- Un tipo è della stagione se c'è in **almeno uno** dei suoi mesi.
- Una riga per tipo, in ordine alfabetico, con la **striscia dei 12 mesi**: pieni
  quelli in cui c'è, più scuri e **racchiusi da un bordo** quelli del periodo scelto.
  Si vede se un tipo sta arrivando o sta finendo.
- In testa alla colonna le iniziali dei mesi: è evidenziata solo quella del **mese
  corrente**.
- Quello che c'è **tutto l'anno** (mele, limoni, banane, ananas; carote, cipolle,
  funghi coltivati, patate, songino) sta a parte, in una riga sola in fondo.

### 7. Ricette
Le ricette importate da un link ([14](14-piano-ricette.md)).
- **Elenco**: in cima il campo per **incollare un link** (con la PWA su Android si
  arriva anche da *Condividi → Grocery*); sotto la **ricerca** per nome, i **chip
  delle categorie** del sito e le card, dalla più recente, con la foto presa dal
  sito, il nome, le categorie e quanti ingredienti. Toccare la card apre la
  scheda; il **⋯** a lato, o la pressione lunga, il popup delle azioni.
- **Import**: "Scarico la ricetta…", poi "Ricetta salvata" con la domanda
  *Aggiungo gli ingredienti alla lista?* → **Sì, scelgo** / **No, solo salvata**. Gli
  errori dicono cosa fare (niente link, pagina senza ricetta, sito che non
  risponde, senza rete) e, dove ha senso, **Riprova**.
- **Scelta degli ingredienti**: una casella per ingrediente, tutte spuntate tranne
  i *q.b.*; "già in lista" accanto a quelli già da prendere; *Tutti* / *Nessuno*;
  il bottone dice quanti ne aggiunge. Fatto, si torna alla lista.
- **Scheda**: in cima *‹ Ricette* e il **⋯**; foto, nome, categorie, link al
  **procedimento sul sito**, ingredienti (i *q.b.* più tenui), *Aggiungi
  ingredienti alla lista*.
- **Popup delle azioni** di una ricetta, come quello delle voci (sale dal fondo):
  *Aggiungi ingredienti alla lista* (solo dall'elenco), *Procedimento sul sito*,
  *Elimina*. Eliminare chiede conferma **dentro il popup** (*Indietro* /
  *Elimina*, rosso pieno), che resta aperto finché il database non risponde e
  mostra lì l'eventuale errore.
- Nella **lista** gli ingredienti stanno dopo i reparti, sotto il nome della
  ricetta in maiuscolo, su una riga sola, troncato coi "…": toccarlo apre la scheda.

## Configurazione
La routine, i cataloghi di rotazione e le regole **non sono modificabili
dall'interfaccia**: stanno nei file JSON del repository
([05 — Dati statici](05-dati-statici.md)). Non esiste quindi una schermata
impostazioni.
