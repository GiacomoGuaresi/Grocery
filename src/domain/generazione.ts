// Algoritmo di generazione della lista (v2, Step V3 di doc/13-piano-v2.md).
// Solo logica, nessuna UI: dalla routine escono le voci di un ciclo di due
// settimane (doc/03-algoritmo-generazione.md).
//
// Deterministico e senza stato: una voce per categoria, col totale dei pasti
// da coprire. Non sceglie tipologie (i tipi sono solo consigli del popup), non
// guarda la stagionalità e non legge niente dal database, quindi gira anche
// senza rete.

import { categorie, giorniRoutine, pastiPerGiorno, type GiornoRoutine, type GruppoFisso } from './dati'
import type { IdCategoria, Lista, Voce } from './tipi'

/** Il ciclo dura due settimane. */
const settimanePerCiclo = 2

/** La routine da cui nascono i numeri: di norma `routine.json`, sostituibile nei test. */
export interface Routine {
  giorni: Pick<GiornoRoutine, 'categoria'>[]
  pastiPerGiorno: Record<GruppoFisso, number>
}

export interface OpzioniGenerazione {
  /** Dà l'id e la data della lista. Default: adesso. */
  data?: Date
  /** Id della lista prodotta. Default: derivato dalla data. */
  id?: string
  /** Default: quella di `routine.json`. */
  routine?: Routine
}

const routineDelleDati: Routine = { giorni: giorniRoutine, pastiPerGiorno }

/**
 * Quanti pasti coprire per categoria in un ciclo. Le fonti proteiche: le sere
 * della settimana che la routine assegna × 2 (R1). Verdura e frutta: i pasti
 * al giorno × 7 × 2 (R2). Non è una tabella a mano: cambiare la routine cambia
 * i numeri.
 */
export function pastiPerCiclo(routine: Routine = routineDelleDati): Map<IdCategoria | GruppoFisso, number> {
  const pasti = new Map<IdCategoria | GruppoFisso, number>()
  for (const { categoria } of routine.giorni) {
    pasti.set(categoria, (pasti.get(categoria) ?? 0) + settimanePerCiclo)
  }
  for (const [gruppo, alGiorno] of Object.entries(routine.pastiPerGiorno) as [GruppoFisso, number][]) {
    pasti.set(gruppo, alGiorno * 7 * settimanePerCiclo)
  }
  return pasti
}

/**
 * La lista di un ciclo di due settimane: una voce per categoria, nell'ordine
 * del catalogo, con `presi` a zero. Una categoria che la routine non usa non
 * entra. Non tocca la lista precedente: il riporto è in `ciclo.ts`.
 */
export function generaLista(opzioni: OpzioniGenerazione = {}): Lista {
  const data = opzioni.data ?? new Date()
  const pasti = pastiPerCiclo(opzioni.routine)

  const voci: Voce[] = []
  for (const catalogo of categorie) {
    const quantita = pasti.get(catalogo.id) ?? 0
    if (quantita <= 0) continue
    voci.push({
      id: catalogo.id,
      nome: catalogo.etichetta,
      reparto: catalogo.reparto,
      categoria: catalogo.id,
      origine: 'generata',
      comprata: false,
      quantita,
      presi: 0,
    })
  }

  return {
    id: opzioni.id ?? `ciclo-${data.toISOString()}`,
    creataIl: data.toISOString(),
    voci,
  }
}
