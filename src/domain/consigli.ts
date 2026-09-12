// I consigli del popup di una voce generata (Step V5 di doc/13-piano-v2.md, F14).
// Solo lettura: non toccano la lista, dicono cosa guardare nel reparto.
//
// Per carni, pesce, formaggio e affettati è l'elenco breve del catalogo. Per
// verdura e frutta sono tutti i tipi del gruppo, divisi tra quelli di stagione
// nel mese e gli altri, con una chip che dice se stanno per finire o arrivare.

import { categoria as trovaCategoria, eGruppoFisso, stagionalita, type Mese } from './dati'
import { haContatore } from './contatore'
import type { Voce } from './tipi'

export type Chip = "tutto l'anno" | 'in uscita' | 'in arrivo'

export interface TipoConsigliato {
  nome: string
  chip?: Chip
}

export type Consigli =
  | { tipo: 'elenco'; tipi: string[] }
  | { tipo: 'stagione'; diStagione: TipoConsigliato[]; fuoriStagione: TipoConsigliato[] }

/** Il mese dopo: a dicembre è gennaio. */
export function meseDopo(mese: Mese): Mese {
  return ((mese % 12) + 1) as Mese
}

const perNome = (a: TipoConsigliato, b: TipoConsigliato) => a.nome.localeCompare(b.nome, 'it')

/**
 * I consigli di una voce, o null se non ne ha: le manuali, le rimaste dalla v1
 * (senza contatore) e le uova non hanno popup.
 */
export function consigliVoce(voce: Voce, mese: Mese): Consigli | null {
  if (voce.origine !== 'generata' || !haContatore(voce) || !voce.categoria) return null
  const categoria = voce.categoria

  if (!eGruppoFisso(categoria)) {
    const tipi = trovaCategoria(categoria)?.consigli ?? []
    return tipi.length > 0 ? { tipo: 'elenco', tipi } : null
  }

  // Di stagione: quello che c'è questo mese, "in uscita" se il prossimo non c'è
  // più. Fuori stagione: il resto, "in arrivo" se c'è dal mese prossimo.
  const prossimo = meseDopo(mese)
  const diStagione: TipoConsigliato[] = []
  const fuoriStagione: TipoConsigliato[] = []
  for (const [nome, mesi] of Object.entries(stagionalita[categoria])) {
    if (new Set(mesi).size === 12) diStagione.push({ nome, chip: "tutto l'anno" })
    else if (mesi.includes(mese))
      diStagione.push(mesi.includes(prossimo) ? { nome } : { nome, chip: 'in uscita' })
    else fuoriStagione.push(mesi.includes(prossimo) ? { nome, chip: 'in arrivo' } : { nome })
  }
  return {
    tipo: 'stagione',
    diStagione: diStagione.sort(perNome),
    fuoriStagione: fuoriStagione.sort(perNome),
  }
}
