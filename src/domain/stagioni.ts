// Frutta e verdura di stagione (doc/08-ui-ux.md): la tabella di stagionalità in
// sola consultazione. Solo dati statici: non dipende dalla lista né dallo storage.
//
// Le stagioni sono quelle meteorologiche, tre mesi interi ciascuna: la tabella
// ragiona a mesi, e una stagione che iniziasse il 21 non ci si incastrerebbe.

import { stagionalita, type GruppoFisso, type Mese } from './dati'

export type IdStagione = 'inverno' | 'primavera' | 'estate' | 'autunno'

export interface Stagione {
  id: IdStagione
  etichetta: string
  /** I suoi tre mesi, nell'ordine in cui arrivano: l'inverno parte da dicembre. */
  mesi: Mese[]
}

/** Le quattro stagioni, nell'ordine dell'anno. */
export const stagioni: Stagione[] = [
  { id: 'inverno', etichetta: 'Inverno', mesi: [12, 1, 2] },
  { id: 'primavera', etichetta: 'Primavera', mesi: [3, 4, 5] },
  { id: 'estate', etichetta: 'Estate', mesi: [6, 7, 8] },
  { id: 'autunno', etichetta: 'Autunno', mesi: [9, 10, 11] },
]

/** Il nome del mese come si scrive: "settembre". */
export const nomiMesi: Record<Mese, string> = {
  1: 'gennaio',
  2: 'febbraio',
  3: 'marzo',
  4: 'aprile',
  5: 'maggio',
  6: 'giugno',
  7: 'luglio',
  8: 'agosto',
  9: 'settembre',
  10: 'ottobre',
  11: 'novembre',
  12: 'dicembre',
}

/** Il mese di una data. `getMonth()` conta da 0: qui si riporta a 1 = gennaio. */
export function meseDi(data: Date = new Date()): Mese {
  return (data.getMonth() + 1) as Mese
}

/** La stagione in cui cade un mese. */
export function stagioneDi(mese: Mese): Stagione {
  return stagioni.find((s) => s.mesi.includes(mese)) ?? stagioni[0]
}

export interface TipoDiStagione {
  nome: string
  /** Tutti i mesi in cui c'è, non solo quelli del periodo: si vede se inizia o finisce. */
  mesi: Mese[]
}

export interface StagionaliDelPeriodo {
  /** Quello che c'è in almeno un mese del periodo, in ordine alfabetico. */
  diStagione: TipoDiStagione[]
  /** Quello che c'è tutto l'anno: sempre uguale, quindi a parte. */
  tuttoLAnno: string[]
}

const perNome = (a: string, b: string) => a.localeCompare(b, 'it')

/**
 * La frutta o la verdura di un periodo, che sia un mese solo o una stagione
 * intera. Un tipo è di stagione se c'è in almeno uno dei mesi: i fichi, finiti
 * a settembre, sono ancora frutta d'autunno.
 */
export function diStagioneNelPeriodo(
  gruppo: GruppoFisso,
  periodo: readonly Mese[],
): StagionaliDelPeriodo {
  const diStagione: TipoDiStagione[] = []
  const tuttoLAnno: string[] = []

  for (const [nome, mesi] of Object.entries(stagionalita[gruppo])) {
    if (new Set(mesi).size === 12) tuttoLAnno.push(nome)
    else if (periodo.some((mese) => mesi.includes(mese))) diStagione.push({ nome, mesi })
  }

  return {
    diStagione: diStagione.sort((a, b) => perNome(a.nome, b.nome)),
    tuttoLAnno: tuttoLAnno.sort(perNome),
  }
}
