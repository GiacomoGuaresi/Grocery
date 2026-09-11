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

## Navigazione
Un **menu laterale a scomparsa**, aperto dal bottone ☰ nell'intestazione, contiene
tutte le sezioni e le azioni. **Da desktop** (finestra larga almeno 1024px) il menu
è **sempre aperto**: una colonna fissa a sinistra sotto l'intestazione, senza ☰ e
senza X.
- **Lista**
- **Piano**
- **Archivio**
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
- Nelle voci con alternative (frutta, verdura, carne, pesce e ogni altra categoria
  con più tipologie) il tap sul testo **apre subito la select** delle alternative,
  senza passare dal popup. Una freccina accanto al nome dice che si può toccare.
- Sezione ripiegata **"Già presi"** in fondo, per rivedere e **de-spuntare**.
- Nella riga della voce ci sono la **spunta** e il nome. Le funzioni della voce
  (alternative, rinomina, elimina) stanno in un **popup**, che si apre col ⋯ a lato
  e sale dal fondo dello schermo.
- Ogni voce generata ha una **dropdown** con le tipologie alternative, che si apre
  dal nome e c'è anche nel popup.
  Nessuna quantità né grammatura viene mostrata.
- Ogni voce si può **eliminare**; solo le voci manuali sotto "Altro" si possono
  anche **rinominare**.
- **Frutta** e **Verdura** sono in **elenco diretto**: ogni tipo scelto (4 di verdura,
  4 di frutta) è una voce a sé nel reparto Ortofrutta, con la sua checkbox e, nel
  popup, la sua dropdown di alternative in due sezioni: **Di stagione** e poi
  **Fuori stagione**. Nessuna voce "Frutta" o "Verdura" che li raggruppa.
- **Aggiunta rapida** sempre raggiungibile (serve anche mentre si è al supermercato):
  campo di testo con **autocompletamento case-insensitive**; se il prodotto è nel
  catalogo eredita il reparto, altrimenti finisce sotto **"Altro"**. Sta **sempre in
  fondo allo schermo**, anche con la lista corta, in una **card galleggiante** (bordo,
  angoli arrotondati, ombra) staccata dal bordo, sopra lo sfondo a icone.

### 3. Genera lista
Azione per generare il nuovo ciclo di due settimane. Da confermare, perché archivia
la lista corrente. Sta nel **menu laterale**, che apre direttamente la conferma; nella
lista vuota resta anche come bottone principale.

Se la lista corrente ha voci **non spuntate**, la conferma **chiede se portarle nella
nuova lista**.

Non esiste un'azione "rigenera": per rifare la lista se ne genera una nuova.

### 4. Piano settimanale
La tabella dei pasti con il **giorno corrente evidenziato**. Vista di consultazione.

Mostra solo la **categoria** del giorno ("mercoledì: pesce"), non quale tipologia
specifica: ci si regola con quello che si ha in casa. L'algoritmo assegna le
tipologie ai giorni solo per costruire la lista; mangiare l'orata sabato invece che
mercoledì è irrilevante e l'app non lo traccia.

### 5. Archivio
Elenco delle liste passate, in sola lettura.

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

## Configurazione
La routine, i cataloghi di rotazione e le regole **non sono modificabili
dall'interfaccia**: stanno nei file JSON del repository
([05 — Dati statici](05-dati-statici.md)). Non esiste quindi una schermata
impostazioni.
