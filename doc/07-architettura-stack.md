# 07 — Architettura e stack

Lo stack è stato **scelto da chi sviluppa** (delega esplicita dell'autore),
privilegiando cose gratuite, semplici da mantenere e presentabili in un portfolio.

## Stack

| Ambito | Scelta | Perché |
|---|---|---|
| Linguaggio | **TypeScript** | Tipizza cataloghi e modello dati; buon segnale in portfolio |
| UI | **React** | Ecosistema ampio, ottimo supporto PWA, familiare a chi legge il codice |
| Build | **Vite** | Build statica veloce, deploy immediato su Pages |
| Stile | **Tailwind CSS** | Rapido per una UI mobile-first, nessun file CSS da gestire |
| PWA | **vite-plugin-pwa** (Workbox) | Installabile e offline con poca configurazione |
| DB (sviluppo) | **SQLite** via `sql.js` (WASM) nel browser | Nessun servizio esterno né server da avviare |
| DB (produzione) | **Supabase** (piano gratuito) | Postgres gestito, realtime incluso, gratuito, poco codice |
| Test | **Vitest** + Testing Library | Stessa toolchain di Vite |
| Hosting | **GitHub Pages** | Richiesto |
| CI/CD | **GitHub Actions** | Build e deploy su push del branch principale |

## Struttura

```
frontend statico (GitHub Pages)
  ├── dati di configurazione  → JSON nel repo (build-time)
  └── stato condiviso         → SQLite in sviluppo · Supabase in produzione
```

### Due ambienti di persistenza
Lo stato passa da un'**interfaccia di storage** unica, con due implementazioni:

- **sviluppo (solo PC)** → **SQLite** eseguito nel browser con `sql.js` (SQLite
  compilato in WebAssembly), database persistito su IndexedDB. Nessun server da
  avviare, nessun account da configurare, e resta vero SQL: lo schema è lo stesso che
  gira su Postgres in produzione.
- **produzione** → **Supabase**, che aggiunge il realtime tra i due dispositivi.

Il codice applicativo non conosce l'implementazione: si programma contro
l'interfaccia.

L'app online userà **Supabase fin da subito**; semplicemente non viene pubblicata
finché la base non è pronta. Nel frattempo si sviluppa in locale su SQLite, senza
collegare Supabase.

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

- **Shell dell'app** in cache (service worker) → si apre senza rete.
- **Stato locale** persistito sul dispositivo (IndexedDB / localStorage) e usato come
  sorgente per il rendering: la lista è sempre visibile.
- **Scritture offline** (spunte, aggiunte) applicate subito in locale e messe in coda;
  al ritorno della rete vengono inviate a Supabase.
- **Realtime** quando c'è rete: le modifiche di un dispositivo compaiono sull'altro.
- **Conflitti**: lo scenario reale è due persone nello stesso supermercato che
  spuntano cose diverse. Si applica *last-write-wins* per singola voce, che è
  sufficiente e non richiede merge complessi.

## Requisiti non funzionali
- **Mobile-first**, usabile con una mano in corsia.
- **Performance**: caricamento pressoché istantaneo, bundle minimo.
- **Privacy**: pochi dati, non sensibili, visibili solo ai due utenti.
- **Qualità**: test automatici richiesti, in particolare sull'algoritmo di
  generazione (rotazione, varietà nel ciclo, stagionalità).

## Deploy
Un solo ambiente: **produzione** su GitHub Pages, deploy automatico dal branch
principale. Il repository si chiamerà **`Grocery`** (nome mantenuto per ora) e
**non è ancora stato creato**: verrà pubblicato dopo aver messo in piedi la base del
progetto.

Serve un **README** del progetto, non elaborato ma presentabile.
