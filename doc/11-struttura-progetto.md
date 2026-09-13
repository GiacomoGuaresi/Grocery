# 11 — Struttura del progetto

```
Grocery/
├── doc/                 documentazione (questi file)
│   └── immagini/        gli screenshot del README
├── Q&A.md               domande aperte in corso
├── .github/workflows/
│   └── pubblica.yml     test, build e deploy su GitHub Pages a ogni push su main
├── .env.example         variabili d'ambiente: URL, chiave ed email di Supabase
├── supabase/            progetto Supabase (CLI)
│   ├── config.toml      config del Supabase locale: registrazione pubblica spenta
│   └── migrations/      schema, funzioni e policy del database
├── index.html           entry point di Vite
├── public/              icona.svg e le icone PWA generate da lì (npm run icone)
├── pwa-assets.config.ts come generare le icone: tagli e sfondo terracotta
├── package.json         React + TypeScript + Vite + Vitest
├── vite.config.ts       base: '/Grocery/' per GitHub Pages + PWA + config Vitest
├── tsconfig.json
└── src/
    ├── main.tsx         monta React su #root
    ├── vite-env.d.ts    tipi di Vite e delle variabili d'ambiente
    ├── data/            configurazioni statiche in JSON (vedi 05)
    ├── domain/          modello dati, dati statici tipizzati, algoritmo di generazione
    ├── storage/         interfaccia di persistenza, su Supabase
    │   ├── tipi.ts      l'interfaccia `Storage`
    │   ├── supabase.ts  implementazione su Supabase
    │   ├── accesso.ts   l'interfaccia `Accesso`: passphrase e sessione
    │   ├── sincronizzatore.ts  la lista in pari tra schermo, dispositivo e database
    │   ├── memoriaLocale.ts    lista e coda delle scritture sul dispositivo
    │   ├── inMemoria.ts        database finto in memoria, per i test
    │   ├── contratto.ts i test dell'interfaccia
    │   └── index.ts     apertura del client, una volta sola
    └── ui/              componenti e schermate
        ├── tema.css     palette pastello, tipografia, misure dei tocchi
        ├── ConAccesso.tsx     il cancello: passphrase finché non c'è una sessione
        ├── Accesso.tsx        la schermata col solo campo passphrase
        ├── App.tsx      layout: header fisso col bottone del menu, contenuto
        ├── MenuLaterale.tsx   menu a scomparsa con sezioni e azioni
        ├── useLista.ts  la lista corrente, letta e salvata sullo storage
        ├── ListaSpesa.tsx     schermata principale: lista attiva + già presi
        ├── GruppoReparto.tsx  un reparto col suo titolo e le sue voci
        ├── GiaPresi.tsx       sezione ripiegata in fondo, per riportare in lista
        ├── AggiungiVoce.tsx   aggiunta rapida con autocompletamento
        ├── GeneraLista.tsx    l'azione "Genera lista" e la sua conferma
        ├── PianoSettimanale.tsx  la tabella delle cene, in consultazione
        ├── DiStagione.tsx     frutta o verdura di stagione, per mese
        ├── Voce.tsx           una voce: contatore o checkbox, nome, ⋯
        ├── Contatore.tsx      `[−] presi/totale [+]` delle voci generate
        ├── ConsigliVoce.tsx   il popup dei consigli, col contatore in cima
        ├── AzioniVoce.tsx     il popup con le azioni di una voce
        ├── Installa.tsx       l'invito a installare la PWA
        └── Icona.tsx          le icone SVG dell'app, al posto delle emoji
```

## `src/data` — dati statici

| File | Contenuto | Voci |
|---|---|---|
| `reparti.json` | Gli 8 reparti nell'ordine del percorso in corsia | 8 |
| `routine.json` | Categoria proteica per giorno + pasti al giorno di verdura e frutta | 7 giorni |
| `catalogo.json` | Per categoria: etichetta, reparto e consigli brevi | 8 categorie |
| `stagionalita.json` | Verdura e frutta per mese, Nord Italia | 44 + 27 |
| `prodotti.json` | Mappa `prodotto → reparto` per l'autocompletamento | 83 |

