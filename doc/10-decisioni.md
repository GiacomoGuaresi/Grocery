# 10 — Decisioni

| Data | Decisione | Esito |
|---|---|---|
| 2026-09-09 | Hosting su GitHub Pages, frontend statico | deciso |
| 2026-09-09 | Ciclo di riferimento: 2 settimane | deciso |
| 2026-09-09 | **Niente IA** nel progetto | deciso |
| 2026-09-09 | L'app gestisce **solo la cena**: colazione, spuntini e pranzo esclusi | deciso |
| 2026-09-09 | Il **pane** è comprato a parte e congelato: fuori dalla lista | deciso |
| 2026-09-09 | Contorni: solo verdura, al massimo patate. **Mai legumi** | deciso |
| 2026-09-09 | Nessun vincolo alimentare (allergie/intolleranze) | deciso |
| 2026-09-09 | ~~Rotazione **deterministica**, con memoria persistita tra i cicli~~ | superata |
| 2026-09-09 | Tipologie scelte **a caso**, non a giro fisso sul catalogo: a rotazione ciclica capitava sempre lo **stesso animale con tagli diversi** | deciso |
| 2026-09-09 | La memoria tra i cicli diventa l'elenco delle **tipologie dell'ultimo ciclo**, escluse dalla pesca successiva | deciso |
| 2026-09-09 | Sostituzione delle proposte tramite **dropdown di alternative**, non "rigenera" | deciso |
| 2026-09-09 | **Nessuna quantità né grammatura** mostrata; possibile sviluppo futuro | deciso |
| 2026-09-09 | Nessuna lista di prodotti base ricorrenti, nessun prodotto manuale ricorrente | deciso |
| 2026-09-09 | Ciclo **non ancorato al calendario**: parte dalla generazione | deciso |
| 2026-09-09 | Lista **unica** per le due settimane, con tipologie diverse tra le due settimane | deciso |
| 2026-09-09 | Freschi: si presume che vengano **congelati**; nessuno split prima/seconda settimana | deciso |
| 2026-09-09 | Liste passate **archiviate**, non sovrascritte | deciso |
| 2026-09-09 | Lista raggruppata per **reparto** del supermercato | deciso |
| 2026-09-09 | Voci spuntate **spariscono**, ma restano visualizzabili e de-spuntabili | deciso |
| 2026-09-09 | Niente "non trovato / esaurito" | deciso |
| 2026-09-09 | Sincronizzazione **in tempo reale** tra i dispositivi | deciso |
| 2026-09-09 | **Un solo account condiviso**, accesso con **passphrase** | deciso |
| 2026-09-09 | Nessuna registrazione pubblica; niente tracciamento di chi fa cosa | deciso |
| 2026-09-09 | Configurazioni statiche in **JSON versionati nel repo**, aggiornabili con un commit | deciso |
| 2026-09-09 | DB: servizio gratuito per pochi dati non sensibili → **Supabase** | deciso |
| 2026-09-09 | ~~Stack delegato allo sviluppo → **React + TypeScript + Vite + Tailwind**~~ | superata |
| 2026-09-11 | Stack reale: **React + TypeScript + Vite**, stili in **CSS a mano** accanto ai componenti. Niente Tailwind né Testing Library: i test coprono dominio e storage | deciso |
| 2026-09-09 | **PWA installabile**, offline in lettura **e scrittura** con sync postuma | deciso |
| 2026-09-09 | **Test automatici** richiesti | deciso |
| 2026-09-09 | UI: solo **italiano**, solo **tema chiaro**, colori pastello a tema culinario | deciso |
| 2026-09-09 | Regole e routine **non editabili da UI**: stanno nei JSON | deciso |
| 2026-09-09 | Stagionalità: tabella **statica nel repo**, Nord Italia, granularità mensile | deciso |
| 2026-09-09 | Vista **piano settimanale** con giorno corrente evidenziato | deciso |
| 2026-09-09 | Progetto senza scadenze; README sobrio ma presente | deciso |
| 2026-09-09 | **Modalità demo** per il portfolio | rimandata |
| 2026-09-09 | **Gestione pasti saltati** (cene fuori) | rimandata |
| 2026-09-09 | Statistiche sullo storico | da valutare |
| 2026-09-09 | Cataloghi di rotazione ampliati il più possibile; ordine indifferente | deciso |
| 2026-09-09 | **La frutta rientra** nella lista: 2 porzioni/giorno, **4 tipi** di stagione per ciclo | deciso |
| 2026-09-09 | Contorni: **4 verdure diverse per ciclo**, che si ripetono lungo le due settimane | deciso |
| 2026-09-09 | **Patate** in rotazione come le altre verdure | deciso |
| 2026-09-09 | Stagionalità: elencare tutta la verdura e la frutta, nessun filtro sui gusti | deciso |
| 2026-09-09 | Prodotti manuali nuovi → sempre in **"Altro"**, nessuna scelta del reparto | deciso |
| 2026-09-09 | Il catalogo **non impara**: si estende solo con un commit al JSON | deciso |
| 2026-09-09 | Voci **modificabili ed eliminabili**; nessun campo note | deciso |
| 2026-09-09 | Alla generazione l'app **chiede** se portare avanti le voci non spuntate | deciso |
| 2026-09-09 | Nessuna lista "prossima spesa" separata | deciso |
| 2026-09-09 | Nessuna **rigenerazione** della lista corrente | deciso |
| 2026-09-09 | Ordine dei reparti confermato e fissato nel JSON | deciso |
| 2026-09-09 | ~~Persistenza: **SQLite in sviluppo**, **Supabase in produzione**~~ | superata |
| 2026-09-11 | ~~**Solo Supabase**, in sviluppo e in produzione, sullo stesso progetto: SQLite tolto. Accettati i dati di prova mescolati a quelli veri e i rischi che ne vengono~~ | superata |
| 2026-09-12 | Solo Supabase, ma lo sviluppo su un **progetto separato** (*Grocery DEV*) con lo stesso schema e lo stesso account: lo sviluppo non sporca la produzione | deciso |
| 2026-09-09 | Sessione conservata nei **cookie**: passphrase non richiesta ogni volta | deciso |
| 2026-09-11 | Sessione **solo nei cookie** (400 giorni, rinnovati a ogni uso), nessuna copia in `localStorage`: nessuno usa Safari su iPhone, dove i cookie scritti da JavaScript durano al massimo 7 giorni. Da rivedere se entra un iPhone | deciso |
| 2026-09-09 | Nome del repository: **`Grocery`** (mantenuto per ora) | deciso |
| 2026-09-09 | Frutta e verdura comprate **tutte insieme**, nessuna divisione prima/seconda settimana | deciso |
| 2026-09-09 | ~~Frutta e verdura come **una voce raggruppata ciascuna**, con dropdown sui singoli tipi~~ | superata |
| 2026-09-11 | Frutta e verdura in **elenco diretto**: una voce per ogni tipo, niente voce raggruppata | deciso |
| 2026-09-09 | ~~Formaggi e affettati **preconfezionati** → reparto "Salumi e formaggi", non banco gastronomia~~ | superata |
| 2026-09-11 | **Formaggi coi latticini**: reparto "Latticini, formaggi e uova"; gli affettati restano da soli in "Salumi". Sempre preconfezionati, non banco gastronomia | deciso |
| 2026-09-09 | ~~Pesce sia **fresco sia surgelato**: il reparto è per singola voce di catalogo~~ | superata |
| 2026-09-11 | **Niente reparto Surgelati**: ogni surgelato sta nel reparto del prodotto (il pesce surgelato in pescheria) | deciso |
| 2026-09-09 | `prodotti.json` parte da un **elenco ridotto** di prodotti base, espanso nel tempo | deciso |
| 2026-09-09 | L'app online userà **Supabase da subito**, ma non viene pubblicata ora | deciso |
| 2026-09-09 | ~~Sviluppo solo su PC con **SQLite via `sql.js` (WASM) nel browser**, persistito su IndexedDB~~ | superata |
| 2026-09-09 | ~~Spunta dei **singoli tipi** dentro le voci raggruppate Frutta e Verdura~~ | superata |
| 2026-09-09 | Le voci generate **non si rinominano**: sono dati statici, si sostituiscono con la dropdown | deciso |
| 2026-09-09 | Solo le voci manuali in "Altro" si rinominano; il reparto non è mai modificabile | deciso |
| 2026-09-11 | Si spunta **solo dalla checkbox**; in "Altro" il tap sul testo rinomina la voce nella riga | deciso |
| 2026-09-11 | **Icone SVG** a tratto al posto delle emoji, disegnate in casa (stile Lucide) senza librerie | deciso |
| 2026-09-11 | Dropdown di frutta e verdura in **due sezioni**: prima i tipi di stagione, poi quelli fuori stagione (sceglibili anche loro) | deciso |
| 2026-09-09 | Piano settimanale: mostra la **categoria**, non la tipologia del giorno | deciso |
| 2026-09-09 | **Uova**: voce fissa senza quantità | deciso |
| 2026-09-11 | Le voci **non si ripetono mai**: uova una voce sola; aggiungere a mano una voce già da prendere avvisa, una già presa torna da prendere | deciso |
| 2026-09-09 | Si passa allo **sviluppo**: struttura del progetto e dati JSON | deciso |
| 2026-09-11 | ~~*Last-write-wins* per voce: ogni modifica scrive **solo le voci toccate**; l'"ultima" è l'ultima arrivata al database. Da rivedere con l'offline (Step 16)~~ | superata |
| 2026-09-11 | Realtime come **campanello** sulla tabella `liste`: arriva l'avviso e la lista si rilegge. Le voci restano fuori dal canale, perché le cancellazioni viaggiano senza policy | deciso |
| 2026-09-11 | *Last-write-wins* per voce sull'**ora della modifica** (orologio del dispositivo), non sull'ordine di arrivo: una coda offline svuotata tardi non copre modifiche più nuove | deciso |
| 2026-09-11 | Una voce **eliminata non torna**, qualunque sia l'ora della modifica che arriva dopo | deciso |
| 2026-09-11 | Lista e coda delle scritture offline in **`localStorage`**, non IndexedDB: sono piccole e con una lettura sincrona la lista è a schermo subito | deciso |
| 2026-09-11 | Una scrittura **rifiutata dal database** (non per la rete) si scarta: riprovarla darebbe lo stesso errore e bloccherebbe la coda | deciso |
| 2026-09-11 | La **generazione vuole la rete**; spunte, aggiunte, eliminazioni e sostituzioni no | deciso |
| 2026-09-11 | Icona dell'app: il **cesto** delle icone, panna su terracotta | deciso |
| 2026-09-11 | Configurazione di Supabase per la build nelle **variabili** del repository GitHub, non nei segreti: URL, chiave publishable ed email finiscono comunque nel bundle pubblico | deciso |
| 2026-09-11 | Il sito va online **solo con le registrazioni pubbliche spente** sul progetto Supabase | deciso |
| 2026-09-12 | **v2 — lista per categorie**: la pesca di tipologie (casuale o in sequenza) non funziona nell'uso vero. Una voce per categoria con moltiplicatore di pasti | deciso |
| 2026-09-12 | Categorie invariate: carne rossa, carne bianca, pesce, formaggio, uova, affettati, verdura, frutta | deciso |
| 2026-09-12 | Moltiplicatore **ricavato dalla routine**, ciclo sempre di **2 settimane** | deciso |
| 2026-09-12 | Il moltiplicatore conta i **pasti**, non pezzi o confezioni; accanto al numero l'unità in piccolo ("cene", "porzioni") | deciso |
| 2026-09-12 | Moltiplicatore **fisso**, un suggerimento: non si modifica dalla lista, ma si **scala** durante la spesa | deciso |
| 2026-09-12 | Frutta **×28** (2 porzioni al giorno), verdura **×14** | deciso |
| 2026-09-12 | Voce riportata della stessa categoria di una generata: **separata**, non sommata | deciso |
| 2026-09-12 | Nessun moltiplicatore sulle **voci manuali** | deciso |
| 2026-09-12 | **Rotazioni e pesca casuale tolte del tutto**, tabella e funzioni sul database comprese. Superano le decisioni su scelta casuale e memoria tra i cicli | deciso |
| 2026-09-12 | **Archivio tolto**: pagina e dati. Alla generazione la lista precedente si cancella | deciso |
| 2026-09-12 | La lista corrente al passaggio alla v2 **resta com'è**: la pulisce l'utente | deciso |
| 2026-09-12 | **Dropdown delle alternative tolta**: al suo posto un **popup dei consigli in sola lettura** | deciso |
| 2026-09-12 | Verdura e frutta: **due voci**, con dentro l'elenco dei tipi di stagione. Superano l'elenco diretto del 2026-09-11 | deciso |
| 2026-09-12 | Reparti delle voci generiche: carni → macelleria, pesce → pescheria, formaggio e uova → latticini e uova, affettati → salumi, verdura e frutta → ortofrutta | deciso |
| 2026-09-12 | Pagine *Frutta* e *Verdura* di stagione **restano**; resta anche il **piano settimanale** | deciso |
| 2026-09-12 | Consigli di carne, pesce, formaggio e affettati: **elenco breve dei tagli/tipi**, con cavallo, agnello, baccalà, alici, sardine, sgombro, salmone affumicato, porchetta, pancetta, strolghino e gli stagionati da tavola | deciso |
| 2026-09-12 | Popup di verdura e frutta: di stagione + tutto l'anno → in arrivo e in uscita → fuori stagione | deciso |
| 2026-09-12 | La **generazione non vuole più la rete**: non legge nulla dal database. Supera la decisione del 2026-09-11 | deciso |
| 2026-09-12 | Nessun mockup: si parte direttamente col codice | deciso |
| 2026-09-12 | In corsia si contano i presi con un **contatore `[−] presi/totale [+]`**, numero scrivibile; al totale la voce è completa | deciso |
| 2026-09-12 | Il contatore va di **uno alla volta** anche per verdura ×14 e frutta ×28; da rivedere con l'uso | deciso |
| 2026-09-12 | Una voce generata **presa a metà non si riporta** nella lista nuova | deciso |
| 2026-09-12 | Unità **"pasti"** per tutte le voci generate, frutta compresa | deciso |
| 2026-09-12 | I tipi di verdura e frutta si vedono **solo nel popup**, che ha anche il contatore: si tiene aperto nel reparto mentre si prende tutto | deciso |
| 2026-09-12 | Popup di verdura e frutta: **liste collassabili** con chip *tutto l'anno*, *in uscita*, *in arrivo*. Supera l'ordine a tre gruppi deciso poco prima | deciso |
| 2026-09-12 | Consigli di carne, pesce, formaggio e affettati: per ora **solo l'animale o il tipo**, da personalizzare con l'uso | deciso |
| 2026-09-12 | `presi` in *last-write-wins* per voce: due **+** simultanei da due telefoni possono perdere un tocco. Accettato | deciso |
| 2026-09-12 | Il contatore **prende il posto della spunta** nelle voci generate; dai "Già presi" il − riporta la voce in lista a totale − 1 | deciso |
| 2026-09-12 | Alla generazione si riportano solo le **voci manuali** non spuntate; le generate mai, complete o no. Supera "voce riportata separata" | deciso |
| 2026-09-12 | Popup di verdura e frutta: **Di stagione** aperta (chip *tutto l'anno*, *in uscita*) e **Fuori stagione** chiusa (chip *in arrivo*) | deciso |
| 2026-09-12 | Al totale il popup **resta aperto**; la voce va tra i "Già presi" alla chiusura | deciso |
