// Passaggio da un ciclo di due settimane al successivo (v2, Step V3 di
// doc/13-piano-v2.md). La generazione sa solo produrre le voci del nuovo ciclo;
// qui intorno c'è quello che riguarda la lista di prima: portare avanti, se lo
// si chiede, le voci manuali non spuntate (R5, F1).
//
// La lista di prima non si archivia: salvando la nuova si cancella (R6).

import { generaLista, type OpzioniGenerazione } from './generazione'
import type { Lista, Voce } from './tipi'

export interface OpzioniCiclo extends OpzioniGenerazione {
  /** La lista di adesso, che verrà sostituita. Assente alla prima generazione. */
  precedente?: Lista | null
  /** Se portare nella nuova lista le voci manuali non spuntate (R5). */
  portaAvanti?: boolean
}

/**
 * Quello che si può portare nella lista nuova: le voci manuali non spuntate.
 * Le generate mai, complete o no, e nemmeno quelle rimaste dalla v1: la lista
 * nuova ha già le sue. Se non torna niente, non c'è niente da chiedere.
 */
export function vociDaRiportare(lista: Lista | null | undefined): Voce[] {
  if (!lista) return []
  return lista.voci.filter((voce) => voce.origine === 'manuale' && !voce.comprata)
}

/** Vero se la lista ha voci manuali ancora da prendere: allora si chiede (R5). */
export function haVociDaRiportare(lista: Lista | null | undefined): boolean {
  return vociDaRiportare(lista).length > 0
}

/** Aggiunge in fondo alla lista nuova le voci manuali rimaste, tali e quali. */
function riporta(nuova: Lista, precedente: Lista): Lista {
  const occupati = new Set(nuova.voci.map((voce) => voce.id))
  const riportate = vociDaRiportare(precedente).map((voce) =>
    // Gli id delle manuali non collidono con quelli delle generate; se
    // capitasse lo stesso, la riportata ne prende uno suo.
    occupati.has(voce.id) ? { ...voce, id: `riportata-${voce.id}` } : voce,
  )
  return { ...nuova, voci: [...nuova.voci, ...riportate] }
}

/**
 * La lista del nuovo ciclo: quella generata più, se richiesto, le voci manuali
 * rimaste. Funzione pura e senza rete: chi chiama la salva, e salvandola
 * cancella la precedente.
 */
export function nuovoCiclo(opzioni: OpzioniCiclo = {}): Lista {
  const { precedente = null, portaAvanti = false, ...generazione } = opzioni
  const lista = generaLista(generazione)
  return portaAvanti && precedente ? riporta(lista, precedente) : lista
}
