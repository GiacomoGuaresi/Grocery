// Annulla e ripristina: la cronologia breve delle modifiche fatte su questo
// dispositivo, solo per la sessione (doc/08-ui-ux.md, "Annulla e ripristina").
// Funzioni pure: cosa ricordare di una modifica, e come riportare le voci che
// ha toccato a com'erano prima o dopo. Le voci che la modifica non ha toccato
// restano come sono, anche se intanto le ha cambiate l'altro dispositivo.
//
// Una voce eliminata non può tornare con lo stesso id: il database se lo
// ricorda in `voci_eliminate` e non la riscrive più (salva_voci). Quando
// annulla o ripristina rimettono in lista una voce che non c'è, le danno un id
// nuovo, e la cronologia da lì in poi la chiama così (`rimappa`).

import { differenze } from './sincronia'
import type { Lista, Voce } from './tipi'

/** Una voce toccata da una modifica: com'era e com'è diventata (assente se non c'era). */
export interface Cambio {
  id: string
  prima?: Voce
  dopo?: Voce
}

/** Una modifica da poter annullare: le voci che ha toccato, nella sua lista. */
export interface Passo {
  listaId: string
  cambi: Cambio[]
}

export type Verso = 'annulla' | 'ripristina'

/** Gli id cambiati da un salto: vecchio → nuovo. */
export type Mappa = ReadonlyMap<string, string>

/** Quante modifiche si ricordano: le più vecchie si dimenticano. */
export const LUNGHEZZA_CRONOLOGIA = 30

/** Il passo tra due versioni della lista; nullo se non è cambiato niente. */
export function passoTra(prima: Lista, dopo: Lista): Passo | null {
  const { voci, eliminate } = differenze(prima, dopo)
  if (voci.length === 0 && eliminate.length === 0) return null
  const vecchie = new Map(prima.voci.map((voce) => [voce.id, voce]))
  const cambi: Cambio[] = [
    ...voci.map((voce) => ({ id: voce.id, prima: vecchie.get(voce.id), dopo: voce })),
    ...eliminate.map((id) => ({ id, prima: vecchie.get(id) })),
  ]
  return { listaId: prima.id, cambi }
}

/** Com'è la voce toccata dopo aver annullato o ripristinato il passo. */
export function destinazione(cambio: Cambio, verso: Verso): Voce | undefined {
  return verso === 'annulla' ? cambio.prima : cambio.dopo
}

/**
 * La lista con le voci del passo riportate a prima (annulla) o a dopo
 * (ripristina). Una voce che non c'è più torna in fondo, con un id nuovo
 * preso da `nuovoId`: la `mappa` dice quali. Un passo di un'altra lista (ne è
 * stata generata una nuova) non tocca niente.
 */
export function riporta(
  lista: Lista,
  passo: Passo,
  verso: Verso,
  nuovoId: () => string,
): { lista: Lista; mappa: Mappa } {
  const mappa = new Map<string, string>()
  if (lista.id !== passo.listaId) return { lista, mappa }
  const voci = [...lista.voci]
  for (const cambio of passo.cambi) {
    const voce = destinazione(cambio, verso)
    const dove = voci.findIndex((v) => v.id === cambio.id)
    if (!voce) {
      if (dove >= 0) voci.splice(dove, 1)
    } else if (dove >= 0) {
      voci[dove] = voce
    } else {
      const id = nuovoId()
      mappa.set(cambio.id, id)
      voci.push({ ...voce, id })
    }
  }
  return { lista: { ...lista, voci }, mappa }
}

/** Il passo con gli id della `mappa` al posto dei vecchi. */
export function rimappa(passo: Passo, mappa: Mappa): Passo {
  if (mappa.size === 0 || !passo.cambi.some((cambio) => mappa.has(cambio.id))) return passo
  const nuova = (voce: Voce | undefined, id: string) => (voce ? { ...voce, id } : undefined)
  return {
    ...passo,
    cambi: passo.cambi.map((cambio) => {
      const id = mappa.get(cambio.id)
      if (!id) return cambio
      return { id, prima: nuova(cambio.prima, id), dopo: nuova(cambio.dopo, id) }
    }),
  }
}

/**
 * Le due pile di annulla e ripristina, per una lista sola: quando arriva una
 * modifica di un'altra lista (ne è stata generata una nuova) si ricomincia da
 * capo. Una modifica nuova svuota la pila di ripristina, come in ogni editor.
 */
export class Cronologia {
  private indietro: Passo[] = []
  private avanti: Passo[] = []
  private listaId: string | null = null

  constructor(private readonly nuovoId: () => string) {}

  get puoAnnullare(): boolean {
    return this.indietro.length > 0
  }

  get puoRipristinare(): boolean {
    return this.avanti.length > 0
  }

  /** Ricorda la modifica da `prima` a `dopo`, se ha cambiato qualcosa. */
  registra(prima: Lista, dopo: Lista): void {
    this.perLista(prima.id)
    const passo = passoTra(prima, dopo)
    if (!passo) return
    this.indietro = [...this.indietro, passo].slice(-LUNGHEZZA_CRONOLOGIA)
    this.avanti = []
  }

  /** Il passo che annulla o ripristina toccherebbe adesso. */
  prossimo(verso: Verso): Passo | null {
    return (verso === 'annulla' ? this.indietro : this.avanti).at(-1) ?? null
  }

  /**
   * Annulla o ripristina proprio `passo` sulla lista, anche se intanto ne è
   * arrivato un altro sopra; null se non è più in cronologia (già fatto, o di
   * una lista vecchia). Le voci tornate con un id nuovo si chiamano così anche
   * negli altri passi.
   */
  salta(lista: Lista, verso: Verso, passo: Passo): { lista: Lista; mappa: Mappa } | null {
    this.perLista(lista.id)
    const da = verso === 'annulla' ? this.indietro : this.avanti
    if (!da.includes(passo)) return null
    const fatto = riporta(lista, passo, verso, this.nuovoId)
    const aggiorna = (passi: Passo[]) => passi.map((p) => rimappa(p, fatto.mappa))
    const resto = aggiorna(da.filter((p) => p !== passo))
    const spostato = rimappa(passo, fatto.mappa)
    if (verso === 'annulla') {
      this.indietro = resto
      this.avanti = [...aggiorna(this.avanti), spostato]
    } else {
      this.avanti = resto
      this.indietro = [...aggiorna(this.indietro), spostato]
    }
    return fatto
  }

  /** La lista di adesso: se è un'altra, la cronologia di prima non vale più. */
  perLista(listaId: string): void {
    if (this.listaId === listaId) return
    this.listaId = listaId
    this.indietro = []
    this.avanti = []
  }
}
