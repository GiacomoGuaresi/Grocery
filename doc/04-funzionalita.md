# 04 — Funzionalità

> Aggiornato il 2026-09-12 per la **v2** ([13](13-piano-v2.md)).

| # | Funzionalità | Stato |
|---|---|---|
| F1 | Generazione della lista **per categorie** per il ciclo di 2 settimane | v2 |
| F2 | Spunta dei prodotti durante la spesa | ✅ |
| F3 | Raggruppamento per reparto del supermercato | ✅ |
| F4 | Aggiunta manuale di prodotti | ✅ |
| F5 | Aggiunta al volo mentre si è al supermercato | ✅ |
| ~~F6~~ | ~~Sostituzione di una voce tramite dropdown di alternative~~ | tolta in v2 |
| F6b | Rinomina di una voce manuale, eliminazione di qualsiasi voce | ✅ |
| F7 | Lista condivisa e sincronizzata in tempo reale | ✅ |
| F8 | Accesso con passphrase condivisa | ✅ |
| F9 | Funzionamento offline in lettura e scrittura | ✅ |
| F10 | Vista piano settimanale con giorno corrente evidenziato | ✅ |
| ~~F11~~ | ~~Archivio delle liste passate~~ | tolta in v2 |
| F11b | Vista della frutta e della verdura di stagione, per stagione o per mese | ✅ |
| F14 | **Popup dei consigli** su ogni voce generata | v2 |
| F15 | **Moltiplicatore** di pasti sulle voci generate, scalabile in corsia | v2 |
| F12 | Modalità demo per il portfolio | ❌ futuro |
| F13 | Gestione dei pasti saltati (cene fuori) | ❌ futuro |

Legenda: ✅ fatto · v2 da fare nella v2 · ❌ non ora

---

## F1 — Generazione
Un'azione genera la lista secondo [l'algoritmo](03-algoritmo-generazione.md): **una
voce per categoria** (Carne rossa, Pesce, …, Verdura, Frutta), ognuna col suo
moltiplicatore. Nessuna tipologia specifica: quella si sceglie in corsia. Il ciclo
**parte dal momento della generazione**, non è ancorato a un giorno fisso del
calendario: tipicamente la lista viene generata quando si è già al supermercato.

Si genera **una lista unica** per le due settimane. Non legge nulla dal database,
quindi si può generare anche **senza rete**.

Se la lista precedente ha **voci manuali non spuntate**, l'app **chiede se portarle
nella nuova lista**. È così che i prodotti aggiunti a mano tra una spesa e l'altra
arrivano alla spesa successiva. Le voci generate non si riportano mai, nemmeno se non
sono complete.

Non è previsto **rigenerare** la lista corrente: per rifarla si genera una lista
nuova, e la precedente si cancella.

## F2 — Spunta
Ogni voce si segna come **comprata** con un tap.

- L'articolo comprato **sparisce dalla lista attiva**.
- Le voci generate si contano col **contatore** `presi/totale` e spariscono quando
  sono complete (F15).
- Deve restare **visualizzabile** (sezione/toggle "già presi") e **de-spuntabile**
  per annullare un errore.
- Non serve segnare "non trovato / esaurito".

## F3 — Reparti
La lista è raggruppata per **reparto del supermercato**, per seguire il percorso in
corsia (ortofrutta, macelleria, pescheria, gastronomia, latticini, ...). L'elenco dei
reparti e la loro mappatura sta in [05 — Dati statici](05-dati-statici.md).

## F4 / F5 — Aggiunta manuale
Si aggiungono prodotti extra (detersivi, igiene, biscotti...) sia **nelle settimane
precedenti** alla spesa sia **al volo mentre si è al supermercato**.

Flusso di inserimento:
1. Si scrive il nome del prodotto **a mano**.
2. Mentre si scrive compare un **autocompletamento case-insensitive** basato sul
   catalogo prodotti del repo.
3. Se il prodotto è nel catalogo, la sua **categoria/reparto viene assegnata
   automaticamente**.
4. Se il prodotto è **nuovo** (non in catalogo), finisce **sempre** nella sezione
   **"Altro"**, senza possibilità di scegliere il reparto al volo.
5. Le voci **non si ripetono mai** (stesso confronto: maiuscole, accenti e spazi non
   contano). Se il prodotto è già in lista **e non è spuntato**, non viene aggiunto e
   compare un **avviso**; se era già spuntato, torna tra quelli da prendere.

