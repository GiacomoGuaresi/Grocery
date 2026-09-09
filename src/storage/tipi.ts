// Interfaccia di persistenza — vedi doc/07-architettura-stack.md.
// Il resto dell'app programma solo contro questa: oggi l'implementazione è
// SQLite via sql.js (Step 5), in produzione sarà Supabase (Step 13).

import type { Lista, Rotazione } from '../domain/tipi'

export interface Storage {
  /** La lista in stato `corrente`, oppure `null` se non ne esiste ancora una. */
  leggiListaCorrente(): Promise<Lista | null>
  /** Salva la lista per intero (voci ed elementi compresi), sostituendo quella con lo stesso id. */
  salvaLista(lista: Lista): Promise<void>
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
