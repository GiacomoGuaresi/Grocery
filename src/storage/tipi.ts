// Interfaccia di persistenza — vedi doc/07-architettura-stack.md.
// Il resto dell'app programma solo contro questa: oggi l'implementazione è
// SQLite via sql.js (Step 5), in produzione sarà Supabase (Step 13).

import type { Modifiche } from '../domain/sincronia'
import type { Lista, Rotazione, SintesiLista } from '../domain/tipi'

export interface Storage {
  /** La lista in stato `corrente`, oppure `null` se non ne esiste ancora una. */
  leggiListaCorrente(): Promise<Lista | null>
  /** Salva la lista per intero (voci comprese), sostituendo quella con lo stesso id. */
  salvaLista(lista: Lista): Promise<void>
  /**
   * Scrive solo le voci toccate, lasciando le altre come le trova: così le
   * modifiche di due dispositivi si sommano invece di sovrascriversi (Step 15).
   * Le voci nuove vanno in fondo. Scrive solo sulla lista corrente: su una
   * archiviata, o che non c'è, non fa niente.
   */
  salvaVoci(listaId: string, modifiche: Modifiche): Promise<void>
  /**
   * `avvisa` scatta quando la lista corrente può essere cambiata altrove — da
   * un altro dispositivo, o mentre si era senza rete — ed è il momento di
   * rileggerla. Restituisce come smettere.
   */
  quandoCambia(avvisa: () => void): () => void
  /** Le liste archiviate, dalla più recente alla più vecchia (F11). */
  leggiArchivio(): Promise<SintesiLista[]>
  /** Una lista qualsiasi per id, corrente o archiviata; `null` se non esiste. */
  leggiLista(id: string): Promise<Lista | null>
  /** La memoria della rotazione, una riga per categoria. */
  leggiRotazioni(): Promise<Rotazione[]>
  /** Sostituisce la memoria della rotazione con quella passata. */
  salvaRotazioni(rotazioni: Rotazione[]): Promise<void>
}

/**
 * Dove finisce il file SQLite tra un'apertura e l'altra. In browser è
 * IndexedDB; nei test è la memoria del processo.
 */
export interface Persistenza {
  carica(): Promise<Uint8Array | null>
  salva(dati: Uint8Array): Promise<void>
}
