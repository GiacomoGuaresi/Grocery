# 04 — Funzionalità

| # | Funzionalità | MVP |
|---|---|---|
| F1 | Generazione della lista per il ciclo di 2 settimane | ✅ |
| F2 | Spunta dei prodotti durante la spesa | ✅ |
| F3 | Raggruppamento per reparto del supermercato | ✅ |
| F4 | Aggiunta manuale di prodotti | ✅ |
| F5 | Aggiunta al volo mentre si è al supermercato | ✅ |
| F6 | Sostituzione di una voce tramite dropdown di alternative | ✅ |
| F6b | Rinomina di una voce manuale, eliminazione di qualsiasi voce | ✅ |
| F7 | Lista condivisa e sincronizzata in tempo reale | ✅ |
| F8 | Accesso con passphrase condivisa | ✅ |
| F9 | Funzionamento offline in lettura e scrittura | ✅ |
| F10 | Vista piano settimanale con giorno corrente evidenziato | ➖ |
| F11 | Archivio delle liste passate | ➖ |
| F11b | Vista della frutta e della verdura di stagione, per stagione o per mese | ➖ |
| F12 | Modalità demo per il portfolio | ❌ futuro |
| F13 | Gestione dei pasti saltati (cene fuori) | ❌ futuro |

Legenda: ✅ nell'MVP · ➖ subito dopo · ❌ non ora

---

## F1 — Generazione
Un'azione genera la lista delle 14 cene secondo
[l'algoritmo](03-algoritmo-generazione.md). Il ciclo **parte dal momento della
generazione**, non è ancorato a un giorno fisso del calendario: tipicamente la lista
viene generata quando si è già al supermercato.

Si genera **una lista unica** per le due settimane.

Se la lista precedente ha voci **non spuntate**, l'app **chiede se portarle nella
nuova lista**. È così che i prodotti aggiunti a mano tra una spesa e l'altra
arrivano alla spesa successiva.

Non è previsto **rigenerare** la lista corrente: per rifarla si genera una lista
nuova, archiviando la precedente.

## F2 — Spunta
Ogni voce si segna come **comprata** con un tap.

- L'articolo comprato **sparisce dalla lista attiva**.
- Ogni tipo di frutta e verdura è una **voce a sé** e si spunta da solo.
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

## F6 — Alternative
Ogni voce generata ha una **dropdown** con le altre tipologie della sua categoria,
per sostituirla se la proposta non va bene.

Frutta e verdura compaiono in **elenco diretto**, una voce per tipo (es. *Carote,
Indivia, Zucca, Cavolfiore, Fichi, More, Prugne*): la dropdown di ogni tipo propone
gli altri prodotti dello stesso gruppo, divisa in **due sezioni**: prima quelli **di
stagione** nel mese, poi quelli **fuori stagione**. Si possono scegliere tutti, ma si
vede sempre quali alternative è meglio preferire.

La dropdown è **l'unico modo di modificare una voce generata**: i nomi degli alimenti
vengono dal catalogo e non si rinominano. Si apre **toccando il nome** della voce
nella lista, oltre che dal popup.

## F6b — Rinomina ed eliminazione

| Tipo di voce | Si può rinominare | Si può cambiare reparto | Si può eliminare |
|---|---|---|---|
| Generata (dal catalogo) | ❌ — si sostituisce con la dropdown (F6) | ❌ | ✅ |
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

## F11 — Archivio
Alla generazione di una nuova lista, la precedente viene **archiviata** (non
sovrascritta), dopo aver chiesto se portare avanti le voci non spuntate.
L'interesse principale resta la lista corrente; le statistiche sullo storico sono da
valutare.

## F11b — Frutta e verdura di stagione
Due pagine del menu laterale, **Frutta** e **Verdura**, che mostrano cosa è di
stagione, dalla tabella di stagionalità. Parte dalla **stagione corrente** e permette di cambiare **stagione**
o di restringere a un **mese**. In sola consultazione.
