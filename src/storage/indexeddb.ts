// Persistenza del file SQLite su IndexedDB: un solo record, il blob del
// database. È l'unico modo per tenere dei byte nel browser tra un'apertura e
// l'altra senza server (doc/07-architettura-stack.md).

import type { Persistenza } from './tipi'

const DB = 'grocery'
const DEPOSITO = 'sqlite'
const CHIAVE = 'database'

function apriIndexedDB(): Promise<IDBDatabase> {
  return new Promise((risolvi, rifiuta) => {
    const richiesta = indexedDB.open(DB, 1)
    richiesta.onupgradeneeded = () => {
      richiesta.result.createObjectStore(DEPOSITO)
    }
    richiesta.onsuccess = () => risolvi(richiesta.result)
    richiesta.onerror = () => rifiuta(richiesta.error)
  })
}

function esegui<T>(
  db: IDBDatabase,
  modo: IDBTransactionMode,
  operazione: (deposito: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((risolvi, rifiuta) => {
    const transazione = db.transaction(DEPOSITO, modo)
    const richiesta = operazione(transazione.objectStore(DEPOSITO))
    richiesta.onsuccess = () => risolvi(richiesta.result)
    richiesta.onerror = () => rifiuta(richiesta.error)
  })
}

export class PersistenzaIndexedDB implements Persistenza {
  private db: Promise<IDBDatabase> | null = null

  private connessione(): Promise<IDBDatabase> {
    this.db ??= apriIndexedDB()
    return this.db
  }

  async carica(): Promise<Uint8Array | null> {
    const db = await this.connessione()
    const salvato = await esegui<ArrayBuffer | undefined>(db, 'readonly', (deposito) =>
      deposito.get(CHIAVE),
    )
    return salvato ? new Uint8Array(salvato) : null
  }

  async salva(dati: Uint8Array): Promise<void> {
    const db = await this.connessione()
    // Si salva l'ArrayBuffer e non la vista: IndexedDB lo struttura-clona meglio.
    const copia = dati.slice().buffer
    await esegui(db, 'readwrite', (deposito) => deposito.put(copia, CHIAVE))
  }
}
