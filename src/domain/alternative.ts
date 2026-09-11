// Sostituzione di una voce generata tramite la dropdown delle alternative
// (Step 10 di doc/12-piano-sviluppo.md, F6 e R7).
//
// È l'unico modo di "modificare" una voce generata: i nomi vengono dal
// catalogo e non si rinominano. Le alternative sono le altre tipologie della
// stessa categoria; per un tipo di frutta o verdura sono gli altri tipi **di
// stagione** del mese. Quello che è già in lista non viene riproposto:
// sostituire una voce non deve creare un doppione.
//
// Nessuna di queste funzioni tocca le rotazioni: la memoria del ciclo resta
// quella salvata alla generazione, anche se poi si cambia mezza lista (R7).

import {
  categoria as trovaCategoria,
  diStagione,
  eGruppoFisso,
  gruppiFissi,
  type Mese,
} from './dati'
import { meseDi } from './generazione'
import type { IdReparto, Lista, Voce } from './tipi'

/** I nomi già presenti in lista. */
function giaInLista(lista: Lista): Set<string> {
  return new Set(lista.voci.map((voce) => voce.nome))
}

/**
 * Le tipologie della categoria, ognuna col reparto in cui si compra. Per
 * frutta e verdura sono quelle di stagione nel mese.
 */
function tipiDi(categoria: NonNullable<Voce['categoria']>, mese: Mese): Map<string, IdReparto> {
  if (eGruppoFisso(categoria)) {
    const { reparto } = gruppiFissi[categoria]
    return new Map(diStagione(categoria, mese).map((nome) => [nome, reparto]))
  }
  const catalogo = trovaCategoria(categoria)
  // Le categorie fisse come le uova hanno una tipologia sola: niente da proporre (R8).
  if (!catalogo || catalogo.fisso) return new Map()
  return new Map(catalogo.tipi.map((tipo) => [tipo.nome, tipo.reparto]))
}

/**
 * Le tipologie con cui si può sostituire questa voce: le altre della sua
 * categoria — di stagione, per frutta e verdura — senza quelle già in lista.
 * Vuoto per le voci manuali e per le categorie fisse come le uova (R8).
 */
export function alternativeVoce(
  lista: Lista,
  voce: Voce,
  mese: Mese = meseDi(new Date()),
): string[] {
  if (voce.origine !== 'generata' || !voce.categoria) return []
  const escluse = giaInLista(lista)
  return [...tipiDi(voce.categoria, mese).keys()].filter((nome) => !escluse.has(nome))
}

/**
 * Mette al posto della voce un'altra tipologia della stessa categoria. Il
 * reparto segue la tipologia nuova — è un dato del catalogo, non una scelta
 * dell'utente: il tonno fresco sta in pescheria, i bastoncini nei surgelati.
 * Un nome che non è tra le alternative lascia la lista com'è.
 */
export function sostituisciVoce(
  lista: Lista,
  id: string,
  nome: string,
  mese: Mese = meseDi(new Date()),
): Lista {
  const voce = lista.voci.find((v) => v.id === id)
  if (!voce?.categoria || !alternativeVoce(lista, voce, mese).includes(nome)) return lista
  const reparto = tipiDi(voce.categoria, mese).get(nome)
  if (!reparto) return lista
  return {
    ...lista,
    voci: lista.voci.map((v) => (v.id === id ? { ...v, nome, reparto } : v)),
  }
}
