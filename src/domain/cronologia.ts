// Annulla e ripristina: la cronologia breve delle modifiche fatte su questo
// dispositivo, solo per la sessione (doc/08-ui-ux.md, "Annulla e ripristina").
// Funzioni pure: cosa ricordare di una modifica, e come riportare le voci che
// ha toccato a com'erano prima o dopo. Le voci che la modifica non ha toccato
// restano come sono, anche se intanto le ha cambiate l'altro dispositivo.

import { differenze } from './sincronia'
import type { Lista, Voce } from './tipi'

/** Una voce toccata da una modifica: com'era e com'è diventata (assente se non c'era). */
export interface Cambio {
  id: string
  prima?: Voce
  dopo?: Voce
  /** Dov'era nella lista: una voce eliminata, se torna, torna lì. */
  indice: number
}

/** Una modifica da poter annullare: le voci che ha toccato, nella sua lista. */
export interface Passo {
  listaId: string
  cambi: Cambio[]
}

export type Verso = 'annulla' | 'ripristina'

/** Quante modifiche si ricordano: le più vecchie si dimenticano. */
export const LUNGHEZZA_CRONOLOGIA = 30

/** Il passo tra due versioni della lista; nullo se non è cambiato niente. */
export function passoTra(prima: Lista, dopo: Lista): Passo | null {
  const { voci, eliminate } = differenze(prima, dopo)
  if (voci.length === 0 && eliminate.length === 0) return null
  const vecchie = new Map(prima.voci.map((voce, indice) => [voce.id, { voce, indice }]))
  const cambi: Cambio[] = [
    ...voci.map((voce) => ({
      id: voce.id,
      prima: vecchie.get(voce.id)?.voce,
      dopo: voce,
      indice: vecchie.get(voce.id)?.indice ?? dopo.voci.indexOf(voce),
    })),
    ...eliminate.map((id) => ({ id, prima: vecchie.get(id)?.voce, indice: vecchie.get(id)?.indice ?? 0 })),
  ]
  return { listaId: prima.id, cambi }
}

/** Com'è ogni voce toccata dopo aver annullato o ripristinato il passo. */
export function destinazione(cambio: Cambio, verso: Verso): Voce | undefined {
  return verso === 'annulla' ? cambio.prima : cambio.dopo
}

/**
 * La lista con le voci del passo riportate a prima (annulla) o a dopo
 * (ripristina). Una voce che torna riprende il suo posto, se c'è ancora.
 * Un passo di un'altra lista (ne è stata generata una nuova) non tocca niente.
 */
export function riporta(lista: Lista, passo: Passo, verso: Verso): Lista {
  if (lista.id !== passo.listaId) return lista
  const voci = [...lista.voci]
  for (const cambio of passo.cambi) {
    const voce = destinazione(cambio, verso)
    const dove = voci.findIndex((v) => v.id === cambio.id)
    if (!voce) {
      if (dove >= 0) voci.splice(dove, 1)
    } else if (dove >= 0) {
      voci[dove] = voce
    } else {
      voci.splice(Math.min(cambio.indice, voci.length), 0, voce)
    }
  }
  return { ...lista, voci }
}
