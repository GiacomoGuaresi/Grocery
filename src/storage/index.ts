// Punto d'ingresso della persistenza per l'app in esecuzione nel browser:
// carica il WASM di SQLite e apre il database tenuto su IndexedDB.
// Sarà qui che, allo Step 13, si sceglierà Supabase in produzione.

import initSqlJs from 'sql.js'
import wasm from 'sql.js/dist/sql-wasm.wasm?url'
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

async function apri(): Promise<Storage> {
  const SQL = await initSqlJs({ locateFile: () => wasm })
  return apriStorageSqlite(SQL, persistenza())
}

function persistenza(): Persistenza {
  // In un contesto senza IndexedDB (SSR, test di rendering) la lista vive
  // comunque, semplicemente non sopravvive alla chiusura.
  return typeof indexedDB === 'undefined' ? new PersistenzaMemoria() : new PersistenzaIndexedDB()
}
