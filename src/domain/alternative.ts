// Sostituzione di una voce generata tramite la dropdown delle alternative
// (Step 10 di doc/12-piano-sviluppo.md, F6 e R7).
//
// È l'unico modo di "modificare" una voce generata: i nomi vengono dal
// catalogo e non si rinominano. Le alternative sono le altre tipologie della
// stessa categoria; dentro Frutta e Verdura sono gli altri tipi **di stagione**
// del mese. Quello che è già in lista non viene riproposto: sostituire una
// voce non deve creare un doppione.
//
// Nessuna di queste funzioni tocca le rotazioni: la memoria del ciclo resta
// quella salvata alla generazione, anche se poi si cambia mezza lista (R7).

import { categoria as trovaCategoria, diStagione, type GruppoFisso, type Mese } from './dati'
import { meseDi } from './generazione'
import { eRaggruppata } from './spunta'
import type { Lista, Voce } from './tipi'

/** Il gruppo di stagionalità di una voce raggruppata, se lo è. */
function gruppoDi(voce: Voce): GruppoFisso | null {
  if (!eRaggruppata(voce)) return null
  return voce.id === 'verdura' || voce.id === 'frutta' ? voce.id : null
}

/** I nomi già presenti in lista: voci e tipi dentro le voci raggruppate. */
function giaInLista(lista: Lista): Set<string> {
  const nomi = new Set<string>()
  for (const voce of lista.voci) {
    nomi.add(voce.nome)
    if (eRaggruppata(voce)) for (const elemento of voce.elementi) nomi.add(elemento.nome)
  }
  return nomi
}

/**
 * Le tipologie con cui si può sostituire questa voce: le altre della sua
 * categoria, senza quelle già in lista. Vuoto per le voci manuali, per le
 * raggruppate (lì si sostituiscono i singoli tipi) e per le categorie fisse
 * come le uova, che una tipologia sola ce l'hanno e basta (R8).
 */
export function alternativeVoce(lista: Lista, voce: Voce): string[] {
  if (voce.origine !== 'generata' || !voce.categoria || eRaggruppata(voce)) return []
  const catalogo = trovaCategoria(voce.categoria)
  if (!catalogo || catalogo.fisso) return []
  const escluse = giaInLista(lista)
  return catalogo.tipi.map((tipo) => tipo.nome).filter((nome) => !escluse.has(nome))
}

/**
 * Le alternative di stagione per un tipo dentro Frutta o Verdura: gli altri
 * nomi disponibili nel mese, senza quelli già scelti nella voce o altrove in
 * lista (R5, R7).
 */
export function alternativeElemento(
  lista: Lista,
  voce: Voce,
  nome: string,
  mese: Mese = meseDi(new Date()),
): string[] {
  const gruppo = gruppoDi(voce)
  if (!gruppo || !voce.elementi?.some((elemento) => elemento.nome === nome)) return []
  const escluse = giaInLista(lista)
  return diStagione(gruppo, mese).filter((candidato) => !escluse.has(candidato))
}

/**
 * Mette al posto della voce un'altra tipologia della stessa categoria. Il
 * reparto segue la tipologia nuova — è un dato del catalogo, non una scelta
 * dell'utente: il tonno fresco sta in pescheria, i bastoncini nei surgelati.
 * Un nome che non è tra le alternative lascia la lista com'è.
 */
export function sostituisciVoce(lista: Lista, id: string, nome: string): Lista {
  const voce = lista.voci.find((v) => v.id === id)
  if (!voce || !alternativeVoce(lista, voce).includes(nome)) return lista
  const tipo = trovaCategoria(voce.categoria!)?.tipi.find((t) => t.nome === nome)
  if (!tipo) return lista
  return {
    ...lista,
    voci: lista.voci.map((v) =>
      v.id === id ? { ...v, nome: tipo.nome, reparto: tipo.reparto } : v,
    ),
  }
}

/**
 * Scambia un tipo dentro Frutta o Verdura con un altro di stagione. Quello
 * nuovo è tutto da prendere, anche se il precedente era spuntato: la voce
 * torna quindi tra quelle attive.
 */
export function sostituisciElemento(
  lista: Lista,
  idVoce: string,
  nome: string,
  nuovo: string,
  mese: Mese = meseDi(new Date()),
): Lista {
  const voce = lista.voci.find((v) => v.id === idVoce)
  if (!voce || !eRaggruppata(voce)) return lista
  if (!alternativeElemento(lista, voce, nome, mese).includes(nuovo)) return lista

  const elementi = voce.elementi.map((elemento) =>
    elemento.nome === nome ? { nome: nuovo, comprato: false } : elemento,
  )
  return {
    ...lista,
    voci: lista.voci.map((v) =>
      v.id === idVoce ? { ...v, elementi, comprata: elementi.every((e) => e.comprato) } : v,
    ),
  }
}
