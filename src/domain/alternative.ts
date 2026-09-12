// Sostituzione di una voce generata tramite la dropdown delle alternative
// (Step 10 di doc/12-piano-sviluppo.md, F6 e R7).
//
// È l'unico modo di "modificare" una voce generata: i nomi vengono dal
// catalogo e non si rinominano. Le alternative sono le altre tipologie della
// stessa categoria; per un tipo di frutta o verdura sono tutti gli altri tipi
// del gruppo, divisi tra quelli **di stagione** nel mese — da preferire — e
// quelli fuori stagione. Quello che è già in lista non viene riproposto:
// sostituire una voce non deve creare un doppione.
//
// Nessuna di queste funzioni tocca le rotazioni: la memoria del ciclo resta
// quella salvata alla generazione, anche se poi si cambia mezza lista (R7).

import { categoria as trovaCategoria, diStagione, eGruppoFisso, type Mese } from './dati'
import { meseDi } from './generazione'
import type { IdReparto, Lista, Voce } from './tipi'

/**
 * Le alternative di una voce, nell'ordine in cui la dropdown le mostra.
 * `fuoriStagione` è pieno solo per frutta e verdura: per le altre categorie
 * tutte le tipologie stanno in `consigliate`.
 */
export interface Alternative {
  /** Le tipologie da preferire; per frutta e verdura, quelle di stagione nel mese. */
  consigliate: string[]
  /** Frutta e verdura fuori stagione: si possono scegliere, ma in coda. */
  fuoriStagione: string[]
}

const nessuna: Alternative = { consigliate: [], fuoriStagione: [] }

/** Tutti i nomi proposti, di stagione e no. */
export function tutteLeAlternative(alternative: Alternative): string[] {
  return [...alternative.consigliate, ...alternative.fuoriStagione]
}

/** I nomi già presenti in lista. */
function giaInLista(lista: Lista): Set<string> {
  return new Set(lista.voci.map((voce) => voce.nome))
}

/**
 * Le tipologie della categoria, ognuna col reparto in cui si compra. Per
 * frutta e verdura sono tutti i tipi del gruppo, di stagione e no.
 */
function tipiDi(categoria: NonNullable<Voce['categoria']>): Map<string, IdReparto> {
  const catalogo = trovaCategoria(categoria)
  if (!catalogo) return new Map()
  // Le uova non hanno consigli: niente da proporre (R8).
  return new Map(catalogo.consigli.map((nome) => [nome, catalogo.reparto] as const))
}

/**
 * Le tipologie con cui si può sostituire questa voce: le altre della sua
 * categoria, senza quelle già in lista. Per frutta e verdura prima quelle di
 * stagione nel mese, poi le altre. Vuoto per le voci manuali e per le
 * categorie fisse come le uova (R8).
 */
export function alternativeVoce(
  lista: Lista,
  voce: Voce,
  mese: Mese = meseDi(new Date()),
): Alternative {
  if (voce.origine !== 'generata' || !voce.categoria) return nessuna
  const escluse = giaInLista(lista)
  const proponibili = [...tipiDi(voce.categoria).keys()].filter((nome) => !escluse.has(nome))
  if (!eGruppoFisso(voce.categoria)) return { consigliate: proponibili, fuoriStagione: [] }
  const delMese = new Set(diStagione(voce.categoria, mese))
  return {
    consigliate: proponibili.filter((nome) => delMese.has(nome)),
    fuoriStagione: proponibili.filter((nome) => !delMese.has(nome)),
  }
}

/**
 * Mette al posto della voce un'altra tipologia della stessa categoria. Il
 * reparto segue la tipologia nuova — è un dato del catalogo, non una scelta
 * dell'utente: il tonno fresco sta in pescheria, la mortadella nei salumi.
 * Un nome che non è tra le alternative lascia la lista com'è.
 */
export function sostituisciVoce(lista: Lista, id: string, nome: string): Lista {
  const voce = lista.voci.find((v) => v.id === id)
  if (!voce?.categoria || !tutteLeAlternative(alternativeVoce(lista, voce)).includes(nome)) {
    return lista
  }
  const reparto = tipiDi(voce.categoria).get(nome)
  if (!reparto) return lista
  return {
    ...lista,
    voci: lista.voci.map((v) => (v.id === id ? { ...v, nome, reparto } : v)),
  }
}
