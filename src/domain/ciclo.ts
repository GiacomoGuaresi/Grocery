// Passaggio da un ciclo di due settimane al successivo (Step 9 di
// doc/12-piano-sviluppo.md). L'algoritmo (Step 8) sa solo produrre le voci del
// nuovo ciclo; qui intorno c'è quello che riguarda la lista di prima: portare
// avanti, se lo si chiede, quello che non è stato preso (R6, F1).
//
// Dalla v2 la lista di prima non si archivia: salvando la nuova si cancella
// (doc/13). Il riporto si riscrive nello Step V3.

import { normalizza } from './aggiunta'
import { generaLista, type OpzioniGenerazione } from './generazione'
import type { Lista, Voce } from './tipi'

export interface OpzioniCiclo extends OpzioniGenerazione {
  /** La lista di adesso, che verrà sostituita. Assente alla prima generazione. */
  precedente?: Lista | null
  /** Se portare nella nuova lista le voci non spuntate della precedente (R6). */
  portaAvanti?: boolean
}

/**
 * Quello che resta da prendere nella lista: le voci ancora non spuntate. È la
 * domanda da fare prima di generare: se non torna niente, non c'è niente da
 * chiedere.
 */
export function vociDaRiportare(lista: Lista | null | undefined): Voce[] {
  if (!lista) return []
  return lista.voci.filter((voce) => !voce.comprata)
}

/** Vero se la lista ha ancora qualcosa da prendere: allora si chiede (R6). */
export function haVociDaRiportare(lista: Lista | null | undefined): boolean {
  return vociDaRiportare(lista).length > 0
}

/**
 * Aggiunge alla lista nuova quello che era rimasto da prendere. Non raddoppia
 * niente: quello che il nuovo ciclo propone già — per nome, senza badare a
 * maiuscole e accenti — non viene riportato. Vale anche per i tipi di frutta
 * e verdura, che sono voci come le altre.
 */
function riporta(nuova: Lista, precedente: Lista): Lista {
  const voci = nuova.voci.map((voce) => ({ ...voce }))
  const perId = new Map(voci.map((voce) => [voce.id, voce]))
  const giaPresenti = new Set(voci.map((voce) => normalizza(voce.nome)))

  for (const rimasta of vociDaRiportare(precedente)) {
    if (giaPresenti.has(normalizza(rimasta.nome))) continue
    giaPresenti.add(normalizza(rimasta.nome))
    // L'id di una voce generata si ripete tra un ciclo e l'altro
    // (`pesce-1`, …): quando è già occupato, la voce riportata ne prende uno
    // suo, così le due restano distinte.
    const id = perId.has(rimasta.id) ? `riportata-${rimasta.id}` : rimasta.id
    const voce: Voce = { ...rimasta, id, comprata: false }
    voci.push(voce)
    perId.set(id, voce)
  }

  return { ...nuova, voci }
}

/**
 * La lista del nuovo ciclo: quella generata più, se richiesto, quello che era
 * rimasto da prendere. Funzione pura: chi chiama la salva, e salvandola
 * cancella la precedente.
 */
export function nuovoCiclo(opzioni: OpzioniCiclo = {}): Lista {
  const { precedente = null, portaAvanti = false, ...generazione } = opzioni
  const lista = generaLista(generazione)
  return portaAvanti && precedente ? riporta(lista, precedente) : lista
}
