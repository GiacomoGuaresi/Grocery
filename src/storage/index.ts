// Punto d'ingresso della persistenza per l'app in esecuzione nel browser:
// sceglie l'implementazione per ambiente — SQLite in sviluppo, Supabase nella
// build di produzione (doc/07) — e la apre. Ognuna arriva con un import
// dinamico, così il bundle di produzione non si porta dietro il WASM di SQLite.

import { accessoLibero, type Accesso } from './accesso'
import { PersistenzaIndexedDB } from './indexeddb'
import { PersistenzaMemoria } from './memoria'
import { apriStorageSqlite } from './sqlite'
import type { Persistenza, Storage } from './tipi'

export type { Accesso, EsitoAccesso } from './accesso'
export type { Persistenza, Storage } from './tipi'
export { PersistenzaMemoria } from './memoria'
export { StorageSqlite, apriStorageSqlite } from './sqlite'

type ConnessioneSupabase = ReturnType<(typeof import('./supabase'))['connettiSupabase']>

let aperto: Promise<Storage> | null = null
let supabase: Promise<ConnessioneSupabase> | null = null

/** Lo storage dell'app, aperto una volta sola e condiviso da chi lo chiede. */
export function storage(): Promise<Storage> {
  aperto ??= implementazione() === 'supabase' ? connessione().then((c) => c.storage) : apriSqlite()
  return aperto
}

/** Chi può entrare: con SQLite lo stato non esce dal dispositivo, e si entra sempre. */
export function accesso(): Promise<Accesso> {
  return implementazione() === 'supabase'
    ? connessione().then((c) => c.accesso)
    : Promise.resolve(accessoLibero)
}

/** `VITE_STORAGE` forza la scelta, per esempio per provare Supabase in sviluppo. */
function implementazione(): 'sqlite' | 'supabase' {
  return import.meta.env.VITE_STORAGE ?? (import.meta.env.PROD ? 'supabase' : 'sqlite')
}

/** Il client Supabase è uno solo: storage e accesso condividono la sessione. */
function connessione(): Promise<ConnessioneSupabase> {
  supabase ??= connettiSupabase()
  return supabase
}

async function connettiSupabase(): Promise<ConnessioneSupabase> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const chiave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const email = import.meta.env.VITE_SUPABASE_EMAIL
  if (!url || !chiave || !email) {
    throw new Error(
      'Mancano VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_EMAIL: vedi .env.example',
    )
  }
  const { connettiSupabase } = await import('./supabase')
  return connettiSupabase(url, chiave, email)
}

async function apriSqlite(): Promise<Storage> {
  const [{ default: initSqlJs }, { default: wasm }] = await Promise.all([
    import('sql.js'),
    import('sql.js/dist/sql-wasm.wasm?url'),
  ])
  const SQL = await initSqlJs({ locateFile: () => wasm })
  return apriStorageSqlite(SQL, persistenza())
}

function persistenza(): Persistenza {
  // In un contesto senza IndexedDB (SSR, test di rendering) la lista vive
  // comunque, semplicemente non sopravvive alla chiusura.
  return typeof indexedDB === 'undefined' ? new PersistenzaMemoria() : new PersistenzaIndexedDB()
}