Il catalogo **non impara**: i prodotti nuovi non vi entrano automaticamente. Se uno
ricorre spesso viene aggiunto a `prodotti.json` con un commit.

I prodotti manuali **non** possono essere marcati come ricorrenti, e non hanno un
campo note.

## ~~F6 — Alternative~~
Tolta con la v2: le voci generate sono categorie, non c'è niente da sostituire. Al
suo posto il popup dei consigli (F14), in sola lettura.

## F14 — Consigli
Toccando il nome di una voce generata si apre un popup con dei **suggerimenti in
sola lettura** e, in cima, lo stesso **contatore** della riga (F15). Il popup è
pensato per restare **aperto nel reparto** mentre si prende tutto: i consigli non si
selezionano, ma i presi si contano da lì.

- **Verdura** e **Frutta**: i tipi del gruppo in due **schede** (*Di stagione* /
  *Fuori stagione*, col numero dei tipi), come pillole divise in gruppi:
  - **Di stagione** (scheda iniziale): *Ultimi giorni* (il mese prossimo non ci
    sono più), *Nel pieno*, *Tutto l'anno*. I tipi del **mese corrente** sono **in
    evidenza**;
  - **Fuori stagione**: *In arrivo* (ci sono dal mese prossimo), *Più avanti*.
- Arrivati al totale il popup **resta aperto**, così un tocco di troppo si corregge
  col −; la voce va tra i "Già presi" quando il popup si chiude.
- **Carne rossa, carne bianca, pesce, formaggio, affettati**: un elenco **breve**, per
  ora solo l'animale o il tipo ([05](05-dati-statici.md)); da rivedere con l'uso.
- **Uova**: nessun consiglio, nessun popup.

Le pagine *Frutta* e *Verdura* di stagione del menu restano (F11b).

## F15 — Moltiplicatore
Ogni voce generata porta il numero di **pasti** da coprire nel ciclo (Pesce ×4,
Frutta ×28), ricavato dalla routine. Conta i pasti, **non i pezzi né le confezioni**.

- Il **totale è fisso**: un suggerimento, non si modifica.
- Durante la spesa si contano i presi con un contatore **`[−] 0/4 [+]`**: i tasti
  vanno di **uno alla volta** (anche per verdura ×14 e frutta ×28, per ora); il
  numero **non si scrive**, si legge soltanto. Sta nella riga e nel popup (F14).
- Il contatore **prende il posto della spunta** nelle voci generate.
- Arrivati al totale (**4/4**) la voce è **completa** e va tra i "Già presi". Lì
  mostra ancora il contatore: il **−** la riporta nella lista a 3/4.
- Le voci **manuali** non hanno moltiplicatore: restano con la spunta.

## F6b — Rinomina ed eliminazione

| Tipo di voce | Si può rinominare | Si può cambiare reparto | Si può eliminare |
|---|---|---|---|
| Generata (una categoria) | ❌ | ❌ | ✅ |
| Manuale riconosciuta dal catalogo | ❌ | ❌ | ✅ |
| Manuale nuova (reparto "Altro") | ✅ | ❌ | ✅ |

Gli alimenti del catalogo sono **dati statici**: non si rinominano né cambiano
reparto. Solo le voci manuali finite in "Altro", che non hanno un reparto, possono
essere rinominate.

## F7 — Condivisione
Unica lista condivisa, **aggiornamento in tempo reale** tra i due dispositivi. Non
serve sapere *chi* ha spuntato o aggiunto cosa.

## F8 — Accesso
Ingresso protetto da **passphrase condivisa**, uguale per entrambi. Nessuna
registrazione pubblica.

## F9 — Offline
L'app deve funzionare **senza rete**, sia in **lettura** (vedere la lista) sia in
**scrittura** (spuntare, aggiungere): le modifiche si sincronizzano appena la
connessione torna.

## F10 — Piano settimanale
Vista che mostra la tabella dei pasti con il **giorno corrente evidenziato**.

## ~~F11 — Archivio~~
Tolto con la v2: non serviva. Alla generazione, dopo aver chiesto se portare avanti
le voci non spuntate, la lista precedente **si cancella**. Le liste già archiviate si
cancellano anche loro.

## F11b — Frutta e verdura di stagione
Due pagine del menu laterale, **Frutta** e **Verdura**, che mostrano cosa è di
stagione, dalla tabella di stagionalità. Parte dalla **stagione corrente** e permette di cambiare **stagione**
o di restringere a un **mese**. In sola consultazione.
