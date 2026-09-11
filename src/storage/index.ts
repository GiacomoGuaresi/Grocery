// Punto d'ingresso della persistenza per l'app in esecuzione nel browser:
// sceglie l'implementazione per ambiente — SQLite in sviluppo, Supabase nella
// build di produzione (doc/07) — e la apre. Ognuna arriva con un import
// dinamico, così il bundle di produzione non si porta dietro il WASM di SQLite.

import { PersistenzaIndexedDB } from './indexeddb'
import { PersistenzaMemoria } from './memoria'
import { apriStorageSqlite } from './sqlite'
import type { Persistenza, Storage } from './tipi'

export type { Persistenza, Storage } from './tipi'
export { PersistenzaMemoria } from './memoria'
export { StorageSqlite, apriStorageSqlite } from './sqlite'

let aperto: Promise<Storage> | null = null

/** Lo storage dell'app, aperto una volta sola e condiviso da chi lo chiede. */
export function storage(): Promise<Storage> {
  aperto ??= apri()
  return aperto
}

/** `VITE_STORAGE` forza la scelta, per esempio per provare Supabase in sviluppo. */
function implementazione(): 'sqlite' | 'supabase' {
  return import.meta.env.VITE_STORAGE ?? (import.meta.env.PROD ? 'supabase' : 'sqlite')
}

function apri(): Promise<Storage> {
  return implementazione() === 'supabase' ? apriSupabase() : apriSqlite()
}

async function apriSupabase(): Promise<Storage> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const chiave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !chiave) {
    throw new Error('Mancano VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY: vedi .env.example')
  }
  const { apriStorageSupabase } = await import('./supabase')
  return apriStorageSupabase(url, chiave)
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