Ogni file porta un campo `$commento` che ne spiega lo scopo, così resta leggibile
anche aprendolo da solo.

### Note sui dati
- Non c'è un reparto dei surgelati: ogni surgelato sta nel reparto del prodotto.
  In `catalogo.json` tutto il **pesce**, fresco o surgelato, è in `pescheria`.
- In `stagionalita.json` i mesi sono numeri (1 = gennaio) e gli intervalli possono
  attraversare dicembre (es. le arance sono `[12,1,2,3,4]`).
- Ogni mese ha verdura e frutta di stagione, che il popup dei consigli mostra.

## `src/domain`
`tipi.ts` contiene il modello dati di [06](06-modello-dati.md): `Lista` e `Voce`.
Una voce generata sta per una categoria intera e porta `quantita` (i pasti da
coprire) e `presi`; le manuali, e le generate rimaste dalla v1, ne sono senza e si
spuntano.

`dati.ts` è l'unico punto in cui i JSON di `src/data` vengono importati: li tipizza e
li espone come `reparti`, `categorie`, `giorniRoutine`, `gruppiFissi`,
`stagionalita`, `prodotti`, più le funzioni `reparto()`, `categoria()`,
`ordineReparto()`, `diStagione(gruppo, mese)` ed `eGruppoFisso()`. Il resto del
codice passa da qui e non tocca mai la forma grezza dei file.

`dati.test.ts` verifica la coerenza dei dati statici: i reparti citati dal catalogo,
dai prodotti e dai gruppi fissi esistono in `reparti.json`, le categorie della
routine esistono nel catalogo, la routine copre i sette giorni, i nomi dentro una
categoria non si ripetono, ogni mese ha almeno 4 verdure e 4 frutti di stagione e la
stagionalità usa solo mesi da 1 a 12.

`lista.ts` lavora sulla lista corrente: `raggruppaPerReparto(voci)` divide le voci per
reparto nell'ordine del percorso in corsia scartando i reparti vuoti, `vociAttive(lista)`
tiene solo quelle non ancora comprate e `vociComprate(lista)` solo quelle già prese.
`listaEsempio.ts` è una lista di settembre nella forma della v1, con una voce per
tipologia e senza contatori: resta come banco di prova dei test di aggiunta, spunta,
modifica e del contratto di Storage, che non guardano i contatori.

`lista.test.ts` verifica l'ordine dei reparti, l'esclusione di quelli vuoti, l'ordine
delle voci dentro un reparto e la coerenza della lista di esempio (id unici, reparti
esistenti, 4 tipi di verdura e 4 di frutta di stagione, una voce ciascuno).

`spunta.ts` raccoglie le transizioni di stato della spunta, tutte pure: ogni funzione
restituisce una lista nuova e lascia intatta quella di partenza. `spuntaVoce()` e
`despuntaVoce()` spostano una voce tra lista attiva e "Già presi". Valgono per le
voci manuali e per le generate rimaste dalla v1.

`contatore.ts` fa lo stesso per le voci generate: `aumenta()`, `diminuisci()` e
`impostaPresi()` tengono `presi` tra 0 e il totale; a totale la voce è comprata e va
tra i "Già presi", sotto torna in lista.

`consigli.ts` prepara il popup di frutta e verdura: i tipi di stagione nel mese,
con *tutto l'anno* e *in uscita*, e quelli fuori stagione, con *in arrivo*, anche a
cavallo d'anno. Per carni, pesce, formaggio e affettati i consigli sono l'elenco
breve di `catalogo.json`.

`spunta.test.ts` copre le transizioni: la voce che sparisce dalla lista attiva,
l'immutabilità della lista di partenza, l'idempotenza, il tipo di verdura che si
spunta senza toccare gli altri, e l'invariante per cui attive e già presi coprono
sempre tutte le voci senza doppioni.

