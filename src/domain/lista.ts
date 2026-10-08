// Operazioni di lettura sulla lista corrente: raggruppamento per reparto
// nell'ordine del percorso in corsia (doc/08-ui-ux.md), e dopo i reparti un
// gruppo per ogni ricetta (doc/14-piano-ricette.md).

import { ordineReparto, reparto as trovaReparto } from './dati'
import type { IdReparto, Lista, RiferimentoRicetta, Voce } from './tipi'

export interface GruppoReparto {
  id: IdReparto
  nome: string
  voci: Voce[]
}

export interface GruppoRicetta {
  ricetta: RiferimentoRicetta
  voci: Voce[]
}

/**
 * Le voci della lista divise per reparto, nell'ordine del percorso in corsia.
 * I reparti senza voci non compaiono. Dentro ogni reparto le voci restano
 * nell'ordine in cui stanno nella lista. Gli ingredienti delle ricette non ci
 * sono: stanno nei gruppi delle loro ricette (raggruppaPerRicetta).
 */
export function raggruppaPerReparto(voci: Voce[]): GruppoReparto[] {
  const perReparto = new Map<IdReparto, Voce[]>()
  for (const voce of voci) {
    if (voce.ricetta) continue
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

/**
 * Gli ingredienti delle ricette, un gruppo per ricetta, nell'ordine in cui le
 * ricette sono entrate nella lista. Il nome del gruppo è quello della prima voce.
 */
export function raggruppaPerRicetta(voci: Voce[]): GruppoRicetta[] {
  const perRicetta = new Map<string, GruppoRicetta>()
  for (const voce of voci) {
    if (!voce.ricetta) continue
    const gruppo = perRicetta.get(voce.ricetta.id)
    if (gruppo) gruppo.voci.push(voce)
    else perRicetta.set(voce.ricetta.id, { ricetta: voce.ricetta, voci: [voce] })
  }
  return [...perRicetta.values()]
}

/** Le voci ancora da comprare: quelle spuntate finiscono in "Già presi". */
export function vociAttive(lista: Lista): Voce[] {
  return lista.voci.filter((voce) => !voce.comprata)
}

/** Le voci già prese, nell'ordine in cui stanno nella lista. */
export function vociComprate(lista: Lista): Voce[] {
  return lista.voci.filter((voce) => voce.comprata)
}
