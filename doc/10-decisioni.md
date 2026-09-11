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
| 2026-09-09 | Stack delegato allo sviluppo → **React + TypeScript + Vite + Tailwind** | deciso |
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
| 2026-09-09 | Persistenza: **SQLite in sviluppo**, **Supabase in produzione** | deciso |
| 2026-09-09 | Sessione conservata nei **cookie**: passphrase non richiesta ogni volta | deciso |
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
| 2026-09-09 | Sviluppo solo su PC con **SQLite via `sql.js` (WASM) nel browser**, persistito su IndexedDB | deciso |
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
