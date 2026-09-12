# 07 — Architettura e stack

Lo stack è stato **scelto da chi sviluppa** (delega esplicita dell'autore),
privilegiando cose gratuite, semplici da mantenere e presentabili in un portfolio.

## Stack

| Ambito | Scelta | Perché |
|---|---|---|
| Linguaggio | **TypeScript** | Tipizza cataloghi e modello dati; buon segnale in portfolio |
| UI | **React** | Ecosistema ampio, ottimo supporto PWA, familiare a chi legge il codice |
| Build | **Vite** | Build statica veloce, deploy immediato su Pages |
| Stile | **CSS a mano**, un file accanto a ogni componente (`src/ui/*.css`), palette in `tema.css` | Pochi componenti, nessuna dipendenza in più |
| PWA | **vite-plugin-pwa** (Workbox) | Installabile e offline con poca configurazione |
| DB | **Supabase** (piano gratuito), in sviluppo e in produzione | Postgres gestito, realtime incluso, gratuito, poco codice |
| Test | **Vitest**, su dominio e storage (nessun test dei componenti) | Stessa toolchain di Vite |
| Hosting | **GitHub Pages** | Richiesto |
| CI/CD | **GitHub Actions** | Build e deploy su push del branch principale |

## Struttura

```
frontend statico (GitHub Pages)
  ├── dati di configurazione  → JSON nel repo (build-time)
  └── stato condiviso         → Supabase
```

### Un solo database
Lo stato passa da un'**interfaccia di storage** unica, implementata su
**Supabase**. Il codice applicativo non conosce l'implementazione: si programma
contro l'interfaccia.

Sviluppo e produzione usano **due progetti Supabase separati** (dal 2026-09-12),
con lo stesso schema:

| Ambiente | Progetto | Ref | Configurato in |
|---|---|---|---|
| Produzione (GitHub Pages) | *GiacomoGuaresi's Project Grocery* | `fvsohjlrulwabvfvcfxo` | variabili del repository GitHub |
| Sviluppo (`npm run dev`) | *Grocery DEV* (org *GiacomoGuaresi's DEV TEST*) | `hbfpqrdvazbosfwqmbvy` | `.env.local` |

Così i dati di prova non si mescolano a quelli veri. Il progetto di sviluppo ha lo
stesso account (stessa email e passphrase) e le registrazioni spente. Una
migrazione nuova va applicata a **tutti e due**: la CLI resta collegata alla
produzione, per il dev si collega, si fa `supabase db push` e si ricollega. Le
credenziali di entrambi stanno in `supabase/credenziali.local`.
Dal 2026-09-11 al 2026-09-12 sviluppo e produzione hanno condiviso lo stesso
progetto; prima ancora in sviluppo c'era SQLite nel browser (`sql.js`, su IndexedDB).

Nessun backend proprio. Nessuna funzione serverless: non servendo l'IA, non c'è
alcuna API key da nascondere. La chiave `anon` di Supabase è pubblica per
progettazione e viene protetta lato DB.

## Accesso
Passphrase condivisa, uguale per entrambi: un solo account, la passphrase fa da
password.

La sessione viene **conservata nei cookie**, così la passphrase non viene richiesta a
ogni apertura — requisito importante, visto che l'app si usa al volo in corsia.

Le policy del DB consentono lettura e scrittura **solo alla sessione autenticata**:
nessuna registrazione pubblica è abilitata.

## Offline e sincronizzazione
Requisito: funzionare **offline in lettura e in scrittura**, con sincronizzazione
successiva.

- **Shell dell'app** in cache (service worker di `vite-plugin-pwa`) → si apre senza
  rete. Il service worker non tocca le chiamate a Supabase.
- **Stato locale** persistito sul dispositivo in `localStorage` (l'ultima lista vista)
  e usato come sorgente per il rendering: la lista è sempre visibile, anche aprendo
  l'app senza rete. Solo la prima apertura su un dispositivo vuole la rete.
- **Scritture offline** (spunte, aggiunte, eliminazioni) applicate subito in locale e
  messe in coda, anche lei in `localStorage`; al ritorno della rete vengono inviate a
  Supabase, nell'ordine in cui sono state fatte (Step 16).
- **Realtime** quando c'è rete: le modifiche di un dispositivo compaiono sull'altro.
- **Conflitti**: lo scenario reale è due persone nello stesso supermercato che
  spuntano cose diverse. Si applica *last-write-wins* per singola voce, che è
  sufficiente e non richiede merge complessi. In pratica ogni modifica scrive solo
  le voci che ha toccato, e sulla stessa voce vince la **modifica più recente**:
  ogni scrittura porta l'ora in cui è stata fatta sul dispositivo, così una coda
  offline svuotata tardi non copre modifiche più nuove (Step 16). Si conta
  sull'orologio dei telefoni, che è sincronizzato dalla rete.
- **Eliminazioni**: una voce eliminata non torna, nemmeno per una modifica più
  recente rimasta in coda sull'altro dispositivo.
- **Generazione**: gira anche senza rete (v2). Non legge niente dal database: la
  lista nuova va subito a schermo e un segno in `localStorage` (`grocery.generata`)
  la salva per intera al ritorno della rete, prima della coda delle scritture.
- **Come arriva il realtime**: Supabase avvisa quando la riga della lista corrente
  cambia, e l'app rilegge la lista. Dal canale non passa il contenuto delle voci.

## Requisiti non funzionali
- **Mobile-first**, usabile con una mano in corsia.
- **Performance**: caricamento pressoché istantaneo, bundle minimo.
- **Privacy**: pochi dati, non sensibili, visibili solo ai due utenti.
- **Qualità**: test automatici richiesti, in particolare sull'algoritmo di
  generazione (totali dalla routine, riporto delle voci manuali, generazione offline).

## Deploy
Un solo ambiente: **produzione** su GitHub Pages, deploy automatico dal branch
principale. Il repository è **`Grocery`** (nome mantenuto per ora), pubblico su
`github.com/GiacomoGuaresi/Grocery`; il sito sarà su
`giacomoguaresi.github.io/Grocery/`.

Il workflow `.github/workflows/pubblica.yml` a ogni push su `main` fa girare i test
e la build e pubblica `dist` su Pages. URL, chiave publishable ed email
dell'account arrivano dalle **variabili** del repository: finiscono comunque nel
bundle pubblico, quindi non sono segreti. Il sito va online solo con le
registrazioni pubbliche spente sul progetto Supabase: con la chiave publishable in
giro, un account creato da chiunque vedrebbe tutti i dati.

Il **README** del progetto è sobrio, con qualche screenshot in `doc/immagini`.