`aggiunta.ts` regge l'inserimento manuale: `normalizza()` mette i nomi in una forma
confrontabile (minuscolo, senza accenti né spazi di troppo), `suggerimenti()` propone
i prodotti del catalogo mentre si scrive e `aggiungiVoce()` crea la voce, col reparto
del prodotto riconosciuto o in "Altro". `modifica.ts` tiene eliminazione e rinomina:
solo le voci manuali in "Altro" si rinominano, e il reparto non cambia mai.

`generazione.ts` è l'algoritmo di [03](03-algoritmo-generazione.md), deterministico
e senza rete: `pastiPerCiclo()` conta dalla routine i pasti di due settimane per
categoria (pesce 4, verdura 14, frutta 28…) e `generaLista()` fa una voce per
categoria, nell'ordine del catalogo, con `presi` a zero. Nello stesso file c'è il
passaggio al ciclo dopo: `vociDaRiportare()` dice quali voci manuali sono rimaste da
prendere e `nuovoCiclo()` le mette in fondo alla lista nuova, se lo si è chiesto
(R5). Le generate non si riportano mai. La lista di prima non si archivia: salvando
la nuova si cancella (R6).

`stagioni.ts` regge le pagine di frutta e verdura di stagione: le quattro `stagioni`
meteorologiche (tre mesi interi, come la granularità della tabella), `meseDi()` e
`stagioneDi()` per partire da quella corrente, e `diStagioneNelPeriodo(gruppo, mesi)`
che dà i tipi del gruppo presenti in almeno uno dei mesi, in ordine alfabetico, con a
parte quelli che ci sono tutto l'anno. `stagioni.test.ts` verifica che le stagioni
coprano i dodici mesi una volta sola, che i gruppi non si mescolino e che nessun tipo
si perda o si duplichi.

`sincronia.ts` tiene la lista condivisa tra i due dispositivi (F7, Step 15), tutto
in funzioni pure. `differenze(prima, dopo)` dice quali voci una modifica ha toccato
e quali ha tolto: le transizioni del dominio lasciano intatti gli oggetti delle voci
che non toccano, quindi basta confrontare i riferimenti. `applicaModifiche()` le
riapplica a una lista (le toccate al loro posto, le nuove in fondo), come fa
`salva_voci` sul database. `unisci()` mette insieme la lista riletta dal database con
quella a schermo: per le voci con una scrittura ancora in volo vale la versione
locale, per tutte le altre quella riletta; se nel frattempo è nata una lista nuova
vale quella. Una `Scrittura` è una modifica in coda verso il database, con la
lista a cui va e l'ora in cui è stata fatta; `vociInAttesa()` dice quali voci
hanno ancora una scrittura in coda, ed è quello che `unisci()` protegge.
`sincronia.test.ts` copre queste funzioni, compresi i due casi del
*last-write-wins* per singola voce: spunte su voci diverse che si sommano e, sulla
stessa voce, l'ultima che vince.

## `src/storage`
Tutto lo stato passa dall'interfaccia `Storage` di `tipi.ts`:
`leggiListaCorrente()`, `salvaLista()`, `salvaVoci()` e `quandoCambia()`.
`salvaLista()` scrive la lista per intero, cancella le altre e serve alla
generazione; `salvaVoci()`
scrive solo le voci toccate da una modifica e serve a tutto il resto, così le
modifiche dei due dispositivi si sommano invece di sovrascriversi; scrive solo sulla
lista corrente. `quandoCambia(avvisa)` avvisa quando la lista può essere cambiata
altrove. Il
resto dell'app conosce solo questa, e non sa cosa c'è sotto.

