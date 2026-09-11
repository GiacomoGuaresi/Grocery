# 08 — UI / UX

## Principi
Mobile-first, pensata per l'uso **in piedi, con una mano, in corsia**: target tap
ampi, testo leggibile, poche schermate, nessun passaggio inutile.

## Stile
- **Tema chiaro** soltanto (nessun tema scuro).
- **Colori caldi**, **terracotta** su fondo **panna chiara**, con un leggero tema
  **culinario**.
- Lingua: **solo italiano**.
- **Scala 0.8**: testi, spazi e tocchi sono ridotti all'80% della prima versione,
  che sul telefono era troppo grande. I campi di testo restano a 16px, altrimenti
  iOS zooma al tocco.
- **Voci compatte**: le voci di un reparto sono righe basse attaccate l'una
  all'altra, un unico blocco per reparto, così se ne vedono più alla volta.

## Navigazione
Un **menu laterale a scomparsa**, aperto dal bottone ☰ nell'intestazione, contiene
tutte le sezioni e le azioni:
- **Lista**
- **Piano**
- **Archivio**
- **Genera lista** (azione, staccata dalle sezioni)

Si chiude toccando fuori, con la ✕ o scegliendo una voce. Non c'è più la barra
delle schede in alto.

## Schermate

### 1. Accesso
Campo unico per la **passphrase**. La sessione viene salvata nei **cookie**: una
volta inserita, non viene più richiesta sul dispositivo.

### 2. Lista della spesa *(schermata principale)*
- Voci raggruppate per **reparto**, nell'ordine del percorso in corsia.
- Tap su una voce = **comprata**: la voce **sparisce** dalla lista attiva. Nelle voci
  raggruppate si spuntano i singoli tipi.
- Sezione ripiegata **"Già presi"** in fondo, per rivedere e **de-spuntare**.
- Nella riga della voce c'è solo la **spunta**. Le funzioni della voce
  (alternative, rinomina, elimina) stanno in un **popup**, che si apre col ⋯ a lato
  e sale dal fondo dello schermo.
- Ogni voce generata ha, nel popup, una **dropdown** con le tipologie alternative.
  Nessuna quantità né grammatura viene mostrata.
- Ogni voce si può **eliminare**; solo le voci manuali sotto "Altro" si possono
  anche **rinominare**.
- **Frutta** e **Verdura** sono una voce raggruppata ciascuna, che elenca i 4 tipi
  scelti; ogni tipo ha la sua spunta nella riga e, nel popup, la sua dropdown di
  alternative di stagione.
- **Aggiunta rapida** sempre raggiungibile (serve anche mentre si è al supermercato):
  campo di testo con **autocompletamento case-insensitive**; se il prodotto è nel
  catalogo eredita il reparto, altrimenti finisce sotto **"Altro"**.

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

## Configurazione
La routine, i cataloghi di rotazione e le regole **non sono modificabili
dall'interfaccia**: stanno nei file JSON del repository
([05 — Dati statici](05-dati-statici.md)). Non esiste quindi una schermata
impostazioni.
