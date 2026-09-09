// Transizioni di stato della spunta (Step 4 di doc/12-piano-sviluppo.md).
// Funzioni pure: ogni operazione restituisce una lista nuova e lascia
// intatta quella di partenza.

import type { Elemento, Lista, Voce } from './tipi'

/** Vero se la voce ha elementi spuntabili singolarmente (Frutta, Verdura). */
export function eRaggruppata(voce: Voce): voce is Voce & { elementi: Elemento[] } {
  return Array.isArray(voce.elementi) && voce.elementi.length > 0
}

function conElementi(voce: Voce, comprato: boolean): Voce {
  if (!eRaggruppata(voce)) return { ...voce, comprata: comprato }
  return {
    ...voce,
    comprata: comprato,
    elementi: voce.elementi.map((elemento) => ({ ...elemento, comprato })),
  }
}

function mappaVoce(lista: Lista, id: string, f: (voce: Voce) => Voce): Lista {
  return { ...lista, voci: lista.voci.map((voce) => (voce.id === id ? f(voce) : voce)) }
}

/**
 * Segna la voce come comprata: sparisce dalla lista attiva e compare in
 * "Già presi". Su una voce raggruppata spunta anche tutti i suoi elementi.
 */
export function spuntaVoce(lista: Lista, id: string): Lista {
  return mappaVoce(lista, id, (voce) => conElementi(voce, true))
}

/**
 * Riporta la voce tra quelle da comprare. Su una voce raggruppata torna da
 * prendere per intero: tutti i suoi elementi tornano non comprati.
 */
export function despuntaVoce(lista: Lista, id: string): Lista {
  return mappaVoce(lista, id, (voce) => conElementi(voce, false))
}

/**
 * Spunta o de-spunta un singolo elemento dentro Frutta o Verdura.
 * Quando tutti gli elementi sono presi la voce intera si considera comprata;
 * de-spuntandone uno la voce torna nella lista attiva.
 */
export function alternaElemento(lista: Lista, idVoce: string, nome: string): Lista {
  return mappaVoce(lista, idVoce, (voce) => {
    if (!eRaggruppata(voce)) return voce
    const elementi = voce.elementi.map((elemento) =>
      elemento.nome === nome ? { ...elemento, comprato: !elemento.comprato } : elemento,
    )
    return { ...voce, elementi, comprata: elementi.every((e) => e.comprato) }
  })
}

/** Gli elementi ancora da prendere dentro una voce raggruppata. */
export function elementiAttivi(voce: Voce): Elemento[] {
  return eRaggruppata(voce) ? voce.elementi.filter((e) => !e.comprato) : []
}
