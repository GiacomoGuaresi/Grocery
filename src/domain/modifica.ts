// Rinomina ed eliminazione delle voci (Step 7 di doc/12-piano-sviluppo.md).
// Funzioni pure come quelle della spunta: restituiscono una lista nuova.
//
// Gli alimenti del catalogo sono dati statici: una voce generata si sostituisce
// con la dropdown (F6), non si rinomina. Solo le voci manuali finite in "Altro"
// hanno un nome scritto a mano, e solo quello si corregge. Il reparto non si
// cambia mai, in nessun caso (doc/04-funzionalita.md, F6b).

import { normalizza } from './aggiunta'
import type { Lista, Voce } from './tipi'

/** Vero se il nome di questa voce si può correggere: manuale e in "Altro". */
export function rinominabile(voce: Voce): boolean {
  return voce.origine === 'manuale' && voce.reparto === 'altro'
}

/** Toglie la voce dalla lista, spuntata o no. Un id che non c'è non cambia niente. */
export function eliminaVoce(lista: Lista, id: string): Lista {
  return { ...lista, voci: lista.voci.filter((voce) => voce.id !== id) }
}

/**
 * Cambia il nome di una voce manuale in "Altro". Le altre voci restano come
 * sono, e così il reparto: anche se il nuovo nome è in catalogo la voce non
 * trasloca. Un nome vuoto lascia la lista com'è.
 */
export function rinominaVoce(lista: Lista, id: string, nome: string): Lista {
  if (normalizza(nome) === '') return lista
  const pulito = nome.trim().replace(/\s+/g, ' ')
  return {
    ...lista,
    voci: lista.voci.map((voce) =>
      voce.id === id && rinominabile(voce) ? { ...voce, nome: pulito } : voce,
    ),
  }
}
