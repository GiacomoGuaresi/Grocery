// Transizioni di stato della spunta (Step 4 di doc/12-piano-sviluppo.md).
// Funzioni pure: ogni operazione restituisce una lista nuova e lascia
// intatta quella di partenza.

import type { Lista, Voce } from './tipi'

function mappaVoce(lista: Lista, id: string, f: (voce: Voce) => Voce): Lista {
  return { ...lista, voci: lista.voci.map((voce) => (voce.id === id ? f(voce) : voce)) }
}

/**
 * Segna la voce come comprata: sparisce dalla lista attiva e compare in
 * "Già presi".
 */
export function spuntaVoce(lista: Lista, id: string): Lista {
  return mappaVoce(lista, id, (voce) => ({ ...voce, comprata: true }))
}

/** Riporta la voce tra quelle da comprare. */
export function despuntaVoce(lista: Lista, id: string): Lista {
  return mappaVoce(lista, id, (voce) => ({ ...voce, comprata: false }))
}
