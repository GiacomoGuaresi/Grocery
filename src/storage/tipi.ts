// Interfaccia di persistenza — vedi doc/07-architettura-stack.md.
// Il resto dell'app programma solo contro questa: l'implementazione è
// Supabase (Step 13), in sviluppo come in produzione.

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
   *
   * `quando` è l'ora della modifica, ISO (Step 16): una voce scritta da una
   * modifica più recente non si tocca, anche se questa arriva dopo. Una voce
   * eliminata non torna più, qualunque sia l'ora.
   */
  salvaVoci(listaId: string, modifiche: Modifiche, quando: string): Promise<void>
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
 * Il database non si raggiunge: manca la rete. A differenza degli altri errori
 * non dice niente di quello che si voleva fare, che al ritorno della rete si
 * può riprovare tale e quale (Step 16).
 */
export class ErroreRete extends Error {
  constructor(causa?: unknown) {
    super('Database non raggiungibile: senza rete', { cause: causa })
    this.name = 'ErroreRete'
  }
}