`supabase.ts` la implementa su Supabase (Step 13), in sviluppo come in produzione:
fino al 2026-09-11 in sviluppo c'era SQLite nel browser, poi tolto. Lo schema sta
in `supabase/migrations`: le tabelle di [06](06-modello-dati.md) `liste` e `voci`,
con date `timestamptz`, `comprata` booleano e, per le voci generate, `quantita` e
`presi` col vincolo `0 ≤ presi ≤ quantita` (migrazione `20260912000000_v2.sql`, che
ha tolto `rotazioni`, la vista `archivio`, `alternative` e lo `stato` della lista).
Le voci portano una `posizione`, così l'ordine della lista è quello con cui è stata
salvata. Un indice unico garantisce che la lista sia una sola. Il client
di Supabase non apre transazioni, quindi le scritture composte sono funzioni
Postgres chiamate via RPC: `salva_lista` aggiorna le voci sul posto, cancella solo
quelle sparite e le altre liste, `salva_voci` scrive solo le voci toccate (le nuove
in fondo, le altre al loro posto). Le date tornano da
Postgres come `+00:00` e si rimettono nella forma di `toISOString()`.

Il realtime (Step 15, migrazione `20260911100000_realtime.sql`) ascolta solo la
tabella `liste`, che fa da campanello: `salva_voci` e `salva_lista` ne aggiornano
la colonna `aggiornata_il`, il client riceve l'UPDATE (o l'INSERT di una lista nuova)
e rilegge. Le voci non sono nella pubblicazione: le cancellazioni Postgres le manda a
chiunque sia in ascolto senza guardare le policy, e dal canale non deve passare
niente del contenuto della lista. Il realtime non ripete gli eventi persi, quindi
`quandoCambia` avvisa anche a ogni (ri)connessione del canale e quando l'app torna in
primo piano: il telefono in tasca chiude il socket senza dirlo. `salva_voci` prende
il lock sulla riga della lista, e questo mette in fila le scritture concorrenti.
Non scrive su una lista che non c'è più: la scrittura di un dispositivo rimasto
indietro non fa niente e non blocca la coda.

Con l'offline (Step 16, migrazione `20260911200000_offline.sql`) `salvaVoci` riceve
anche `quando`, l'ora della modifica sul dispositivo. `salva_voci` la scrive nella
colonna `modificata_il` della voce e non tocca una voce già scritta da una modifica
più recente (quelle scritte da `salva_lista` ne sono senza, e perdono contro
qualunque modifica). Le voci eliminate lasciano il loro id nella tabella
`voci_eliminate`, e da lì nessuna scrittura le ricrea. Una richiesta rimasta senza
risposta — PostgREST la restituisce con stato 0 — diventa `ErroreRete`, l'errore di
`tipi.ts` che dice "riprova quando torna la rete"; se il browser sa già di essere
offline non si prova nemmeno, perché le letture ritenterebbero per qualche secondo.
`quandoCambia` avvisa anche quando torna la rete (evento `online`).

`sincronizzatore.ts` tiene la lista corrente in pari tra schermo, dispositivo e
database, senza React così si prova nei test. All'apertura mostra subito la lista
rimasta sul dispositivo, poi si mette in ascolto e rilegge. Ogni modifica va a
schermo, in `memoriaLocale.ts` (`localStorage`: l'ultima lista e la coda delle
scritture) e poi in coda verso il database; senza rete la coda aspetta e parte al
primo avviso dello storage. Una scrittura che il database rifiuta per altri motivi
si scarta, per non bloccare le altre. Tutto quello che parla col database passa da
una sola fila, così le scritture arrivano in ordine e una rilettura parte dopo le
scritture già avviate. L'istantanea che pubblica dice anche quante modifiche sono in
coda e se l'ultimo tentativo è fallito per la rete. Genera lista passa da qui con
`nuovoCiclo()` e funziona anche offline: la lista nuova va a schermo e un segno in
memoria locale (`grocery.generata`) la salva per intera al ritorno della rete, prima
della coda.

