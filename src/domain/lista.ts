// Operazioni di lettura sulla lista corrente: raggruppamento per reparto
// nell'ordine del percorso in corsia (doc/08-ui-ux.md).

import { ordineReparto, reparto as trovaReparto } from './dati'
import type { IdReparto, Lista, Voce } from './tipi'

export interface GruppoReparto {
  id: IdReparto
  nome: string
  voci: Voce[]
}

/**
 * Le voci della lista divise per reparto, nell'ordine del percorso in corsia.
 * I reparti senza voci non compaiono. Dentro ogni reparto le voci restano
 * nell'ordine in cui stanno nella lista.
 */
export function raggruppaPerReparto(voci: Voce[]): GruppoReparto[] {
  const perReparto = new Map<IdReparto, Voce[]>()
  for (const voce of voci) {
    const gruppo = perReparto.get(voce.reparto)
    if (gruppo) gruppo.push(voce)
    else perReparto.set(voce.reparto, [voce])
  }

  return [...perReparto.entries()]
    .sort(([a], [b]) => ordineReparto(a) - ordineReparto(b))
    .map(([id, vociReparto]) => ({
      id,
      nome: trovaReparto(id)?.nome ?? id,
      voci: vociReparto,
    }))
}

/** Le voci ancora da comprare: quelle spuntate finiscono in "Già presi". */
export function vociAttive(lista: Lista): Voce[] {
  return lista.voci.filter((voce) => !voce.comprata)
}

/** Le voci già prese, nell'ordine in cui stanno nella lista. */
export function vociComprate(lista: Lista): Voce[] {
  return lista.voci.filter((voce) => voce.comprata)
}
