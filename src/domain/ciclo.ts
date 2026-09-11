// Passaggio da un ciclo di due settimane al successivo (Step 9 di
// doc/12-piano-sviluppo.md). L'algoritmo (Step 8) sa solo produrre le voci del
// nuovo ciclo; qui intorno c'è quello che riguarda la lista corrente:
// archiviarla e, se lo si chiede, portare avanti quello che non è stato preso
// (R6, F1).
//
// Niente rigenerazione in place: la lista precedente non viene toccata nel
// contenuto, passa in stato `archiviata` e resta consultabile (Step 12).

import { normalizza } from './aggiunta'
import { generaLista, type OpzioniGenerazione } from './generazione'
import type { Lista, Rotazione, Voce } from './tipi'

export interface OpzioniCiclo extends OpzioniGenerazione {
  /** La lista corrente, che verrà archiviata. Assente alla prima generazione. */
  precedente?: Lista | null
  /** Se portare nella nuova lista le voci non spuntate della precedente (R6). */
  portaAvanti?: boolean
}

export interface Ciclo {
  /** La nuova lista corrente. */
  lista: Lista
  /** Le rotazioni aggiornate da salvare. */
  rotazioni: Rotazione[]
  /** La lista di prima, ora archiviata: da salvare com'è. */
  archiviata: Lista | null
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
 * Il nuovo ciclo: la lista generata (più, se richiesto, quello che era rimasto
 * da prendere), le rotazioni da salvare e la lista di prima da archiviare.
 * Funzione pura: chi chiama decide quando e in che ordine salvare.
 */
export function nuovoCiclo(opzioni: OpzioniCiclo = {}): Ciclo {
  const { precedente = null, portaAvanti = false, ...generazione } = opzioni
  const { lista, rotazioni } = generaLista(generazione)

  return {
    lista: portaAvanti && precedente ? riporta(lista, precedente) : lista,
    rotazioni,
    archiviata: precedente ? { ...precedente, stato: 'archiviata' } : null,
  }
}