`inMemoria.ts` è un database finto con le stesse regole delle funzioni di Supabase,
e `Collegamento` ci attacca un dispositivo con la sua rete da staccare a comando.
`inMemoria.test.ts` gli fa passare il contratto di Storage, così è sicuro che si
comporti come quello vero; `sincronizzatore.test.ts` ci prova il ciclo offline →
online con più dispositivi: le modifiche che restano a schermo e sopravvivono alla
chiusura, la coda che parte al ritorno della rete, la spunta vecchia che non vince
su una più nuova, la voce eliminata che non torna, la lista generata altrove.

Le policy (RLS) aprono le tabelle alla sola sessione autenticata, senza
filtri per utente perché l'account è uno solo; al ruolo `anon` sono tolti anche i
permessi su tabelle, vista e funzioni. In `supabase/config.toml` la registrazione
pubblica è spenta.

`index.ts` apre il client una volta sola, con `npm run dev` come nella build: i due
ambienti usano due progetti Supabase con lo stesso schema (vedi 07). URL e chiave
publishable del progetto arrivano da `VITE_SUPABASE_URL` e
`VITE_SUPABASE_PUBLISHABLE_KEY` (vedi `.env.example`, da copiare in `.env.local`).

L'accesso (F8, Step 14) segue lo stesso schema: l'interfaccia `Accesso` di
`accesso.ts` — `haSessione()`, `entra(passphrase)`, `quandoEsce()` — implementata
da `AccessoSupabase`, che fa della passphrase la password
dell'unico account, la cui email arriva da `VITE_SUPABASE_EMAIL`: chi entra scrive
solo la passphrase. Storage e accesso condividono un solo client, creato con
`createBrowserClient` di `@supabase/ssr`, che tiene la sessione nei **cookie**
(400 giorni, con percorso `/`, condivisi con Projects; i vecchi cookie sul percorso
`/Grocery/` si cancellano all'avvio). Se il rinnovo del token fallisce per
mancanza di rete la sessione resta valida: in corsia non si chiede la passphrase a
chi è già entrato. `accesso.test.ts` verifica tutto questo su un client finto.

I test dell'interfaccia stanno in `contratto.ts`: la lista riletta identica a quella salvata, l'ordine delle voci
(anche dopo un riordino), i campi opzionali che restano assenti, il salvataggio
che aggiorna invece di duplicare, le voci tolte che spariscono, la lista nuova che
cancella la vecchia. Per `salvaVoci`: le voci non toccate
che restano come sono, le spunte e i `presi` di due dispositivi su voci diverse che
si sommano, la modifica più recente che vince sulla stessa voce anche quando arriva
prima di una più vecchia, la voce eliminata che non torna, le nuove in fondo, la
lista sparita che non si tocca.

`realtime.test.ts` prova `quandoCambia` e `salvaVoci` di Supabase su un client
finto, come `accesso.test.ts`, quindi gira sempre: si ascolta la sola tabella
`liste`, si avvisa a ogni cambio e a ogni connessione, ogni ascolto ha il suo canale
e smettendo il canale si chiude; `salvaVoci` manda l'ora della modifica, una
richiesta senza risposta diventa `ErroreRete` e un rifiuto del database resta com'è.

`supabase.test.ts` li esegue contro un Supabase vero e
verifica le policy: senza sessione non si legge e non si scrive niente, e una spunta
avvisa via realtime chi ascolta con la sessione ma non chi è senza. Svuota le
tabelle a ogni test, quindi va puntato solo sul Supabase locale: gira se trova
`SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` e `SUPABASE_TEST_SECRET_KEY`
(i valori li stampa `supabase status`), altrimenti si salta.

## `src/ui`
Davanti a tutto c'è `ConAccesso`, montato in `main.tsx` attorno ad `App`: finché
non c'è una sessione mostra `Accesso`, la schermata col solo campo passphrase
(doc/08, §1), poi l'app. Mentre legge i cookie non mostra niente, per non far
lampeggiare la passphrase a chi è già entrato; se la sessione finisce con l'app
aperta torna alla passphrase. Anche in sviluppo si entra con la passphrase.

Il tema sta tutto in `tema.css` come variabili CSS: colori pastello (crema, salvia,
zucca, pomodoro), raggi, spaziature e `--tocco`, l'altezza minima di ogni elemento
toccabile. Ogni componente ha il suo `.css` accanto, importato dal componente
stesso. Nessuna libreria di stili.

La lista corrente arriva dal `Sincronizzatore` (vedi `src/storage`): `useLista.ts`
lo apre, ne ascolta le istantanee e lo chiude. Si vede "Apro la lista…" solo alla
prima apertura su un dispositivo; da lì in poi la lista è a schermo subito, quella
rimasta sul dispositivo, e si aggiorna appena arriva quella del database. Quando il
database non ha ancora una lista corrente gli si salva una lista vuota, che da lì in
poi è la lista corrente vera. Ogni modifica va prima a schermo (l'interfaccia
risponde subito) e poi in coda verso il database, con `salvaVoci` e le sole voci
toccate, così i tocchi rapidi arrivano nell'ordine in cui sono stati fatti.

Quando lo storage avvisa che la lista è cambiata altrove, il `Sincronizzatore`
aspetta un attimo (una generazione arriva come una raffica di avvisi), manda
quello che è rimasto in coda e rilegge. Per le voci con una scrittura ancora in
coda tiene la versione di qui (vedi `unisci()`). Anche l'eco delle proprie scritture
arriva come avviso, e rileggere la propria spunta non la fa tremare. Senza rete, in
cima alla lista, una riga discreta lo dice e conta le modifiche che aspettano.

La lista è una sequenza di reparti: titolo del reparto in maiuscoletto e sotto le sue
voci, righe compatte alte almeno `--riga` e attaccate in un unico blocco. Verdura e
frutta sono due voci, in Ortofrutta; i tipi stanno solo nel popup dei consigli.

Una voce generata ha di lato al nome il `Contatore` `[−] presi/totale [+]`, col
numero scrivibile: a totale va tra i "Già presi". Il tap sul nome apre
`ConsigliVoce`, un popup dal fondo col contatore fisso in cima e sotto i consigli
(per verdura e frutta *Di stagione* aperta e *Fuori stagione* chiusa); le uova non
hanno popup. Le voci manuali, e le generate rimaste dalla v1, hanno la checkbox:
toccarla le segna comprate; il tap sul testo nelle manuali in "Altro" rende il nome
modificabile. Il ⋯ apre `AzioniVoce` con *Elimina* (e *Rinomina* in "Altro").
In fondo alla lista sta la sezione ripiegata "Già presi", col conteggio di quello
che è nel carrello: lì si de-spunta, o col − si riporta in lista una voce col
contatore. Non è raggruppata per reparto, quel percorso ormai è alle spalle.

Il menu laterale a scomparsa, aperto dal bottone ☰ dell'intestazione, tiene le
sezioni *Lista*, *Piano*, *Frutta* e *Verdura* e, sotto, l'azione
*Genera lista*. Per questo
`useLista` sta in `App.tsx` e non dentro la schermata della lista: la conferma della
generazione ha bisogno della lista corrente anche quando si è altrove.

`DiStagione.tsx` è la pagina della frutta o della verdura di stagione, a seconda
del `gruppo` che riceve: una barra a segmenti per le quattro stagioni, aperta su
quella corrente, le pastiglie dei suoi mesi per restringere il periodo, e un blocco
di righe con la striscia dei dodici mesi di ogni tipo, col bordo attorno ai mesi del
periodo; in testa le iniziali dei mesi, evidenziata quella di adesso. La scelta non
si salva: riaprendo la pagina si riparte dalla stagione di adesso.

Il layout occupa sempre tutta la finestra, senza bordi ai lati: l'intestazione va da
bordo a bordo, il contenuto è centrato e largo al massimo 720px (`--colonna`).
